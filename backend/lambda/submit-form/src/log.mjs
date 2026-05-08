/**
 * ログ整形 — PII (個人情報) をログに残さないためのヘルパー
 */

export function maskEmail(email) {
    if (!email || typeof email !== 'string') return '<no-email>';
    const at = email.indexOf('@');
    if (at < 1) return '<masked>';
    const user = email.slice(0, at);
    const domain = email.slice(at + 1);
    const userMasked = user.length <= 2 ? user[0] + '*' : user[0] + '***' + user[user.length - 1];
    return userMasked + '@' + domain;
}

export function maskPhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return '****' + digits.slice(-4);
}

// メッセージ中の email/phone を除去
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\b0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}\b/g;

export function redactPII(message) {
    if (!message) return '';
    let s = String(message);
    s = s.replace(EMAIL_RE, '<email>');
    s = s.replace(PHONE_RE, '<phone>');
    return s.slice(0, 1000);
}
