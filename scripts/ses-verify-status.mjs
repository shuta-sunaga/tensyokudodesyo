/**
 * AWS SES ドメイン検証ステータスのモニタリング
 *
 * 実行: node scripts/ses-verify-status.mjs
 */

import { execSync } from 'node:child_process';

const REGION = 'ap-northeast-1';
const DOMAIN = 'tensyokudodesyo.com';

function aws(cmd) {
    try {
        return JSON.parse(execSync(`aws --region ${REGION} ${cmd} --output json`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString());
    } catch (e) {
        const stderr = e.stderr ? e.stderr.toString() : '';
        if (stderr.includes('NotFoundException')) return null;
        throw new Error(stderr || e.message);
    }
}

const id = aws(`sesv2 get-email-identity --email-identity ${DOMAIN}`);
if (!id) {
    console.log('❌ ドメイン未登録。先に node scripts/ses-setup.mjs --apply');
    process.exit(1);
}

console.log(`Domain: ${DOMAIN}`);
console.log(`├─ Verification : ${id.VerificationStatus}`);
console.log(`├─ DKIM Status  : ${id.DkimAttributes?.Status}`);
console.log(`├─ DKIM Tokens  : ${(id.DkimAttributes?.Tokens || []).length} 件`);
console.log(`├─ MAIL FROM    : ${id.MailFromAttributes?.MailFromDomain || '(未設定)'}`);
console.log(`└─ MF Status    : ${id.MailFromAttributes?.MailFromDomainStatus || 'N/A'}`);

const allOk = id.VerificationStatus === 'SUCCESS'
    && id.DkimAttributes?.Status === 'SUCCESS'
    && id.MailFromAttributes?.MailFromDomainStatus === 'SUCCESS';

console.log(allOk ? '\n✅ 全部 SUCCESS。送信可能です。' : '\n⏳ DNS反映待ち。5-30分後に再実行してみてください。');
