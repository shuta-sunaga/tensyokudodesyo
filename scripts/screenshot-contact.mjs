/**
 * /contact/ ページをデスクトップ＋モバイルでスクショ
 */
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tmp', 'screenshots');
await import('node:fs').then(({ promises }) => promises.mkdir(OUT, { recursive: true }));

const browser = await puppeteer.launch({ headless: 'new' });
const url = 'http://localhost:8080/contact/';

async function shoot(name, viewport) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500)); // wait for includes & turnstile
    const file = path.join(OUT, name + '.png');
    await page.screenshot({ path: file, fullPage: true });
    console.log('saved', file);
    await page.close();
}

await shoot('desktop-1280', { width: 1280, height: 900, deviceScaleFactor: 1 });
await shoot('tablet-768', { width: 768, height: 1024, deviceScaleFactor: 1 });
await shoot('mobile-390', { width: 390, height: 844, deviceScaleFactor: 1 });

await browser.close();
console.log('done');
