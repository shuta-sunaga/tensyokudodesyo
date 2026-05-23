/**
 * /clients/ 一覧 + 詳細ページのスクショ (検証用、コミット対象外)
 */
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'screenshots-clients');
await fs.mkdir(OUT, { recursive: true });

const PORT = process.env.PORT || 8089;
const BASE = `http://localhost:${PORT}`;

const targets = [
    { url: '/', name: 'home' },
    { url: '/clients/', name: 'clients-list' },
    { url: '/clients/detail/techno-solution.html', name: 'clients-detail-techno' },
    { url: '/clients/detail/digital-create.html', name: 'clients-detail-digital' },
];

const viewports = [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'mobile',  width: 390,  height: 844 },
];

const browser = await puppeteer.launch({ headless: 'new' });

for (const target of targets) {
    for (const vp of viewports) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
        try {
            await page.goto(BASE + target.url, { waitUntil: 'networkidle0', timeout: 20000 });
            await new Promise(r => setTimeout(r, 1200));
            const file = path.join(OUT, `${target.name}-${vp.name}.png`);
            await page.screenshot({ path: file, fullPage: true });
            console.log('saved', file);
        } catch (e) {
            console.error('failed:', target.url, vp.name, e.message);
        }
        await page.close();
    }
}

await browser.close();
console.log('done');
