/**
 * Lark Base (Bitable) API 連携
 * - Tenant Access Token 取得
 * - レコード追加
 * - 失敗時は3回リトライ (指数バックオフ)
 */

const TENANT_TOKEN_URL = 'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal';
const ADD_RECORD_URL = (appToken, tableId) =>
    `https://open.larksuite.com/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records`;

let _tokenCache = { token: null, expiresAt: 0 };

async function getTenantAccessToken(appId, appSecret) {
    const now = Date.now();
    if (_tokenCache.token && _tokenCache.expiresAt > now + 60_000) {
        return _tokenCache.token;
    }
    const res = await fetch(TENANT_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    if (!res.ok) throw new Error('Lark token HTTP ' + res.status);
    const data = await res.json();
    if (data.code !== 0) throw new Error('Lark token error: ' + data.msg);
    _tokenCache = {
        token: data.tenant_access_token,
        expiresAt: now + (data.expire * 1000),
    };
    return _tokenCache.token;
}

/**
 * Phase 5: スプレッドシート Formula Injection 対策
 * Lark Base から CSV/Excel エクスポート時、先頭が = + - @ \t \r 等の値が
 * 数式として評価される脆弱性 (CVE-2014-3524 系) を防ぐ。
 */
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;
function escapeFormulaInjection(value) {
    if (typeof value !== 'string' || value === '') return value;
    return FORMULA_PREFIX_RE.test(value) ? "'" + value : value;
}

function buildFields(record) {
    // Lark Base のフィールド名は docs/lark-base-setup.md に従う
    const submittedAtMs = new Date(record.submitted_at).getTime();
    return {
        // 日時フィールドはミリ秒タイムスタンプ
        submitted_at: submittedAtMs,
        name: escapeFormulaInjection(record.name || ''),
        name_kana: escapeFormulaInjection(record.name_kana || ''),
        email: escapeFormulaInjection(record.email || ''),
        phone: escapeFormulaInjection(record.phone || ''),
        prefecture: record.prefecture || '',
        age: record.age != null ? record.age : null,
        current_status: record.current_status || '',
        interested_job: escapeFormulaInjection(record.interested_job || ''),
        message: escapeFormulaInjection(record.message || ''),
        terms_consent: !!record.terms_consent,
        terms_version: record.terms_version || '',
        privacy_consent: !!record.privacy_consent,
        privacy_policy_version: record.privacy_policy_version || '',
        consent_ip: record.consent_ip || '',
        user_agent: escapeFormulaInjection(record.user_agent || ''),
        referrer_url: escapeFormulaInjection(record.referrer_url || ''),
        status: '未対応',
    };
}

async function addRecordOnce(token, appToken, tableId, record) {
    const res = await fetch(ADD_RECORD_URL(appToken, tableId), {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: buildFields(record) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.code !== 0) {
        const msg = `Lark add record HTTP ${res.status} code=${data.code || '?'} msg=${data.msg || 'unknown'}`;
        const err = new Error(msg);
        err.larkCode = data.code;
        err.status = res.status;
        throw err;
    }
    return { record_id: data.data?.record?.record_id || 'unknown' };
}

export async function writeToLarkBase(record, secrets) {
    if (process.env.MOCK_MODE_ACTIVE === 'true') {
        console.log('[mock] Lark write:', JSON.stringify({
            email: record.email ? record.email.replace(/(.).+(@.+)/, '$1***$2') : '',
            prefecture: record.prefecture,
            submitted_at: record.submitted_at,
        }));
        return { record_id: 'mock_' + Date.now() };
    }
    const { larkAppId, larkAppSecret, larkAppToken, larkTableId } = secrets;
    if (!larkAppId || !larkAppSecret || !larkAppToken || !larkTableId) {
        throw new Error('Lark credentials not configured');
    }

    let lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const token = await getTenantAccessToken(larkAppId, larkAppSecret);
            return await addRecordOnce(token, larkAppToken, larkTableId, record);
        } catch (e) {
            lastErr = e;
            // 認証系エラーは即時失敗
            if (e.status === 401 || e.larkCode === 99991663) break;
            // 指数バックオフ: 0.5s, 1.5s, 4.5s
            if (attempt < 3) {
                const wait = Math.pow(3, attempt - 1) * 500;
                await new Promise((r) => setTimeout(r, wait));
            }
        }
    }
    throw lastErr || new Error('Lark write failed after retries');
}
