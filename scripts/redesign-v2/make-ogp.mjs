/**
 * v2 の OGP 画像（1200×630）を ogp.html から生成して public_html/assets/ogp.png を更新する。
 *   node scripts/redesign-v2/make-ogp.mjs [--out public_html/assets/ogp.png]
 */
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const i = args.indexOf('--out');
const OUT = path.resolve(i >= 0 ? args[i + 1] : path.join(ROOT, 'public_html', 'assets', 'ogp.png'));

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(__dirname, 'ogp.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 500));
const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
if (fs.existsSync(OUT)) fs.copyFileSync(OUT, OUT.replace(/\.png$/, '.v1-backup.png'));
await sharp(buf).png({ compressionLevel: 9, palette: false }).toFile(OUT);
const st = fs.statSync(OUT);
console.log(`ogp written: ${OUT} (${Math.round(st.size / 1024)} KB)`);
