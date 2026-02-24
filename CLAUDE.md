# tensyokudodesyo - Claude Code Context

## サイト概要

**転職どうでしょう** (`tensyokudodesyo.com`) - 地域密着型の転職支援サービスサイト

- **運営形態**: 法人運営
- **公開URL**: https://tensyokudodesyo.com
- **ホスティング**: AWS
- **CMS**: Movable Type 9.0.5（詳細ページ・JSONデータの自動生成に使用）
- **フロントエンド**: バニラHTML/CSS/JS（フレームワーク不使用の静的サイト）
- **展開方針**: 段階的に全国展開予定（現在は滋賀県・静岡県の2県のみ公開中）

### サイトの特徴
- 日本地図から都道府県を選択して求人を検索できるUI
- 転職者インタビュー・企業インタビュー・転職ノウハウの3種コンテンツ
- LINE相談への導線（CTA）がサイト全体に配置
- `prefectures.json` の `active` フラグで都道府県の公開状態を制御

---

## プロジェクト構造

```
tensyokudodesyo/
├── public_html/                    # Webサイト公開ディレクトリ
│   ├── index.html                  # トップページ（日本地図MV）
│   ├── contact.html                # お問い合わせページ
│   ├── assets/                     # 静的アセット
│   │   ├── japan-map.svg           # 日本地図SVG（Geolonia製）
│   │   ├── logo.webp               # サービスロゴ
│   │   ├── LINE_Brand_icon.png     # LINEアイコン
│   │   └── ogp.png                 # OGP画像
│   ├── css/
│   │   ├── style.css               # メインスタイル
│   │   ├── japan-map.css           # 日本地図専用スタイル
│   │   └── article-detail.css      # 記事詳細ページスタイル
│   ├── js/
│   │   ├── main.js                 # メインJS（ページ初期化・フォーム・アニメーション）
│   │   ├── japan-map.js            # 日本地図インタラクション
│   │   ├── prefecture-page.js      # 都道府県ページ制御（検索・フィルタ・ページネーション）
│   │   ├── categories.js           # カテゴリ管理（CategoryManagerシングルトン）
│   │   ├── includes.js             # ヘッダー/フッター動的読込
│   │   └── article-toc.js          # 記事目次生成（H2/H3階層対応）
│   ├── data/
│   │   ├── prefectures.json        # 都道府県マスター（47都道府県、active管理）
│   │   ├── jobs.json               # 全求人データ（詳細情報付き・12件）
│   │   ├── interviews.json         # 転職者インタビュー（6件）
│   │   ├── companies.json          # 企業インタビュー（4件）
│   │   ├── knowhow.json            # 転職ノウハウ記事（6件）
│   │   ├── categories/             # カテゴリマスター
│   │   │   ├── interview-categories.json  # 職種カテゴリ (oc01-oc11)
│   │   │   ├── company-industries.json    # 業界カテゴリ (in01-in09)
│   │   │   ├── knowhow-categories.json    # ノウハウカテゴリ (kh01-kh05)
│   │   │   └── job-conditions.json        # 勤務条件タグ (pu01-pu11)
│   │   ├── jobs/                   # 都道府県別求人（軽量リスト形式）
│   │   │   ├── shiga.json          # 滋賀県求人（7件）
│   │   │   └── shizuoka.json       # 静岡県求人（13件）
│   │   ├── interviews/             # 都道府県別インタビュー
│   │   └── companies/              # 都道府県別企業
│   ├── includes/
│   │   ├── header.html             # 共通ヘッダー
│   │   └── footer.html             # 共通フッター
│   ├── interviews/                 # 転職者インタビュー
│   │   ├── index.html              # 一覧ページ
│   │   └── detail/{id}.html        # 詳細ページ
│   ├── companies/                  # 企業インタビュー
│   │   ├── index.html
│   │   └── detail/{id}.html
│   ├── knowhow/                    # 転職ノウハウ
│   │   ├── index.html
│   │   └── detail/{id}.html
│   ├── {prefecture}/               # 都道府県ページ（shiga/, shizuoka/）
│   │   ├── index.html              # 求人一覧
│   │   └── jobs/job-{id}.html      # 求人詳細
│   ├── robots.txt
│   ├── sitemap.xml
│   └── serve.json
├── gas/
│   └── csv-transform.gs            # 求人CSV整形GASスクリプト
├── mt-template/                    # Movable Type テンプレート群（約25ファイル）
├── docs/
│   └── detail-page-specification.md # MT詳細ページ仕様書
├── .claude/                        # Claude Code設定
│   ├── agents/                     # 6エージェント定義
│   ├── commands/                   # 12カスタムスラッシュコマンド
│   ├── hooks/                      # フック設定
│   └── mcp-servers/                # 4 MCPサーバー実装
├── .github/
│   └── ISSUE_TEMPLATE/             # Issueテンプレート
├── scripts/
│   └── convert-ogp.mjs             # OGP画像変換（puppeteer使用）
├── CLAUDE.md                       # このファイル
├── SPECIFICATION.md                # サイト仕様書（詳細）
└── package.json                    # devDependencies: puppeteer のみ
```

---

## URL構造

| パス | ページ | データソース |
|------|--------|------------|
| `/` | トップページ（日本地図MV） | `interviews.json`, `companies.json` |
| `/interviews/` | 転職者インタビュー一覧 | `interviews.json` |
| `/interviews/detail/{id}.html` | インタビュー詳細 | MT生成 |
| `/companies/` | 企業インタビュー一覧 | `companies.json` |
| `/companies/detail/{id}.html` | 企業詳細 | MT生成 |
| `/knowhow/` | 転職ノウハウ一覧 | `knowhow.json` |
| `/knowhow/detail/{id}.html` | ノウハウ詳細 | MT生成 |
| `/contact.html` | お問い合わせ | 静的 |
| `/{prefecture}/` | 都道府県求人一覧 | `data/jobs/{prefecture}.json` |
| `/{prefecture}/jobs/job-{id}.html` | 求人詳細 | 静的HTML |

ナビゲーション4項目: 転職先を探す(`/`) / 転職インタビュー(`/interviews/`) / 企業インタビュー(`/companies/`) / 転職ノウハウ(`/knowhow/`)

---

## 現在の公開状態

| 都道府県 | active | 求人数 | エリア |
|---------|--------|-------|--------|
| 滋賀県 (`shiga`) | **true** | 7件 | 近畿 |
| 静岡県 (`shizuoka`) | **true** | 13件 | 中部 |
| その他45都道府県 | false | - | - |

新しい都道府県を追加する場合:
1. `prefectures.json` の該当都道府県を `active: true` に変更
2. `data/jobs/{id}.json` に求人データを追加
3. `{prefecture}/index.html` を作成（`index-child-template.html`をベースに）
4. `{prefecture}/jobs/job-{N}.html` に求人詳細ページを作成

---

## データ構造

### 求人JSON (`jobs.json` / `data/jobs/{prefecture}.json`)

```json
{
  "id": 1,
  "title": "【営業職】法人営業/未経験歓迎",
  "postDate": "2026-01-10",
  "company": "株式会社テクノソリューション",
  "prefecture": "滋賀県",
  "city": "大津市",
  "salary": "年収350万〜500万円",
  "conditions": "未経験歓迎,土日祝休み,研修充実",
  "category": "sales",
  "keywords": "営業,法人営業,BtoB",
  "detailUrl": "shiga/jobs/job-000001.html",
  "detail": { "description", "requirements", "location", "workHours", "employmentType", "salaryDetail", "bonus", "benefits", "holidays", "companyAddress", "established", "representative", "employees", "businessContent", "selectionProcess", "applicationMethod" }
}
```

**注意**: `jobs.json`（グローバル）は `detail` フィールド付き完全版、`data/jobs/{prefecture}.json`（都道府県別）は `detail` なし軽量版。

### カテゴリマスター

| ファイル | プレフィックス | 件数 | 用途 |
|---------|-------------|------|------|
| `interview-categories.json` | `oc01`〜`oc11` | 11 | 職種カテゴリ |
| `company-industries.json` | `in01`〜`in09` | 9 | 業界カテゴリ |
| `knowhow-categories.json` | `kh01`〜`kh05` | 5 | ノウハウカテゴリ |
| `job-conditions.json` | `pu01`〜`pu11` | 11 | 勤務条件タグ |

カテゴリの追加はJSONファイルの編集のみで対応可能（コード変更不要）。

---

## 日本地図（Japan Map）実装詳細

### ファイル構成
| ファイル | 説明 |
|---------|------|
| `public_html/assets/japan-map.svg` | Geolonia製SVG地図。各都道府県は`<g data-prefecture="tokyo">`形式 |
| `public_html/js/japan-map.js` | インタラクションロジック（538行） |
| `public_html/css/japan-map.css` | スタイル定義（640行） |
| `public_html/data/prefectures.json` | 都道府県マスター。`active`フラグで公開状態制御 |

### エリア（9地域）とカラーコード
```javascript
regionIdMap = {
    '北海道': 'hokkaido',  // #a8d8ea 水色
    '東北': 'tohoku',      // #d4b8e0 薄紫
    '関東': 'kanto',       // #ffd4a8 薄オレンジ
    '中部': 'chubu',       // #c8e6d0 薄緑（静岡県）
    '近畿': 'kinki',       // #f5c4c4 薄ピンク（滋賀県）
    '中国': 'chugoku',     // #f5f0a8 薄黄
    '四国': 'shikoku',     // #a8f0e8 薄シアン
    '九州': 'kyushu',      // #f5a8d4 薄ピンク
    '沖縄': 'okinawa'      // #a8e8f5 薄水色
}
// 非活性エリア: #d0d0d0（グレー）
```

### 状態管理
- `prefectures.json`の`active: true/false`で都道府県の公開状態を管理
- `activeRegions` (Set) でエリア単位の活性状態を追跡
- **活性エリア**: 1つでも`active: true`の都道府県があるエリア → カラー表示
- **非活性エリア**: 全都道府県が`active: false` → グレー表示（`#d0d0d0`）

### レスポンシブ対応
- **デスクトップ (769px+)**: 地図クリック → ツールチップ表示
- **モバイル (768px以下)**: 地図タップ → ボトムシート表示（スワイプ下で閉じ）

---

## JavaScript モジュール

| ファイル | 主な機能 |
|---------|---------|
| `main.js` | ページ初期化（`initHomePage`, `initInterviewPage`, `initCompanyPage`, `initKnowhowPage`）、モバイルメニュー、スクロールアニメーション、フォームバリデーション、統計カウンター |
| `japan-map.js` | `initJapanMap()` - SVG地図操作、`prefectures.json`＋求人JSONを非同期ロード、エリア別カラー表示 |
| `prefecture-page.js` | `window.PREFECTURE_CONFIG`に基づく都道府県ページ制御、求人フィルタリング（キーワード・職種・条件、デバウンス300ms）、ページネーション（20件/ページ） |
| `categories.js` | `CategoryManager`シングルトン - 4種のカテゴリJSON並行ロード、ID⇔表示名変換、フィルタ用selectの動的生成 |
| `includes.js` | ヘッダー/フッターの動的フェッチ・挿入、ベースパス計算（ページ階層に応じた相対パス）、アクティブナビリンク判定 |
| `article-toc.js` | 記事詳細ページの目次自動生成（H2/H3階層構造対応、スムーススクロール） |

### JS読み込み順序（標準パターン）
```html
<script src="js/includes.js"></script>     <!-- ヘッダー/フッター挿入 -->
<script src="js/categories.js"></script>   <!-- カテゴリロード（categoriesLoadedイベント発火） -->
<script src="js/main.js"></script>         <!-- メイン処理（categoriesLoadedを待って実行） -->
<script src="js/japan-map.js"></script>    <!-- トップページのみ -->
<script src="js/prefecture-page.js"></script> <!-- 都道府県ページのみ -->
```

---

## CSSカラーパレット

```css
--color-primary: #5a9e6f;       /* メイングリーン */
--color-secondary: #e8a85a;     /* セカンダリオレンジ */
--color-bg-warm: #faf8f0;       /* 温かみのあるクリーム背景 */
--color-bg-dark: #3d4a3f;       /* ダーク背景（フッター等） */
```

---

## Movable Type テンプレート

`mt-template/` に約25ファイル。MT 9.0.5環境向けテンプレート。

| テンプレート | 出力先 |
|------------|-------|
| `interview-detail.mtml` | `/interviews/detail/{ContentID}.html` |
| `company-detail.mtml` | `/companies/detail/{ContentID}.html` |
| `knowhow-detail.mtml` | `/knowhow/detail/{ContentID}.html` |
| `jobs-json.mtml` | 求人JSON出力 |
| `prefectures-json.mtml` | 都道府県JSON出力 |
| `header-html.mtml` / `footer-html.mtml` | 共通パーツ |

詳細仕様は `docs/detail-page-specification.md` を参照。

---

## GAS CSV整形スクリプト (`gas/csv-transform.gs`)

自社求人管理システムからエクスポートしたデータを、Movable Type インポート用CSV（Shift_JIS）に変換するGoogle Apps Scriptスクリプト。

### 運用フロー

1. 自社求人管理システムから求人データをエクスポート
2. Googleスプレッドシートの「整形前」シートに貼り付け
3. メニュー「CSV整形」→「データを整形する」を実行
4. 「整形後」シートに変換結果が出力 + Shift_JIS CSVがマイドライブに保存
5. ダウンロードしたCSVをMT管理画面から手動インポート

### 主な変換処理

- **カラムマッピング**: 整形前26項目 → 整形後44項目（MT記事フォーマット）
- **都市名自動抽出**: 勤務地詳細から「都道府県+市区町村」を正規表現で抽出（`extractCity`）
- **数値フォーマット**: 年収・給与・従業員数にカンマ付与
- **括弧統一**: 半角括弧→全角括弧（職種大分類）
- **環境依存文字変換**: 丸囲み数字、ローマ数字、㈱、異体字（髙→高等）を安全な文字に置換
- **Shift_JIS安全性チェック**: 変換不能文字は`?`に置換し、ログに記録

### 整形後CSVの固定値カラム

| カラム | 値 |
|-------|-----|
| `class` | `entry` |
| `author` | `admin` |
| `authored_on` / `modified_on` | 実行時刻 |

### MT側で別途入力するカラム

`conditions`, `keywords`, `recommendpoint1`〜`3`, `application_method` 等

---

## 重要なルール

### Issueのクローズについて
- **Issueは勝手にクローズしない**
- コミット・プッシュ後、必ずユーザーの動作確認を待つ
- ユーザーから明示的に「クローズして」と指示があった場合のみクローズする

### 動作確認依頼時のルール
- **更新ファイル一覧を必ず提示する**
- テーブル形式で「ファイルパス」と「変更内容」を明記
- 例：
  ```
  | ファイル | 変更内容 |
  |---------|---------|
  | `public_html/js/japan-map.js` | 非活性エリアのグレー表示ロジック追加 |
  ```

### プロジェクト概要・仕様・ルールの管理
- **CLAUDE.mdに追記する** - プロジェクト概要、仕様、ルールの変更は必ずこのファイルに反映する

---

## Miyabi Framework

識学理論(Shikigaku Theory)とAI Agentsを組み合わせた自律型開発環境。

### 6つの自律エージェント（`.claude/agents/`に定義）

| Agent | 役割 |
|-------|------|
| **CoordinatorAgent** | タスク統括・DAGベースの並列実行制御（最大5並行） |
| **CodeGenAgent** | Claude Sonnet 4によるコード自動生成 |
| **ReviewAgent** | 品質スコアリング（100点満点、80点以上で合格） |
| **IssueAgent** | 65ラベル体系によるIssue自動分類 |
| **PRAgent** | Conventional Commits準拠Draft PR自動生成 |
| **DeploymentAgent** | デプロイ・ヘルスチェック・自動Rollback |

### ラベル体系（識学理論準拠・10カテゴリー）

- **type:** bug, feature, refactor, docs, test, chore, security
- **priority:** P0-Critical, P1-High, P2-Medium, P3-Low
- **state:** pending, analyzing, implementing, reviewing, testing, deploying, done
- **agent:** codegen, review, deployment, test, coordinator, issue, pr
- **complexity:** small, medium, large, xlarge
- **phase:** planning, design, implementation, testing, deployment
- **impact:** breaking, major, minor, patch
- **category:** frontend, backend, infra, dx, security
- **effort:** 1h, 4h, 1d, 3d, 1w, 2w
- **blocked:** waiting-review, waiting-deployment, waiting-feedback

### カスタムスラッシュコマンド

- `/test` - テスト実行
- `/generate-docs` - ドキュメント自動生成
- `/create-issue` - Issue対話作成
- `/deploy` - デプロイ実行
- `/verify` - 環境・コンパイル・テスト全チェック
- `/security-scan` - セキュリティスキャン
- `/agent-run` - Issue自動処理パイプライン

---

## セキュリティ

- **機密情報は環境変数で管理**: `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`
- **.env を .gitignore に含める**
- `robots.txt`で `/includes/` と `/data/` はクローラーをブロック

## 環境変数

```bash
GITHUB_TOKEN=ghp_xxxxx           # GitHub Personal Access Token（必須）
ANTHROPIC_API_KEY=sk-ant-xxxxx   # Anthropic API Key（Agent実行時必須）
```

---

## 関連ドキュメント

| ドキュメント | 内容 |
|------------|------|
| `SPECIFICATION.md` | サイト仕様書（ページ別仕様・JSONスキーマ・JSモジュール詳細） |
| `docs/detail-page-specification.md` | MT詳細ページ仕様（コンテンツタイプ・ブロックエディタ・テンプレート） |

---

*このファイルは Claude Code が自動的に参照します。プロジェクトの変更に応じて更新してください。*
