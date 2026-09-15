/**
 * デプロイ可能な静的 HTML の CSS/JS 参照に ?v=YYYYMMDD を付ける（キャッシュバスター）。
 * MT 管理ページ（トップ・一覧・都道府県・MT 生成詳細）は触らない（MT 側は mt-apply-v2 の SQL REPLACE で対応）。
 *
 *   node scripts/redesign-v2/version-assets.mjs [--version 20260915]
 *
 * 変更したファイル一覧を stdout に出す（deploy.sh に渡す）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PUB = path.join(ROOT, 'public_html');
const args = process.argv.slice(2);
const vi = args.indexOf('--version');
const V = vi >= 0 ? args[vi + 1] : '20260915';

const ASSETS = ['css/style.css', 'css/article-detail.css', 'css/client-detail.css', 'css/contact.css', 'css/japan-map.css',
  'js/includes.js', 'js/main.js', 'js/categories.js', 'js/related-articles.js', 'js/article-toc.js', 'js/clients-page.js',
  'js/client-detail.js', 'js/contact.js', 'js/data-cache.js', 'js/job-taxonomy.js', 'js/home-v2.js', 'js/prefecture-page.js'];
const re = new RegExp('((?:\\.\\./)*|/)?(' + ASSETS.map(a => a.replace(/\./g, '\\.')).join('|') + ')(\\?v=[^"\' ]*)?(["\'])', 'g');

// MT 管理（deploy.sh でブロックされる）パス
const MT_MANAGED = [
  /^index\.html$/, /^(interviews|companies|knowhow)\/index\.html$/, /^(interviews|companies)\/detail\//, /^knowhow\/detail\/\d+\.html$/,
  /^(hokkaido|aomori|iwate|miyagi|akita|yamagata|fukushima|ibaraki|tochigi|gunma|saitama|chiba|tokyo|kanagawa|niigata|toyama|ishikawa|fukui|yamanashi|nagano|gifu|shizuoka|aichi|mie|shiga|kyoto|osaka|hyogo|nara|wakayama|tottori|shimane|okayama|hiroshima|yamaguchi|tokushima|kagawa|ehime|kochi|fukuoka|saga|nagasaki|kumamoto|oita|miyazaki|kagoshima|okinawa)\//,
  /^index-child-template\.html$/, /^(interviews|companies|knowhow)\.html$/,
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (['assets', 'data', 'includes', 'css', 'js'].includes(e.name)) continue; walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const changed = [];
for (const f of walk(PUB, [])) {
  const rel = path.relative(PUB, f).replace(/\\/g, '/');
  if (MT_MANAGED.some(r => r.test(rel))) continue;
  const s = fs.readFileSync(f, 'utf8');
  const n = s.replace(re, (m, pre, asset, ver, q) => `${pre || ''}${asset}?v=${V}${q}`);
  if (n !== s) { fs.writeFileSync(f, n); changed.push('public_html/' + rel); }
}
console.error(`versioned: ${changed.length} files (knowhow pipeline pages: ${changed.filter(f => /knowhow\/detail/.test(f)).length})`);
console.log(changed.join('\n'));
