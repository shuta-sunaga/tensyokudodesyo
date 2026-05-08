/**
 * Cloudflare Turnstile 検証。
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token, remoteIp, secret) {
    if (process.env.MOCK_MODE_ACTIVE === 'true' || process.env.SKIP_TURNSTILE === 'true') {
        console.log('[mock/skip-turnstile] Turnstile verify SKIP');
        return true;
    }
    if (!token || typeof token !== 'string') return false;
    if (!secret) {
        console.warn('Turnstile secret not configured');
        return false;
    }

    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (remoteIp) body.append('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        throw new Error('Turnstile siteverify HTTP ' + res.status);
    }
    const data = await res.json();
    if (!data.success) {
        console.warn('Turnstile failed:', data['error-codes']);
        return false;
    }
    return true;
}
