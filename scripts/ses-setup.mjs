/**
 * AWS SES ドメイン認証・DKIM・MAIL FROM の初期化スクリプト
 *
 * 実行:
 *   node scripts/ses-setup.mjs                # 状態確認 (dry-run)
 *   node scripts/ses-setup.mjs --apply        # 実際に登録 (まだ DKIM トークンが無ければ生成)
 *
 * 必要権限 (IAM ポリシー):
 *   ses:CreateEmailIdentity
 *   ses:GetEmailIdentity
 *   ses:PutEmailIdentityMailFromAttributes
 *   ses:PutEmailIdentityDkimSigningAttributes
 *
 * 出力: DNS に追加すべき TXT/CNAME レコードを表で表示。
 */

import { execSync } from 'node:child_process';

const REGION = 'ap-northeast-1';
const DOMAIN = 'tensyokudodesyo.com';
const MAIL_FROM = 'mail.tensyokudodesyo.com'; // サブドメイン (バウンス処理用)
const APPLY = process.argv.includes('--apply');

function aws(cmd) {
    try {
        const out = execSync(`aws --region ${REGION} ${cmd} --output json`, { stdio: ['ignore', 'pipe', 'pipe'] });
        return JSON.parse(out.toString() || '{}');
    } catch (e) {
        const stderr = e.stderr ? e.stderr.toString() : '';
        if (stderr.includes('NotFoundException')) return { __notFound: true };
        throw new Error(stderr || e.message);
    }
}

function table(rows) {
    if (rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const widths = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c] ?? '').length)));
    const sep = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    console.log(sep);
    console.log('| ' + cols.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |');
    console.log(sep);
    rows.forEach(r => console.log('| ' + cols.map((c, i) => String(r[c] ?? '').padEnd(widths[i])).join(' | ') + ' |'));
    console.log(sep);
}

console.log(`\n=== AWS SES Setup ===`);
console.log(`Region    : ${REGION}`);
console.log(`Domain    : ${DOMAIN}`);
console.log(`MAIL FROM : ${MAIL_FROM}`);
console.log(`Mode      : ${APPLY ? 'APPLY' : 'DRY-RUN (確認のみ)'}\n`);

// ----- 1. 既存の identity を確認 -----------------------------------------
console.log(`--- ドメイン identity ---`);
let identity = aws(`sesv2 get-email-identity --email-identity ${DOMAIN}`);

if (identity.__notFound) {
    if (!APPLY) {
        console.log(`未登録。--apply で create-email-identity します。`);
    } else {
        console.log(`登録中...`);
        // Easy DKIM (AWS-managed) で作成。EasyDKIMはオプション省略でデフォルト動作。
        aws(`sesv2 create-email-identity --email-identity ${DOMAIN}`);
        identity = aws(`sesv2 get-email-identity --email-identity ${DOMAIN}`);
        console.log(`✓ 登録完了`);
    }
}

if (identity && !identity.__notFound) {
    console.log(`Verification : ${identity.VerificationStatus || 'unknown'}`);
    console.log(`Identity Type: ${identity.IdentityType || 'unknown'}`);
    console.log(`DKIM Status  : ${identity.DkimAttributes?.Status || 'unknown'}`);

    // ----- 2. DKIM トークンから CNAME を生成 ------------------------------
    const dkimTokens = identity.DkimAttributes?.Tokens || [];
    if (dkimTokens.length > 0) {
        console.log(`\n--- DNS に追加すべき DKIM CNAME (3 件) ---`);
        const dkimRows = dkimTokens.map(t => ({
            'Type': 'CNAME',
            'Host (お名前.com 等で入力)': `${t}._domainkey`,
            'Value': `${t}.dkim.amazonses.com`,
            'TTL': '300',
        }));
        table(dkimRows);
    }

    // ----- 3. MAIL FROM ---------------------------------------------------
    const mailFromAttrs = identity.MailFromAttributes;
    if (APPLY) {
        if (!mailFromAttrs?.MailFromDomain) {
            console.log(`\nMAIL FROM ドメインを設定中... (${MAIL_FROM})`);
            aws(`sesv2 put-email-identity-mail-from-attributes --email-identity ${DOMAIN} --mail-from-domain ${MAIL_FROM} --behavior-on-mx-failure USE_DEFAULT_VALUE`);
            console.log(`✓ MAIL FROM 設定完了`);
        }
    }

    // 再取得
    const refreshed = APPLY ? aws(`sesv2 get-email-identity --email-identity ${DOMAIN}`) : identity;
    const mfStatus = refreshed.MailFromAttributes?.MailFromDomainStatus;

    console.log(`\n--- MAIL FROM ドメイン (${MAIL_FROM}) ---`);
    console.log(`Status: ${mfStatus || 'PENDING'}`);
    console.log(`\nDNS に追加すべき MAIL FROM レコード:`);
    table([
        { 'Type': 'MX',  'Host (お名前.com 等で入力)': MAIL_FROM, 'Value': `10 feedback-smtp.${REGION}.amazonses.com`, 'TTL': '300' },
        { 'Type': 'TXT', 'Host (お名前.com 等で入力)': MAIL_FROM, 'Value': `"v=spf1 include:amazonses.com ~all"`,         'TTL': '300' },
    ]);

    // ----- 4. ドメイン全体の SPF (任意・推奨) -----------------------------
    console.log(`\n--- 補助レコード (推奨) ---`);
    table([
        { 'Type': 'TXT', 'Host': '@ (ルート)', 'Value': `"v=spf1 include:amazonses.com ~all"`, '備考': '既に SPF があれば include: のみ追記' },
        { 'Type': 'TXT', 'Host': '_dmarc',   'Value': `"v=DMARC1; p=quarantine; rua=mailto:dmarc@tensyokudodesyo.com; pct=100"`, '備考': 'DMARC ポリシー (推奨)' },
    ]);
}

// ----- 5. アカウントの Sandbox 状態 --------------------------------------
console.log(`\n--- アカウント送信制限 ---`);
const account = aws(`sesv2 get-account`);
console.log(`Production Access  : ${account.ProductionAccessEnabled ? 'YES (本番送信可)' : 'NO (Sandboxモード)'}`);
console.log(`Daily Send Quota   : ${account.SendQuota?.Max24HourSend || '?'} 通/日`);
console.log(`Send Rate          : ${account.SendQuota?.MaxSendRate || '?'} 通/秒`);
if (!account.ProductionAccessEnabled) {
    console.log(`\n⚠ Sandbox モードでは検証済みの宛先にしか送信できません。`);
    console.log(`  本番運用前に AWS Console から Sandbox 解除を申請してください。`);
    console.log(`  https://${REGION}.console.aws.amazon.com/ses/home?region=${REGION}#/account`);
}

console.log(`\n--- 次の手順 ---`);
console.log(`1. 上記 DNS レコードを お名前.com 等の管理画面で追加 (CNAME×3 + MX + TXT)`);
console.log(`2. 反映後 (5-30 分): node scripts/ses-verify-status.mjs で検証状況を確認`);
console.log(`3. 全部 SUCCESS になったら Sandbox 解除を申請 (上記URL)`);
console.log(`4. Sandbox 解除後、SES_FROM_ADDRESS を Lambda の Secrets Manager に保存して送信開始`);
