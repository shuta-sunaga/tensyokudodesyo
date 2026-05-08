/**
 * AWS Secrets Manager に Lambda 用の認証情報を一括投入
 *
 * 入力:
 *   - backend/local-dev/.env (Lark系)
 *   - 環境変数 PROD_TURNSTILE_SECRET (本番 Turnstile Secret Key)
 *   - 環境変数 SES_FROM_ADDRESS (デフォルト: noreply@tensyokudodesyo.com)
 *   - 環境変数 SES_REPLY_TO (デフォルト: info@tensyokudodesyo.com)
 *
 * 実行:
 *   node scripts/secrets-upload.mjs            # 確認のみ (--apply なしで内容を表示)
 *   node scripts/secrets-upload.mjs --apply    # 実際に Secrets Manager に書き込み
 *
 * 安全策:
 *   - ローカル .env のテストTurnstileSecret (1x000...) はそのまま投入されない
 *   - PROD_TURNSTILE_SECRET 未設定時は --apply 拒否
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, 'backend', 'local-dev', '.env');
const SECRET_NAME = 'tensyokudodesyo/contact-form';
const REGION = 'ap-northeast-1';
const APPLY = process.argv.includes('--apply');

// ----- .env 読み込み ------------------------------------------------------
async function loadEnv() {
    const raw = await fs.readFile(ENV_PATH, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m && !line.startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
}
const env = await loadEnv();

// ----- 投入対象の secret 値 ----------------------------------------------
const turnstileSecret = process.env.PROD_TURNSTILE_SECRET || env.PROD_TURNSTILE_SECRET || '';

const secret = {
    larkAppId:               env.LARK_APP_ID || '',
    larkAppSecret:           env.LARK_APP_SECRET || '',
    larkAppToken:            env.LARK_APP_TOKEN || '',
    larkTableId:             env.LARK_TABLE_ID || '',
    turnstileSecret:         turnstileSecret,
    sesFromAddress:          process.env.SES_FROM_ADDRESS || env.SES_FROM_ADDRESS || 'noreply@tensyokudodesyo.com',
    sesReplyTo:              process.env.SES_REPLY_TO || env.SES_REPLY_TO || 'info@tensyokudodesyo.com',
    sesConfigurationSet:     process.env.SES_CONFIG_SET || env.SES_CONFIG_SET || null,
};

// ----- 表示 (マスキング) -------------------------------------------------
function mask(v) {
    if (!v) return '<EMPTY>';
    if (v.length < 8) return v.slice(0, 1) + '***';
    return v.slice(0, 4) + '...' + v.slice(-3) + ` (len=${v.length})`;
}

console.log(`\n=== Secrets Manager Upload ===`);
console.log(`Region:     ${REGION}`);
console.log(`Secret name: ${SECRET_NAME}`);
console.log(`Mode:        ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

console.log('投入予定値 (マスク済):');
console.log('  larkAppId          :', mask(secret.larkAppId));
console.log('  larkAppSecret      :', mask(secret.larkAppSecret));
console.log('  larkAppToken       :', mask(secret.larkAppToken));
console.log('  larkTableId        :', mask(secret.larkTableId));
console.log('  turnstileSecret    :', mask(secret.turnstileSecret));
console.log('  sesFromAddress     :', secret.sesFromAddress);
console.log('  sesReplyTo         :', secret.sesReplyTo);
console.log('  sesConfigurationSet:', secret.sesConfigurationSet || '(null)');

// ----- 検証 --------------------------------------------------------------
const missing = [];
if (!secret.larkAppId) missing.push('larkAppId');
if (!secret.larkAppSecret) missing.push('larkAppSecret');
if (!secret.larkAppToken) missing.push('larkAppToken');
if (!secret.larkTableId) missing.push('larkTableId');
if (!secret.turnstileSecret) {
    missing.push('turnstileSecret (PROD_TURNSTILE_SECRET 環境変数 or .env に PROD_TURNSTILE_SECRET=xxx 行を追加)');
}
if (secret.turnstileSecret.startsWith('1x0000') || secret.turnstileSecret.startsWith('2x0000')) {
    console.log('\n⚠️ 警告: Turnstile テストキーが投入されようとしています (本番では使わないでください)');
    if (APPLY) {
        console.log('  → APPLY 中止');
        process.exit(1);
    }
}
if (missing.length > 0) {
    console.log('\n❌ 未設定の値:');
    missing.forEach(m => console.log('  -', m));
    if (APPLY) process.exit(1);
}

if (!APPLY) {
    console.log('\n⏸  DRY-RUN モード。実際に投入するには --apply');
    console.log('   PROD_TURNSTILE_SECRET=xxx node scripts/secrets-upload.mjs --apply');
    process.exit(0);
}

// ----- AWS Secrets Manager 投入 -----------------------------------------
console.log('\n=== AWS Secrets Manager 投入 ===');
const secretJson = JSON.stringify(secret);

// 既存 secret があるかチェック
let exists = false;
try {
    execSync(`aws --region ${REGION} secretsmanager describe-secret --secret-id ${SECRET_NAME}`, { stdio: 'pipe' });
    exists = true;
} catch (_) {}

if (exists) {
    console.log(`既存 secret 検出 → update-secret`);
    // tmpfile経由で渡す (コマンドライン履歴に値を残さない)
    const tmpFile = path.join(ROOT, 'tmp', `secret-${Date.now()}.json`);
    await fs.mkdir(path.dirname(tmpFile), { recursive: true });
    await fs.writeFile(tmpFile, secretJson, { mode: 0o600 });
    try {
        execSync(`aws --region ${REGION} secretsmanager update-secret --secret-id ${SECRET_NAME} --secret-string file://${tmpFile.replace(/\\/g, '/')}`, { stdio: 'inherit' });
    } finally {
        await fs.unlink(tmpFile).catch(() => {});
    }
} else {
    console.log(`secret 未作成 → create-secret`);
    const tmpFile = path.join(ROOT, 'tmp', `secret-${Date.now()}.json`);
    await fs.mkdir(path.dirname(tmpFile), { recursive: true });
    await fs.writeFile(tmpFile, secretJson, { mode: 0o600 });
    try {
        execSync(`aws --region ${REGION} secretsmanager create-secret --name ${SECRET_NAME} --description "tensyokudodesyo.com /contact/ form credentials" --secret-string file://${tmpFile.replace(/\\/g, '/')}`, { stdio: 'inherit' });
    } finally {
        await fs.unlink(tmpFile).catch(() => {});
    }
}

console.log('\n✅ Secrets Manager 投入完了');
console.log(`確認: aws --region ${REGION} secretsmanager get-secret-value --secret-id ${SECRET_NAME} --query SecretString --output text`);
