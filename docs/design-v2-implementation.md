# デザイン v2 実装メモ（2026-09-15）

引き継ぎ要件書 `docs/design-v2-handoff-from-corporate.md` を実装した記録。デザイン定義は `DESIGN.md`。

## 決定事項（須長 2026-09-15）

| 項目 | 決定 |
|------|------|
| ブランドカラー | (A) グループ共通のオレンジ `#F5820D`／ネイビー `#1B2430` に統一。ロゴは変えない |
| 製造業寄せ | **振り切る**（コピー・写真とも製造業） |
| ヒーロー | 日本地図は廃止。写真ヒーロー＋検索パネル。既存の転職プラットフォームを参考に **一覧性・検索性** を主軸に |
| 検索機能 | MT の求人フィールドは変更しない。表記ゆれの吸収とこだわり条件はクライアント側で判定 |
| 写真 | AI 生成（Gemini）。**AIっぽさゼロ** が条件 |
| 英字ラベル | 使う（Manufacturing Career Support / Find Jobs by Area / Jobs in Osaka 等） |
| 都道府県ウォーターマーク | 使う（`OSAKA` 等、`prefecture_id` を大文字化） |

## ファイル構成

### 静的アセット（`bash scripts/deploy.sh` でデプロイ可）

| ファイル | 内容 |
|---|---|
| `public_html/css/style.css` | 末尾に `DESIGN V2 START〜END` ブロック（正本は `scripts/redesign-v2/v2-theme.css`）。先頭に IBM Plex Sans の `@import` |
| `public_html/css/contact.css` / `client-detail.css` / `article-detail.css` | 同様に v2 ブロックを末尾追加（正本 `scripts/redesign-v2/v2-contact.css` 等） |
| `public_html/includes/header.html` / `footer.html` | v2 構造（`.header` + `.nav-mobile`、4カラムフッター） |
| `public_html/js/includes.js` | 書き直し。ハンバーガー（クラス切替）・透明→白ヘッダー・`.page-header` への `data-en` 付与・アクティブナビ |
| `public_html/js/job-taxonomy.js` | **新規**。職種の表記ゆれ→10グループ、こだわり条件の正規表現、年収パース |
| `public_html/js/home-v2.js` | **新規**。トップページ（検索・都道府県一覧・新着求人・タイルの最新3件・フェードイン） |
| `public_html/js/prefecture-page.js` | 書き直し。キーワード／市区町村／職種グループ／雇用形態／こだわり条件／並び順／URL 同期 |
| `public_html/js/main.js` | 旧ヘッダー処理を v2 では無効化、一覧ページの新着求人を `jobs-latest.json` から取得、求人詳細の年収整形 |
| `public_html/404.html` | **新規**。nginx に `error_page 404 /404.html;` が必要（未設定） |
| `public_html/assets/ogp.png` | v2 の OGP 画像（1200×630、`scripts/redesign-v2/ogp.html` → `make-ogp.mjs` で生成、旧版は git 履歴） |
| `public_html/assets/v2/*.webp` | 生成写真 8 枚（hero-main / tile-clients / tile-interview / tile-company / tile-knowhow / tile-jobs / photo-consult / photo-company） |

### MT 管理（`scripts/redesign-v2/mt-apply-v2.sh` で反映）

| テンプレート | 対象 | 出力 |
|---|---|---|
| `mt-template/index-html.mtml` | 親サイト「トップページ」 | `/index.html` |
| `mt-template/prefecture-page.mtml` | 全47子ブログ「トップページ」（先頭の SetVar 2行はブログ毎に自動生成） | `/{pref}/index.html` |
| `mt-template/jobs-latest-json.mtml` | 親サイト **新規** index テンプレ「新着求人JSON」 | `/data/jobs-latest.json` |
| `mt-template/jobs-summary-json.mtml` | 親サイト **新規** index テンプレ「求人件数JSON」 | `/data/jobs-summary.json` |

新規 2 テンプレは **公開設定「定期的に再構築」60 分**（`build_type=5`）で作成する。子ブログに求人をインポートしても親サイトを再構築しなくても、常駐の `mt-periodic-tasks` が更新する。

一覧ページ（interviews / companies / knowhow）と詳細ページ（求人・インタビュー・企業・ノウハウ）は **テンプレート変更なし**。CSS の後勝ちと `includes.js` の `data-en` 付与だけで v2 になる。

### ローカル確認

```bash
node scripts/redesign-v2/apply-css.mjs              # v2 CSS を style.css 等へ反映（冪等）
node scripts/redesign-v2/build-static-from-mtml.mjs # index.html / shiga, shizuoka, osaka, fukuoka, aichi の index.html を生成
npx http-server public_html -p 8080 -c-1 -P https://www.tensyokudodesyo.com   # ローカルに無いデータ・ページは本番へプロキシ
node scripts/redesign-v2/screenshot.mjs             # PC/スマホのフルページ撮影（scripts/redesign-v2/shots/）
```

`osaka/` `fukuoka/` `aichi/` はプレビュー用（`.gitignore` 済・deploy.sh でブロック）。
`data/jobs-latest.json` `data/jobs-summary.json` はローカルのサンプル（本番は MT が生成、deploy.sh でブロック）。

## 検索の仕様（クライアント側）

- **職種グループ**（`JobTaxonomy.BUCKETS`、評価順）: 営業 → IT・システム → 建築・土木・設備 → 運輸・物流 → 製造・技能工 → 技術職（機械・電気・化学）→ 医療・福祉・保育 → 事務・企画・管理 → 販売・サービス・飲食 → 専門職・コンサル・その他 → その他。UI の表示順は製造業を先頭に
- **こだわり条件**（`JobTaxonomy.TAGS`）: 未経験歓迎／土日祝休み／年間休日120日以上／残業少なめ／転勤なし／資格取得支援／研修充実／社宅・寮あり／車通勤可／リモート可／U・Iターン歓迎／学歴不問。title + conditions + keywords + detail（仕事内容・休日・待遇・給与詳細・おすすめポイント等）の結合テキストに正規表現
- **市区町村**: `city` から県名を除き `〜市／区／郡／町／村` までを採用。「要相談」「その他」は末尾
- **年収**: `"2,700,000~4,010,000"` → `{min:270,max:401}` → 「270万〜401万円」。並び替え「年収が高い順／低い順」に使用
- **URL**: `/{pref}/?q=&city=&cat=&emp=&tag=&tag=&sort=&page=`。トップの検索パネルは `q` / `cat` / `tag` を都道府県ページへ引き継ぐ
- **データ量**: 都道府県ページは従来どおり `data/jobs/{id}.json`（detail 付き、大阪 9MB）。トップと一覧ページの新着求人は `jobs-latest.json`（12KB）だけを読む。**従来は 47 都道府県分（100MB 超）を毎回取得していた**

## 求人データの最適化（2026-09-15、MT 基盤で JSON 生成）

| 項目 | 旧 | 新 |
|---|---|---|
| 都道府県ページの初期取得（大阪） | `data/jobs/osaka.json` 8.9MB（gzip 2.3MB、detail 付き） | 同ファイルを **schema 2** に: 一覧項目 + `tags` のみ、gzip **75KB** |
| キーワード検索 | 上と同じ 9MB の中を検索 | `data/jobs/osaka.kw.json`（仕事内容300字+求める人材150字、gzip 295KB）を**キーワード入力時だけ**遅延取得 |
| こだわり条件の判定 | クライアントで detail 全文に正規表現 | **MT テンプレ側で判定**（`<mt:If name="hay" like="/…/">`）し `"tags": "mikeiken,donichi,"` を出力。クライアントは split するだけ |
| トップ・一覧ページの新着求人 | 47県 JSON 全取得（100MB 超） | `jobs-latest.json`（gzip 2KB） |
| 会社紹介詳細の「この会社の求人」 | 47県 JSON 全取得 | `<meta name="client-prefecture">` の県の JSON だけ（所在地不明時のみ全県） |
| キャッシュ | ヘッダなし（毎回再検証） | nginx `expires`: JSON 10分 / CSS・JS 1時間 / 画像 30日、gzip_vary |
| 先読み | なし | `<link rel="preload" as="fetch">` で一覧 JSON・prefectures・summary・latest を HTML 解析時に取得開始 |

### MT テンプレ（子ブログ・各47）

- `mt-template/jobs-child-json.mtml` → `../data/jobs/{id}.json`（既存「求人JSON生成テンプレート」を差し替え、schema 2）
- `mt-template/jobs-child-kw-json.mtml` → `../data/jobs/{id}.kw.json`（新規「求人キーワードJSON生成テンプレート」、保存時再構築）
- どちらも本番 MT で一時テンプレを使って出力・JSON 妥当性を検証済み（`scripts/redesign-v2/mt-test-template.pl`）
- 反映は `mt-apply-v2.sh --apply` に含めた（2b/2c）。**MT のフィールド・入力運用は変更なし**

### 読み込み側

- `prefecture-page.js`: `schema` を見て分岐。schema 2 では `tags` を使い、キーワード入力時に `kw.json` を取得して `_lc` に合成（読み込み中は件数横に注記）。schema 1（旧 JSON）でも従来どおり動く
- `client-detail.js`: 所在都道府県の JSON だけ取得
- `main.js`: 一覧ページの新着求人は `jobs-latest.json` を優先

### Perl スクリプトの修正（重要）

`/tmp` などから `MT->new` すると `MT_DIR` が `$0` の場所から推定されて **addons（カスタムフィールド）が読み込まれず、`EntryData*` タグを含むテンプレの再構築が失敗**していた。`BEGIN { $ENV{MT_HOME} = "/var/www/mt" }` と `CustomFields::Util::install_field_tags()` を `scripts/mt-rebuild-*.pl` と `scripts/redesign-v2/*.pl` に追加して解消。

### 本番 nginx への追加（portal.conf、デプロイ時）

```nginx
    # キャッシュ（add_header ではなく expires を使う: add_header だとセキュリティヘッダの継承が切れる）
    location ^~ /data/ { expires 10m; }
    location ~* .(?:css|js)$ { expires 1h; }
    location ~* .(?:webp|png|jpg|jpeg|gif|svg|ico|woff2?)$ { expires 30d; }
    gzip_vary on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    error_page 404 /404.html;
```

## プレビュー環境（社内確認用、2026-09-15 構築）

- URL: https://www.tensyokudodesyo.com:8443/ （Basic 認証。ユーザー名・パスワードは須長が保持）
- 実体: EC2 の `/var/www/preview-v2`（本番 `/var/www/html` のコピー＝**インタビュー・企業・ノウハウ・求人の本番データと MT 生成ページ**に、v2 の静的ファイルと MT テンプレから生成した index.html・47県 index.html、`make-feeds.py` で作った新着/件数 JSON を重ねたもの）。本番には触れない
- nginx: `scripts/redesign-v2/preview-nginx.conf` → `/etc/nginx/conf.d/preview-v2.conf`（8443/ssl、本番と同じ証明書、`X-Robots-Tag: noindex`、GA タグを sub_filter で除去、左下に「PREVIEW／非公開」バッジ、`error_page 404`）
- 更新: `bash scripts/redesign-v2/deploy-preview.sh`（v2 ファイルと生成ページを再アップ）／ `--sync-prod` で本番データを再同期 ／ `--setup USER PASS` は初回のみ
- **EC2 セキュリティグループ `sg-0ac710d4926f635b5` に TCP 8443 の許可が必要**（Claude Code の自動モードでは実行不可。`aws ec2 authorize-security-group-ingress --region ap-northeast-1 --group-id sg-0ac710d4926f635b5 --protocol tcp --port 8443 --cidr 0.0.0.0/0`）
- 撤去: `/etc/nginx/conf.d/preview-v2.conf` と `/etc/nginx/.htpasswd-preview` を削除して reload、`/var/www/preview-v2` を削除、SG の 8443 を閉じる
- 注意: contact フォームは Origin が本番と異なるため送信できない（想定どおり）

## デプロイ手順

1. `bash scripts/deploy.sh` で静的アセットを先に反映
   ```
   public_html/css/style.css public_html/css/contact.css public_html/css/client-detail.css public_html/css/article-detail.css
   public_html/includes/header.html public_html/includes/footer.html
   public_html/js/includes.js public_html/js/main.js public_html/js/prefecture-page.js public_html/js/job-taxonomy.js public_html/js/home-v2.js
   public_html/404.html public_html/assets/v2/*.webp
   ```
2. `bash scripts/redesign-v2/mt-apply-v2.sh`（DRY-RUN）→ `--apply`（mt_template をバックアップ → テンプレ更新 → index 再構築）
3. nginx: `error_page 404 /404.html;` を HTTPS server ブロックに追加して reload（`docs/nginx-security-headers.md` の手順に倣う）
4. 本番でスマホ表示・検索・フォーム送信を再確認
5. 元に戻す場合: `mt_template_backup_YYYYMMDD_HHMMSS` から復元 → `scripts/mt-rebuild-all-force.pl`、静的アセットは git の前コミットを deploy.sh

## QA 結果（ローカル、2026-09-15）

| 項目 | 結果 |
|---|---|
| PC Chrome 1400px: トップ／大阪／求人詳細／インタビュー一覧／ノウハウ一覧／会社紹介一覧・詳細／ノウハウ詳細／contact／terms／404 | OK（コンソールエラー 0） |
| 390px（puppeteer）: 同上 | OK（横はみ出し 0） |
| ヘッダー透明→白（ヒーロー直下）／ハンバーガー開閉 | OK |
| 日本語見出しの途中割れ | `keep-all` + 明示 `<br>` で OK |
| 都道府県ページの検索・絞り込み・並び替え・ページネーション・URL 同期 | OK（大阪 1,447 件） |
| フォーム送信 | **未確認**（本番反映後に実施。プレビューは Lambda 直結のため送信していない） |
| iPhone Safari 実機／LINE・X アプリ内ブラウザ | **未確認**（本番反映後） |

## 残課題・提案

- nginx の 404 設定（上記 3）
- ヒーローの検索は「勤務地必須」。都道府県横断のキーワード検索は全 JSON 取得が必要になるため見送り
- 写真は AI 生成。実写が用意でき次第 `assets/v2/` を差し替える（同名・1920×1080）
- ヒーローコピー案（採用: 1）
  1. 地元で、ものづくりの仕事を。
  2. 条件だけでなく、想いで選ぶ転職を。
  3. 現場を知る人が、地元の工場につなぐ。
