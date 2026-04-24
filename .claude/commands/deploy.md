---
description: SCP デプロイ実行（MT管理ファイル保護付き）
---

# Deploy Command

`scripts/deploy.sh` を使用して、変更ファイルをAWS EC2にデプロイします。

**重要: MT管理ファイルは自動でブロックされます。直接SCPを叩かず、必ずこのスクリプト経由でデプロイすること。**

## 使い方

```bash
bash scripts/deploy.sh <file1> [file2] ...
```

## デプロイ可能なファイル

- `public_html/js/` — JavaScript
- `public_html/css/` — スタイルシート
- `public_html/assets/` — 画像・静的アセット
- `public_html/data/knowhow.json` — パイプライン記事データ
- `public_html/data/categories/` — カテゴリJSON
- `public_html/sitemap.xml`
- `public_html/robots.txt`
- `public_html/privacy.html`
- `public_html/knowhow/detail/knowhow-*.html` — パイプライン生成記事

## ブロックされるファイル（MT管理）

以下はスクリプトが自動ブロックします：

- `public_html/index.html` — トップページ
- `public_html/{prefecture}/index.html` — 都道府県ページ
- `public_html/{prefecture}/jobs/*.html` — 求人詳細
- `public_html/interviews/`, `public_html/companies/` 配下の詳細・一覧
- `public_html/knowhow/index.html` — ノウハウ一覧
- `public_html/knowhow/detail/{数字}.html` — MT生成ノウハウ詳細
- `public_html/data/knowhow-mt.json` — MT記事データ
- `public_html/data/jobs/`, `data/interviews/`, `data/companies/` — MT生成JSON
- `public_html/includes/header.html`, `footer.html`

MT管理ファイルの変更手順：
1. `mt-template/*.mtml` を修正
2. MT管理画面にテンプレートをコピー
3. MT管理画面で再構築

## 実行例

```bash
# JS・CSSのデプロイ
bash scripts/deploy.sh public_html/js/prefecture-page.js public_html/css/style.css

# ノウハウ記事のデプロイ
bash scripts/deploy.sh \
  public_html/knowhow/detail/knowhow-040.html \
  public_html/assets/knowhow-040.webp \
  public_html/data/knowhow.json \
  public_html/sitemap.xml

# MT管理ファイルを含むとブロックされる
bash scripts/deploy.sh public_html/shiga/index.html
# → エラー: MT管理ファイルのデプロイをブロックしました
```
