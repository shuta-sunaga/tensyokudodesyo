import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
const url = "http://localhost:8080/clients/detail/aru.html";

// Desktop full editorial group
await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 600));

const group = await page.$(".client-editorial-group");
await group.screenshot({ path: "tmp/aru-editorial-desktop.png" });

// Hero + quickfacts
const heroShot = await page.$(".client-detail .container");
await page.screenshot({ path: "tmp/aru-top-desktop.png", clip: { x: 0, y: 0, width: 1280, height: 980 } });

// Mobile
await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 600));
const groupM = await page.$(".client-editorial-group");
await groupM.screenshot({ path: "tmp/aru-editorial-mobile.png" });

await browser.close();
console.log("screenshots saved");
