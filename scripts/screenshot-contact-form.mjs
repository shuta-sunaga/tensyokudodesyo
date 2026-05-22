/**
 * /contact/ のフォームカード部分を拡大スクショ
 */
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promises as fs } from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'screenshots');
await fs.mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
const url = 'http://localhost:8080/contact/';

async function shootSection(name, viewport, selector) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    const el = await page.$(selector);
    if (!el) { console.log('NOT FOUND', selector); await page.close(); return; }
    const file = path.join(OUT, name + '.png');
    await el.screenshot({ path: file });
    console.log('saved', file);
    await page.close();
}

// フォームカードのみ
await shootSection('mobile-390-form', { width: 390, height: 844 }, '.form-card');
await shootSection('mobile-375-form', { width: 375, height: 812 }, '.form-card');
await shootSection('desktop-1280-form', { width: 1280, height: 900 }, '.form-card');

await browser.close();
console.log('done');
