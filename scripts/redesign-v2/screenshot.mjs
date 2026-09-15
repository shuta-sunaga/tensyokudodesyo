/**
 * ローカルプレビュー（http://localhost:8080）の各ページを PC / スマホ幅でフルページ撮影する。
 *
 *   node scripts/redesign-v2/screenshot.mjs [--base http://localhost:8080] [--out DIR] [--only index,osaka]
 *
 * 出力: DIR/<name>-<width>.jpg（幅 700px に縮小した確認用）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BASE = opt('--base', 'http://localhost:8080');
const OUT = path.resolve(opt('--out', path.join(__dirname, 'shots')));
const ONLY = opt('--only', '').split(',').filter(Boolean);
const WIDTHS = opt('--widths', '1400,390').split(',').map(Number);

const PAGES = [
  ['index', '/'],
  ['osaka', '/osaka/?cat=manufacturing'],
  ['job', '/osaka/jobs/SJ2516020.html'],
  ['interviews', '/interviews/'],
  ['knowhow', '/knowhow/'],
  ['clients', '/clients/'],
  ['client-detail', '/clients/detail/aru.html'],
  ['knowhow-detail', '/knowhow/detail/knowhow-264.html'],
  ['contact', '/contact/'],
  ['terms', '/terms.html'],
  ['404', '/404.html'],
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
try {
  for (const [name, url] of PAGES) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    for (const width of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
      const errors = [];
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      try {
        await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 1200));
        // フェードイン要素を表示状態に
        await page.evaluate(() => document.querySelectorAll('.tp-fade').forEach(el => el.classList.add('is-in')));
        const overflow = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
        const buf = await page.screenshot({ fullPage: true, type: 'png' });
        const outPath = path.join(OUT, `${name}-${width}.jpg`);
        if (width < 600) {
          const meta = await sharp(buf).metadata();
          const TILE = 1300; const n = Math.min(10, Math.ceil(meta.height / TILE));
          for (let i = 0; i < n; i++) {
            const h = Math.min(TILE, meta.height - i * TILE);
            await sharp(buf).extract({ left: 0, top: i * TILE, width: meta.width, height: h }).jpeg({ quality: 80 }).toFile(path.join(OUT, `${name}-${width}-${i + 1}.jpg`));
          }
        } else {
          await sharp(buf).resize({ width: 700 }).jpeg({ quality: 78 }).toFile(outPath);
        }
        console.log(`${name}@${width}: ${path.basename(outPath)} overflow=${overflow.sw > overflow.cw ? 'YES ' + overflow.sw + '>' + overflow.cw : 'no'} errors=${errors.length}${errors.length ? ' ' + errors.slice(0, 3).join(' | ') : ''}`);
      } catch (e) {
        console.log(`${name}@${width}: FAILED ${e.message}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
