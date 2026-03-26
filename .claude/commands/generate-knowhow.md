# ノウハウ記事自動生成パイプライン

転職ノウハウ記事を自動生成し、サイトに統合・デプロイするパイプラインを実行してください。

**重要: テーマ選定（Stage 1）のユーザー承認以外は、すべて停止せず自動で進めること。bashコマンドの実行確認は不要。**

---

## 設定ファイル

- **サイト設定**: `site.config.yaml`
- **パイプライン記事データ**: `public_html/data/knowhow.json`
- **MT記事データ**: `public_html/data/knowhow-mt.json`
- **テンプレート**: `public_html/knowhow/detail/6.html`
- **カテゴリマスター**: `public_html/data/categories/knowhow-categories.json`（面接対策:kh01 / 履歴書の書き方:kh02 / 自己分析:kh03 / 業界研究:kh04 / 転職準備:kh05）

---

## Stage 1: テーマ分析・提案（⏸ ユーザー承認で停止）

1. `knowhow.json` と `knowhow-mt.json` の全記事を読み込み、タイトル・カテゴリを把握
2. カテゴリバランスを分析し、手薄なカテゴリを特定
3. テーマ3件を提案（カニバリチェック付き）:

```
| # | カテゴリ | タイトル案 | 想定検索KW | 既存記事とのカニバリ | リスク |
|---|---------|-----------|-----------|-------------------|--------|
| 1 | ...     | ...       | ...       | ...               | ...    |
| 2 | ...     | ...       | ...       | ...               | ...    |
| 3 | ...     | ...       | ...       | ...               | ...    |
```

4. 「上記から1つ選択するか、修正案を教えてください」と聞いて**ここで停止**

---

## Stage 2: 記事HTML生成（承認後、自動実行）

1. **ID採番**: `knowhow.json` と `knowhow-mt.json` の最大ID + 1
2. **HTML生成**: `public_html/knowhow/detail/knowhow-006.html` をテンプレートとして新規作成:
   - `<meta>` タグ（description, OGP, Twitter Card）
   - JSON-LD（BreadcrumbList + BlogPosting）
   - パンくずリスト、サムネイル画像
   - 本文（3000〜5000文字、です・ます調）
   - 見出し（H2）は4〜6個、各セクションに具体例や数字
   - LINE CTA（関連性のある箇所のみ、`site.config.yaml` の `lineUrl` を使用）
   - 関連記事セクション
   - `</body>` 前に `<script src="/js/blog-ad.min.js" defer></script>` を含める
   - 禁止ワード: `site.config.yaml` の `content.forbidden` を遵守
3. **ファイル命名規則**: `knowhow-{NNN}.html`（3桁ゼロ埋め、例: `knowhow-007.html`）。MTとのファイル名衝突を防止するため、`{id}.html` は使わない
4. **出力先**: `public_html/knowhow/detail/knowhow-{NNN}.html`

---

## Stage 3: サムネイル画像生成（自動実行）

1. **画像命名規則**: `knowhow-{NNN}.webp`（3桁ゼロ埋め、例: `knowhow-007.webp`）
2. **Gemini API で画像生成**:
   - 環境変数 `GEMINI_API_KEY` を使用
   - **画像内に文字・テキスト・ロゴ・数字・記号を一切含めないこと**（Geminiは文字を描くと高確率で文字化けするため）
   - プロンプトに必ず以下を含める: `"Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image."`
   - 記事テーマに合った、テキストなしのイラスト・写真風画像を生成
3. **sharp で WebP 変換**: 1200x675px, quality 85
4. **出力先**: `public_html/assets/knowhow-{NNN}.webp`
5. **フォールバック**: API エラー時はユーザーに通知し、手動で画像を用意するよう案内

### 画像生成コード

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImage(prompt, outputPath) {
    const fullPrompt = prompt + "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });

    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);

    if (!imagePart) throw new Error("No image generated");

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(imageBuffer)
        .resize(1200, 675, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(outputPath);
}
```

---

## Stage 4: サイト統合（自動実行）

1. **knowhow.json 更新**: 新記事を `articles` 配列の先頭に追加
   ```json
   {
     "id": {新ID},
     "title": "{タイトル}",
     "category": "{カテゴリID}",
     "excerpt": "{概要文}",
     "image": "/assets/knowhow-{NNN}.webp",
     "postDate": "{今日の日付 YYYY-MM-DD}",
     "detailUrl": "/knowhow/detail/knowhow-{NNN}.html"
   }
   ```
2. **sitemap.xml 更新**: 新記事のURLエントリを追加
   ```xml
   <url>
       <loc>https://www.tensyokudodesyo.com/knowhow/detail/knowhow-{NNN}.html</loc>
       <lastmod>{今日の日付}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.6</priority>
   </url>
   ```

---

## Stage 5: 品質検証（自動実行、失敗時は自動修正）

以下のチェックをすべて実行し、結果をテーブルで表示:

| # | チェック項目 | 検証方法 |
|---|------------|---------|
| 1 | JSON-LD 構造 | HTML内のJSON-LDが有効なJSONか、必須フィールドがあるか |
| 2 | 画像ファイル存在 | `public_html/assets/knowhow-{NNN}.webp` が存在するか |
| 3 | カテゴリ整合性 | JSON の category が `knowhow-categories.json` に存在するか |
| 4 | 文字数 | 本文が3000〜5000文字の範囲内か |
| 5 | 禁止ワード | `site.config.yaml` の `content.forbidden` に該当しないか |
| 6 | OGP メタタグ | og:title, og:description, og:image が設定されているか |
| 7 | 内部リンク | detailUrl がHTMLファイルと一致するか |
| 8 | sitemap エントリ | sitemap.xml に新記事URLが追加されているか |

失敗項目があれば自動修正して再検証する。

---

## Stage 6: バージョン管理（自動実行）

1. git add → commit → push
   - コミットメッセージ: `feat: 転職ノウハウ記事{ID}を追加（{タイトル短縮版}）`
2. 更新ファイル一覧をテーブルで表示

---

## Stage 7: デプロイ（自動実行）

1. `site.config.yaml` の deploy 設定を使用して SCP でデプロイ
   - 対象ファイル: 新規・変更されたファイル群（HTML、画像、knowhow.json、sitemap.xml）
   - デプロイ先: `ec2-user@13.230.204.170:/var/www/html/`
   - SSH鍵: `site.config.yaml` の `deploy.keyFile`
2. デプロイ完了後、本番URLを表示

---

## Stage 8: GSC sitemap送信（自動実行）

1. `.env` を読み込み、`site.config.yaml` の `seo.gsc` 設定を使用
2. Google Search Console API で sitemap.xml を送信

### 送信コード

```javascript
const { google } = require('googleapis');

async function submitSitemap() {
    const auth = new google.auth.GoogleAuth({
        keyFile: 'docs/tensyokudodesyo-1dcb1b08e015.json',
        scopes: ['https://www.googleapis.com/auth/webmasters']
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    await searchconsole.sitemaps.submit({
        siteUrl: 'sc-domain:tensyokudodesyo.com',
        feedpath: 'https://www.tensyokudodesyo.com/sitemap.xml'
    });
}
```

3. 送信成功を確認し、結果を表示
4. **フォールバック**: API エラー時はエラー内容を表示し、GSC管理画面での手動送信を案内

---

## 注意事項

- **Stage 1 のみユーザー承認で停止**。それ以外はすべて自動で最後まで進める
- エラーが発生した場合は自動修正を試み、不可能な場合のみユーザーに報告
- Issueは勝手にクローズしない（CLAUDE.mdのルール準拠）
