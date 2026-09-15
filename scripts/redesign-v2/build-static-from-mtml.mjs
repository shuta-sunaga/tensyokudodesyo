/**
 * MT テンプレート（.mtml）からローカル確認用の静的 HTML を生成する。
 * 本番では MT が同じテンプレートから出力するため、ここで生成したファイルは
 * deploy.sh でブロックされる（MT 管理ファイル）。あくまでローカルプレビュー用。
 *
 *   node scripts/redesign-v2/build-static-from-mtml.mjs
 *
 * 対応する MT タグ: mt:Ignore / mt:SetVar / mt:Var（upper_case, capitalize）/ mt:BlogURL /
 *                    mt:Include module="ga-tag" / mt:If name=.. eq=.. ... mt:Else ... /mt:If
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ALL = args.includes('--all');
const PUB = path.resolve(opt('--out', path.join(ROOT, 'public_html')));
const TPL = path.join(ROOT, 'mt-template');
const BLOG_URL = 'https://www.tensyokudodesyo.com/';
const GA = `<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GJSD6BRJ0T"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-GJSD6BRJ0T');
    </script>`;

function render(src, vars) {
  let out = src.replace(/\r\n/g, '\n');
  out = out.replace(/<mt:Ignore>[\s\S]*?<\/mt:Ignore>\s*/g, '');
  // SetVar（引数の vars が優先）
  out = out.replace(/<mt:SetVar name="([^"]+)" value="([^"]*)">\s*/g, (m, k, v) => {
    if (!(k in vars)) vars[k] = v;
    return '';
  });
  // If/Else
  out = out.replace(/<mt:If name="([^"]+)" eq="([^"]*)">([\s\S]*?)(?:<mt:Else>([\s\S]*?))?<\/mt:If>/g, (m, k, v, a, b) => (vars[k] === v ? a : (b || '')));
  // Var with modifiers
  out = out.replace(/<mt:Var name="([^"]+)"((?:\s+\w+="[^"]*")*)\s*>/g, (m, k, mods) => {
    let v = vars[k] != null ? String(vars[k]) : '';
    if (/upper_case="1"/.test(mods)) v = v.toUpperCase();
    if (/lower_case="1"/.test(mods)) v = v.toLowerCase();
    if (/capitalize="1"/.test(mods)) v = v.charAt(0).toUpperCase() + v.slice(1);
    return v;
  });
  out = out.replace(/<mt:BlogURL>/g, BLOG_URL);
  out = out.replace(/<mt:Include module="ga-tag" global="1">/g, GA);
  // 先頭の空行を落とす
  out = out.replace(/^\s*\n/, '');
  return out;
}

function build(tplName, outRel, vars) {
  const src = fs.readFileSync(path.join(TPL, tplName), 'utf8');
  const html = render(src, { ...vars });
  const outPath = path.join(PUB, outRel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`built ${outRel} ← ${tplName}`);
}

build('index-html.mtml', 'index.html', {});
if (ALL) {
  // 47 都道府県すべて（プレビュー環境用）: prefectures.json のマスターから生成
  const prefs = JSON.parse(fs.readFileSync(path.join(ROOT, 'public_html', 'data', 'prefectures.json'), 'utf8')).prefectures;
  for (const p of prefs) build('prefecture-page.mtml', `${p.id}/index.html`, { prefecture_id: p.id, prefecture_name: p.name });
} else {
  build('prefecture-page.mtml', 'shiga/index.html', { prefecture_id: 'shiga', prefecture_name: '滋賀県' });
  build('prefecture-page.mtml', 'shizuoka/index.html', { prefecture_id: 'shizuoka', prefecture_name: '静岡県' });
  // ローカルプレビュー用に本番相当のページも生成（deploy.sh でブロックされる / git には入れない想定）
  for (const [id, name] of [['osaka', '大阪府'], ['fukuoka', '福岡県'], ['aichi', '愛知県']]) {
    build('prefecture-page.mtml', `${id}/index.html`, { prefecture_id: id, prefecture_name: name });
  }
}
