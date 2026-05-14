import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    keyFile: 'docs/tensyokudodesyo-1dcb1b08e015.json',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
});

const searchconsole = google.searchconsole({ version: 'v1', auth });
const siteUrl = 'sc-domain:tensyokudodesyo.com';

function fmtDate(d) { return d.toISOString().slice(0,10); }
const today = new Date();
const end = new Date(today); end.setDate(end.getDate() - 2);
const start = new Date(end); start.setDate(start.getDate() - 28);

async function query(dimensions, rowLimit = 50, filters = null) {
    const body = {
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        dimensions,
        rowLimit
    };
    if (filters) body.dimensionFilterGroups = [{ filters }];
    const res = await searchconsole.searchanalytics.query({ siteUrl, requestBody: body });
    return res.data.rows || [];
}

console.log(`=== GSC Analysis (${fmtDate(start)} to ${fmtDate(end)}, 28 days) ===\n`);

// 1. Overall totals
const totals = await query([]);
if (totals[0]) {
    const t = totals[0];
    console.log(`[Site total] clicks=${t.clicks} impressions=${t.impressions} CTR=${(t.ctr*100).toFixed(2)}% avgPos=${t.position.toFixed(1)}\n`);
}

// 2. Top queries
console.log('=== Top 30 queries by impressions ===');
const queries = await query(['query'], 30);
queries.sort((a,b)=>b.impressions-a.impressions);
console.log('clicks | impr | CTR% | pos | query');
queries.forEach(r => console.log(`${String(r.clicks).padStart(4)} | ${String(r.impressions).padStart(5)} | ${(r.ctr*100).toFixed(1).padStart(5)} | ${r.position.toFixed(1).padStart(4)} | ${r.keys[0]}`));

// 3. Top pages
console.log('\n=== Top 30 pages by impressions ===');
const pages = await query(['page'], 30);
pages.sort((a,b)=>b.impressions-a.impressions);
console.log('clicks | impr | CTR% | pos | page');
pages.forEach(r => {
    const path = r.keys[0].replace('https://www.tensyokudodesyo.com','');
    console.log(`${String(r.clicks).padStart(4)} | ${String(r.impressions).padStart(5)} | ${(r.ctr*100).toFixed(1).padStart(5)} | ${r.position.toFixed(1).padStart(4)} | ${path}`);
});

// 4. Pages with 0 clicks but impressions (low CTR)
console.log('\n=== Top 20 missed opportunities (high impr / low clicks) ===');
const missed = pages.filter(r => r.impressions > 50 && r.clicks < 3).slice(0,20);
console.log('clicks | impr | CTR% | pos | page');
missed.forEach(r => {
    const path = r.keys[0].replace('https://www.tensyokudodesyo.com','');
    console.log(`${String(r.clicks).padStart(4)} | ${String(r.impressions).padStart(5)} | ${(r.ctr*100).toFixed(1).padStart(5)} | ${r.position.toFixed(1).padStart(4)} | ${path}`);
});

// 5. Query-page combos that rank 11-30 (page 2 — close to page 1)
console.log('\n=== Queries ranking 11-30 (close to page 1, top 30) ===');
const close = await query(['query','page'], 500);
const closeRows = close.filter(r => r.position >= 11 && r.position <= 30 && r.impressions > 5)
    .sort((a,b)=>b.impressions-a.impressions).slice(0,30);
console.log('clicks | impr | CTR% | pos | query | page');
closeRows.forEach(r => {
    const path = r.keys[1].replace('https://www.tensyokudodesyo.com','');
    console.log(`${String(r.clicks).padStart(4)} | ${String(r.impressions).padStart(5)} | ${(r.ctr*100).toFixed(1).padStart(5)} | ${r.position.toFixed(1).padStart(4)} | ${r.keys[0]} | ${path}`);
});

// 6. Indexation summary (sitemap inspection)
console.log('\n=== Sitemap status ===');
try {
    const sm = await searchconsole.sitemaps.get({ siteUrl, feedpath: 'https://www.tensyokudodesyo.com/sitemap.xml' });
    const d = sm.data;
    console.log(`lastSubmitted: ${d.lastSubmitted}`);
    console.log(`lastDownloaded: ${d.lastDownloaded}`);
    if (d.contents) d.contents.forEach(c => console.log(`  ${c.type}: submitted=${c.submitted} indexed=${c.indexed}`));
} catch (e) { console.log('sitemap fetch failed:', e.message); }
