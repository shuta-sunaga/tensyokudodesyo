/**
 * AWS Secrets Manager から認証情報を取得し、関数のメモリにキャッシュ
 *
 * 期待する Secret 構造（JSON 文字列）:
 * {
 *   "larkAppId": "cli_xxx",
 *   "larkAppSecret": "xxx",
 *   "larkAppToken": "bascn...",
 *   "larkTableId": "tbl...",
 *   "turnstileSecret": "0xxxx",
 *   "sesFromAddress": "noreply@tensyokudodesyo.com",
 *   "sesReplyTo": "info@tensyokudodesyo.com",
 *   "sesConfigurationSet": null
 * }
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const secretId = process.env.SECRET_NAME || 'tensyokudodesyo/contact-form';

const client = new SecretsManagerClient({ region });
let _cache = null;
let _cacheExpire = 0;

export async function getSecrets() {
    // ローカル開発時は環境変数から
    if (process.env.NODE_ENV !== 'production' && process.env.USE_LOCAL_SECRETS === 'true') {
        return {
            larkAppId: process.env.LARK_APP_ID,
            larkAppSecret: process.env.LARK_APP_SECRET,
            larkAppToken: process.env.LARK_APP_TOKEN,
            larkTableId: process.env.LARK_TABLE_ID,
            turnstileSecret: process.env.TURNSTILE_SECRET,
            sesFromAddress: process.env.SES_FROM_ADDRESS,
            sesReplyTo: process.env.SES_REPLY_TO,
            sesConfigurationSet: process.env.SES_CONFIG_SET || null,
        };
    }

    const now = Date.now();
    if (_cache && _cacheExpire > now) return _cache;

    const cmd = new GetSecretValueCommand({ SecretId: secretId });
    const res = await client.send(cmd);
    if (!res.SecretString) throw new Error('Secret has no SecretString');
    _cache = JSON.parse(res.SecretString);
    // 5分キャッシュ
    _cacheExpire = now + 5 * 60_000;
    return _cache;
}
