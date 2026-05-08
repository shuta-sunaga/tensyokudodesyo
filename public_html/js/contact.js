/**
 * /contact/ — 転職相談フォーム
 *
 * 主な責務:
 * - 入力検証（クライアント側、最終検証はサーバー側で必ず再実施）
 * - URL パラメータ自動入力（求人ページからの流入対応）
 * - Cloudflare Turnstile の状態管理
 * - 送信時刻計測（ハニーポット時間チェック）
 * - 同意チェック必須
 * - フォーム送信 → API → 成功画面切替
 *
 * セキュリティ:
 * - 信頼境界はサーバー。ここではUX目的のバリデーション。
 * - エラーメッセージにユーザー入力を直接挿入しない（XSS防止）
 */

(function () {
    'use strict';

    // ==========================================================================
    // グローバル URIError サプレッサ
    // 不正な %XX シーケンスを含む URL でも、フォーム動作を妨げない。
    // ==========================================================================
    window.addEventListener('error', function (ev) {
        if (ev.error instanceof URIError) {
            // 既知の不正 URL ケース → 警告のみで継続
            console.warn('[contact] URIError suppressed:', ev.error.message);
            ev.preventDefault();
        }
    });

    // ==========================================================================
    // 設定
    // ==========================================================================

    const API_ENDPOINT = (function () {
        // ローカル開発時は localhost、本番は API Gateway (将来 CloudFront 経由で同一オリジン化予定)
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '') {
            return 'http://localhost:3001/api/contact';
        }
        return 'https://2kyofn1cn7.execute-api.ap-northeast-1.amazonaws.com/api/contact';
    })();

    const PRIVACY_POLICY_VERSION = '2026-04-06'; // privacy.html の改訂日に合わせる
    const TERMS_VERSION = '2026-05-07'; // terms.html の制定日/改訂日に合わせる

    // ==========================================================================
    // DOM 取得
    // ==========================================================================

    const form = document.getElementById('contact-form');
    if (!form) return;

    const submitBtn = document.getElementById('submit-btn');
    const consentEl = document.getElementById('privacy_consent');
    const termsConsentEl = document.getElementById('terms_consent');
    const messageEl = document.getElementById('message');
    const messageCounter = document.getElementById('message-counter');
    const successPanel = document.getElementById('success-panel');
    const globalError = document.getElementById('global-error');
    const honeypot = document.getElementById('website');

    const formStartedAt = Date.now();

    // ==========================================================================
    // URL パラメータからの自動入力
    // ==========================================================================

    function autofillFromUrlParams() {
        // URLSearchParams.get() はデコード済みの値を返すため、二重デコードしない。
        // 不正なパーセントエンコードが含まれていても URLSearchParams は静かに処理する想定だが、
        // ブラウザ実装差や手書き URL での例外を想定して全体を try/catch で保護する。
        let params;
        try {
            params = new URLSearchParams(window.location.search);
        } catch (_) {
            return;
        }
        const interested = document.getElementById('interested_job');
        if (!interested) return;

        const safeGet = (key) => {
            try {
                const v = params.get(key);
                return typeof v === 'string' ? v : '';
            } catch (_) {
                return '';
            }
        };

        const title = safeGet('title');
        const url = safeGet('url');
        const ref = safeGet('ref');

        if (title) {
            interested.value = title.slice(0, 500);
            return;
        }
        if (url) {
            interested.value = url.slice(0, 500);
            return;
        }
        if (ref) {
            interested.value = '求人ID: ' + ref.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 50);
            return;
        }

        // URLパラメータが無い場合、referrer (前ページ) が求人詳細ページなら
        // 「気になった求人」欄にそのURLを自動入力する。
        // 求人詳細URLパターン: /<prefecture>/jobs/<id>.html
        try {
            const ref = document.referrer || '';
            if (!ref) return;
            const isSameOrigin = (() => {
                try { return new URL(ref).origin === window.location.origin; } catch (_) { return false; }
            })();
            if (!isSameOrigin) return;
            // 求人詳細・インタビュー詳細・企業詳細のいずれかから来たら入れる
            const m = ref.match(/\/[a-z]+\/jobs\/[^/]+\.html|\/(interviews|companies)\/detail\/[^/]+\.html/);
            if (m) {
                interested.value = ref.slice(0, 500);
            }
        } catch (_) {}
    }
    autofillFromUrlParams();

    // ==========================================================================
    // 文字数カウンタ
    // ==========================================================================

    if (messageEl && messageCounter) {
        const max = parseInt(messageEl.getAttribute('maxlength'), 10) || 1000;
        const update = () => {
            const len = messageEl.value.length;
            messageCounter.textContent = len + ' / ' + max + ' 文字';
        };
        messageEl.addEventListener('input', update);
        update();
    }

    // ==========================================================================
    // バリデーション
    // ==========================================================================

    const validators = {
        name: (v) => {
            if (!v || !v.trim()) return 'お名前をご入力ください';
            if (v.length > 50) return '50文字以内でご入力ください';
            return null;
        },
        name_kana: (v) => {
            if (!v) return null; // 任意
            if (v.length > 50) return '50文字以内でご入力ください';
            if (!/^[ァ-ヶー\s　]+$/.test(v)) return 'カタカナでご入力ください';
            return null;
        },
        email: (v) => {
            if (!v || !v.trim()) return 'メールアドレスをご入力ください';
            if (v.length > 254) return 'メールアドレスが長すぎます';
            // RFC5322ライト版
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!re.test(v)) return 'メールアドレスの形式が正しくありません';
            return null;
        },
        phone: (v) => {
            if (!v) return null; // 任意
            const cleaned = v.replace(/[\s-()]/g, '');
            if (!/^\+?\d{10,15}$/.test(cleaned)) return '電話番号の形式が正しくありません';
            return null;
        },
        prefecture: (v) => {
            if (!v) return '都道府県をお選びください';
            return null;
        },
        age: (v) => {
            if (!v) return '年齢をご入力ください';
            const n = parseInt(v, 10);
            if (isNaN(n)) return '年齢を数字でご入力ください';
            if (n < 18) return '18歳以上でご入力ください';
            if (n > 80) return '80歳以下でご入力ください';
            return null;
        },
        interested_job: (v) => {
            if (!v) return null;
            if (v.length > 500) return '500文字以内でご入力ください';
            return null;
        },
        message: (v) => {
            if (!v) return null;
            if (v.length > 1000) return '1000文字以内でご入力ください';
            return null;
        },
    };

    function showFieldError(name, message) {
        const errorEl = form.querySelector('[data-error-for="' + CSS.escape(name) + '"]');
        const inputEl = form.querySelector('[name="' + CSS.escape(name) + '"]');
        if (errorEl) errorEl.textContent = message || '';
        if (inputEl) {
            const row = inputEl.closest('.form-row__col') || inputEl.closest('.form-row');
            if (row) {
                if (message) row.classList.add('has-error');
                else row.classList.remove('has-error');
            }
            if (message) inputEl.setAttribute('aria-invalid', 'true');
            else inputEl.removeAttribute('aria-invalid');
        }
    }

    function validateField(name) {
        const v = (form.elements[name] && form.elements[name].value) || '';
        const fn = validators[name];
        if (!fn) return null;
        const err = fn(v);
        showFieldError(name, err);
        return err;
    }

    function validateAll() {
        let firstErrorField = null;
        Object.keys(validators).forEach((name) => {
            const err = validateField(name);
            if (err && !firstErrorField) firstErrorField = name;
        });
        // 同意チェック (利用規約)
        if (!termsConsentEl || !termsConsentEl.checked) {
            showFieldError('terms_consent', '利用規約への同意が必要です');
            if (!firstErrorField) firstErrorField = 'terms_consent';
        } else {
            showFieldError('terms_consent', '');
        }
        // 同意チェック (個人情報保護方針)
        if (!consentEl || !consentEl.checked) {
            showFieldError('privacy_consent', '個人情報保護方針への同意が必要です');
            if (!firstErrorField) firstErrorField = 'privacy_consent';
        } else {
            showFieldError('privacy_consent', '');
        }
        return firstErrorField;
    }

    // blur時にバリデート
    Object.keys(validators).forEach((name) => {
        const el = form.elements[name];
        if (!el) return;
        const targets = el.length ? Array.from(el) : [el];
        targets.forEach((target) => {
            target.addEventListener('blur', () => validateField(name));
        });
    });

    // ==========================================================================
    // 送信ボタンの有効化（同意チェック連動）
    // ==========================================================================

    function refreshSubmitButton() {
        if (!submitBtn || !consentEl || !termsConsentEl) return;
        // Turnstileトークンの存在もここで確認
        const token = getTurnstileToken();
        const ready = consentEl.checked && termsConsentEl.checked && !!token;
        submitBtn.disabled = !ready;
    }

    consentEl && consentEl.addEventListener('change', refreshSubmitButton);
    termsConsentEl && termsConsentEl.addEventListener('change', refreshSubmitButton);

    // ==========================================================================
    // Cloudflare Turnstile
    // ==========================================================================

    function getTurnstileToken() {
        try {
            const input = form.querySelector('input[name="cf-turnstile-response"]');
            return input ? input.value : '';
        } catch (e) {
            return '';
        }
    }

    // Turnstile はトークン取得時にコールバックがあるが、widget の DOM 完了後は
    // 値が input[name=cf-turnstile-response] に入る。定期チェックで反映。
    let turnstileReadyChecks = 0;
    const turnstileTimer = setInterval(() => {
        turnstileReadyChecks++;
        refreshSubmitButton();
        if (getTurnstileToken() || turnstileReadyChecks > 60) {
            // 30秒間チェックして取れなければ諦める（環境によりサイトキー未設定の場合等）
            if (turnstileReadyChecks > 60) clearInterval(turnstileTimer);
        }
    }, 500);

    // ==========================================================================
    // 送信
    // ==========================================================================

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled || submitBtn.classList.contains('is-loading')) return;

        globalError.textContent = '';

        // 1. クライアント検証
        const firstError = validateAll();
        if (firstError) {
            const target = form.querySelector('[name="' + CSS.escape(firstError) + '"]');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // 2. ハニーポット (複数)
        const honeypots = [honeypot, document.getElementById('fax_number')].filter(Boolean);
        if (honeypots.some((el) => el.value)) {
            // bot 確定。ユーザーには送信成功として見せ、バックエンドには到達させない
            showSuccess();
            return;
        }

        // 3. 経過時間チェック（3秒未満は怪しい）
        const elapsed = Date.now() - formStartedAt;
        if (elapsed < 3000) {
            globalError.textContent = '送信が早すぎます。少し時間を置いてからお試しください。';
            return;
        }

        // 4. Turnstile トークン
        const turnstileToken = getTurnstileToken();
        if (!turnstileToken) {
            globalError.textContent = '認証トークンを取得できませんでした。ページを再読み込みしてお試しください。';
            return;
        }

        // 5. ローディング表示
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        // 6. ペイロード組み立て
        const data = new FormData(form);
        const payload = {
            name: (data.get('name') || '').toString().trim(),
            name_kana: (data.get('name_kana') || '').toString().trim(),
            email: (data.get('email') || '').toString().trim(),
            phone: (data.get('phone') || '').toString().trim(),
            prefecture: (data.get('prefecture') || '').toString(),
            age: parseInt(data.get('age'), 10) || null,
            current_status: (data.get('current_status') || '').toString(),
            interested_job: (data.get('interested_job') || '').toString().trim().slice(0, 500),
            message: (data.get('message') || '').toString().trim().slice(0, 1000),
            privacy_consent: !!consentEl.checked,
            privacy_policy_version: PRIVACY_POLICY_VERSION,
            terms_consent: !!termsConsentEl.checked,
            terms_version: TERMS_VERSION,
            cf_turnstile_token: turnstileToken,
            referrer_url: (document.referrer || '').slice(0, 500),
            // form_started_at はサーバー側でも別途検証するためミリ秒経過時間も送る
            form_elapsed_ms: elapsed,
        };

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let msg = '送信に失敗しました。時間をおいて再度お試しください。';
                try {
                    const errJson = await res.json();
                    if (errJson && errJson.message) {
                        msg = errJson.message;
                    } else if (errJson && errJson.errors && Array.isArray(errJson.errors)) {
                        // フィールド単位エラーをUIに反映
                        errJson.errors.forEach((er) => {
                            if (er.field) showFieldError(er.field, er.message || '入力をご確認ください');
                        });
                        msg = '入力内容にエラーがあります。各項目をご確認ください。';
                    }
                } catch (_) {}
                throw new Error(msg);
            }

            // GA4 送信完了イベント
            try {
                if (typeof gtag === 'function') {
                    gtag('event', 'contact_form_submit', { event_category: 'engagement' });
                }
            } catch (_) {}

            showSuccess();
        } catch (err) {
            globalError.textContent = err.message || '送信に失敗しました。時間をおいて再度お試しください。';
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    });

    function showSuccess() {
        form.hidden = true;
        successPanel.hidden = false;
        // フォーム以外の周辺セクション (流れ図・プライバシー説明・ヒーロー) も隠して
        // 完了パネルだけが目に入る状態に
        document.querySelectorAll('.contact-hero, .contact-flow, .privacy-note').forEach(el => {
            el.hidden = true;
        });
        // 完了パネル単独表示時の余白を確保
        const formCard = successPanel.closest('.form-card');
        if (formCard) {
            formCard.style.marginTop = 'clamp(48px, 8vw, 96px)';
            formCard.style.marginBottom = 'clamp(40px, 6vw, 72px)';
        }
        // form-card__head (タイトル + ★は必須項目) も非表示に
        const head = formCard?.querySelector('.form-card__head');
        if (head) head.hidden = true;
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
})();

// IIFE 内で同期的に発生した URIError も最終ガード。Turnstile 等の外部スクリプトは別物。
window.addEventListener('unhandledrejection', function (ev) {
    if (ev.reason instanceof URIError) {
        console.warn('[contact] URIError in promise suppressed:', ev.reason.message);
        ev.preventDefault();
    }
});

