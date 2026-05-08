/**
 * submit-form Lambda
 *
 * Endpoint: POST /api/contact
 *
 * フロー:
 *   1. Origin/Referer 検証
 *   2. JSON parse + 形状検証
 *   3. Cloudflare Turnstile 検証
 *   4. ハニーポット & 時間チェック
 *   5. 入力フィールドの厳格検証 (再実施・サニタイズ)
 *   6. Lark Base へレコード追加
 *   7. SES で確認メール送信
 *   8. レスポンス返却
 *
 * セキュリティ:
 *   - シークレットは AWS Secrets Manager から取得 (Lambda 起動時にキャッシュ)
 *   - PII は CloudWatch ログに出さない (マスキング関数を経由)
 *   - レスポンスにユーザー入力を直接含めない
 */

import { handle } from './handler.mjs';

export const handler = async (event) => {
    return handle(event);
};
