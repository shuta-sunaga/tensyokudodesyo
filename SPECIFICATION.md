# 転職どうでしょう - サイト仕様書

## 概要

地域密着型の転職支援サービスサイト。日本地図から都道府県を選択して求人を検索できる。

---

## ディレクトリ構成

```
public_html/
├── index.html              # トップページ（日本地図）
├── interviews.html         # 転職者インタビュー一覧
├── companies.html          # 企業インタビュー一覧
├── knowhow.html            # 転職ノウハウ一覧
├── contact.html            # お問い合わせ
├── job-detail.html         # 求人詳細ページ（動的）
├── index-child-template.html # 都道府県ページテンプレート
│
├── shiga/                  # 滋賀県ページ
│   ├── index.html
│   └── jobs/
│       └── job-{id}.html   # 求人詳細（静的）
│
├── shizuoka/               # 静岡県ページ
│   ├── index.html
│   └── jobs/
│       └── job-{id}.html
│
├── data/                   # JSONデータ
│   ├── jobs.json           # 全求人（グローバル）
│   ├── interviews.json     # 全インタビュー（グローバル）
│   ├── companies.json      # 全企業（グローバル）
│   ├── prefectures.json    # 都道府県マスタ
│   ├── categories/         # カテゴリマスター（動的読み込み）
│   │   ├── interview-categories.json  # インタビューカテゴリ (oc01-oc11)
│   │   ├── company-industries.json    # 企業業界 (in01-in09)
│   │   ├── knowhow-categories.json    # ノウハウカテゴリ (kh01-kh05)
│   │   └── job-conditions.json        # 求人条件タグ (pu01-pu11)
│   ├── jobs/
│   │   ├── shiga.json      # 滋賀県の求人
│   │   └── shizuoka.json   # 静岡県の求人
│   ├── interviews/
│   │   ├── shiga.json
│   │   └── shizuoka.json
│   └── companies/
│       ├── shiga.json
│       └── shizuoka.json
│
├── js/
│   ├── main.js             # メインスクリプト
│   ├── categories.js       # カテゴリ動的管理システム
│   ├── includes.js         # ヘッダー/フッターインクルード
│   ├── japan-map.js        # 日本地図インタラクション
│   └── prefecture-page.js  # 都道府県ページ用
│
├── includes/               # 共通パーツ
│   ├── header.html         # ヘッダーテンプレート
│   └── footer.html         # フッターテンプレート
│
├── css/
│   ├── style.css           # メインスタイル
│   └── japan-map.css       # 地図用スタイル
│
└── assets/                 # 画像・アイコン
    ├── logo.webp
    ├── LINE_Brand_icon.png
    └── japan-map.svg
```

---

## ページ別仕様

### 1. トップページ (`index.html`)

**URL**: `/` または `/index.html`

**機能**:
- 日本地図から都道府県を選択して求人ページへ遷移
- 最新の転職者インタビュー3件を表示
- 最新の企業インタビュー3件を表示
- 転職ノウハウ記事のプレビュー表示
- LINE相談CTA

**データソース**:
| セクション | JSONファイル | 読み込み関数 |
|-----------|-------------|-------------|
| 転職者インタビュー | `data/interviews.json` | `initHomePage()` |
| 企業インタビュー | `data/companies.json` | `initHomePage()` |
| ノウハウ | HTMLに静的記述 | - |

**表示件数**: 各セクション最大3件（日付降順）

---

### 2. 転職者インタビュー一覧 (`interviews.html`)

**URL**: `/interviews.html`

**機能**:
- インタビュー記事のカード一覧表示
- エリアフィルター（都道府県セレクト）
- カテゴリフィルター（タブ切り替え）
- 新着求人セクション

**データソース**:
| データ | JSONファイル | 読み込み関数 |
|-------|-------------|-------------|
| インタビュー | `data/interviews.json` | `initInterviewPage()` |
| 新着求人 | `data/jobs.json` | `renderNewJobs()` |

**フィルター項目**:
- **エリア**: すべてのエリア / 滋賀県 / 静岡県
- **カテゴリ**: すべて / 営業 / 企画・管理 / 事務・アシスタント / 販売・サービス / クリエイティブ / 技術系

**インタビューJSONスキーマ**:
```json
{
  "id": number,
  "title": string,           // 記事タイトル
  "name": string,            // インタビュー対象者名
  "prefecture": string,      // 都道府県
  "category": string,        // 職種カテゴリ
  "excerpt": string,         // 抜粋文
  "image": string,           // サムネイル画像URL
  "postDate": string,        // 投稿日（YYYY-MM-DD）
  "detailUrl": string        // 詳細ページURL
}
```

---

### 3. 企業インタビュー一覧 (`companies.html`)

**URL**: `/companies.html`

**機能**:
- 企業カード一覧表示
- エリアフィルター
- 業界フィルター（タブ切り替え）
- 新着求人セクション

**データソース**:
| データ | JSONファイル | 読み込み関数 |
|-------|-------------|-------------|
| 企業 | `data/companies.json` | `initCompanyPage()` |
| 新着求人 | `data/jobs.json` | `renderNewJobs()` |

**フィルター項目**:
- **エリア**: すべてのエリア / 滋賀県 / 静岡県
- **業界**: すべて / IT・通信 / 金融・保険 / コンサルティング / メーカー

**企業JSONスキーマ**:
```json
{
  "id": number,
  "name": string,            // 企業名
  "prefecture": string,      // 都道府県
  "industry": string,        // 業界
  "description": string,     // 企業説明文
  "highlights": string[],    // 特徴タグ配列
  "image": string,           // 企業画像URL
  "detailUrl": string        // 詳細ページURL
}
```

---

### 4. 転職ノウハウ一覧 (`knowhow.html`)

**URL**: `/knowhow.html`

**機能**:
- ノウハウ記事のカード一覧表示
- カテゴリフィルター（タブ切り替え）
- 新着求人セクション

**データソース**:
| データ | ソース |
|-------|-------|
| ノウハウ記事 | **HTMLに静的記述**（JSONではない） |
| 新着求人 | `data/jobs.json` |

**カテゴリ**:
- すべて / 面接対策 / 履歴書・職務経歴書 / 自己分析 / 業界研究 / 転職準備

**備考**: ノウハウ記事は現在HTMLに直接記述。将来的にJSON化の検討余地あり。

---

### 5. お問い合わせ (`contact.html`)

**URL**: `/contact.html`

**機能**:
- お問い合わせフォーム（JavaScript検証付き）
- 問い合わせ方法の案内（電話・メール・所在地）
- FAQ表示

**データソース**: なし（静的ページ）

**フォーム項目**:
| 項目名 | 必須 | 型 |
|-------|-----|---|
| お問い合わせ種別 | ○ | select |
| 姓 | ○ | text |
| 名 | ○ | text |
| メールアドレス | ○ | email |
| 電話番号 | - | tel |
| 現在のご職業 | - | select |
| ご希望の連絡方法 | - | checkbox |
| お問い合わせ内容 | ○ | textarea |
| プライバシーポリシー同意 | ○ | checkbox |

---

### 6. 都道府県ページ (`{prefecture}/index.html`)

**URL**: `/shiga/` , `/shizuoka/` など

**機能**:
- 都道府県別の求人一覧
- キーワード検索
- 職種フィルター
- こだわり条件フィルター
- ページネーション（10件/ページ）
- 都道府県別インタビュー表示
- 都道府県別企業表示

**データソース**:
| データ | JSONファイル |
|-------|-------------|
| 求人 | `data/jobs/{prefecture_id}.json` |
| インタビュー | `data/interviews/{prefecture_id}.json` |
| 企業 | `data/companies/{prefecture_id}.json` |

**設定**: ページ内の `window.PREFECTURE_CONFIG` で都道府県IDと名前を指定

```javascript
window.PREFECTURE_CONFIG = {
    id: 'shiga',
    name: '滋賀県'
};
```

**検索フィルター**:
- **キーワード**: タイトル・企業名・キーワードで検索
- **職種**: 営業/IT・エンジニア/事務・管理/企画・マーケ/販売・サービス/その他
- **こだわり条件**: リモートワーク可/未経験歓迎/高年収/土日祝休み/残業少なめ/研修充実

---

### 7. 求人詳細ページ (`{prefecture}/jobs/job-{id}.html`)

**URL**: `/shiga/jobs/job-1.html` など

**機能**:
- 求人の詳細情報表示
- 募集要項テーブル
- 会社概要テーブル
- 応募・選考情報
- LINE相談CTA

**データソース**: HTMLに静的記述（各求人ごとに個別ファイル）

---

## JSONデータ仕様

### 求人データ (`jobs.json`)

```json
{
  "jobs": [
    {
      "id": number,
      "title": string,              // 求人タイトル
      "postDate": string,           // 掲載日（YYYY-MM-DD）
      "company": string,            // 企業名
      "prefecture": string,         // 都道府県
      "city": string,               // 市区町村
      "salary": string,             // 給与
      "conditions": string,         // 条件（カンマ区切り）
      "category": string,           // カテゴリID
      "keywords": string,           // 検索用キーワード
      "detailUrl": string,          // 詳細ページパス
      "detail": {                   // 詳細情報
        "description": string,      // 仕事内容
        "requirements": string,     // 求める人材
        "location": string,         // 勤務地
        "workHours": string,        // 勤務時間
        "employmentType": string,   // 雇用形態
        "salaryDetail": string,     // 給与詳細
        "bonus": string,            // 賞与
        "benefits": string,         // 待遇・福利厚生
        "holidays": string,         // 休日・休暇
        "companyAddress": string,   // 会社所在地
        "established": string,      // 設立
        "representative": string,   // 代表
        "employees": string,        // 従業員数
        "businessContent": string,  // 事業内容
        "selectionProcess": string, // 選考フロー
        "applicationMethod": string // 応募方法
      }
    }
  ]
}
```

### 職種カテゴリID

| ID | 表示名 |
|----|-------|
| `sales` | 営業 |
| `it` | IT・エンジニア |
| `office` | 事務・管理 |
| `planning` | 企画・マーケ |
| `service` | 販売・サービス |
| `other` | その他 |

### こだわり条件マッピング

| 内部値 | 表示名 |
|-------|-------|
| `remote` | リモートワーク可 |
| `inexperienced` | 未経験歓迎 |
| `high_salary` | 高年収 |
| `holiday` | 土日祝休み |
| `no_overtime` | 残業少なめ |
| `training` | 研修充実 |
| `flextime` | フレックス |
| `benefits` | 福利厚生充実 |
| `certification` | 資格取得支援 |
| `incentive` | インセンティブあり |

---

## JavaScript モジュール

### categories.js

カテゴリマスターの読み込みとフィルタータブの動的生成を担当。

| 関数/メソッド | 説明 |
|--------------|------|
| `CategoryManager.loadAll()` | 全カテゴリマスターを読み込み |
| `CategoryManager.getName(type, id)` | IDから表示名を取得 |
| `CategoryManager.getId(type, name)` | 表示名からIDを取得 |
| `CategoryManager.getAll(type)` | 指定タイプの全カテゴリを取得 |
| `CategoryManager.renderFilterTabs()` | フィルタータブを動的生成 |
| `CategoryManager.setupFilterHandlers()` | フィルターイベントハンドラ設定 |
| `CategoryManager.normalizeToId()` | 値をID形式に正規化 |
| `CategoryManager.normalizeToName()` | 値を表示名に正規化 |

**カテゴリタイプ**:
- `interview` - インタビューカテゴリ
- `company` - 企業業界
- `knowhow` - ノウハウカテゴリ
- `jobCondition` - 求人条件タグ

### includes.js

ヘッダー/フッターの動的インクルードを担当。

| 関数 | 説明 |
|-----|------|
| `getBasePath()` | ページ階層に応じたベースパスを計算 |
| `loadInclude()` | インクルードファイルを読み込み・挿入 |
| `initMobileMenuAfterLoad()` | ヘッダー読み込み後のメニュー初期化 |
| `setActiveNavLink()` | 現在ページに応じたナビリンクのアクティブ化 |

### main.js

| 関数名 | 説明 |
|--------|------|
| `initMobileMenu()` | モバイルメニュー制御 |
| `initSmoothScroll()` | スムーススクロール |
| `initScrollAnimations()` | スクロールアニメーション |
| `initHeaderScroll()` | ヘッダースクロール効果 |
| `initFormValidation()` | フォームバリデーション |
| `initStatsCounter()` | 数値カウントアニメーション |
| `initJobSearch()` | 求人検索機能 |
| `initFilterTabs()` | フィルタータブ（レガシー） |
| `initInterviewPage()` | インタビューページ初期化 |
| `initCompanyPage()` | 企業ページ初期化 |
| `initKnowhowPage()` | ノウハウページ初期化 |
| `initHomePage()` | ホームページ初期化 |

### prefecture-page.js

| 関数名 | 説明 |
|--------|------|
| `initPrefecturePage()` | 都道府県ページ初期化 |
| `filterAndRenderJobs()` | 求人フィルタリング |
| `renderJobs()` | 求人一覧描画 |
| `renderPagination()` | ページネーション描画 |
| `renderInterviews()` | インタビュー描画 |
| `renderCompanies()` | 企業描画 |
| `getConditionName()` | 条件IDから表示名を取得 |

---

## 新着判定ロジック

投稿日から7日以内の求人には「NEW」バッジが表示される。

```javascript
function isNewJob(postDate) {
    const now = new Date();
    const posted = new Date(postDate);
    const diffDays = (now - posted) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}
```

---

## フッターSNSリンク

| SNS | アイコン |
|-----|---------|
| LinkedIn | SVGアイコン |
| Instagram | SVGアイコン |
| X (Twitter) | SVGアイコン |
| TikTok | SVGアイコン |

---

## カテゴリ動的管理システム

### 概要

カテゴリはJSONマスターファイルで一元管理され、JavaScriptで動的に読み込まれる。
これにより、カテゴリの追加・変更はJSONファイルの編集のみで対応可能。

**マスターファイル**: `data/categories/`配下

| ファイル | 用途 | ベースネーム形式 |
|---------|-----|-----------------|
| `interview-categories.json` | インタビューカテゴリ | `oc01`〜`oc11` |
| `company-industries.json` | 企業業界 | `in01`〜`in09` |
| `knowhow-categories.json` | ノウハウカテゴリ | `kh01`〜`kh05` |
| `job-conditions.json` | 求人条件タグ | `pu01`〜`pu11` |

### カテゴリマスターJSONスキーマ

```json
{
  "categories": [
    { "id": "oc01", "name": "営業" },
    { "id": "oc02", "name": "企画・管理" }
  ]
}
```

### カテゴリの追加方法

1. 該当するマスターJSONファイルを開く
2. `categories`配列に新しいオブジェクトを追加
3. `id`は既存の形式に従う（例: `oc12`, `in10`など）
4. `name`は表示名を設定
5. **コード変更不要**でフィルタータブに自動反映

---

## カテゴリ・タグ仕様

### 転職者インタビュー (`interviews.html`)

**マスターファイル**: `data/categories/interview-categories.json`
**フィルター属性**: `data-category`
**JSONフィールド**: `category`

| カテゴリ名 | ベースネーム |
|-----------|-------------|
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

---

### 企業インタビュー (`companies.html`)

**マスターファイル**: `data/categories/company-industries.json`
**フィルター属性**: `data-industry`
**JSONフィールド**: `industry`

| カテゴリ名 | ベースネーム |
|-----------|-------------|
| 金融・保険 | `in01` |
| 建設・不動産 | `in02` |
| コンサルティング | `in03` |
| IT・通信 | `in04` |
| メーカー | `in05` |
| 商社 | `in06` |
| 流通・小売・サービス | `in07` |
| 広告・マスコミ | `in08` |
| その他 | `in09` |

---

### 転職ノウハウ (`knowhow.html`)

**マスターファイル**: `data/categories/knowhow-categories.json`
**フィルター属性**: `data-category`
**データソース**: HTMLに静的記述（`data-category`属性でベースネーム指定）

| カテゴリ名 | ベースネーム |
|-----------|-------------|
| 面接対策 | `kh01` |
| 履歴書・職務経歴書 | `kh02` |
| 自己分析 | `kh03` |
| 業界研究 | `kh04` |
| 転職準備 | `kh05` |

---

### 求人条件タグ

**マスターファイル**: `data/categories/job-conditions.json`
**フィルター属性**: `data-conditions`
**JSONフィールド**: `conditions`（カンマ区切りの日本語表記）

| タグ名 | ベースネーム |
|--------|-------------|
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

---

## フッターナビゲーション

親サイトと子サイト（都道府県ページ）で統一されたフッター構造を使用。

**構成**:
```
footer.footer-grid
├── footer-brand       # ロゴ + キャッチコピー
├── footer-links       # コンテンツリンク
│   └── コンテンツ
│       ├── 転職先を探す → index.html
│       ├── 転職者インタビュー → interviews.html
│       ├── 企業インタビュー → companies.html
│       └── 転職ノウハウ → knowhow.html
├── footer-links       # ユーザー種別リンク
│   ├── 求職者の方
│   │   └── LINEで相談 → #
│   └── 企業の方
│       └── 求人掲載のお問い合わせ → contact.html
└── footer-social      # SNSリンク（上記参照）
```

**パス設定**（ディレクトリ階層による）:
| ページ階層 | パス接頭辞 |
|-----------|----------|
| ルート（`/`） | なし（例: `index.html`） |
| 都道府県（`/shiga/`） | `../`（例: `../index.html`） |
| 求人詳細（`/shiga/jobs/`） | `../../`（例: `../../index.html`） |

---

## 更新履歴

| 日付 | 内容 |
|-----|------|
| 2026-01-19 | 仕様書初版作成 |
| 2026-01-19 | フッターSNSアイコン変更（LinkedIn, Instagram, X, TikTok） |
| 2026-01-19 | フッターナビゲーション統一（親サイト・子サイト共通化、対応エリア削除） |
| 2026-01-20 | カテゴリ・タグ仕様を追加（インタビュー、企業、ノウハウ） |
| 2026-01-20 | ヘッダー/フッターインクルードシステム追加（includes.js） |
| 2026-01-20 | カテゴリ動的管理システム実装（categories.js）- JSONマスターによる一元管理 |
| 2026-01-20 | カテゴリベースネーム統一（oc01/in01/kh01/pu01形式） |
