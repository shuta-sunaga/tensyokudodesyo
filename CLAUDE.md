# 転職どうでしょう - プロジェクト概要

## サイト概要

「転職どうでしょう」は地域密着型の転職ポータルサイト。都道府県別に求人情報を管理・表示する。

- **本番URL**: http://13.230.204.170/
- **CMS**: MovableType（親サイト + 子サイト構成）
- **対応エリア**: 静岡県、滋賀県（active: true）

---

## アーキテクチャ

### サイト構成

```
親サイト（転職どうでしょう）
├── トップページ（日本地図から都道府県選択）
├── 転職者インタビュー一覧
├── 企業インタビュー一覧
├── 転職ノウハウ一覧
├── お問い合わせ
└── 子サイト
    ├── 静岡県（shizuoka）
    │   ├── 求人一覧
    │   └── 求人詳細ページ
    └── 滋賀県（shiga）
        ├── 求人一覧
        └── 求人詳細ページ
```

### データフロー

```
[MT子サイト] → [JSON出力] → [フロントエンドJS] → [画面表示]
     │              │
     │              ├── data/jobs/shizuoka.json
     │              └── data/jobs/shiga.json
     │
     └── 記事 + カスタムフィールドで求人管理
```

### 重要な設計決定

1. **求人は子サイトで管理** - 記事 + カスタムフィールド方式
2. **JSONは子サイトごとに出力** - `data/jobs/{prefecture_id}.json`
3. **フロントエンドで統合** - 複数JSONを並列取得・マージ（親サイト再構築不要）
4. **detailUrlは6桁ゼロパディング** - `job-000007.html`形式

---

## ディレクトリ構成

```
tensyokudodesyo/
├── public_html/          # 公開ファイル
│   ├── index.html        # トップページ
│   ├── interviews.html   # 転職者インタビュー
│   ├── companies.html    # 企業インタビュー
│   ├── knowhow.html      # 転職ノウハウ
│   ├── contact.html      # お問い合わせ
│   ├── css/
│   │   ├── style.css     # メインCSS
│   │   └── japan-map.css # 日本地図CSS
│   ├── js/
│   │   ├── main.js       # メインJS（求人読み込み・フィルタリング）
│   │   ├── japan-map.js  # 日本地図インタラクション
│   │   ├── includes.js   # ヘッダー/フッター読み込み
│   │   └── categories.js # カテゴリ管理
│   ├── data/
│   │   ├── prefectures.json      # 都道府県マスター
│   │   ├── interviews.json       # インタビューデータ
│   │   ├── companies.json        # 企業データ
│   │   ├── jobs/
│   │   │   ├── shiga.json        # 滋賀県求人
│   │   │   └── shizuoka.json     # 静岡県求人
│   │   └── categories/           # カテゴリJSON
│   ├── includes/
│   │   ├── header.html
│   │   └── footer.html
│   ├── shiga/                    # 滋賀県ページ
│   │   └── jobs/                 # 求人詳細
│   └── shizuoka/                 # 静岡県ページ
│       └── jobs/                 # 求人詳細
│
└── mt-template/          # MovableTypeテンプレート
    ├── README.md         # MT設定手順
    ├── jobs-child-json.mtml      # 求人JSON（子サイト用）
    ├── job-detail-child.mtml     # 求人詳細ページ（子サイト用）
    └── [その他テンプレート]
```

---

## MovableTypeテンプレート

### 子サイト用テンプレート（重要）

| テンプレート | 種類 | 出力ファイル |
|-------------|------|-------------|
| `jobs-child-json.mtml` | インデックス | `data/jobs/{prefecture_id}.json` |
| `job-detail-child.mtml` | 記事アーカイブ | `jobs/job-%E.html`（6桁パディング） |

### 親サイト用テンプレート

| テンプレート | 出力ファイル |
|-------------|-------------|
| `interviews-json.mtml` | `data/interviews.json` |
| `companies-json.mtml` | `data/companies.json` |
| `prefectures-json.mtml` | `data/prefectures.json` |
| カテゴリJSON各種 | `data/categories/*.json` |

---

## カスタムフィールド（子サイト求人用）

子サイトで記事に設定するカスタムフィールド（22項目）

### 基本情報
| フィールド名 | ベースネーム | タイプ |
|------------|-------------|-------|
| 会社名 | `company` | テキスト |
| 市区町村 | `city` | テキスト |
| 給与 | `salary` | テキスト |
| 条件タグ | `conditions` | テキスト |
| 職種 | `category` | ドロップダウン |
| キーワード | `keywords` | テキスト |

### 募集要項
| フィールド名 | ベースネーム | タイプ |
|------------|-------------|-------|
| 仕事内容 | `description` | テキストエリア |
| 求める人材 | `requirements` | テキストエリア |
| 勤務地 | `location` | 埋め込みオブジェクト |
| 勤務時間 | `workHours` | 埋め込みオブジェクト |
| 雇用形態 | `employmentType` | ドロップダウン |
| 給与詳細 | `salaryDetail` | 埋め込みオブジェクト |
| 賞与 | `bonus` | 埋め込みオブジェクト |
| 待遇・福利厚生 | `benefits` | テキストエリア |
| 休日・休暇 | `holidays` | 埋め込みオブジェクト |

### 会社情報
| フィールド名 | ベースネーム | タイプ |
|------------|-------------|-------|
| 会社所在地 | `companyAddress` | テキスト |
| 設立 | `established` | テキスト |
| 代表者 | `representative` | テキスト |
| 従業員数 | `employees` | テキスト |
| 事業内容 | `businessContent` | テキストエリア |

### 応募・選考
| フィールド名 | ベースネーム | タイプ |
|------------|-------------|-------|
| 選考フロー | `selectionProcess` | 埋め込みオブジェクト |
| 応募方法 | `AppMethod` | 埋め込みオブジェクト |

### ドロップダウン選択肢

**職種(category)**:
```
sales,it,office,marketing,medical,creative,consulting,manufacturing
```

**雇用形態(employmentType)**:
```
正社員,契約社員,派遣社員,パート・アルバイト,業務委託
```

---

## MTタグ形式

カスタムフィールドの出力タグ形式:
```mtml
<$mt:EntryData{ベースネーム}$>
```

例:
```mtml
<$mt:EntryDatacompany encode_html="1"$>
<$mt:EntryDatadescription nl2br="1"$>
<mt:EntryID sprintf="%06d">  <!-- 6桁ゼロパディング -->
```

---

## フロントエンド仕様

### 求人読み込みフロー（main.js）

1. `data/prefectures.json`を取得
2. `active: true`の都道府県を抽出
3. 各都道府県の`data/jobs/{id}.json`を並列取得
4. 全求人をマージ・日付順ソート
5. 画面に表示

### 日本地図（japan-map.js）

- SVG地図（Geolonia版）を使用
- 地域ごとに色分け
- ホバーで都道府県リンク表示
- active: trueの都道府県のみクリック可能

---

## 本セッションでの変更履歴

### MTテンプレート修正
- カスタムフィールドのベースネームをキャメルケースに統一
- `applicationMethod` → `AppMethod`に変更（名前が長すぎたため）
- 埋め込みオブジェクトのフィールドに`nl2br="1"`追加
- detailUrlを6桁ゼロパディング対応（`sprintf="%06d"`）

### CSS修正
- `.article-card-image img`に`object-position: center top`追加（画像見切れ対策）

### JavaScript修正
- `main.js`: detailUrlにprefecture_idを自動付加するロジック追加
- 複数JSONの並列取得・統合処理は実装済み

---

## サーバーへのアップロード必須ファイル

新着求人を表示するには以下をサーバーにアップロード:

```
public_html/
├── css/style.css
├── js/main.js
├── js/japan-map.js
├── data/
│   ├── prefectures.json
│   └── jobs/
│       ├── shiga.json
│       └── shizuoka.json
```

---

## 今後の作業

1. MTで子サイトにカスタムフィールドを作成
2. 求人記事を投稿
3. テンプレートを再構築してJSON生成
4. 生成されたJSONをサーバーにアップロード（または自動公開設定）
