import { validatePayload } from './validate.mjs';
import { verifyTurnstile } from './turnstile.mjs';
import { writeToLarkBase } from './lark.mjs';
import { sendConfirmationMail } from './mailer.mjs';
import { getSecrets } from './secrets.mjs';
import { maskEmail, redactPII } from './log.mjs';

const ALLOWED_ORIGINS = [
    'https://www.tensyokudodesyo.com',
    'https://tensyokudodesyo.com',
];
const ALLOWED_ORIGINS_DEV = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
];

function corsHeaders(origin) {
    const allowed = (process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : [...ALLOWED_ORIGINS, ...ALLOWED_ORIGINS_DEV]);
    const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
}

function jsonResponse(statusCode, body, origin) {
    return {
        statusCode,
        headers: corsHeaders(origin),
        body: JSON.stringify(body),
    };
}

export async function handle(event) {
    const headers = event.headers || {};
    const origin = headers.origin || headers.Origin || '';
    const referer = headers.referer || headers.Referer || '';
    const userAgent = headers['user-agent'] || headers['User-Agent'] || '';
    const requestContext = event.requestContext || {};
    const sourceIp = (requestContext.identity && requestContext.identity.sourceIp) ||
                     (requestContext.http && requestContext.http.sourceIp) ||
                     headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     'unknown';

    // ----- 1. CORS preflight -------------------------------------------------
    const method = (event.requestContext?.http?.method || event.httpMethod || '').toUpperCase();
    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders(origin), body: '' };
    }
    if (method !== 'POST') {
        return jsonResponse(405, { message: 'Method Not Allowed' }, origin);
    }

    // ----- 2. Origin/Referer 検証 -------------------------------------------
    const allowed = (process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : [...ALLOWED_ORIGINS, ...ALLOWED_ORIGINS_DEV]);
    if (origin && !allowed.includes(origin)) {
        console.warn('Origin rejected:', origin);
        return jsonResponse(403, { message: 'Forbidden origin' }, origin);
    }
    if (process.env.NODE_ENV === 'production' && referer && !allowed.some((o) => referer.startsWith(o))) {
        console.warn('Referer rejected:', referer);
        return jsonResponse(403, { message: 'Forbidden referer' }, origin);
    }

    // ----- 3. Content-Type 制限 ---------------------------------------------
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
        return jsonResponse(415, { message: 'Unsupported Media Type' }, origin);
    }

    // ----- 4. JSON parse ----------------------------------------------------
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return jsonResponse(400, { message: 'Invalid JSON' }, origin);
    }

    // ----- 5. Body サイズ制限 -----------------------------------------------
    if ((event.body || '').length > 16384) {
        return jsonResponse(413, { message: 'Payload too large' }, origin);
    }

    // ----- 6. ハニーポット + 経過時間 ---------------------------------------
    if (body.website && String(body.website).trim() !== '') {
        // ハニーポットに値が入っているのは bot
        console.warn('Honeypot triggered from', maskIp(sourceIp));
        // bot にも成功風レスポンスを返す
        return jsonResponse(200, { message: 'OK' }, origin);
    }
    if (typeof body.form_elapsed_ms === 'number' && body.form_elapsed_ms < 3000) {
        return jsonResponse(400, { message: '送信が早すぎます。少し時間を置いてからお試しください。' }, origin);
    }

    // ----- 7. ペイロード検証 ------------------------------------------------
    const { value, errors } = validatePayload(body);
    if (errors.length > 0) {
        return jsonResponse(400, { message: '入力内容にエラーがあります', errors }, origin);
    }

    // ----- 8. シークレット取得 ----------------------------------------------
    let secrets;
    if (process.env.MOCK_MODE_ACTIVE === 'true') {
        secrets = { mock: true };
    } else {
        try {
            secrets = await getSecrets();
        } catch (e) {
            console.error('Failed to load secrets:', e.message);
            return jsonResponse(500, { message: 'サービスが一時的に利用できません。少し時間をおいてお試しください。' }, origin);
        }
    }

    // ----- 9. Turnstile 検証 ------------------------------------------------
    try {
        const ok = await verifyTurnstile(body.cf_turnstile_token, sourceIp, secrets.turnstileSecret);
        if (!ok) {
            return jsonResponse(403, { message: '認証に失敗しました。ページを再読み込みしてお試しください。' }, origin);
        }
    } catch (e) {
        console.error('Turnstile verify error:', e.message);
        return jsonResponse(500, { message: 'サービスが一時的に利用できません。少し時間をおいてお試しください。' }, origin);
    }

    // ----- 10. Lark Base へ書き込み -----------------------------------------
    const submittedAt = new Date();
    const larkRecord = {
        ...value,
        submitted_at: submittedAt.toISOString(),
        consent_ip: sourceIp,
        user_agent: userAgent.slice(0, 500),
        referrer_url: (body.referrer_url || '').slice(0, 500),
    };

    let larkResult;
    try {
        larkResult = await writeToLarkBase(larkRecord, secrets);
        console.log('Lark write success:', { record_id: larkResult.record_id, email_masked: maskEmail(value.email) });
    } catch (e) {
        console.error('Lark write failed:', redactPII(e.message));
        // Lark 失敗時もユーザーには成功風に返さず、メッセージで案内
        return jsonResponse(502, { message: '転職相談の保存に失敗しました。時間をおいて再度お試しください。' }, origin);
    }

    // ----- 11. SES で確認メール送信 -----------------------------------------
    try {
        await sendConfirmationMail({
            to: value.email,
            name: value.name,
            payload: value,
            submittedAt,
        }, secrets);
    } catch (e) {
        console.error('SES send failed:', redactPII(e.message));
        // メール送信失敗してもレコードは保存済みなので、案内メッセージで完結扱い
        return jsonResponse(200, {
            message: 'ご相談を受付ました。確認メールの送信に失敗したため、運営から別途ご連絡します。'
        }, origin);
    }

    return jsonResponse(200, { message: 'OK' }, origin);
}

function maskIp(ip) {
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    if (parts.length === 4) return parts[0] + '.' + parts[1] + '.x.x';
    return ip.slice(0, 8) + '...';
}
