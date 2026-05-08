/**
 * AWS SES 経由で確認メールを送信
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const SCHEDULER_URL = 'https://sjpfkixxkhe8.jp.larksuite.com/scheduler/f87a0259f5d1099f';
const SITE_URL = 'https://www.tensyokudodesyo.com';

const sesClient = new SESv2Client({
    region: process.env.AWS_REGION || 'ap-northeast-1',
});

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function fmtDate(d) {
    return d.toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

function buildPlainText({ name, payload, submittedAt }) {
    const lines = [
        `${name} 様`,
        '',
        '転職どうでしょうへの転職相談をいただきまして、誠にありがとうございます。',
        '以下の内容で承りました。',
        '',
        '────────────────────',
        '【面談のご予約はこちらから】',
        SCHEDULER_URL,
        '────────────────────',
        '',
        '上記URLからご都合の良い日時をお選びください。',
        'オンラインまたは対面で、地域のキャリアアドバイザーがご相談を承ります。',
        '',
        '────────────────────',
        '【ご入力内容】',
        '────────────────────',
        `転職相談日時: ${fmtDate(submittedAt)}`,
        `お名前: ${name}`,
    ];
    if (payload.name_kana) lines.push(`ふりがな: ${payload.name_kana}`);
    lines.push(`メールアドレス: ${payload.email}`);
    if (payload.phone) lines.push(`電話番号: ${payload.phone}`);
    lines.push(`都道府県: ${payload.prefecture}`);
    lines.push(`年齢: ${payload.age}歳`);
    if (payload.current_status) lines.push(`現在のご状況: ${payload.current_status}`);
    if (payload.interested_job) lines.push(`気になった求人: ${payload.interested_job}`);
    if (payload.message) {
        lines.push('');
        lines.push('【ご質問・ご要望】');
        lines.push(payload.message);
    }
    lines.push('');
    lines.push('────────────────────');
    lines.push('※このメールは送信専用アドレスから配信しています。');
    lines.push('※心当たりがない場合は、お手数ですが本メールを破棄してください。');
    lines.push('');
    lines.push('転職どうでしょう');
    lines.push(SITE_URL);
    return lines.join('\n');
}

function buildHtml({ name, payload, submittedAt }) {
    const e = escapeHtml;
    const optional = (label, val) => val ? `<tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;">${e(label)}</th><td style="padding:6px 12px;color:#3d3d3d;">${e(val)}</td></tr>` : '';
    const messageHtml = payload.message
        ? `<div style="margin-top:24px;padding:16px;background:#faf8f0;border-radius:8px;color:#3d3d3d;line-height:1.7;"><strong style="display:block;margin-bottom:8px;">ご質問・ご要望</strong>${e(payload.message).replace(/\n/g, '<br>')}</div>`
        : '';
    return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#faf8f0;font-family:'Hiragino Sans','Meiryo',sans-serif;color:#3d3d3d;line-height:1.7;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <p style="font-size:16px;margin:0 0 16px;">${e(name)} 様</p>
      <p style="font-size:15px;margin:0 0 24px;">転職どうでしょうへの転職相談をいただきまして、誠にありがとうございます。<br>以下の内容で承りました。</p>

      <div style="background:linear-gradient(135deg,#5a9e6f 0%,#7db88d 100%);border-radius:12px;padding:24px;text-align:center;color:#ffffff;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:14px;letter-spacing:0.05em;">面談のご予約はこちら</p>
        <a href="${SCHEDULER_URL}" style="display:inline-block;background:#ffffff;color:#4a8a5f;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">面談予約ページを開く</a>
        <p style="margin:16px 0 0;font-size:13px;opacity:0.9;">ご都合の良い日時をお選びください</p>
      </div>

      <h3 style="font-size:14px;color:#5a5a5a;margin:24px 0 8px;border-bottom:1px solid #e5e2d8;padding-bottom:8px;">ご入力内容</h3>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:14px;border-collapse:separate;border-spacing:0 4px;">
        <tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;width:40%;">転職相談日時</th><td style="padding:6px 12px;">${e(fmtDate(submittedAt))}</td></tr>
        <tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;">お名前</th><td style="padding:6px 12px;">${e(name)}</td></tr>
        ${optional('ふりがな', payload.name_kana)}
        <tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;">メールアドレス</th><td style="padding:6px 12px;">${e(payload.email)}</td></tr>
        ${optional('電話番号', payload.phone)}
        <tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;">都道府県</th><td style="padding:6px 12px;">${e(payload.prefecture)}</td></tr>
        <tr><th align="left" style="padding:6px 12px;background:#f5f2e8;color:#3d3d3d;font-weight:600;border-radius:4px 0 0 4px;">年齢</th><td style="padding:6px 12px;">${e(payload.age)}歳</td></tr>
        ${optional('現在のご状況', payload.current_status)}
        ${optional('気になった求人', payload.interested_job)}
      </table>
      ${messageHtml}

      <p style="font-size:12px;color:#7a7a7a;margin:32px 0 0;line-height:1.7;">
        ※このメールは送信専用アドレスから配信しています。<br>
        ※心当たりがない場合は、お手数ですが本メールを破棄してください。
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#7a7a7a;margin:24px 0 0;">
      転職どうでしょう<br>
      <a href="${SITE_URL}" style="color:#5a9e6f;text-decoration:none;">${SITE_URL}</a>
    </p>
  </div>
</body></html>`;
}

export async function sendConfirmationMail({ to, name, payload, submittedAt }, secrets) {
    if (process.env.MOCK_MODE_ACTIVE === 'true' || process.env.SKIP_SES === 'true') {
        console.log('[mock/skip-ses] SES sendConfirmationMail to:', to ? to.replace(/(.).+(@.+)/, '$1***$2') : '');
        return;
    }
    const fromAddress = secrets.sesFromAddress || 'noreply@tensyokudodesyo.com';
    const replyTo = secrets.sesReplyTo || 'info@tensyokudodesyo.com';
    const fromName = '転職どうでしょう';

    const cmd = new SendEmailCommand({
        FromEmailAddress: `${fromName} <${fromAddress}>`,
        Destination: { ToAddresses: [to] },
        ReplyToAddresses: [replyTo],
        Content: {
            Simple: {
                Subject: { Charset: 'UTF-8', Data: '【転職どうでしょう】ご相談ありがとうございます' },
                Body: {
                    Text: { Charset: 'UTF-8', Data: buildPlainText({ name, payload, submittedAt }) },
                    Html: { Charset: 'UTF-8', Data: buildHtml({ name, payload, submittedAt }) },
                },
            },
        },
        ConfigurationSetName: secrets.sesConfigurationSet || undefined,
    });

    await sesClient.send(cmd);
}
