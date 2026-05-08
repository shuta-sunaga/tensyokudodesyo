/**
 * サーバー側の厳格バリデーション。
 * クライアント検証は信用しない。
 */

const PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const STATUSES = ['在職中', '離職中', '転職活動中', '情報収集中', 'その他'];

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const KANA_RE = /^[ァ-ヶー\s　]+$/;
const AGE_RE = /^\d{1,3}$/; // Phase 5: parseInt 緩さ対策

const MAX_ERRORS = 10; // Phase 5: errors 配列の DoS 抑制

// 制御文字 (タブ・LF・CR を除く) を除去 — ログ/ヘッダーインジェクション防止
const CTRL_RE = new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', 'g');
function stripCtrl(s) {
    return String(s).replace(CTRL_RE, '');
}

function trimAndLimit(v, max) {
    return stripCtrl(String(v || '').trim()).slice(0, max);
}

function pushError(errors, field, message) {
    if (errors.length >= MAX_ERRORS) return;
    errors.push({ field, message });
}

export function validatePayload(input) {
    const errors = [];
    const value = {};

    // name
    const name = trimAndLimit(input.name, 50);
    if (!name) pushError(errors, 'name', 'お名前をご入力ください');
    value.name = name;

    // name_kana (任意)
    const kana = trimAndLimit(input.name_kana, 50);
    if (kana && !KANA_RE.test(kana)) pushError(errors, 'name_kana', 'カタカナでご入力ください');
    value.name_kana = kana;

    // email
    const email = trimAndLimit(input.email, 254).toLowerCase();
    if (!email) pushError(errors, 'email', 'メールアドレスをご入力ください');
    else if (!EMAIL_RE.test(email)) pushError(errors, 'email', 'メールアドレスの形式が正しくありません');
    value.email = email;

    // phone (任意)
    const phoneRaw = trimAndLimit(input.phone, 30);
    if (phoneRaw) {
        const cleaned = phoneRaw.replace(/[\s\-()]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleaned)) pushError(errors, 'phone', '電話番号の形式が正しくありません');
    }
    value.phone = phoneRaw;

    // prefecture
    const pref = trimAndLimit(input.prefecture, 10);
    if (!pref) pushError(errors, 'prefecture', '都道府県をお選びください');
    else if (!PREFECTURES.includes(pref)) pushError(errors, 'prefecture', '都道府県の指定が無効です');
    value.prefecture = pref;

    // age (Phase 5: parseInt の緩さ対策、整数文字列のみ受理)
    const ageRaw = String(input.age == null ? '' : input.age).trim();
    let age = null;
    if (!ageRaw) {
        pushError(errors, 'age', '年齢をご入力ください');
    } else if (!AGE_RE.test(ageRaw)) {
        pushError(errors, 'age', '年齢を半角数字でご入力ください');
    } else {
        age = Number(ageRaw);
        if (!Number.isInteger(age) || age < 18 || age > 80) {
            pushError(errors, 'age', '18〜80の範囲でご入力ください');
            age = null;
        }
    }
    value.age = age;

    // current_status (任意)
    const status = trimAndLimit(input.current_status, 20);
    if (status && !STATUSES.includes(status)) {
        pushError(errors, 'current_status', '指定が無効です');
    }
    value.current_status = status;

    // interested_job (任意)
    value.interested_job = trimAndLimit(input.interested_job, 500);

    // message (任意)
    value.message = trimAndLimit(input.message, 1000);

    // terms_consent (利用規約)
    if (!input.terms_consent) pushError(errors, 'terms_consent', '利用規約への同意が必要です');
    value.terms_consent = !!input.terms_consent;

    // privacy_consent (個人情報保護方針)
    if (!input.privacy_consent) pushError(errors, 'privacy_consent', '個人情報保護方針への同意が必要です');
    value.privacy_consent = !!input.privacy_consent;

    // version 系: クライアントが提示した値とサーバー側の信頼値、両方記録
    // 受け入れる側は handler.mjs でサーバー値を上書きする (Phase 5)
    value.privacy_policy_version_client = trimAndLimit(input.privacy_policy_version, 20) || 'unknown';
    value.terms_version_client = trimAndLimit(input.terms_version, 20) || 'unknown';

    return { value, errors };
}
