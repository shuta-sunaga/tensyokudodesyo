import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'screenshots');
await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
const url = 'http://localhost:8080/contact/';

async function shotAndProbe(name, viewport) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    // ヒーローだけクロップ
    const hero = await page.$('.contact-hero');
    if (hero) await hero.screenshot({ path: path.join(OUT, name + '-hero.png') });
    // 各フォーム要素もクロップ
    const formCard = await page.$('.form-card');
    if (formCard) await formCard.screenshot({ path: path.join(OUT, name + '-form.png') });
    // 改行を可視化
    const lines = await page.evaluate(() => {
        const lead = document.querySelector('.contact-hero__lead');
        if (!lead) return null;
        // テキストを文字単位で span 化して改行位置を検知
        const text = lead.textContent.trim();
        // ClientRects で行を判定
        const range = document.createRange();
        range.selectNodeContents(lead);
        const rects = Array.from(range.getClientRects());
        const rows = {};
        rects.forEach(r => { const y = Math.round(r.top); rows[y] = rows[y] || { top: y, width: 0 }; rows[y].width += r.width; });
        return { text, lineCount: Object.keys(rows).length };
    });
    console.log(`[${name}] lead lines:`, lines && lines.lineCount, '/ width:', viewport.width);
    await page.close();
}

await shotAndProbe('desktop', { width: 1280, height: 900 });
await shotAndProbe('tablet', { width: 768, height: 1024 });
await shotAndProbe('mobile', { width: 390, height: 844 });

await browser.close();
console.log('done');
