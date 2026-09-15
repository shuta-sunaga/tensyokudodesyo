/**
 * v2 テーマ CSS を各 CSS ファイルの末尾に「後勝ちブロック」として反映する（冪等）。
 *
 *   node scripts/redesign-v2/apply-css.mjs
 *
 * 対応表:
 *   v2-theme.css   → public_html/css/style.css
 *   v2-contact.css → public_html/css/contact.css
 *   v2-client.css  → public_html/css/client-detail.css
 *   v2-article.css → public_html/css/article-detail.css
 *
 * 既存ブロックは START/END マーカーで置換する。style.css には先頭に IBM Plex Sans の @import を追加する。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CSS_DIR = path.join(ROOT, 'public_html', 'css');

const START = '/* ===== DESIGN V2 START (generated from scripts/redesign-v2 — do not edit below by hand) ===== */';
const END = '/* ===== DESIGN V2 END ===== */';
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');";

const MAP = [
  ['v2-theme.css', 'style.css', true],
  ['v2-contact.css', 'contact.css', false],
  ['v2-client.css', 'client-detail.css', false],
  ['v2-article.css', 'article-detail.css', false],
];

for (const [src, dst, withFont] of MAP) {
  const srcPath = path.join(__dirname, src);
  const dstPath = path.join(CSS_DIR, dst);
  if (!fs.existsSync(srcPath)) { console.log(`skip ${src} (not found)`); continue; }
  const block = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n').trim();
  let css = fs.readFileSync(dstPath, 'utf8').replace(/\r\n/g, '\n');

  const s = css.indexOf(START);
  const e = css.indexOf(END);
  if (s >= 0 && e > s) {
    css = css.slice(0, s).replace(/\s+$/, '') + '\n\n' + START + '\n' + block + '\n' + END + '\n' + css.slice(e + END.length).replace(/^\s+/, '\n');
  } else {
    css = css.replace(/\s+$/, '') + '\n\n' + START + '\n' + block + '\n' + END + '\n';
  }
  if (withFont && !css.includes(FONT_IMPORT)) {
    // @import は他のルールより前に置く必要がある（先頭コメントの直後）
    css = FONT_IMPORT + '\n' + css;
  }
  fs.writeFileSync(dstPath, css, 'utf8');
  console.log(`applied ${src} → css/${dst} (${block.split('\n').length} lines)`);
}
