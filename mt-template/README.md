# MovableType テンプレート

転職どうでしょうサイトをMovableTypeで管理するためのテンプレート一式です。

## テンプレート一覧

### カテゴリJSON生成テンプレート（インデックステンプレート）

| テンプレートファイル | 出力ファイル | カテゴリセット名 |
|---------------------|-------------|-----------------|
| `interview-categories.mtml` | `data/categories/interview-categories.json` | インタビュー職種 |
| `company-industries.mtml` | `data/categories/company-industries.json` | 企業業界 |
| `knowhow-categories.mtml` | `data/categories/knowhow-categories.json` | ノウハウカテゴリ |
| `job-conditions.mtml` | `data/categories/job-conditions.json` | 求人条件 |

### コンテンツデータJSON生成テンプレート（インデックステンプレート）

| テンプレートファイル | 出力ファイル | コンテンツタイプ |
|---------------------|-------------|-----------------|
| `interviews-json.mtml` | `data/interviews.json` | 転職者インタビュー |
| `companies-json.mtml` | `data/companies.json` | 企業インタビュー |
| `prefectures-json.mtml` | `data/prefectures.json` | （静的マスター） |
| ~~`jobs-json.mtml`~~ | ~~`data/jobs.json`~~ | **非推奨** - 子サイト用を使用 |

### 静的ファイルテンプレート（インデックステンプレート）

| テンプレートファイル | 出力ファイル | 説明 |
|---------------------|-------------|------|
| `categories-js.mtml` | `js/categories.js` | カテゴリ管理JavaScript |
| `includes-js.mtml` | `js/includes.js` | ヘッダー/フッターインクルードJS |
| `header-html.mtml` | `includes/header.html` | 共通ヘッダー |
| `footer-html.mtml` | `includes/footer.html` | 共通フッター |

### HTMLページテンプレート（インデックステンプレート）

| テンプレートファイル | 出力ファイル | 説明 |
|---------------------|-------------|------|
| `index-html.mtml` | `index.html` | トップページ |
| `interviews-html.mtml` | `interviews.html` | 転職者インタビュー一覧 |
| `companies-html.mtml` | `companies.html` | 企業インタビュー一覧 |
| `knowhow-html.mtml` | `knowhow.html` | 転職ノウハウ一覧 |
| `contact-html.mtml` | `contact.html` | お問い合わせ |

### アーカイブテンプレート（親サイト用）

| テンプレートファイル | 出力ファイル | 説明 |
|---------------------|-------------|------|
| `prefecture-page.mtml` | `{prefecture_id}/index.html` | 都道府県別ページ |
| `job-detail.mtml` | `{prefecture_id}/jobs/job-{id}.html` | 求人詳細ページ（コンテンツタイプ用） |

### 子サイト用テンプレート（記事+カスタムフィールド）

| テンプレートファイル | 出力ファイル | 説明 |
|---------------------|-------------|------|
| `jobs-child-json.mtml` | `data/jobs/{prefecture_id}.json` | 求人JSONテンプレート |
| `job-detail-child.mtml` | `jobs/job-{id}.html` | 求人詳細ページテンプレート |

---

## MovableType設定手順

### 1. カテゴリセットの作成

**設定 > カテゴリセット > 新規作成**

| カテゴリセット名 |
|-----------------|
| インタビュー職種 |
| 企業業界 |
| ノウハウカテゴリ |
| 求人条件 |

### 2. カテゴリの登録

各カテゴリセットにカテゴリを登録します。

**重要**: カテゴリの「ベースネーム」がJSONの`id`として出力されます。

#### インタビュー職種

| ラベル | ベースネーム |
|-------|-------------|
| 営業 | `oc01` |
| 企画・管理 | `oc02` |
| 事務・アシスタント | `oc03` |
| 販売・サービス | `oc04` |
| コンサルタント・専門職 | `oc05` |
| 金融専門職 | `oc06` |
| SE・ITエンジニア | `oc07` |
| クリエイティブ | `oc08` |
| 技術系 | `oc09` |
| 医療・福祉 | `oc10` |
| その他 | `oc11` |

#### 企業業界

| ラベル | ベースネーム |
|-------|-------------|
| 金融・保険 | `in01` |
| 建設・不動産 | `in02` |
| コンサルティング | `in03` |
| IT・通信 | `in04` |
| メーカー | `in05` |
| 商社・流通 | `in06` |
| サービス | `in07` |
| 医療・福祉 | `in08` |
| その他 | `in09` |

#### ノウハウカテゴリ

| ラベル | ベースネーム |
|-------|-------------|
| 履歴書・職務経歴書 | `kh01` |
| 面接対策 | `kh02` |
| 自己分析 | `kh03` |
| 業界研究 | `kh04` |
| 転職活動の進め方 | `kh05` |

#### 求人条件

| ラベル | ベースネーム |
|-------|-------------|
| リモートワーク可 | `pu01` |
| 土日祝休み | `pu02` |
| 未経験歓迎 | `pu03` |
| 学歴不問 | `pu04` |
| 残業少なめ | `pu05` |
| フレックス | `pu06` |
| 転勤なし | `pu07` |
| 高年収 | `pu08` |
| 研修充実 | `pu09` |
| 資格取得支援 | `pu10` |
| インセンティブあり | `pu11` |

### 3. コンテンツタイプの作成

**設定 > コンテンツタイプ > 新規作成**

#### 転職者インタビュー

| フィールド名 | フィールドタイプ | 説明 |
|-------------|-----------------|------|
| title | テキスト | インタビュータイトル |
| company | テキスト | 会社名 |
| prefecture | 単一選択リスト | 都道府県 |
| category | カテゴリ | インタビュー職種 |
| image | アセット | サムネイル画像 |
| detailUrl | テキスト | 詳細ページURL |

#### 企業インタビュー

| フィールド名 | フィールドタイプ | 説明 |
|-------------|-----------------|------|
| title | テキスト | インタビュータイトル |
| company | テキスト | 会社名 |
| prefecture | 単一選択リスト | 都道府県 |
| industry | カテゴリ | 企業業界 |
| image | アセット | サムネイル画像 |
| detailUrl | テキスト | 詳細ページURL |

#### 求人

| フィールド名 | フィールドタイプ | 説明 |
|-------------|-----------------|------|
| title | テキスト | 求人タイトル |
| company | テキスト | 会社名 |
| prefecture | 単一選択リスト | 都道府県 |
| prefecture_id | テキスト | 都道府県ID (shiga, shizuoka等) |
| city | テキスト | 市区町村 |
| salary | テキスト | 給与（表示用） |
| conditions | テキスト | 求人条件タグ（カンマ区切り） |
| category | テキスト | 職種カテゴリ |
| keywords | テキスト | 検索キーワード |
| description | 複数行テキスト | 仕事内容 |
| requirements | 複数行テキスト | 求める人材 |
| location | テキスト | 勤務地 |
| workHours | テキスト | 勤務時間 |
| employmentType | テキスト | 雇用形態 |
| salaryDetail | テキスト | 給与詳細 |
| bonus | テキスト | 賞与 |
| benefits | テキスト | 待遇・福利厚生 |
| holidays | テキスト | 休日・休暇 |
| companyAddress | テキスト | 会社所在地 |
| established | テキスト | 設立 |
| representative | テキスト | 代表者 |
| employees | テキスト | 従業員数 |
| businessContent | テキスト | 事業内容 |
| selectionProcess | テキスト | 選考フロー |
| applicationMethod | テキスト | 応募方法 |

### 4. インデックステンプレートの作成

**デザイン > テンプレート > インデックステンプレート > 新規作成**

各テンプレートファイルの内容をコピーして、対応する出力ファイル名で設定します。

### 5. アーカイブテンプレートの作成（オプション）

都道府県別ページや求人詳細ページは、以下のいずれかの方法で作成できます：

**方法A: カテゴリアーカイブを使用**
- 「都道府県」カテゴリセットを作成
- `prefecture-page.mtml`をカテゴリアーカイブテンプレートとして設定

**方法B: インデックステンプレートを複製**
- 各都道府県ごとにインデックステンプレートを作成
- `<mt:SetVar>`で都道府県情報を設定

### 6. 再構築

テンプレートを保存後、「すべて再構築」を実行してファイルを生成します。

---

## 子サイト設定手順（都道府県別）

子サイトでは、求人を「記事+カスタムフィールド」で管理します。

### 1. 子サイトの作成

**システム > ウェブサイト/ブログ > 新規作成**

| 設定項目 | 例（静岡県） |
|---------|-------------|
| ブログ名 | 静岡県 |
| ベースネーム | shizuoka |
| サイトパス | shizuoka/ |

### 2. カスタムフィールドの作成

**設定 > カスタムフィールド > 新規作成**

| フィールド名 | ベースネーム | タイプ | 必須 |
|------------|-------------|-------|-----|
| 会社名 | `company` | テキスト | ○ |
| 市区町村 | `city` | テキスト | ○ |
| 給与 | `salary` | テキスト | ○ |
| 条件タグ | `conditions` | テキスト | - |
| 職種 | `category` | ドロップダウン | ○ |
| キーワード | `keywords` | テキスト | - |
| 仕事内容 | `description` | テキストエリア | ○ |
| 求める人材 | `requirements` | テキストエリア | - |
| 勤務地 | `location` | 埋め込みオブジェクト | - |
| 勤務時間 | `workHours` | 埋め込みオブジェクト | - |
| 雇用形態 | `employmentType` | ドロップダウン | ○ |
| 給与詳細 | `salaryDetail` | 埋め込みオブジェクト | - |
| 賞与 | `bonus` | 埋め込みオブジェクト | - |
| 待遇・福利厚生 | `benefits` | テキストエリア | - |
| 休日・休暇 | `holidays` | 埋め込みオブジェクト | - |
| 会社所在地 | `companyAddress` | テキスト | - |
| 設立 | `established` | テキスト | - |
| 代表者 | `representative` | テキスト | - |
| 従業員数 | `employees` | テキスト | - |
| 事業内容 | `businessContent` | テキストエリア | - |
| 選考フロー | `selectionProcess` | 埋め込みオブジェクト | - |
| 応募方法 | `AppMethod` | 埋め込みオブジェクト | - |

#### 職種(category)のドロップダウン選択肢

```
営業職,企画・管理,技術職（SE・インフラエンジニア・Webエンジニア）,技術職（組み込みソフトウェア）,技術職（機械・電気）,技術職（化学・素材・化粧品・トイレタリー）,技術職（食品・香料・飼料）,技術職・専門職（建設・建築・不動産・プラント・工場）,専門職（コンサルティングファーム・専門事務所・監査法人）,クリエイター・クリエイティブ職,販売・サービス職,公務員・教員・農林水産関連職,事務・アシスタント,医療系専門職,金融系専門職
```

#### 雇用形態(employmentType)のドロップダウン選択肢

```
正社員,契約社員,派遣社員,パート・アルバイト,業務委託
```

### 3. テンプレートの設定

**インデックステンプレート**

| テンプレート名 | 出力ファイル | テンプレートファイル |
|--------------|-------------|-------------------|
| 求人JSON | `data/jobs/{ブログベースネーム}.json` | `jobs-child-json.mtml` |

**記事アーカイブテンプレート**

| テンプレート名 | 出力パス | テンプレートファイル |
|--------------|---------|-------------------|
| 求人詳細 | `jobs/job-%e.html` | `job-detail-child.mtml` |

※ `%e` は記事IDに置換されます

### 4. 再構築

記事を作成・更新後、テンプレートを再構築するとJSONファイルが更新されます。

---

## 出力例

### カテゴリJSON

```json
{
  "categories": [
    { "id": "oc01", "name": "営業" },
    { "id": "oc02", "name": "企画・管理" },
    { "id": "oc03", "name": "事務・アシスタント" }
  ]
}
```

**注意**: `show_empty="1"`モディファイアにより、コンテンツが紐づいていないカテゴリも含めてすべて出力されます。

### コンテンツデータJSON

```json
{
  "interviews": [
    {
      "id": 1,
      "title": "営業職からIT企業のPMへキャリアチェンジ",
      "company": "株式会社テクノソリューション",
      "prefecture": "滋賀県",
      "category": "oc01",
      "image": "https://...",
      "postDate": "2026-01-05",
      "detailUrl": "#"
    }
  ]
}
```

---

## カテゴリの追加・変更

1. MovableType管理画面でカテゴリを追加/編集
2. 「すべて再構築」を実行
3. JSONファイルが自動更新される

**コード側の変更は不要です。**

---

## フロントエンドでの処理

- カテゴリはフロントエンド（`categories.js`）でID順にソートされます
- MovableType側のカテゴリ順序に依存しません

---

## ファイル構成

```
mt-template/
├── README.md                    # このファイル
├── interview-categories.mtml    # インタビュー職種JSON
├── company-industries.mtml      # 企業業界JSON
├── knowhow-categories.mtml      # ノウハウカテゴリJSON
├── job-conditions.mtml          # 求人条件JSON
├── interviews-json.mtml         # 転職者インタビューJSON
├── companies-json.mtml          # 企業インタビューJSON
├── jobs-json.mtml               # 求人JSON
├── prefectures-json.mtml        # 都道府県マスターJSON
├── categories-js.mtml           # カテゴリ管理JS
├── includes-js.mtml             # インクルードシステムJS
├── header-html.mtml             # 共通ヘッダー
├── footer-html.mtml             # 共通フッター
├── index-html.mtml              # トップページ
├── interviews-html.mtml         # インタビュー一覧
├── companies-html.mtml          # 企業インタビュー一覧
├── knowhow-html.mtml            # ノウハウ一覧
├── contact-html.mtml            # お問い合わせ
├── prefecture-page.mtml         # 都道府県別ページ
└── job-detail.mtml              # 求人詳細ページ
```
