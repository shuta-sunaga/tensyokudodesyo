# /contact/ バックエンド

転職どうでしょう の転職相談フォーム用バックエンドです。

## 構成

```
backend/
├─ lambda/submit-form/      # 本番 Lambda 関数 (AWS SAM)
│  ├─ src/                  # 関数コード (ESM, Node 20+)
│  │  ├─ index.mjs          # Lambda エントリポイント
│  │  ├─ handler.mjs        # メインハンドラ
│  │  ├─ validate.mjs       # サーバー側バリデーション
│  │  ├─ turnstile.mjs      # Cloudflare Turnstile siteverify
│  │  ├─ lark.mjs           # Lark Base API クライアント
│  │  ├─ mailer.mjs         # AWS SES 送信
│  │  ├─ secrets.mjs        # Secrets Manager / .env 切替
│  │  └─ log.mjs            # PII マスキング
│  ├─ template.yaml         # SAM テンプレ
│  └─ package.json
└─ local-dev/               # ローカル開発用 Express ラッパー
   ├─ server.mjs
   ├─ .env.example
   └─ package.json
```

## ローカル開発

### 1. 依存インストール

```bash
cd backend/lambda/submit-form && npm install
cd ../../local-dev && npm install
```

### 2. .env 作成

```bash
cd backend/local-dev
cp .env.example .env
# Lark の管理者 (運営) から受け取った App ID / App Secret / Base 情報を埋める
```

### 3. 起動

```bash
npm run dev
# http://localhost:3001/api/contact が立ち上がる
```

### 4. フロントエンドの確認

`public_html/contact/index.html` を任意のローカルサーバーで配信し、フォームから送信。
JS 側はホスト名 `localhost` の場合に `http://localhost:3001/api/contact` へ送信するように切り替わる。

```bash
# 例: serve で配信
npx -y serve public_html
# ブラウザで http://localhost:3000/contact/
```

## Turnstile のローカルテストキー

開発中は Cloudflare の **常に成功するテストキー** を使えます：

| 用途 | サイトキー | シークレット |
|------|----------|-----------|
| 常に成功 | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| 常に失敗 | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

`public_html/contact/index.html` の `data-sitekey` と `.env` の `TURNSTILE_SECRET` を上記に置き換える。
本番用キーは事前に Cloudflare ダッシュボードで `tensyokudodesyo.com` を登録して取得する。

## デプロイ (本番)

**ユーザーから明示的な指示があるまでデプロイしないこと。** 実施時の参考手順：

```bash
# 0. Secrets Manager に認証情報を一括登録
aws secretsmanager create-secret \
  --name tensyokudodesyo/contact-form \
  --description "Contact form credentials" \
  --secret-string file://secrets.json
# secrets.json は別途 1Password 等から作成、コミットしないこと

# 1. SAM でデプロイ
cd backend/lambda/submit-form
sam build
sam deploy --guided  # 初回のみ
# 以降は: sam deploy
```

デプロイ後、API Gateway の Endpoint をフロントの `API_ENDPOINT` 定数（`public_html/js/contact.js`）に反映、もしくは CloudFront でリバースプロキシして同一オリジンで提供。

## SES 事前作業 (本番)

1. ドメイン `tensyokudodesyo.com` を SES で検証 (DKIM/SPF/DMARC)
2. サンドボックス解除申請 (本番送信に必要)
3. 送信元アドレス `noreply@tensyokudodesyo.com` を MAIL FROM に設定
4. (任意) Configuration Set でバウンス・苦情通知を SNS へ
