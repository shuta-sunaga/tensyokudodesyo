# 転職どうでしょう デザイン刷新 — 引き継ぎ要件書（コーポレートサイト v2 の展開）

> 原本と参照ファイル一式: `C:/Users/shuta/Documents/dev/seisansei-website/docs/handoff/tensyoku-v2-design/`（この文書はそのコピー）

- 作成日: 2026-09-14
- 発注者: 須長 秀太（株式会社Sei San Sei）
- 対象サイト: https://www.tensyokudodesyo.com/（ローカル: `C:/Users/shuta/Documents/dev/tensyokudodesyo`）
- 手本サイト: https://www.sei-san-sei.com/（2026-09-14 公開のコーポレートサイト v2。ローカル: `C:/Users/shuta/Documents/dev/seisansei-website`）
- このフォルダ: `seisansei-website/docs/handoff/tensyoku-v2-design/`（本書 + `reference/` に参照ファイル一式）

この文書は、転職どうでしょう側の Claude Code セッションが**単独で作業を始められる**ことを目的に書いている。先方の `CLAUDE.md` / `DESIGN.md` / `PRODUCT.md` と併読すること。矛盾する箇所は本書の「9. 先方プロジェクトのルールとの整合」を優先し、判断に迷う点は「10. 未決事項」として須長に確認する。

---

## 1. 依頼内容（一文で）

コーポレートサイト v2（製造業特化リニューアル）で確立した**コンセプトとデザイン言語**を、転職どうでしょうにも展開する。内容（求人・記事・フォーム）は維持し、**見た目と語り口を v2 に揃える**。

## 2. 手本サイトのコンセプト（何を移植するのか）

### 2-1. 会社としてのコンセプト
- タグライン「**製造業の経営を、もっと強く。**」。Sei San Sei は「製造業を経営インフラとして支える会社」。
- 経営資源「ヒト・モノ・カネ・情報」をつなぐ。4事業 = MINORI Cloud（ソフトウェア）／ MINORI Advisory（経営改善）／ MINORI Talent（人材）／ Global Marketplace（販路）。
- 転職どうでしょうは **MINORI Talent（人の領域）** に属するサービス。2026-09-07 の経営会議で「転職どうでしょうも製造業寄りに」と決まっている（`docs/site-renewal-requirements-2026-09.md` 7章）。

### 2-2. 転職どうでしょうへの翻訳（提案。10章で確認）
- 求職者向けサイトであることは変えない。ただし「地域密着」に加えて「**製造業・ものづくりの転職に強い**」を前面に出す。
- 語り口は v2 と同じく「短く言い切る」。例: 「地元で、ものづくりの仕事を。」「条件だけでなく、想いで選ぶ転職を。」（コピーは制作側で複数案を出し須長が選ぶ）
- コーポレートと同じ写真調（実在感のある現場写真）に揃える。求職者サイトなので **人の顔が見える** カットを増やす（コーポレートは手元・ラインが中心）。

### 2-3. v2 デザインの思想（DESIGN.md の「あたたかい・角丸」からの転換点）
- **装飾を削り、写真と余白と書体で見せる。** 角丸なし（`border-radius: 0`）、影はほぼ使わない、グラデ装飾なし。
- 色は白／ライトグレー／ネイビーチャコール（`#1B2430`）の3階調に、**オレンジは「ラベル・下線・ボタン」だけ**。
- 英字の小さなラベル（IBM Plex Sans、字間広め、大文字）で章立てを示す。
- **スクロール固定（sticky／スクロールテリング／スナップ）系の演出は使わない**（経営陣が嫌う）。フェードイン程度は可。
- セクション背景は **白／ライトグレーの交互**。
- ヒーローは全幅写真＋暗いグラデーション＋左下（または左中央）にメッセージ。画像とテキストを左右に分けない。
- ヘッダーはヒーロー上では透明（白文字・白ロゴ）、ヒーローを抜けたら白背景＋上端3pxオレンジ。

---

## 3. デザイントークン（そのまま使う）

```css
:root{
  --color-primary:#F5820D;        /* オレンジ。ラベル・ボタン・下線のみ */
  --color-primary-dark:#D96D00;   /* ラベル文字・hover */
  --color-primary-text:#B85B00;
  --color-white:#FFFFFF;
  --color-black:#1B2430;          /* ネイビーチャコール。見出し・CTA帯・ページヘッダー帯 */
  --color-gray-dark:#3A4552;      /* 本文 */
  --color-gray:#5E6975;
  --color-gray-light:#6B7683;     /* キャプション */
  --color-gray-lighter:#D8DCE0;   /* 罫線 */
  --color-bg:#F5F6F6;             /* 交互セクションのライトグレー */
  --font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN","Hiragino Sans",sans-serif;
  --font-family-en:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;
  --header-height:76px; --header-height-mobile:64px;
}
```

- Google Fonts: `family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;600;700`（Noto の 900 は使わない）
- 本文 `line-height:1.9`、見出し `letter-spacing:.02em; line-break:strict`。日本語の長い見出しは `word-break:keep-all; overflow-wrap:anywhere` ＋ 明示 `<br>`。
- 角丸 0、影は hover のカードにだけ `0 12px 32px rgba(27,36,48,.08)`。
- ヒーロー写真のオーバーレイ: `linear-gradient(90deg, rgba(14,20,28,.80) 0%, rgba(14,20,28,.52) 42%, rgba(14,20,28,.10) 100%), linear-gradient(0deg, rgba(14,20,28,.78) 0%, rgba(14,20,28,.12) 55%, rgba(14,20,28,.35) 100%)`

**ブランドカラーの扱い（重要・10章参照）**: 転職どうでしょうの現行は緑（`#5a9e6f`）＋クリーム。v2 展開時に (A) グループ共通のオレンジ／ネイビーに寄せる か (B) オレンジの役割を緑に置き換えて v2 の構造だけ移植する か、須長に確認してから着手する。推奨は (A)。ロゴ（`assets/logo.webp`）の色は変えない。

## 4. コンポーネント仕様（参照ファイルつき）

参照元はすべて `reference/` にコピー済み。CSS の正本は `reference/style-v2-section.css`（本番 `style.css` の v2 ブロックをそのまま抜粋。共通部品 → トップ `tp-*` → 写真タイル → 下層ページヘッダー v2 → 事例の padding-top 修正 → 下層 `bz-*` の順）。**クラス名は流用してよい**（`tp-*` はトップ用、`bz-*` は下層用、共通部品は `.header .nav .btn .footer .page-header`）。

| 部品 | 仕様 | 参照 |
|---|---|---|
| ヘッダー | 固定。ロゴ左、ナビ右、右端にオレンジの `btn btn-primary btn-sm`。モバイルは 44px 角のハンバーガー→全画面白メニュー（項目は太字・下罫線）。`body.page-home` / `body.page-sub` なら透明→スクロールで `.solid` | `reference/header-footer-template.mjs`, `reference/header-scroll.js`, `style-v2-section.css`（Header） |
| ヒーロー（トップ） | `min-height:100svh`、全幅写真＋オーバーレイ、英字タグ（`tp-hero-tag` 40pxオレンジ棒＋大文字）、h1 `clamp(2.1rem,5.4vw,4.4rem)`、リード、ボタン2つ（オレンジ実線＋白線ゴースト）、右端に縦書き英字メタ、下端にオレンジ34%のストライプ、SCROLL キュー | `style-v2-section.css` `.tp-hero*`, `reference/corporate-index.html` |
| ステートメント（Opener） | 「〜会社でもない」を打ち消し線で並べ、「〜になる。」を大見出し（強調はオレンジのマーカー）。下に2カラム（左: ヒト・モノ・カネ・情報の一覧 / 右: 本文＋`tp-more`） | `.tp-opener*` |
| 英字ラベル | `.tp-eyebrow`（`::before` に 18×2px のオレンジ棒） | `.tp-eyebrow` |
| ボタン | `.tp-btn`（黒地白文字、`::after` に→、hover で→が右へ4px）／`.orange`／`.line`／`.ghost`。共通 `.btn-primary` はオレンジ地・黒文字、hover で黒地・白文字 | `.tp-btn`, `style-v2-section.css`（Buttons） |
| 写真タイル（事業） | 1ワイド＋3列。写真に番号＋英字＋役割を重ね、下に本文・要点リスト・リンク。転職どうでしょうでは「転職先を探す／インタビュー／ノウハウ」等の入口に流用可 | `.tp-tiles .tp-tile*` |
| 規模別2行（Scale） | 全幅の2行、左に大きな宛名＋英字、右に説明と3項目。上罫線がオレンジ／ネイビー。転職どうでしょうでは「求職者の方へ／企業の方へ」の分岐に流用 | `.tp-scale*` |
| 事例（Case） | 大型1件（写真16:9＋本文）＋小型2件（写真16:10＋本文の横並び）。画像枠は `padding-top` パターン（aspect-ratio 単体禁止） | `.tp-case*` |
| ニュース／ブログ | 日付＋タイトルの1行リスト、右上に `tp-more` | `.tp-nlist .tp-nrow` |
| CTA 帯 | ネイビー地。左に英字ラベル＋h2＋本文、右に TEL（上）とオレンジのフォームボタン（下）。オレンジはボタンだけ | `.tp-cta*` |
| 下層ページヘッダー | ネイビー帯。パンくず（白55%）→ 2カラム（左: 英字ラベル＋h1 / 右: リード）。右下に英字ウォーターマーク（`data-en` 属性を `::after` の `content:attr(data-en)` で描画） | `style-v2-section.css`（Page header v2）, `reference/corporate-services.html`, `reference/critical-css-common.css` |
| 下層ページ（写真ヒーロー型） | `bz-hero`（写真＋オーバーレイ＋パンくず＋英字大見出し＋リード＋ボタン）→ `bz-sec` を白／グレー交互 → FAQ → 他事業 → CTA | `style-v2-section.css`（`bz-*`）, `reference/corporate-business-minori-advisory.html` |
| 404 | `page-sub` ＋ ネイビー帯（data-en="NOT FOUND"）＋ 大きな「404」（0だけオレンジ）＋主要リンク一覧。noindex | `reference/corporate-404.html` |
| フッター | ネイビー地。4カラム（リンク3列＋ロゴ・タグライン）、下に copyright | `reference/header-footer-template.mjs`, `style-v2-section.css`（Footer） |

## 5. 写真の指針（AI生成の場合）

- 本番の写真は **実際の現場写真が理想**。用意できるまでは AI 生成でよいが、「AI っぽさ」を出さないことが条件（須長指示）。
- 生成は `reference/generate-top-photos.mjs` を流用（Gemini `gemini-3-pro-image-preview`、`imageConfig: {aspectRatio:'16:9', imageSize:'2K'}`、sharp で 1920×1080 WebP q74）。API キーは `.env` の `GEMINI_API_KEY`。
- プロンプトの共通指示（スクリプト内 `STYLE` 定数）の要点: ドキュメンタリー調、フルサイズ一眼35mm、自然光＋蛍光灯、色は少し抑えめ、微細な粒状感、**ボケは弱く**、生活感のある職場、日本人、自然な姿勢でカメラを見ない、グレーか紺の作業服、テカり・HDR・フレア・左右対称・シネマ調グレーディング禁止、**読める文字・ロゴ・看板・意味不明な文字を絶対に入れない**（看板や画面はピンボケか無地）。
- 転職どうでしょう向けの被写体案: 地方の町工場で若手が先輩に教わる／製造現場の面談・見学／通勤路と工場外観／事務所で相談する求職者とアドバイザー。人物は 20〜40代中心、表情は自然（作り笑い禁止）。
- 生成後は必ず目視で確認し、擬似文字・指の異常・貼り付け感があれば再生成する（コーポレートでも1枚は再生成した）。

## 6. ページ別の適用方針（転職どうでしょう）

| ページ | 方針 |
|---|---|
| `/`（トップ） | 現行「日本地図ヒーロー」→ **写真ヒーロー（v2）** に変更し、日本地図は2番目のセクション（白背景・「地域から探す」の英字ラベル付き）に降ろす。以降: ステートメント（転職どうでしょうとは何か。「求人サイトでも、転職エージェントでもない」型の打ち消し→言い切り）→ 入口タイル（転職先を探す／会社紹介／転職者インタビュー／企業インタビュー／転職ノウハウ）→ 求職者・企業の2行分岐 → 新着求人 → インタビュー（大型1＋小型2）→ ノウハウ一覧 → ネイビーCTA |
| 一覧（`/interviews/` `/companies/` `/clients/` `/knowhow/` `/{pref}/`） | ネイビーのページヘッダー（`data-en` は INTERVIEW / COMPANY / CLIENTS / KNOWHOW / 都道府県ローマ字）＋カード。カードは角丸0・罫線1px・hover で影と黒罫。画像枠は padding-top パターン |
| 詳細（MT生成: `*/detail/*.html`, `/{pref}/jobs/*.html`） | マークアップは MT テンプレート（`mt-template/`）が生成するため、**CSS の後勝ちで揃える**のが基本。ヘッダー／フッターは `includes/` 経由なので共通部品差し替えで反映。テンプレート改修が必要なら `mt-template/` を編集し、先方 CLAUDE.md の MT デプロイ手順（`docs/mt-template-deploy-guide.md`）に従う |
| `/contact/` | 構造は維持（フォーム1画面完結・個人情報配慮の文言は PRODUCT.md 準拠）。見た目のみ v2（角丸0、ボタンはオレンジ、フォーカスリングはオレンジ2px） |
| `terms.html` `privacy.html` | ページヘッダーのみ v2、本文はそのまま |
| 404 | コーポレートと同構成。リンクは絶対パス |

## 7. 実装手順（推奨）

1. **ブランドカラーの決定（10章）** を須長に確認。決まるまで着手しない。
2. `public_html/css/style.css` の末尾に v2 ブロックを追加（`reference/style-v2-section.css` を土台に、転職どうでしょうの既存クラス名へ合わせて上書きルールを書く）。既存ルールは消さず **後勝ち上書き** で揃える（コーポレートはこの方式で 580 ページを一括適用できた）。
3. `includes/header.html` / `includes/footer.html` を v2 構造に差し替え（`reference/header-footer-template.mjs` の HTML を転職どうでしょうのナビ5項目＋CTA2つに置換）。ヘッダー CTA は「求職者様はこちら」= `btn-primary`、「企業様はこちら」= `btn-outline` を維持。
4. `js/main.js` に `reference/header-scroll.js` 相当（透明→`.solid`）を追加。`body.page-home` はトップだけ、`page-sub` は写真ヒーローを持つ下層に付与。
5. トップを組み替え（6章）。日本地図の JS（`japan-map.js`）はそのまま動くこと。
6. 一覧・詳細・contact・404 を順に適用。詳細は MT 生成物を本番から取得して見た目を確認する。
7. Critical CSS（`reference/critical-css-common.css` / `-hero-pages.css`）を各ページ先頭の `<style>` に入れる場合、**ページ固有 CSS は別の `<style data-page-css>` ブロックに分離**する（コーポレートで一括置換時に13ページ分が消えた教訓）。
8. `style.min.css` を作る場合は **clean-css-cli 禁止**（メディアクエリが消える）。コーポレートは `scripts/redesign-v2/build-css.mjs` の安全 minify を使用。キャッシュバスター `?v=YYYYMMDD` を全ページ更新。
9. 社内確認は本番と別フォルダのプレビュー（Basic 認証＋noindex＋計測タグ除去）で行う。コーポレートの `scripts/redesign-v2/build-preview.mjs` を参考にしてよい。
10. デプロイは先方ルールどおり **`bash scripts/deploy.sh` 経由のみ**（MT 管理ファイルの上書き禁止）。

## 8. QA チェックリスト（リリース前・必須）

- PC Chrome ／ **iPhone Safari 実機** ／ **LINE・X のアプリ内ブラウザ** ／ 320〜375px（DevTools）の4環境
- 画像コンテナは `padding-top` パターン（`aspect-ratio` 単体禁止。旧 Safari・WebView で高さ0になる）
- 日本語見出しが熟語の途中で割れない（`keep-all` ＋ 明示 `<br>`）
- ヘッダーの透明→白の切り替えがヒーロー直下で起きる。ハンバーガー開閉でヘッダーが白になる
- flex 要素の横はみ出しなし（body に横スクロールが出ない）
- 日本地図の hover／click、都道府県ページの検索・フィルタ・ページネーションが動く
- フォーム送信（Lambda→Lark Base→SES）が壊れていない。プレビュー環境では送信を止める
- JSON-LD／canonical／OGP が既存どおり残っている。MT 生成ページのヘッダー／フッターが includes 経由で新デザインになっている
- CSS 変更後は本番でスマホ表示を再確認

## 9. 先方プロジェクトのルールとの整合（DESIGN.md / PRODUCT.md との差分）

- DESIGN.md の「角丸（8〜24px）・柔らかい影・クリーム背景」は **v2 では採用しない**。適用後は DESIGN.md を v2 の値に更新すること（トークン表・角丸・影・Motion の節）。
- PRODUCT.md の Brand Personality（あたたかい／横に座って一緒に考える）は **コピーと写真で担保**し、UI の装飾で担保しない。冷たいテック調にしないための具体策: 写真は人の顔が見えるカットを入れる、コピーは敬体で丁寧に、CTA の注記（「ご相談・面談はすべて無料です」「勤務先には知られません」等）を残す。
- PRODUCT.md の Anti-references（原色赤ボタン・SaaS ダーク・虚飾ストック写真）は v2 でも同じ。ネイビーは「黒＋ネオン」ではなく紙面の墨色として使う。
- LINE 相談は 2026-05-08 に全廃済み。CTA は `/contact/` と企業向け Lark フォームの2系統のまま。
- 求人・記事データ（`data/*.json`）とカテゴリマスターには触れない。`company-industries.json` は MT 生成のためデプロイ禁止。

## 10. 未決事項（着手前に須長へ確認）

1. **ブランドカラー**: (A) グループ共通のオレンジ／ネイビーに統一 か (B) 緑を主色として v2 の構造だけ移植 か。推奨 (A)。
2. **製造業寄せの度合い**: トップのコピー・写真を製造業に振り切るか、「地域密着」を主に「ものづくりに強い」を副にするか。
3. **ヒーローで日本地図を残すか**: 写真ヒーローに変更し地図は2番目に降ろす提案でよいか。
4. **写真素材**: AI 生成で進めてよいか、実写を用意するか（求職者向けは人物の実在感が効く）。
5. **英字ラベルの言い回し**: 例「Regional Career Support」「Find Jobs by Area」など、サービスの英字表記の有無。
6. **ページヘッダーの英字ウォーターマーク**: 都道府県ページで「SHIGA」「SHIZUOKA」を出してよいか。

## 11. 完了の定義

- 全ページ（MT 生成の詳細ページ含む）が v2 の共通部品・トークンで表示され、8章の QA を通過している
- 求人検索・フォーム・関連記事など既存機能に退行がない
- DESIGN.md が v2 の値に更新され、先方 CLAUDE.md に「デザイン v2（2026-09、コーポレートと共通）」の節が追加されている
- 須長がプレビューで確認し「OK」を出したうえで `scripts/deploy.sh` で本番反映

---

## 付録: 参照ファイル一覧（`reference/`）

| ファイル | 内容 |
|---|---|
| `style-v2-section.css` | 本番 `style.css` の v2 ブロック全体（共通部品の上書き／トップ `tp-*`／下層ページヘッダー v2／下層 `bz-*`）。CSS の正本 |
| `critical-css-common.css` / `critical-css-hero-pages.css` | インライン Critical CSS（共通／写真ヒーローを持つページ用の追加分） |
| `header-footer-template.mjs` | 共通ヘッダー・モバイルナビ・フッターの HTML 生成関数 |
| `header-scroll.js` | 透明ヘッダー→白の切り替え JS |
| `corporate-index.html` | 手本トップページ（完成品） |
| `corporate-services.html` | ネイビー帯ページヘッダー型の下層ページ |
| `corporate-business-minori-advisory.html` | 写真ヒーロー型の下層ページ |
| `corporate-404.html` | 404 ページ |
| `generate-top-photos.mjs` | 写真生成スクリプト（プロンプトの `STYLE` 定数が写真指針の正本） |
| `hero-floor.webp` / `hero-hands.webp` | 写真の仕上がり見本（1920×1080） |

手本サイトの背景資料（seisansei-website リポジトリ）: `docs/site-renewal-requirements-2026-09.md`（経営会議の要件）、`docs/site-renewal-structure-2026-09.md`（構成とデザインシステム）、`docs/mvv-2026-09.md`（MVV 原文）。
