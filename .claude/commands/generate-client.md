# 会社紹介ページ自動生成パイプライン

Word(.docx) 形式のインタビュー原稿から「会社紹介」ページ (/clients/detail/{companyKey}.html) を生成・統合・デプロイするパイプラインを実行する。

**実行前提**: `$ARGUMENTS` または引数で **Wordファイルのパス**を受け取る。例: `/generate-client docs/clients/techno-solution.docx`

**重要**:
- Stage 1（構造化抽出のユーザー承認）と Stage 7（デプロイ実行）のみ停止する。それ以外は全自動で進める
- bashコマンドの実行確認は不要
- **Issueは勝手にクローズしない**

---

## 設定ファイル / 参照先

- **データ**: `public_html/data/clients.json`
- **テンプレート**: `public_html/clients/detail/techno-solution.html`（**必ず Read してから流用**。class名・id・DOM構造を勝手に変更しない）
- **CSS**: `public_html/css/client-detail.css`（共通）
- **動的JS**: `public_html/js/client-detail.js`（共通）
- **業界マスター**: `public_html/data/categories/company-industries.json`（in01-in09）
- **画像格納**: `public_html/assets/clients/`
- **Word抽出ヘルパー**: `scripts/extract-client-docx.mjs`
- **画像生成**: `scripts/generate-knowhow-images.js` の Gemini ロジックを流用

---

## Stage 1: Word取り込み・構造化抽出（⏸ ユーザー承認で停止）

1. **Wordパス確認**: 引数で指定された .docx ファイルが存在することを検証
2. **抽出スクリプト実行**:
   ```bash
   node scripts/extract-client-docx.mjs <docx-path>
   ```
   - 出力: `tmp/client-extract/{basename}.md` + `tmp/client-extract/{basename}.json`
3. **抽出結果の整形と補完**:
   - `tmp/client-extract/{basename}.json` を読み込む
   - 抽出された各フィールドを `public_html/data/clients.json` のスキーマに合わせる:
     ```
     name / tagline / industry / prefecture / city / address / established /
     employees / ceo / businessContent / vision / culture / idealPerson / message
     ```
   - **業界**: `industryHint` → `company-industries.json` の ID (in01〜in09) に変換（テキスト中の業界キーワードから推測）
   - **prefecture / city**: `address` フィールドから正規表現で抽出（`(\S+?[都道府県])(\S+?[市区町村])`）
   - **companyKey**: 会社名を kebab-case 英数字スラッグに変換（漢字は意訳ローマ字、既存IDと重複しないか確認）
   - **id**: `clients.json` の最大 ID + 1
4. **抽出プレビュー表示**:
   ```
   | フィールド | 抽出値 |
   |----------|-------|
   | name     | 株式会社XXX |
   | tagline  | ... |
   | ...      | ... |
   ```
5. **「上記の内容で記事を作成して問題ないですか？修正があれば指摘してください」と聞いてここで停止**

---

## Stage 2: 詳細ページHTML生成（承認後、自動実行）

1. **テンプレート読込**: `public_html/clients/detail/techno-solution.html` を Read
2. **新規HTML生成**: `public_html/clients/detail/{companyKey}.html` に出力
3. **置換ポイント**（テンプレート内の固定値をすべて差し替え）:
   - title / description / OGP / Twitter Card / canonical URL
   - `<meta name="client-name|client-key|client-industry|client-prefecture">`
   - JSON-LD (BreadcrumbList + Organization)
   - パンくず
   - ヒーロー（画像パス・name・tagline・industry/area タグ）
   - quickfacts（業界・所在地・従業員数・設立）
   - 会社概要テーブル
   - ビジョン / カルチャー / 求める人物像 / メッセージ
4. **DOM構造の遵守**:
   - `<section class="client-section">` + `<div class="client-editorial">` / `<div class="client-overview">`
   - 求人セクションは `<section class="client-section client-jobs">` 固定
   - 関連セクションは `<section class="client-section client-related">` 固定
   - JS読込順: `includes.js` → `categories.js` → `client-detail.js`

---

## Stage 3: サムネイル画像（自動実行）

1. **存在チェック**: `public_html/assets/clients/{companyKey}.webp` が手動アップロード済みか確認
2. **既存ならスキップ**
3. **なければ Gemini で生成**:
   - 環境変数 `GEMINI_API_KEY` を使用
   - プロンプト: 業界 + tagline + カルチャーから雰囲気を導出
   - **重要: 画像内に文字を一切含めない**（`Do NOT include any text, letters, numbers, words, logos, watermarks` をプロンプトに必ず明記）
4. **sharp で WebP 変換**: 1200x675px, quality 85
5. **出力先**: `public_html/assets/clients/{companyKey}.webp`
6. **エラー時**: ユーザーに通知し、placeholder にフォールバック（HTMLの `onerror` が拾う）

---

## Stage 4: サイト統合（自動実行）

1. **clients.json 更新**: 新規エントリを `clients` 配列の先頭に挿入
   ```json
   {
     "id": <新ID>,
     "companyKey": "<key>",
     "name": "...",
     "tagline": "...",
     "industry": "in0X",
     "prefecture": "...",
     "city": "...",
     "image": "/assets/clients/<key>.webp",
     "established": "...",
     "employees": "...",
     "ceo": "...",
     "address": "...",
     "businessContent": "...",
     "vision": "...",
     "culture": "...",
     "idealPerson": "...",
     "message": "...",
     "postDate": "<YYYY-MM-DD>",
     "detailUrl": "/clients/detail/<key>.html"
   }
   ```
2. **sitemap.xml 更新**: 新URLエントリを追加
   ```xml
   <url>
     <loc>https://www.tensyokudodesyo.com/clients/detail/<key>.html</loc>
     <lastmod>YYYY-MM-DD</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.7</priority>
   </url>
   ```

---

## Stage 5: 品質検証（自動実行、失敗時は自動修正）

| # | チェック項目 | 検証方法 |
|---|------------|---------|
| 1 | JSON-LD 構造 | BreadcrumbList + Organization が有効JSON、必須フィールドあり |
| 2 | 画像ファイル存在 | `public_html/assets/clients/{key}.webp` が存在（onerror fallback で許容しない） |
| 3 | 業界整合性 | `industry` が `company-industries.json` に存在 |
| 4 | DOM構造 | `<section class="client-hero">`、`<div class="client-overview">`、`<div id="clientJobsGrid">`、`<div id="clientRelatedGrid">` が揃っているか |
| 5 | meta タグ | `client-name`/`client-key`/`client-industry`/`client-prefecture` が設定されているか |
| 6 | clients.json | JSONとして valid、id が一意、companyKey が一意 |
| 7 | sitemap | 新URLエントリが追加されているか |
| 8 | 求人連携テスト | `jobs.json` 内に `company === name` の求人が何件あるか報告（0件でも警告のみ） |

失敗項目があれば自動修正して再検証。

---

## Stage 6: バージョン管理（自動実行）

1. `git add` → `git commit`（commit メッセージ: `feat: 会社紹介ページ {name} ({key}) を追加`）
2. `git push origin master`
3. push 成功で Stage 7 へ進む
4. push 失敗のみユーザー報告

---

## Stage 7: デプロイ（⏸ Epic方針: 指示があるまでデプロイしない）

1. **デフォルトは停止**:「デプロイを実行しますか？(y/N)」と確認
2. ユーザー承認後:
   - `bash scripts/deploy.sh` 経由でSCPデプロイ
   - **必ず scripts/deploy.sh を経由する**（MT管理ファイル保護のため）
   - 対象: 新規HTML、clients.json、sitemap.xml、画像
3. デプロイ後、本番URLを表示

---

## Stage 8: GSC sitemap送信（Stage 7 完了後、自動実行）

1. `.env` を読み込み、`scripts/gsc-submit-sitemap.mjs` を実行
2. 失敗時はエラーを表示し、GSC管理画面での手動送信を案内

---

## 注意事項

- **Stage 1 と Stage 7 のみユーザー承認で停止**。それ以外はすべて自動
- 画像生成エラー時は処理を継続（手動補完のため `assets/clients/{key}.webp` が無くてもサイトは壊れない）
- 既存の `companyKey` と重複した場合はユーザーに別名を提案
- Issueは勝手にクローズしない
