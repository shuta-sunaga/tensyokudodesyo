# 求人CSVエクスポート (jobs-export)

Lark Base の求人データを **県名 + 日付で絞り込み**、Movable Type インポート用の
**Shift_JIS CSV** をワンクリックで生成・ダウンロードする社内ツール。

旧フロー（Base→CSVエクスポート→GASスプレッドシートに貼付→整形→DL）を置き換える。
整形ロジックは `gas/csv-transform.gs` を忠実に移植している。

## フロー

```
[ブラウザ] 県名 + 日付 + パスワードを入力
   ↓ POST /api/export
[Vercel Function] パスワード照合 → Lark search APIで県フィルタ取得
   → created_time で日付フィルタ → MT形式に整形 → Shift_JIS エンコード
   ↓
[ブラウザ] CSV を自動ダウンロード → MT に手動インポート（従来どおり）
```

## 構成

| ファイル | 役割 |
|---------|------|
| `index.html` | フォームUI（県セレクト / 日付 / パスワード / 自動DL） |
| `api/export.mjs` | Vercel Serverless Function（認証・Lark読取・整形・SJIS出力） |
| `lark.mjs` | Lark Bitable 読み取りクライアント（トークン / フィールド / 全レコード） |
| `transform.mjs` | 整形ロジック（GAS移植・44列マッピング・環境依存文字置換） |
| `csv-shiftjis.mjs` | Shift_JIS エンコード（`iconv-lite`、変換不能文字を`?`化＋検出） |
| `local-server.mjs` | ローカル検証サーバー |
| `test/transform.test.mjs` | 整形＋SJISのスモークテスト（creds不要） |

## 環境変数

`.env.example` をコピーして `.env` を作成（`.env` は gitignore 済み）。
Vercel では Project Settings → Environment Variables に同じものを登録する。

| 変数 | 説明 |
|------|------|
| `LARK_APP_ID` / `LARK_APP_SECRET` | Lark アプリ認証情報 |
| `LARK_APP_TOKEN` / `LARK_TABLE_ID` | 求人データの Base / テーブル |
| `EXPORT_PASSWORD` | フォーム共有パスワード（公開URL保護） |
| `PREFECTURE_FIELD` | 県で絞るフィールド名（default: `勤務地（県）`＝勤務地。本社所在地ではない） |

> 日付フィルタは Lark **レコードの作成日時 (`created_time`)** で「指定日以降に登録された求人」を抽出する。
> 求人テーブルには日付型フィールドが無いため、日付用の環境変数は不要。
> 県の絞り込みは search API でサーバー側実行（テーブルは約13,000件あり全件取得は非効率なため）。
> 値はサフィックス(都/道/府/県)を除いたコア名で `contains` 検索 → クライアント側で
> 区切り(`、` `,`)分割＋各トークンのサフィックスを外した完全一致で精緻化する。
> これにより「東京/大阪」等のサフィックス無し表記・複数県混在に対応しつつ、
> 「京都」が「東京都」を誤検出する衝突を防ぐ。
> なお複数県(全国)求人は、列挙に該当県を含めば各県のCSVに含まれる（`勤務地詳細`由来のcityは別県になり得る）。

## ローカル開発

```bash
npm install
node test/transform.test.mjs            # creds不要のロジックテスト
node --env-file=.env local-server.mjs   # http://localhost:5174
```

`.env` 設定後、`GET /api/export?action=fields&password=...` で
Base の実フィールド名一覧を確認できる（`SRC_FIELDS` / `*_FIELD` の照合用）。

## Vercel デプロイ

- GitHub 連携で本リポジトリを Vercel に接続
- **Root Directory** に `tools/jobs-export` を指定
- Framework Preset: **Other**（バニラ構成・ビルド不要）
- 環境変数を登録 → `master` への push で自動デプロイ

> ⚠️ 公開URLになるため `EXPORT_PASSWORD` を必ず設定すること。
> このツールは `public_html/` 配下ではないため、サイト本体の SCP デプロイ対象外。
