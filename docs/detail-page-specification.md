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
| 2 | スラッグ | slug | 単行テキスト | ○ | URLに使用（英数字・ハイフン） |
| 3 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像 |
| 4 | カテゴリ | category | 選択 | ○ | 職種カテゴリ |
| 5 | エリア | area | 選択 | ○ | 都道府県 |
| 6 | 企業名 | company_name | 単行テキスト | ○ | 転職先企業名 |
| 7 | 職種（前） | job_before | 単行テキスト | - | 転職前の職種 |
| 8 | 職種（後） | job_after | 単行テキスト | - | 転職後の職種 |
| 9 | 公開日 | publish_date | 日付 | ○ | 記事公開日 |
| 10 | H2見出し | h2_title | 単行テキスト | ○ | メインセクション見出し |
| 11 | H2サムネイル画像 | h2_thumbnail | アセット（画像） | - | H2見出し上の画像 |
| 12 | 本文 | body | ブロックエディタ | ○ | 記事本文 |
| 13 | メタディスクリプション | meta_description | 複数行テキスト | - | SEO用説明文（160文字以内） |

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
| 2 | スラッグ | slug | 単行テキスト | ○ | URLに使用（英数字・ハイフン） |
| 3 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像 |
| 4 | 業界 | industry | 選択 | ○ | 業界カテゴリ |
| 5 | エリア | area | 選択 | ○ | 都道府県 |
| 6 | 企業名 | company_name | 単行テキスト | ○ | 企業名 |
| 7 | 従業員数 | employees | 単行テキスト | - | 会社規模 |
| 8 | 公開日 | publish_date | 日付 | ○ | 記事公開日 |
| 9 | H2見出し | h2_title | 単行テキスト | ○ | メインセクション見出し |
| 10 | H2サムネイル画像 | h2_thumbnail | アセット（画像） | - | H2見出し上の画像 |
| 11 | 本文 | body | ブロックエディタ | ○ | 記事本文 |
| 12 | メタディスクリプション | meta_description | 複数行テキスト | - | SEO用説明文（160文字以内） |

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
| 2 | スラッグ | slug | 単行テキスト | ○ | URLに使用（英数字・ハイフン） |
| 3 | サムネイル画像 | thumbnail | アセット（画像） | ○ | アイキャッチ画像 |
| 4 | カテゴリ | category | 選択 | ○ | ノウハウカテゴリ |
| 5 | 公開日 | publish_date | 日付 | ○ | 記事公開日 |
| 6 | H2見出し | h2_title | 単行テキスト | ○ | メインセクション見出し |
| 7 | H2サムネイル画像 | h2_thumbnail | アセット（画像） | - | H2見出し上の画像 |
| 8 | 本文 | body | ブロックエディタ | ○ | 記事本文 |
| 9 | メタディスクリプション | meta_description | 複数行テキスト | - | SEO用説明文（160文字以内） |

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

| ブロック名 | ブロックID | 用途 | 有効化 |
|-----------|-----------|------|-------|
| 見出し | heading | セクション見出し（H3） | ○ |
| 段落 | paragraph | 本文テキスト | ○ |

### 3.3 見出しブロックの設定

| 項目 | 設定値 |
|-----|-------|
| 見出しレベル | H3のみ（H2, H4, H5, H6は無効化） |
| プレースホルダー | セクション見出しを入力 |

### 3.4 段落ブロックの設定

| 項目 | 設定値 |
|-----|-------|
| プレースホルダー | 本文を入力 |
| リッチテキスト機能 | 太字、リンクのみ有効 |

### 3.5 その他のブロック

以下のブロックは**無効化**する：
- 画像
- リスト
- 引用
- コード
- テーブル
- 埋め込み

---

## 4. テンプレート設計

### 4.1 テンプレート一覧

| テンプレート名 | ファイル名 | 出力パス |
|--------------|-----------|---------|
| 転職インタビュー詳細 | interview-detail.mtml | /interviews/{slug}.html |
| 企業インタビュー詳細 | company-detail.mtml | /companies/{slug}.html |
| 転職ノウハウ詳細 | knowhow-detail.mtml | /knowhow/{slug}.html |

### 4.2 アーカイブマッピング設定

#### 転職インタビュー
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 転職インタビュー詳細 |
| 出力ファイル名 | interviews/<mt:ContentFieldValue field="slug">.html |

#### 企業インタビュー
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 企業インタビュー詳細 |
| 出力ファイル名 | companies/<mt:ContentFieldValue field="slug">.html |

#### 転職ノウハウ
| 項目 | 設定値 |
|-----|-------|
| アーカイブタイプ | コンテンツタイプ |
| テンプレート | 転職ノウハウ詳細 |
| 出力ファイル名 | knowhow/<mt:ContentFieldValue field="slug">.html |

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
                {ブロックエディタ出力}
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

```javascript
/**
 * 記事詳細ページ - 目次生成 & スムーススクロール
 */
document.addEventListener('DOMContentLoaded', function() {
    const articleBody = document.getElementById('articleBody');
    const tocList = document.getElementById('tocList');
    const tocContainer = document.querySelector('.article-toc');

    if (!articleBody || !tocList) return;

    // H3タグを取得
    const h3Tags = articleBody.querySelectorAll('h3');

    // H3がない場合は目次を非表示
    if (h3Tags.length === 0) {
        if (tocContainer) {
            tocContainer.style.display = 'none';
        }
        return;
    }

    // 各H3にidを付与 & 目次を生成
    h3Tags.forEach((h3, index) => {
        const sectionId = 'section-' + (index + 1);
        h3.id = sectionId;

        // 目次項目を追加
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + sectionId;
        a.textContent = h3.textContent;
        a.classList.add('toc-link');
        li.appendChild(a);
        tocList.appendChild(li);
    });

    // スムーススクロール
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 80;
                const targetPosition = target.getBoundingClientRect().top
                    + window.pageYOffset
                    - headerHeight
                    - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
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
  "detailUrl": "interviews/{slug}.html"
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
  "postDate": "<mt:ContentFieldValue field="publish_date" format="%Y-%m-%d">",
  "detailUrl": "interviews/<mt:ContentFieldValue field="slug">.html"
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

## 10. 備考

- MovableType バージョン: 9.0.5
- ブロックエディタは見出し（H3）と段落のみ使用
- 目次はJavaScriptで動的生成（H3タグから抽出）
- 既存の一覧ページ機能（フィルタ等）は変更なし

---

作成日: 2026-01-27
更新日: 2026-01-27
