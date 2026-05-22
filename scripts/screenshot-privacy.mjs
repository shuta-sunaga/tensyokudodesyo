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
    await el.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('saved', name);
    await page.close();
}

await shootSection('privacy-mobile-375', { width: 375, height: 812 }, '.privacy-card');
await shootSection('privacy-mobile-390', { width: 390, height: 844 }, '.privacy-card');
await shootSection('privacy-desktop', { width: 1280, height: 900 }, '.privacy-card');

await browser.close();
console.log('done');
