# AWS SES セットアップ手順書

転職どうでしょう のお問い合わせフォームから送信する**確認メール**を AWS SES 経由で送るためのセットアップ手順です。

DNS は **お名前.com / エックスサーバー等の他社管理** を前提としています（Route53 ではない）。

---

## 全体像

```
[Lambda] --(API)--> [AWS SES]
                       │
                       ├─ ドメイン認証 (TXT)
                       ├─ DKIM 署名 (CNAME × 3)
                       └─ MAIL FROM (MX + TXT)
                            │
                            └─ DNS (お名前.com 等) に追加
```

完了するまでの段階:
1. **SESにドメイン登録 + DKIM トークン取得** (スクリプト自動)
2. **DNSレコード追加** (お名前.com 等で手動)
3. **検証ステータス確認** (スクリプト)
4. **MAIL FROM ドメイン設定** (スクリプト自動)
5. **Sandbox 解除申請** (AWS Console で手動・1〜2営業日)
6. **Lambdaに反映 → 送信テスト**

---

## Step 1: ドメイン登録 + DKIM 設定（自動）

```bash
# まずは状態確認 (dry-run)
node scripts/ses-setup.mjs

# 実際に登録
node scripts/ses-setup.mjs --apply
```

スクリプトは以下を自動実行します:

- `tensyokudodesyo.com` を SES Email Identity に登録（東京リージョン）
- DKIM トークン3個を生成
- MAIL FROM ドメインを `mail.tensyokudodesyo.com` に設定

実行後、**DNS に追加すべきレコード一覧**が表で出力されます。

例:
```
+-------+--------------------------------+----------------------------------------+-----+
| Type  | Host                           | Value                                  | TTL |
+-------+--------------------------------+----------------------------------------+-----+
| CNAME | xxxxxxx._domainkey             | xxxxxxx.dkim.amazonses.com             | 300 |
| CNAME | yyyyyyy._domainkey             | yyyyyyy.dkim.amazonses.com             | 300 |
| CNAME | zzzzzzz._domainkey             | zzzzzzz.dkim.amazonses.com             | 300 |
| MX    | mail.tensyokudodesyo.com       | 10 feedback-smtp.ap-northeast-1.       | 300 |
|       |                                |   amazonses.com                        |     |
| TXT   | mail.tensyokudodesyo.com       | "v=spf1 include:amazonses.com ~all"    | 300 |
+-------+--------------------------------+----------------------------------------+-----+
```

加えて推奨レコード:

| Type | Host (apex) | Value | 備考 |
|------|------------|-------|------|
| TXT  | `@` (ルート) | `"v=spf1 include:amazonses.com ~all"` | 既に SPF があれば `include:amazonses.com` を **追記** (1ドメインに SPF は1個まで) |
| TXT  | `_dmarc` | `"v=DMARC1; p=quarantine; rua=mailto:dmarc@tensyokudodesyo.com; pct=100"` | DMARC (推奨) |

---

## Step 2: DNS にレコードを追加（手動・お名前.com の場合）

### お名前.com Navi の操作

1. https://www.onamae.com/navi/ にログイン
2. 上部メニュー「ドメイン」→「DNS関連機能の設定」
3. `tensyokudodesyo.com` を選択 → 「次へ」
4. 「DNS レコード設定を利用する」→「設定する」
5. 上記の表のレコードを **1行ずつ追加**:
   - **CNAME × 3 (DKIM)**
     - ホスト名: `xxxxxxx._domainkey` （末尾の `.tensyokudodesyo.com` は不要）
     - TYPE: `CNAME`
     - VALUE: `xxxxxxx.dkim.amazonses.com`
     - TTL: `300`（または既定）
   - **MX (MAIL FROM)**
     - ホスト名: `mail`
     - TYPE: `MX`
     - 優先: `10`
     - VALUE: `feedback-smtp.ap-northeast-1.amazonses.com`
   - **TXT (MAIL FROM SPF)**
     - ホスト名: `mail`
     - TYPE: `TXT`
     - VALUE: `v=spf1 include:amazonses.com ~all` （ダブルクォートはコンソール側で自動付与されます）
   - **TXT (apex SPF)** ※既存があれば追記
     - ホスト名: 空欄 or `@`
     - TYPE: `TXT`
     - VALUE: `v=spf1 include:amazonses.com ~all`
   - **TXT (DMARC)**
     - ホスト名: `_dmarc`
     - TYPE: `TXT`
     - VALUE: `v=DMARC1; p=quarantine; rua=mailto:dmarc@tensyokudodesyo.com; pct=100`
6. 「確認画面へ進む」→ 「設定する」

### エックスサーバーの場合

サーバーパネル → DNSレコード設定 → 同様に1行ずつ追加

### 既存SPFがある場合の注意

SPFは1ドメイン1レコードまで。既存に `v=spf1 include:_spf.google.com ~all` 等があれば:

```
v=spf1 include:_spf.google.com include:amazonses.com ~all
```

のように `include:` を **追記** してください。新規追加すると2レコードになり、両方無効化されます。

---

## Step 3: 検証ステータス確認

DNS 反映には通常 **5〜30分**、最大48時間かかります。

```bash
node scripts/ses-verify-status.mjs
```

期待結果:
```
Domain: tensyokudodesyo.com
├─ Verification : SUCCESS
├─ DKIM Status  : SUCCESS
├─ DKIM Tokens  : 3 件
├─ MAIL FROM    : mail.tensyokudodesyo.com
└─ MF Status    : SUCCESS

✅ 全部 SUCCESS。送信可能です。
```

途中状態 (`PENDING`) の場合は数分後に再実行。1時間経っても変わらない場合は DNS 設定を見直してください。

---

## Step 4: Sandbox 解除申請（手動・1〜2営業日）

新規 SES アカウントは **Sandbox モード** で、検証済み宛先にしか送れません。本番運用には解除申請が必要です。

### 申請手順

1. https://ap-northeast-1.console.aws.amazon.com/ses/home?region=ap-northeast-1#/account へ移動
2. 「**Get production access**」または「本番アクセスをリクエスト」をクリック
3. 入力フォームを埋める:
   - **Mail type**: Transactional
   - **Website URL**: `https://www.tensyokudodesyo.com`
   - **Use case description** (英語推奨):
     ```
     We operate "転職どうでしょう" (Tensyokudodesyo), a Japan-based job-placement
     service. Our website provides a contact form where job seekers submit
     inquiries. We send a single transactional confirmation email to each
     submitter (one per submission) containing:
       - Acknowledgement of receipt
       - A summary of their submitted information
       - A scheduling URL for an interview
     We do not send marketing or bulk email. Recipients are users who
     deliberately submit a form. Bounce/complaint handling will be done via
     SES configuration set with SNS notifications. Estimated volume: 10-50
     emails per day.
     ```
   - **Additional contacts**: 運営担当のメールアドレス
   - **Compliance with AWS terms**: チェック
4. 「Submit」→ 通常 24時間以内に承認

承認後、再度 `ses-verify-status.mjs` でも `Production Access: YES` になります。

---

## Step 5: バウンス / 苦情通知の設定（推奨）

```bash
# Configuration Set 作成 + SNS Topic 紐付け
aws sesv2 create-configuration-set --configuration-set-name tensyokudodesyo-contact

# SNS Topic 作成
aws sns create-topic --name ses-bounce-complaint-tensyokudodesyo

# Topic ARN を控える、Lambdaから読める形でメール購読等
```

詳細は別途必要に応じて。最初は省略してもOK。

---

## Step 6: Lambda 環境への反映

### ローカル `.env` の場合 (テスト)

```bash
# backend/local-dev/.env
SES_FROM_ADDRESS=noreply@tensyokudodesyo.com
SES_REPLY_TO=info@tensyokudodesyo.com
AWS_REGION=ap-northeast-1
```

`AWS_ACCESS_KEY_ID` 等は `aws configure` で設定済みなので不要。

ローカル送信テスト:
```bash
# サーバー再起動
$env:MOCK_MODE='false'; $env:SKIP_SES='false'; $env:SKIP_TURNSTILE='true'; node backend/local-dev/server.mjs
```

別ターミナルで:
```bash
curl -X POST http://localhost:3001/api/contact -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  --data-binary @/tmp/lark-test.json
```

ご自身のメールアドレスで試して、**Lark 書き込み** + **メール受信** の両方を確認。

### 本番 (AWS Secrets Manager)

```bash
aws secretsmanager update-secret \
  --secret-id tensyokudodesyo/contact-form \
  --secret-string '{
    "larkAppId":"...","larkAppSecret":"...","larkAppToken":"...","larkTableId":"...",
    "turnstileSecret":"...",
    "sesFromAddress":"noreply@tensyokudodesyo.com",
    "sesReplyTo":"info@tensyokudodesyo.com",
    "sesConfigurationSet":null
  }'
```

---

## トラブルシューティング

| 症状 | 原因 / 対処 |
|------|------------|
| `Verification: PENDING` のまま48時間 | DNS の TXT が間違っている。`nslookup -type=TXT _amazonses.tensyokudodesyo.com 8.8.8.8` で確認 |
| `DKIM Status: FAILED` | DKIM CNAMEが3つ揃っていない。`nslookup -type=CNAME xxxxxxx._domainkey.tensyokudodesyo.com` で確認 |
| 送信時 `MessageRejected: Email address is not verified` | Sandbox モードのまま。Step 4 を実施 |
| 送信時 `MailFromDomainNotVerified` | MAIL FROM の MX/TXT が反映されていない |
| 受信側で迷惑メール扱い | DMARC / DKIM / SPF いずれか不備。Gmailで「メッセージのソースを表示」→ Authentication-Results を確認 |

---

## 必要IAMポリシー（参考）

`aws configure` で使っているIAMユーザーが SES を操作できる必要があります。最小権限例:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:CreateEmailIdentity",
        "ses:GetEmailIdentity",
        "ses:PutEmailIdentityMailFromAttributes",
        "ses:PutEmailIdentityDkimSigningAttributes",
        "ses:GetAccount",
        "ses:SendEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

権限不足のエラーが出たら IT 担当 / AWS管理者にこの JSON を渡して付与依頼してください。
