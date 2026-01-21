import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertSvgToPng() {
    const svgPath = join(__dirname, '../public_html/assets/ogp.svg');
    const pngPath = join(__dirname, '../public_html/assets/ogp.png');

    const svgContent = readFileSync(svgPath, 'utf8');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; }
        body {
            width: 1200px;
            height: 630px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    ${svgContent}
</body>
</html>`;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(html);

    await page.screenshot({
        path: pngPath,
        type: 'png',
        clip: { x: 0, y: 0, width: 1200, height: 630 }
    });

    await browser.close();
    console.log(`PNG created: ${pngPath}`);
}

convertSvgToPng().catch(console.error);
