# DESIGN.md — 転職どうでしょう

## Theme

**Light**, warm cream background. Day-time reading mood; mobile-first.

`bg: #ffffff / #faf8f0 (warm cream)` で陽の差し込むカフェのような印象を狙う。

## Color

OKLCH thinking, but stored as hex for compatibility. Tinted neutrals (warm-leaning).

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Primary | `--color-primary` | `#5a9e6f` | CTA・リンク・主要ボタン（緑） |
| Primary (dark) | `--color-primary-dark` | `#4a8a5f` | hover・active |
| Primary (light) | `--color-primary-light` | `#e8f5ec` | background tint |
| Secondary | `--color-secondary` | `#e8a85a` | アクセント（オレンジ・限定使用） |
| Accent | `--color-accent` | `#f0c674` | ハイライト |
| Text | `--color-text` | `#3d3d3d` | 本文 |
| Text light | `--color-text-light` | `#5a5a5a` | サブテキスト |
| Text muted | `--color-text-muted` | `#7a7a7a` | キャプション |
| BG | `--color-bg` | `#ffffff` | カード・フォーム背景 |
| BG warm | `--color-bg-warm` | `#faf8f0` | ページ背景 |
| BG cream | `--color-bg-cream` | `#f5f2e8` | セクション差別化 |
| BG dark | `--color-bg-dark` | `#3d4a3f` | フッター |
| Border | `--color-border` | `#e5e2d8` | フォーム枠 |

**Color strategy**: Restrained — クリームベースに緑1色を主軸、オレンジは限定的アクセント。

## Typography

- **Font**: `'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Scale** (1.25 ratio):
  - h1: 2rem (32px) / 700
  - h2: 1.625rem (26px) / 700
  - h3: 1.25rem (20px) / 600
  - body: 1rem (16px) / 400
  - small: 0.875rem (14px) / 400
  - caption: 0.75rem (12px) / 400
- **Line height**: 1.7 for body, 1.4 for headings
- **Body line length**: max 65ch
- **Letter-spacing**: 0.02em for headings (Japanese typography needs slight tracking)

## Spacing

| Token | Value |
|-------|-------|
| `--spacing-xs` | 0.5rem (8px) |
| `--spacing-sm` | 1rem (16px) |
| `--spacing-md` | 1.5rem (24px) |
| `--spacing-lg` | 2rem (32px) |
| `--spacing-xl` | 3rem (48px) |
| `--spacing-2xl` | 4rem (64px) |
| `--spacing-3xl` | 6rem (96px) |

Vary spacing for rhythm — not uniform padding everywhere.

## Border Radius

ソフトでフレンドリーな印象を狙う。
- xs: 4px (input focus)
- sm: 8px (badge, tag)
- md: 12px (button, card-inner)
- lg: 16px (form card)
- xl: 24px (hero card)
- full: 9999px (avatar, pill)

## Shadows

控えめで柔らかい。
- `--shadow-sm`: `0 2px 4px rgba(0, 0, 0, 0.04)`
- `--shadow-md`: `0 4px 12px rgba(0, 0, 0, 0.06)`
- `--shadow-lg`: `0 8px 24px rgba(0, 0, 0, 0.08)`
- `--shadow-xl`: `0 16px 32px rgba(0, 0, 0, 0.1)`

## Motion

- **transition-fast**: 0.15s ease (button color)
- **transition-base**: 0.3s cubic-bezier(0.4, 0.4, 0, 1) (card hover, form focus)
- **transition-slow**: 0.5s cubic-bezier(0.4, 0.4, 0, 1) (page section reveal)

控えめ・上品。バウンス・派手な変形は避ける。

## Layout

- **Container max**: 1280px
- **Header height**: 80px (sticky)
- **Form card max**: 720px (1カラム読みやすさ優先)
- **Mobile breakpoint**: 768px
- **Desktop breakpoint**: 1024px

## Components

### Form
- 1カラム縦並び（PCでも）
- ラベル上、入力欄下
- 必須印は ★ 緑色（赤バッジは威圧的なので使わない）
- フォーカス時: ボーダーをprimary、背景にprimary-lightのうっすらグロウ
- エラー時: ボーダーを `#d97757` (warm-red、警告ピンクではなく)、メッセージは下に小さく
- 入力欄角丸: 12px
- 内余白: 14px 16px
- フォントサイズ: 16px (iOS自動ズーム回避)

### Button
- Primary: 緑グラデーション、白文字、角丸12px、shadow-sm、hover時に1px浮く
- Secondary: ボーダー付き透明背景、hover時に淡い緑塗り
- Disabled: 灰色、cursor: not-allowed

### Step Indicator (応募の流れ)
- 横並びの番号付きステップ4-5個
- 完了/現在/未来の3状態
- アイコンは丸、線で接続
- モバイルでは縦並び

### Privacy notice
- 控えめな影付きカード
- 鍵アイコン左上、「あなたの情報は丁寧に扱います」コピー
- リンクは下線付き

## Accessibility

- WCAG AA target
- Focus visible: 2px solid primary outline + offset 2px
- Color contrast: text vs bg ≥ 4.5:1, interactive ≥ 3:1
- Form: `<label for>` 必須、aria-describedby でエラー紐付け
- Touch target: 44×44px min on mobile

## Anti-patterns to avoid (project-specific)

- ❌ 紫・ピンクのグラデ
- ❌ ネストカード（カードの中にカード）
- ❌ 大量のスケルトンローディングバー
- ❌ 過度なグロウ・ネオン
- ❌ 「今すぐ送信！」のような威圧的なCTAコピー
- ❌ アイコン+テキストの不揃いな垂直アライメント
