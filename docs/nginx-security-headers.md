# Nginx セキュリティヘッダ設定 (Phase 6)

`/etc/nginx/conf.d/portal.conf` の `server { ... }` ブロック内に以下を追加済み。

## 適用ヘッダ

| ヘッダ | 値 | 効果 |
|--------|-----|------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS 強制(2年) + サブドメイン + プリロード対象 |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing 攻撃を防止 |
| `X-Frame-Options` | `SAMEORIGIN` | クリックジャッキング防止 (同一オリジンのみ frame 可) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | クロスオリジン時に referrer の path/query を送らない |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=()` | 不要な強権 API を全部禁止 |
| `Content-Security-Policy` | (下記参照) | XSS の最後の砦 |

## CSP の中身

```
default-src 'self';
script-src 'self' 'unsafe-inline'
  https://challenges.cloudflare.com         (Turnstile)
  https://www.googletagmanager.com           (GA4)
  https://www.google-analytics.com;
style-src 'self' 'unsafe-inline'
  https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https:;
connect-src 'self'
  https://2kyofn1cn7.execute-api.ap-northeast-1.amazonaws.com  (Form API)
  https://challenges.cloudflare.com
  https://www.google-analytics.com
  https://*.google-analytics.com;
frame-src
  https://challenges.cloudflare.com
  https://sjpfkixxkhe8.jp.larksuite.com;     (面談予約)
frame-ancestors 'self';
form-action 'self'
  https://2kyofn1cn7.execute-api.ap-northeast-1.amazonaws.com;
base-uri 'self';
object-src 'none';
upgrade-insecure-requests;
```

## 検証

```bash
curl -sI https://www.tensyokudodesyo.com/contact/ | grep -iE "strict-transport|x-frame|content-security|referrer|permissions"
```

すべて出力されれば OK。

## ロールバック

問題発生時はバックアップから戻す:

```bash
ssh ec2-user@13.230.204.170
sudo ls /etc/nginx/conf.d/portal.conf.bak.*
sudo cp /etc/nginx/conf.d/portal.conf.bak.<TIMESTAMP> /etc/nginx/conf.d/portal.conf
sudo nginx -t && sudo systemctl reload nginx
```

## 今後の拡張

- CloudFront 経由化したらここで Response Headers Policy へ移行
- CSP report-uri を設定して violation を Lark/CloudWatch に送るとより強固
- 'unsafe-inline' を nonce-based に切替 (Phase 8 候補)

## API Gateway 側のヘッダ

Lambda レスポンスにも `X-Frame-Options: DENY` ・ `X-Content-Type-Options: nosniff` ・ `HSTS` ・ `Referrer-Policy` を Phase 2/4/6 で付与済 (handler.mjs corsHeaders)。
