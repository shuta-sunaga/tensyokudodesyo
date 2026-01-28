# 詳細ページ MTテンプレート実装仕様書

## 概要

転職インタビュー・企業インタビュー・転職ノウハウの詳細ページをMovable Type 9.0.5のコンテンツタイプとブロックエディタで実装する。

---

## 1. コンテンツタイプ設計

### 1.1 転職インタビュー（Interview）

#### 基本設定
| 項目 | 設定値 |
|-----|-------|
| コンテンツタイプ名 | 転職インタビュー |
| コンテンツタイプID | interview |
| 説明 | 転職成功者の体験談・インタビュー記事 |

#### フィールド一覧
| No | フィールド名 | フィールドID | フィールドタイプ | 必須 | 説明 |
|----|------------|-------------|----------------|------|------|
| 1 | タイトル | title | 単行テキスト | ○ | 記事タイトル（H1） |
| 2 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像・H2セクション画像兼用 |
| 3 | カテゴリ | category | 選択 | ○ | 職種カテゴリ |
| 4 | エリア | area | 選択 | ○ | 都道府県 |
| 5 | 企業名 | company_name | 単行テキスト | ○ | 転職先企業名 |
| 6 | 職種（前） | job_before | 単行テキスト | - | 転職前の職種 |
| 7 | 職種（後） | job_after | 単行テキスト | - | 転職後の職種 |
| 8 | H2見出し | h2_title | 単行テキスト | ○ | メインセクション見出し |
| 9 | 本文 | body | ブロックエディタ | ○ | 記事本文 |
| 10 | メタディスクリプション | meta_description | 埋め込みテキスト | - | SEO用説明文（160文字以内） |

※ URLにはコンテンツID（`<mt:ContentID>`）を自動使用するため、スラッグフィールドは不要
※ 公開日はコンテンツデータの公開日（`<mt:ContentDate>`）を使用
※ サムネイル画像はアイキャッチとH2セクションの両方で使用

---

### 1.2 企業インタビュー（Company）

#### 基本設定
| 項目 | 設定値 |
|-----|-------|
| コンテンツタイプ名 | 企業インタビュー |
| コンテンツタイプID | company |
| 説明 | 採用企業の魅力・社風紹介記事 |

#### フィールド一覧
| No | フィールド名 | フィールドID | フィールドタイプ | 必須 | 説明 |
|----|------------|-------------|----------------|------|------|
| 1 | タイトル | title | 単行テキスト | ○ | 記事タイトル（H1） |
| 2 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像・H2セクション画像兼用 |
| 3 | 業界 | industry | 選択 | ○ | 業界カテゴリ |
| 4 | エリア | area | 選択 | ○ | 都道府県 |
| 5 | 企業名 | company_name | 単行テキスト | ○ | 企業名 |
| 6 | 従業員数 | employees | 単行テキスト | - | 会社規模 |
| 7 | H2見出し | h2_title | 単行テキスト | ○ | メインセクション見出し |
| 8 | 本文 | body | ブロックエディタ | ○ | 記事本文 |
| 9 | メタディスクリプション | meta_description | 埋め込みテキスト | - | SEO用説明文（160文字以内） |

※ URLにはコンテンツID（`<mt:ContentID>`）を自動使用するため、スラッグフィールドは不要
※ 公開日はコンテンツデータの公開日（`<mt:ContentDate>`）を使用
※ サムネイル画像はアイキャッチとH2セクションの両方で使用

---

### 1.3 転職ノウハウ（Knowhow）

#### 基本設定
| 項目 | 設定値 |
|-----|-------|
| コンテンツタイプ名 | 転職ノウハウ |
| コンテンツタイプID | knowhow |
| 説明 | 転職活動のコツ・ノウハウ記事 |

#### フィールド一覧
| No | フィールド名 | フィールドID | フィールドタイプ | 必須 | 説明 |
|----|------------|-------------|----------------|------|------|
| 1 | タイトル | title | 単行テキスト | ○ | 記事タイトル（H1） |
| 2 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像 |
| 3 | カテゴリ | category | 選択 | ○ | ノウハウカテゴリ |
| 4 | 前書き | introduction | 埋め込みテキスト（複数行） | - | 目次の上に表示する記事の概要 |
| 5 | 本文 | body | ブロックエディタ | ○ | 記事本文（H2/H3/H4/リスト/画像） |
| 6 | メタディスクリプション | meta_description | 埋め込みテキスト | - | SEO用説明文（160文字以内） |

※ URLにはコンテンツID（`<mt:ContentID>`）を自動使用するため、スラッグフィールドは不要
※ 公開日はコンテンツデータの公開日（`<mt:ContentDate>`）を使用
※ H2見出しはブロックエディタ内で使用（インタビュー・企業とは異なる構成）

---

## 2. 選択フィールドの選択肢

### 2.1 カテゴリ（転職インタビュー用）
| ID | 表示名 |
|----|-------|
| oc01 | 営業・セールス |
| oc02 | 事務・管理 |
| oc03 | ITエンジニア |
| oc04 | 企画・マーケティング |
| oc05 | 製造・生産 |
| oc06 | 医療・介護 |
| oc07 | 教育・研修 |
| oc08 | クリエイティブ |
| oc09 | コンサルタント |
| oc10 | 経営・役員 |
| oc11 | その他 |

### 2.2 業界（企業インタビュー用）
| ID | 表示名 |
|----|-------|
| in01 | IT・通信 |
| in02 | メーカー・製造 |
| in03 | 金融・保険 |
| in04 | 小売・流通 |
| in05 | 不動産・建設 |
| in06 | サービス |
| in07 | 医療・福祉 |
| in08 | 教育 |
| in09 | その他 |

### 2.3 カテゴリ（転職ノウハウ用）
| ID | 表示名 |
|----|-------|
| kh01 | 面接対策 |
| kh02 | 履歴書・職務経歴書 |
| kh03 | 自己分析 |

### 2.4 エリア（共通）
| ID | 表示名 |
|----|-------|
| shiga | 滋賀県 |
| shizuoka | 静岡県 |

※ 今後エリア拡大時に追加

---

## 3. ブロックエディタ設定

### 3.1 MT管理画面での設定手順

1. **設定** > **ブロックエディタ** を開く
2. **ブロックタイプの管理** で以下を設定

### 3.2 使用するブロックタイプ

#### 転職インタビュー・企業インタビュー
| ブロック名 | ブロックID | 用途 | 有効化 |
|-----------|-----------|------|-------|
| 見出し | heading | セクション見出し（H3のみ） | ○ |
| 段落 | paragraph | 本文テキスト | ○ |

#### 転職ノウハウ（より複雑な記事構成に対応）
| ブロック名 | ブロックID | 用途 | 有効化 |
|-----------|-----------|------|-------|
| 見出し | heading | H2/H3/H4見出し | ○ |
| 段落 | paragraph | 本文テキスト | ○ |
| リスト | list | 箇条書き・番号付きリスト | ○ |
| 画像 | image | 画像（altがキャプションとして表示） | ○ |

### 3.3 見出しブロックの設定

| コンテンツタイプ | 設定値 |
|---------------|-------|
| インタビュー・企業 | H3のみ有効 |
| 転職ノウハウ | H2/H3/H4有効 |

### 3.4 段落ブロックの設定

| 項目 | 設定値 |
|-----|-------|
| プレースホルダー | 本文を入力 |
| リッチテキスト機能 | 太字、リンクのみ有効 |

### 3.5 転職ノウハウの目次生成ルール

目次はH2とH3を対象に階層構造で自動生成される：
```
1. H2見出し1
   1.1 H3見出し1-1
   1.2 H3見出し1-2
2. H2見出し2
   2.1 H3見出し2-1
```

H4は目次の対象外（本文内の小見出しとして使用）

---

## 4. テンプレート設計

### 4.1 テンプレート一覧

| テンプレート名 | ファイル名 | 出力パス |
|--------------|-----------|---------|
| 転職インタビュー詳細 | interview-detail.mtml | /interviews/detail/{ContentID}.html |
| 企業インタビュー詳細 | company-detail.mtml | /companies/detail/{ContentID}.html |
| 転職ノウハウ詳細 | knowhow-detail.mtml | /knowhow/detail/{ContentID}.html |

### 4.1.1 一覧ページ配置

| ページ | URL |
|-------|-----|
| 転職インタビュー一覧 | /interviews/ (index.html) |
| 企業インタビュー一覧 | /companies/ (index.html) |
| 転職ノウハウ一覧 | /knowhow/ (index.html) |

### 4.2 アーカイブマッピング設定

#### 転職インタビュー
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 転職インタビュー詳細 |
| 出力ファイル名 | interviews/detail/<mt:ContentID>.html |

#### 企業インタビュー
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 企業インタビュー詳細 |
| 出力ファイル名 | companies/detail/<mt:ContentID>.html |

#### 転職ノウハウ
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 転職ノウハウ詳細 |
| 出力ファイル名 | knowhow/detail/<mt:ContentID>.html |

---

## 5. 詳細ページHTML構造

### 5.1 ページ構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{メタディスクリプション}">
    <title>{タイトル} | 転職どうでしょう</title>

    <!-- OGP -->
    <meta property="og:title" content="{タイトル}">
    <meta property="og:description" content="{メタディスクリプション}">
    <meta property="og:image" content="{サムネイル画像URL}">
    <meta property="og:url" content="{ページURL}">
    <meta property="og:type" content="article">

    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/article-detail.css">
</head>
<body>
    <!-- Header -->
    <div id="header-placeholder"></div>

    <main class="article-detail">
        <div class="container">
            <!-- パンくずリスト -->
            <nav class="breadcrumb">
                <a href="/">ホーム</a>
                <a href="/interviews.html">転職インタビュー</a>
                <span>{タイトル}</span>
            </nav>

            <!-- 記事ヘッダー -->
            <header class="article-header">
                <img src="{サムネイル画像}" alt="{タイトル}" class="article-thumbnail">
                <h1 class="article-title">{タイトル}</h1>
                <div class="article-meta">
                    <span class="article-category">{カテゴリ}</span>
                    <span class="article-area">{エリア}</span>
                    <time class="article-date">{公開日}</time>
                </div>
            </header>

            <!-- 目次 -->
            <nav class="article-toc">
                <h2 class="toc-title">目次</h2>
                <ol class="toc-list" id="tocList">
                    <!-- JavaScriptで動的生成 -->
                </ol>
            </nav>

            <!-- H2セクション -->
            <section class="article-main-section">
                <img src="{H2サムネイル画像}" alt="" class="section-thumbnail">
                <h2 class="section-title">{H2見出し}</h2>
            </section>

            <!-- 本文（ブロックエディタ出力） -->
            <div class="article-body" id="articleBody">
                <mt:ContentField content_field="body">
                    <mt:BlockEditorBlocks tag="ContentFieldValue">
                        <mt:Var name="__value__">
                    </mt:BlockEditorBlocks>
                </mt:ContentField>
            </div>

            <!-- CTA -->
            <section class="article-cta">
                <h3>この記事を読んで転職に興味を持った方へ</h3>
                <p>LINEで気軽にご相談ください</p>
                <a href="https://lin.ee/xZ1Tksm" class="btn btn-line btn-lg">
                    友だち追加して相談する
                </a>
            </section>

            <!-- 関連記事 -->
            <section class="related-articles">
                <h2>関連記事</h2>
                <div class="article-grid">
                    <!-- 関連記事カード -->
                </div>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <div id="footer-placeholder"></div>

    <script src="/js/includes.js"></script>
    <script src="/js/article-toc.js"></script>
</body>
</html>
```

---

## 6. JavaScript実装

### 6.1 目次生成スクリプト（article-toc.js）

H2/H3の階層構造に対応した目次を自動生成する。

**対応パターン:**
- インタビュー・企業: H3のみをフラットリストで表示
- 転職ノウハウ: H2をメイン項目、H3をサブ項目として階層表示

```javascript
/**
 * 記事詳細ページ - 目次生成 & スムーススクロール
 * H2/H3階層構造対応
 */
function initArticleToc() {
    const articleBody = document.getElementById('articleBody');
    const tocList = document.getElementById('tocList');

    if (!articleBody || !tocList) return;

    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    let h2Counter = 0;
    let h3Counter = 0;
    let currentH2Item = null;
    let currentSubList = null;

    headings.forEach((heading) => {
        const tagName = heading.tagName.toLowerCase();

        if (tagName === 'h2') {
            h2Counter++;
            h3Counter = 0;
            heading.id = 'section-' + h2Counter;

            // メイン項目を作成
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#section-' + h2Counter;
            a.textContent = heading.textContent;
            a.classList.add('toc-link');
            a.dataset.number = h2Counter + '.';

            li.appendChild(a);
            tocList.appendChild(li);
            currentH2Item = li;
            currentSubList = null;
        } else if (tagName === 'h3' && currentH2Item) {
            h3Counter++;
            heading.id = 'section-' + h2Counter + '-' + h3Counter;

            // サブリストを作成
            if (!currentSubList) {
                currentSubList = document.createElement('ol');
                currentSubList.classList.add('toc-sublist');
                currentH2Item.appendChild(currentSubList);
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = heading.textContent;
            a.classList.add('toc-link', 'toc-link-sub');
            a.dataset.number = h2Counter + '.' + h3Counter;

            li.appendChild(a);
            currentSubList.appendChild(li);
        }
    });
}
```

---

## 7. CSS設計

### 7.1 新規CSSファイル

| ファイル名 | 用途 |
|-----------|------|
| article-detail.css | 詳細ページ専用スタイル |

### 7.2 主要なクラス

```css
/* 記事詳細ページ */
.article-detail { }

/* 記事ヘッダー */
.article-header { }
.article-thumbnail { }
.article-title { }
.article-meta { }

/* 目次 */
.article-toc { }
.toc-title { }
.toc-list { }
.toc-link { }

/* H2セクション */
.article-main-section { }
.section-thumbnail { }
.section-title { }

/* 本文 */
.article-body { }
.article-body h3 { }
.article-body p { }

/* CTA */
.article-cta { }

/* 関連記事 */
.related-articles { }
```

---

## 8. 一覧ページとの連携

### 8.1 JSONデータ更新

一覧ページで使用するJSONデータを更新し、詳細ページへのリンクを設定。

#### 変更前
```json
{
  "detailUrl": "#"
}
```

#### 変更後
```json
{
  "detailUrl": "/interviews/detail/{ContentID}.html"
}
```

### 8.2 MTテンプレートでのJSON出力

一覧ページ用のJSONをMTから自動生成する場合：

```html
<mt:Contents content_type="interview">
{
  "id": <mt:ContentID>,
  "title": "<mt:ContentFieldValue field="title" escape="json">",
  "company": "<mt:ContentFieldValue field="company_name" escape="json">",
  "prefecture": "<mt:ContentFieldValue field="area" escape="json">",
  "category": "<mt:ContentFieldValue field="category" escape="json">",
  "image": "<mt:ContentFieldValue field="thumbnail"><mt:AssetURL></mt:ContentFieldValue>",
  "postDate": "<mt:ContentDate format="%Y-%m-%d">",
  "detailUrl": "/interviews/detail/<mt:ContentID>.html"
}
</mt:Contents>
```

---

## 9. 実装スケジュール

### Phase 1: 設計・準備（本ドキュメント）
- [x] コンテンツタイプ設計
- [x] フィールド設計
- [x] ブロックエディタ設定
- [x] テンプレート設計

### Phase 2: MT管理画面設定
- [ ] コンテンツタイプ作成（3種類）
- [ ] フィールド設定
- [ ] ブロックエディタ設定
- [ ] アーカイブマッピング設定

### Phase 3: テンプレート実装
- [ ] interview-detail.mtml
- [ ] company-detail.mtml
- [ ] knowhow-detail.mtml
- [ ] article-toc.js
- [ ] article-detail.css

### Phase 4: 一覧ページ連携
- [ ] JSONデータ更新
- [ ] 一覧ページテンプレート修正

### Phase 5: テスト・検証
- [ ] 各詳細ページの表示確認
- [ ] 目次機能の動作確認
- [ ] レスポンシブ確認
- [ ] OGP確認

---

## 10. ブロックエディタ出力方法

### 10.1 MTBlockEditorBlocksタグの使用

ブロックエディタのコンテンツを出力するには、`MTBlockEditorBlocks`タグを使用する必要がある。
単純な`<mt:ContentFieldValue field="body">`では正しく出力されない。

```html
<mt:ContentField content_field="body">
    <mt:BlockEditorBlocks tag="ContentFieldValue">
        <mt:Var name="__value__">
    </mt:BlockEditorBlocks>
</mt:ContentField>
```

### 10.2 参考ドキュメント

- [MTBlockEditorBlocks - Movable Type ドキュメント](https://www.movabletype.jp/documentation/appendices/tags/mtblockeditorblocks.html)

---

## 11. 備考

- MovableType バージョン: 9.0.5
- ブロックエディタは見出し（H3）と段落のみ使用
- 目次はJavaScriptで動的生成（H3タグから抽出）
- 既存の一覧ページ機能（フィルタ等）は変更なし
- パスはルート相対パス（`/css/style.css`形式）を使用

---

作成日: 2026-01-27
更新日: 2026-01-27

---

## 更新履歴

| 日付 | 内容 |
|-----|------|
| 2026-01-27 | 初版作成 |
| 2026-01-27 | 転職ノウハウ: 前書きフィールド追加、H2/H3/H4/リスト/画像対応 |
| 2026-01-27 | 目次生成: H2/H3階層構造に対応 |
