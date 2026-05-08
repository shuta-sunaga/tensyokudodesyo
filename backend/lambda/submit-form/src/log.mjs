/**
 * ログ整形 — PII (個人情報) をログに残さないためのヘルパー
 * Phase 4 で強化:
 *  - メアドのドメイン部分も部分マスク
 *  - CRLF 除去 (ログインジェクション防止)
 *  - 危険文字の制御
 */

/**
 * メールアドレスをマスク。ローカル部・ドメイン部両方を伏せる。
 *  例: john.doe@sei-san-sei.com → j***e@***-***.com
 */
export function maskEmail(email) {
    if (!email || typeof email !== 'string') return '<no-email>';
    const at = email.indexOf('@');
    if (at < 1) return '<masked>';
    const user = email.slice(0, at);
    const domain = email.slice(at + 1);
    // ローカル部
    const userMasked = user.length <= 2
        ? user[0] + '*'
        : user[0] + '***' + user[user.length - 1];
    // ドメイン部: 末尾の TLD (例 .com, .jp, .co.jp) は残し、その前を伏せる
    if (!domain) return userMasked + '@***';
    const parts = domain.split('.');
    if (parts.length < 2) return userMasked + '@***';
    // 複合 TLD 検出: 末尾と末尾2番目が両方短い (≤3文字) で要素数 3 以上の時のみ 2要素 TLD 扱い
    let tldCount = 1;
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
        tldCount = 2;
    }
    const labelsToMask = parts.length - tldCount;
    const tld = parts.slice(-tldCount).join('.');
    if (labelsToMask <= 0) {
        return userMasked + '@***.' + tld;
    }
    const masked = Array(labelsToMask).fill('***').join('.');
    return userMasked + '@' + masked + '.' + tld;
}

/**
 * 電話番号マスク (末尾4桁のみ残す)
 */
export function maskPhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return '****' + digits.slice(-4);
}

/**
 * CRLF・制御文字を除去 (ログインジェクション防止)
 */
export function safeLog(s) {
    if (s == null) return '';
    return String(s).replace(/[\x00-\x1F\x7F]+/g, ' ').slice(0, 1000);
}

// メッセージ内の email/phone を除去
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\b0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}\b/g;

/**
 * 構造化ログ用の PII 除去フィルタ
 */
export function redactPII(message) {
    if (!message) return '';
    let s = String(message);
    s = s.replace(EMAIL_RE, '<email>');
    s = s.replace(PHONE_RE, '<phone>');
    return safeLog(s);
}

/**
 * 起動時アサーション: 本番では MOCK_MODE / SKIP_TURNSTILE / SKIP_SES が
 * 有効になっていてはいけない。
 * 万一誤って有効化されたら、Lambda コールド起動時に即 throw する。
 */
export function assertProductionSafety() {
    if (process.env.NODE_ENV !== 'production') return;
    const dangerous = ['MOCK_MODE_ACTIVE', 'SKIP_TURNSTILE', 'SKIP_SES', 'USE_LOCAL_SECRETS'];
    for (const key of dangerous) {
        if (process.env[key] === 'true') {
            throw new Error(`PRODUCTION SAFETY: ${key}=true is not allowed in production`);
        }
    }
}
