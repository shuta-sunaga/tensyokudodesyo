import { validatePayload } from './validate.mjs';
import { verifyTurnstile } from './turnstile.mjs';
import { writeToLarkBase } from './lark.mjs';
import { sendConfirmationMail } from './mailer.mjs';
import { getSecrets } from './secrets.mjs';
import { maskEmail, redactPII, safeLog, assertProductionSafety } from './log.mjs';

// 本番でテスト/モックフラグが立っていたら起動時に即 throw する
assertProductionSafety();

const ALLOWED_ORIGINS = [
    'https://www.tensyokudodesyo.com',
    'https://tensyokudodesyo.com',
];
const ALLOWED_ORIGINS_DEV = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
];

// Phase 5: 同意ポリシーのサーバー側信頼バージョン
// privacy.html / terms.html の改訂日に合わせて更新。
// クライアント送信値は信頼せず、ここに記載した値だけが Lark Base に保存される。
const SERVER_PRIVACY_POLICY_VERSION = '2026-04-06';
const SERVER_TERMS_VERSION = '2026-05-07';

const MAX_PAYLOAD_BYTES = 16384; // 16KB

function getAllowedOrigins() {
    return process.env.NODE_ENV === 'production'
        ? ALLOWED_ORIGINS
        : [...ALLOWED_ORIGINS, ...ALLOWED_ORIGINS_DEV];
}

/**
 * Origin が allowlist に含まれない場合は CORS ヘッダ自体を返さない。
 * これにより、ブラウザは攻撃元 Origin からのレスポンスを読めない。
 */
function corsHeaders(origin) {
    const baseHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Vary': 'Origin',
    };
    const allowed = getAllowedOrigins();
    if (!origin || !allowed.includes(origin)) {
        // CORS ヘッダなし — ブラウザは結果を読めない
        return baseHeaders;
    }
    return {
        ...baseHeaders,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '600',
    };
}

/**
 * 405 Method Not Allowed 用に Allow ヘッダ付き
 */
function methodNotAllowed(origin) {
    return {
        statusCode: 405,
        headers: { ...corsHeaders(origin), 'Allow': 'POST, OPTIONS' },
        body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
}

/**
 * Referer の Origin と allowlist を比較。startsWith は不正 (evil.com.attacker.com を通す)。
 */
function isRefererAllowed(referer, allowedOrigins) {
    if (!referer) return false;
    try {
        const refererOrigin = new URL(referer).origin;
        return allowedOrigins.includes(refererOrigin);
    } catch (_) {
        return false;
    }
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
        return methodNotAllowed(origin);
    }

    // ----- 2. Origin/Referer 検証 (Phase 2 強化版) ---------------------------
    const allowed = getAllowedOrigins();
    const isProduction = process.env.NODE_ENV === 'production';

    // 本番では Origin ヘッダ必須。未送信は 403 (curl/script からの直叩き拒否)
    if (isProduction && !origin) {
        console.warn('Origin missing (production)');
        return jsonResponse(403, { message: 'Forbidden' }, origin);
    }
    // Origin が allowlist 外なら 403
    if (origin && !allowed.includes(origin)) {
        console.warn('Origin rejected:', safeLog(origin));
        return jsonResponse(403, { message: 'Forbidden origin' }, origin);
    }
    // Referer は URL.origin で厳密比較 (本番のみ・送られてきた場合)
    if (isProduction && referer && !isRefererAllowed(referer, allowed)) {
        console.warn('Referer rejected:', safeLog(referer).slice(0, 200));
        return jsonResponse(403, { message: 'Forbidden referer' }, origin);
    }

    // ----- 3. Content-Type 制限 ---------------------------------------------
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    if (!contentType.toLowerCase().startsWith('application/json')) {
        return jsonResponse(415, { message: 'Unsupported Media Type' }, origin);
    }

    // ----- 4. Body サイズ制限 (Phase 5: parse 前にチェック) -----------------
    const rawBody = event.body || '';
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
        return jsonResponse(413, { message: 'Payload too large' }, origin);
    }

    // ----- 5. JSON parse ----------------------------------------------------
    let body;
    try {
        body = JSON.parse(rawBody || '{}');
    } catch (e) {
        return jsonResponse(400, { message: 'Invalid JSON' }, origin);
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return jsonResponse(400, { message: 'Invalid payload shape' }, origin);
    }

    // ----- 6. ハニーポット + 経過時間 (Phase 5: 複数ハニーポット) ----------
    // 「website」 + 「fax_number」 の2つを罠として配置
    // 賢い bot が `website` をスキップしても、もう一方を埋めれば検知
    const hpFields = ['website', 'fax_number'];
    for (const hp of hpFields) {
        if (body[hp] && String(body[hp]).trim() !== '') {
            console.warn('Honeypot triggered:', hp, 'from', maskIp(sourceIp));
            return jsonResponse(200, { message: 'OK' }, origin);
        }
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
    // Phase 5: referrer_url は URL として妥当な場合のみ保存
    let safeReferrer = '';
    try {
        const r = String(body.referrer_url || '');
        if (r) {
            const u = new URL(r);
            if (u.protocol === 'http:' || u.protocol === 'https:') {
                safeReferrer = u.href.slice(0, 500);
            }
        }
    } catch (_) { safeReferrer = ''; }

    const larkRecord = {
        ...value,
        submitted_at: submittedAt.toISOString(),
        consent_ip: sourceIp,
        user_agent: safeLog(userAgent).slice(0, 500),
        referrer_url: safeReferrer,
        // Phase 5: 同意バージョンはサーバー側で固定値を記録
        privacy_policy_version: SERVER_PRIVACY_POLICY_VERSION,
        terms_version: SERVER_TERMS_VERSION,
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
