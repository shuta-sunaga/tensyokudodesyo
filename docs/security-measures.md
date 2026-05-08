# /contact/ フォーム セキュリティ対策まとめ

転職どうでしょう のお問い合わせフォームで採用したセキュリティ対策の一覧です。脅威 → 対策 → 実装位置の3点セットでまとめています。

## 全体方針

| 原則 | 中身 |
|------|------|
| 信頼境界はサーバー | クライアント検証は UX 目的のみ。サーバーで必ず再検証する。 |
| 最小権限 | Lambda の IAM は Secrets 取得 + SES 送信に限定。Lark 用の認証情報は AWS Secrets Manager 経由のみ。 |
| 多層防御 | Bot 対策・入力検証・出力エスケープ・通信暗号化・監査の各層で重ねる。 |
| PII を残さない | ログ・エラーメッセージに個人情報を出さない。出す場合はマスキング。 |
| 失敗時に情報を漏らさない | エラーメッセージは利用者向けの平易な文言のみ。スタックトレース・内部情報を返さない。 |

---

## 脅威 → 対策マトリクス

### 1. 通信の盗聴・改ざん

| 対策 | 実装 |
|------|------|
| HTTPS 強制 | API Gateway は HTTPS のみ受付・CloudFront 経由でも HTTPS 必須。フロントは `https://www.tensyokudodesyo.com` で配信。 |
| HSTS | レスポンスヘッダー `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` を全レスポンスに付与 (`backend/lambda/submit-form/src/handler.mjs`)。 |
| Referrer-Policy | `strict-origin-when-cross-origin` を全レスポンスに付与。 |
| X-Content-Type-Options | `nosniff` でMIME sniffing 攻撃を防止。 |

### 2. CSRF / クロスサイトリクエスト

静的サイトかつ Cookie 認証を使わないため CSRF 攻撃面は限定的。それでも以下の保険を実装：

| 対策 | 実装 |
|------|------|
| Origin / Referer 検証 | サーバー側で `https://www.tensyokudodesyo.com` 以外を 403 で拒否 (`handler.mjs`)。 |
| CORS allowlist | API Gateway / Lambda の両方で本番ドメインのみ許可。preflight (OPTIONS) も明示的にハンドル。 |
| Content-Type 制限 | `application/json` のみ受付。`multipart/form-data` 等の他形式は 415 で拒否 (`handler.mjs`)。フォーム submit では bypass できない。 |

### 3. XSS (クロスサイトスクリプティング)

| 対策 | 実装 |
|------|------|
| 入力をサニタイズ | サーバー側で制御文字 (`\x00-\x1F` 除く `\n\t`) をストリップ (`validate.mjs::stripCtrl`)。 |
| 出力エスケープ | 確認メール HTML 内のユーザー入力は `escapeHtml()` を全て通す (`mailer.mjs`)。プレーンテキスト版はエスケープ不要だが文字数制限あり。 |
| エラーレスポンスにユーザー入力を含めない | フロントは `globalError.textContent` で挿入 (innerHTML 不使用)。 |
| innerHTML を避ける | フロントは `textContent` を使用 (`contact.js`)。 |

### 4. 入力検証バイパス

| 対策 | 実装 |
|------|------|
| 全フィールドをサーバーで再検証 | クライアント検証を信用せず、サーバー側 `validate.mjs` でホワイトリスト検証 (型・長さ・列挙値・正規表現)。 |
| 都道府県は列挙チェック | 47 都道府県のリストに完全一致するもののみ受け入れる。 |
| 年齢は範囲制限 | 18-80 の整数のみ。 |
| 文字数上限 | name 50, email 254, message 1000, payload 全体 16KB。 |

### 5. スパム / Bot

| 対策 | 実装 |
|------|------|
| Cloudflare Turnstile | クライアントで widget 表示・サーバーで `siteverify` API 検証 (`turnstile.mjs`)。失敗時は 403。 |
| ハニーポット | 隠し input `website` を配置。値が入っていたら bot 確定で受信成功風に返却し Lark には書き込まない (`handler.mjs`)。 |
| 経過時間チェック | フォーム読込から3秒未満の送信は拒否 (`handler.mjs::form_elapsed_ms`)。 |
| API Gateway レート制限 | バースト 20 / 平均 5 req/sec を `template.yaml` で設定。ローカルは Express で IP 単位 10 req/min。 |
| User-Agent ログ | Lark Base に `user_agent` カラムを保存し、後追い分析を可能に。 |

### 6. 認証情報 / シークレット漏洩

| 対策 | 実装 |
|------|------|
| AWS Secrets Manager | Lark App Secret / Turnstile Secret / SES 設定値を一括格納 (`secrets.mjs`)。Lambda は IAM で許可された Secret のみ取得可能。 |
| 環境変数禁止 (本番) | 本番では環境変数に秘密情報を直接書かない。`SECRET_NAME` だけが env に入る。 |
| .env はコミットしない | `backend/local-dev/.env` を `.gitignore` に追加済み。 |
| 5分キャッシュ | Secrets Manager の呼び出しコスト削減のため Lambda メモリで5分キャッシュ。Lambda の冷却で自然に再取得される。 |
| ログにシークレット出力なし | エラーメッセージは `redactPII` を経由 (`log.mjs`)。 |

### 7. 個人情報の取り扱い

| 対策 | 実装 |
|------|------|
| 同意の必須化 | フロント・サーバー両方で `privacy_consent: true` を必須に。チェックなしでは送信ボタンが disabled。 |
| 同意の証跡 | Lark Base に `privacy_policy_version`, `consent_ip`, `submitted_at` を保存。後で「いつ・どの版に同意したか」を立証可能。 |
| 最小収集 | 必須は氏名・メール・都道府県・年齢のみ。電話・住所・生年月日 等は収集しない。 |
| 第三者提供しない | プライバシーポリシーで明示。Lark Base のアクセスは運営担当のみ。 |
| 保管期間 | Lark Base 側で運用ルール (例: 3年経過で削除) を別途設定する想定。Lambda 側は通信のみで保管しない。 |
| ログから PII 除去 | `log.mjs::redactPII` がメール・電話を `<email>` `<phone>` に置換。CloudWatch には PII を残さない。 |
| ログ保持期間 | CloudWatch Logs は 30 日で自動削除 (`template.yaml`)。 |
| メールマスキング | 監査用ログには `name@domain` を `n***e@domain` 形式に変換 (`log.mjs::maskEmail`)。 |

### 8. データ保存の整合性

| 対策 | 実装 |
|------|------|
| Lark Base 書込み失敗時のリトライ | 指数バックオフで最大3回 (`lark.mjs`)。認証エラーは即時失敗。 |
| 書込み失敗時はユーザーに明示 | 「保存に失敗しました」をフロントに表示 (`handler.mjs`)。「成功風」に隠さない。 |
| メール送信失敗時の扱い | レコードは保存済みなので、ユーザーには受付完了 + 別途連絡を案内 (`handler.mjs`)。 |

### 9. SQL インジェクション / コマンドインジェクション

| 対策 | 実装 |
|------|------|
| そもそも SQL を使わない | Lark Base API のみ。SQL 機構はなし。 |
| Lark API ペイロードは JSON.stringify | 文字列連結で API リクエストを組まない (`lark.mjs::buildFields`)。 |
| シェルコマンド実行なし | Lambda はシェルアウトしない。 |

### 10. 中継・送信ヘッダのインジェクション (メール)

| 対策 | 実装 |
|------|------|
| 件名・本文をユーザー入力で組まない | 件名は固定。本文は `escapeHtml` 通過後に挿入 (`mailer.mjs`)。 |
| 改行・制御文字を除去 | `validate.mjs::stripCtrl` で送信前に除去。 |
| To アドレスはサーバー側でバリデーション済 | `validate.mjs` で正規表現チェック。 |

### 11. メール送信の認証 / 信頼性

| 対策 | 実装 |
|------|------|
| SPF / DKIM / DMARC | `tensyokudodesyo.com` を AWS SES で検証 (デプロイ時の作業項目。`backend/README.md` 参照)。 |
| 送信元固定 | `noreply@tensyokudodesyo.com` を `MAIL FROM` ドメインに設定。 |
| Reply-To 設定 | 利用者が返信した場合は運営担当の問い合わせ用アドレスへ届く。 |
| バウンス・苦情処理 | (推奨) SES Configuration Set で SNS にバウンス通知を流し、運営に連絡。 |

### 12. ペネトレーションへの基本耐性

| 対策 | 実装 |
|------|------|
| ペイロードサイズ上限 | 16 KB (`handler.mjs`)。Lambda メモリ枯渇防止。 |
| メソッド制限 | POST / OPTIONS のみ。それ以外は 405。 |
| エンドポイントの最小化 | `/api/contact` 1つのみ。GET も生やさない。 |
| 内部エラーをユーザーに見せない | `try/catch` で 500 を返し、詳細は CloudWatch にのみ記録。 |
| HTTP メソッドオーバーライド禁止 | `X-HTTP-Method-Override` ヘッダーを使用しない実装。 |

---

## クライアント側で守れないこと (= サーバー必須)

以下はクライアント JS で「やっている振り」をしても無意味なので、サーバーで再実施しています。

- 入力検証 (型・長さ・列挙値) → `validate.mjs`
- Turnstile トークン検証 → `turnstile.mjs`
- ハニーポット判定 → `handler.mjs`
- レート制限 → API Gateway / Express
- Origin / Referer 検証 → `handler.mjs`
- 同意フラグの存在確認 → `validate.mjs`

---

## 既知の制限

| 項目 | 補足 |
|------|------|
| WAF (AWS WAF) | 本実装には組み込まず。広域な攻撃検知が必要なら CloudFront 前段に AWS WAF を追加することを推奨。コスト要件次第。 |
| アンチウイルス検査 | 添付ファイルを受け付けない設計のため不要。今後ファイル添付を入れる場合は別途対策。 |
| 国別ブロック | 国外からのアクセスは制限していない (CAPTCHA で対応)。必要なら CloudFront / WAF で IP リスト制御。 |
| 保管期間自動削除 | Lark Base 側にレコード自動削除機能は組み込んでいない。運用ルールで手動 or 定期スクリプト実装が必要。 |

---

## デプロイ前チェックリスト

リリース前に以下を確認すること（ユーザーから明示的な指示があったら実施）：

- [ ] Cloudflare Turnstile の本番サイトキーを取得し、HTML / Secrets Manager に反映
- [ ] AWS SES のサンドボックス解除申請が完了している
- [ ] `tensyokudodesyo.com` の DKIM / SPF / DMARC レコードが DNS に登録済み
- [ ] AWS Secrets Manager のシークレットが本番値で作成済み
- [ ] Lark カスタムアプリが Base への編集権限を持っている
- [ ] CloudWatch Logs の保持期間が 30 日に設定されている
- [ ] API Gateway のレート制限が想定値で設定されている
- [ ] CloudFront / API Gateway で HTTPS のみ許可になっている
- [ ] フォーム送信 → Lark 書込み → メール受信 → 面談予約URLアクセス を本番でも E2E 確認
- [ ] バウンス・苦情通知の SNS / メール設定 (推奨)
- [ ] privacy.html の改訂日と Lambda の `PRIVACY_POLICY_VERSION` 定数が一致している

---

## インシデント発生時の手順 (簡易)

1. **疑わしいレコードを発見した場合**:
   - Lark Base から該当レコードを論理削除 (status を「不要対応」に)
   - CloudWatch Logs で同一 IP / User-Agent からの送信を集計
   - 必要なら API Gateway のレート制限を強化 or WAF を有効化

2. **シークレット漏洩の疑い**:
   - AWS Secrets Manager で値を即時ローテーション
   - Lark の App Secret は Lark 管理画面で再発行
   - Turnstile Secret は Cloudflare ダッシュボードで再発行
   - 直近の CloudWatch Logs を確認して悪用の痕跡を調査

3. **DDoS / 大量送信**:
   - API Gateway のスロットルを下げる
   - CloudFront に AWS WAF を追加し、IP レート制限ルールを設定
   - Turnstile の難易度を Managed Challenge に上げる
