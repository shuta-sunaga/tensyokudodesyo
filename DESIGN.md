# DESIGN.md — 転職どうでしょう（デザイン v2 / 2026-09）

コーポレートサイト v2（https://www.sei-san-sei.com/ 2026-09-14 公開）と共通のデザイン言語。
引き継ぎ要件書: `docs/design-v2-handoff-from-corporate.md`、実装メモ: `docs/design-v2-implementation.md`。

## Theme

**Light**。白／ライトグレーの交互セクションに、ネイビーチャコールの帯（ヒーロー・下層ページヘッダー・CTA・フッター）。
装飾を削り、**写真と余白と書体**で見せる。角丸なし、影はほぼ使わない、グラデ装飾なし。

「あたたかさ」は UI の装飾ではなく、**写真（人の顔が見える現場写真）とコピー（敬体・言い切り）**で担保する。

## Color

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--color-primary` | `#F5820D` | オレンジ。**ラベル・ボタン・下線・マーカーのみ**。面積を広く塗らない |
| Primary (dark) | `--color-primary-dark` | `#D96D00` | 英字ラベル文字・hover |
| Primary (text) | `--color-primary-text` | `#B85B00` | 本文中のリンク |
| Black | `--color-black` | `#1B2430` | ネイビーチャコール。見出し・ヒーロー／CTA／ページヘッダー帯・主ボタン hover |
| Text | `--color-gray-dark` / `--color-text` | `#3A4552` | 本文 |
| Gray | `--color-gray` | `#5E6975` | サブテキスト |
| Gray light | `--color-gray-light` | `#6B7683` | キャプション・日付 |
| Border | `--color-gray-lighter` / `--color-border` | `#D8DCE0` | 罫線 |
| BG | `--color-bg` | `#FFFFFF` | ページ・カード背景 |
| BG gray | `--color-bg-gray` (`--color-bg-warm` / `-cream` も同値) | `#F5F6F6` | 交互セクションのライトグレー |
| Footer | `--color-bg-dark` | `#111821` | フッター |

**Color strategy**: 白／グレー／ネイビーの3階調。オレンジはアクセント1色。緑（旧 `#5a9e6f`）とクリーム背景は廃止。
ネイビーは「黒＋ネオン」ではなく紙面の墨色として使う。ロゴ（`assets/logo.webp`）の色は変えない（暗い背景では白抜き）。

## Typography

- **本文**: `"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif`（400 / 500 / 700。900 は使わない）
- **英字ラベル・数字**: `"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif`（400 / 500 / 600）。`letter-spacing: .14〜.18em`、大文字
- Google Fonts: `family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700`
- 本文 `line-height: 1.9`、見出し `letter-spacing: .02em; line-break: strict`
- 長い日本語見出しは `word-break: keep-all; overflow-wrap: anywhere` ＋ 明示 `<br>`
- Scale: h1 `clamp(2.1rem, 5.2vw, 4.2rem)`（ヒーロー）／ `clamp(2rem, 4.6vw, 3.6rem)`（下層帯）、h2 `clamp(1.5rem, 2.6vw, 2rem)`、h3 1.1〜1.4rem、本文 0.95〜1rem、キャプション 0.72〜0.8rem

## Spacing / Layout

- コンテナ: `.container` 1280px、トップ `.tp-wrap` 1240px、左右 `clamp(20px, 4vw, 56px)`
- セクション縦余白: `clamp(72px, 10vh, 120px)`（トップ）、`clamp(64px, 9vh, 100px)`（下層）。モバイルは 56px
- ヘッダー高さ: 76px（PC）／ 64px（〜1024px）。透明→白の切替はヒーロー直下
- ブレークポイント: 1240 / 1024（ナビ→ハンバーガー）/ 1000 / 900 / 768 / 600
- 画像枠は **`padding-top` パターン**（`aspect-ratio` 単体禁止。旧 Safari・WebView で高さ 0 になる）

## Border Radius

**すべて 0**（`--radius-*: 0`）。ピル型・角丸カードは使わない。

## Shadows

- 通常: なし（`--shadow-*: none`）
- hover のカードだけ `0 12px 32px rgba(27,36,48,.08)` ＋ 罫線を黒に
- ヘッダー（スクロール後）: `0 2px 16px rgba(27,36,48,.06)`

## Motion

- ボタン／リンク色: `.2s ease`。矢印（`::after "→"`）は hover で右へ 4px
- 写真 hover: `scale: 1.04`（`.6s ease`）
- セクションのフェードイン（`.tp-fade` → `.is-in`、`.6s`）程度は可。**sticky／スクロールテリング／スナップ系は使わない**（経営陣が嫌う）
- `prefers-reduced-motion` ではフェードを無効化

## Components

### Header
固定。ロゴ左（40px）、ナビ右（5項目・下線オレンジ）、右端に「企業様はこちら」(`btn-outline`) と「求職者様はこちら」(`btn-primary`)。1240px 以下は outline を隠す。1024px 以下はハンバーガー（44px 角）→全画面白メニュー。`body.page-home` ではヒーロー上で透明（白文字・白ロゴ）、`.solid` で白。

### Buttons
`.btn-primary`: オレンジ地・黒文字 → hover 黒地・白文字。`.btn-outline`: 黒線 → hover 黒地。トップ用 `.tp-btn`（黒地・→付き）／`.orange`／`.line`／`.ghost`。

### 英字ラベル
`.section-label` / `.tp-eyebrow`: 18×2px のオレンジ棒＋大文字英字。`.section-header[data-en]` でも出せる。

### 下層ページヘッダー
`.page-header`: ネイビー帯。パンくず（白55%）→ 2カラム（英字ラベル＋h1 / リード）。右下に `data-en` の英字ウォーターマーク（`::after content: attr(data-en)`、白5%）。`data-en` が無い MT 生成ページは `includes.js` がパスから付与（INTERVIEW / COMPANY / KNOWHOW / JOB …）。パンくずだけの帯は `.is-crumb-only`（モバイルでは非表示）。

### Cards
`.article-card` / `.job-listing-card` / `.client-card`: 角丸 0、罫線 1px、hover で影＋黒罫。カテゴリチップは薄グレー地・オレンジ文字。NEW はオレンジ地・黒文字の英字。

### 求人リスト（都道府県ページ `.job-row`）
1行＝タグ行（NEW／雇用形態／職種グループ）＋タイトル＋会社＋メタ（勤務地・年収）＋こだわり条件チップ＋右に日付と「詳細を見る →」。行全体がリンク。

### 検索パネル（`.tp-search` / `.jsr-panel`）
白いパネル、上端にオレンジの太線。入力は高さ 48〜50px・角丸 0・フォント 16px（iOS ズーム防止）。チップは 1px 罫線、選択で黒地。

### CTA 帯
ネイビー地。左に英字ラベル＋h2＋本文、右に注記リスト（無料・勤務先に知られない…）＋オレンジのボタン。オレンジはボタンだけ。

### フォーム（/contact/）
構造は維持。入力 角丸 0、フォーカスは黒罫＋オレンジ 2px アウトライン。必須印 ★ はオレンジ。エラーは `#B03A2E`。

## Photography

- 実在感のある現場写真（製造業）。人の顔が見えるカットを入れる。
- AI 生成時は `scripts/redesign-v2/generate-photos.mjs`（`STYLE` 定数が正本）。**AIっぽさゼロ**が条件: 弱いボケ・粒状感・混合光・生活感・自然な姿勢・カメラ目線なし・読める文字／ロゴなし。生成後は必ず目視、NG なら `--only` で再生成。
- 素材: `public_html/assets/v2/*.webp`（1920×1080 q80）

## Accessibility

- WCAG AA。フォーカスリング `2px solid #D96D00` offset 2px
- 本文コントラスト ≥ 4.5:1（`#3A4552` on white = 9.3:1、`#B85B00` on white = 5.4:1）
- タップ領域 44px 以上、`<label for>` 必須、`aria-live` で件数更新を通知

## Anti-patterns

- ❌ 角丸・柔らかい影・クリーム背景・緑（v1 の意匠）
- ❌ オレンジの面塗り（背景・大きな帯）。オレンジは線とボタンだけ
- ❌ sticky／スクロールテリング／スナップ演出
- ❌ 原色赤ボタン・「今すぐ送信！」コピー・虚飾ストック写真・作り笑いのカメラ目線
- ❌ `aspect-ratio` 単体の画像枠、clean-css-cli での minify（メディアクエリが消える）
- ❌ Noto Sans JP 900、紫・ピンクのグラデ、ネオン
