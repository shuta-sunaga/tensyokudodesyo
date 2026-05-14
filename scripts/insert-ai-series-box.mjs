import fs from 'fs';
import path from 'path';

const aiArticles = [
    { id: '011', title: 'AI時代の転職戦略〜生成AIを活用した効率的な転職活動' },
    { id: '012', title: 'AIで差がつく職務経歴書の作り方〜ChatGPTを使った自己PR' },
    { id: '013', title: 'AI面接・Web面接の完全対策ガイド' },
    { id: '016', title: 'AI・DXで求人が急増している業界5選' },
    { id: '017', title: 'AIに仕事を奪われない業界・職種とは' },
    { id: '018', title: 'AI人材の需要と転職市場〜未経験ロードマップ' },
    { id: '058', title: 'AIで自己分析〜ChatGPTで強み・適職を発見する方法' },
    { id: '107', title: 'プロンプトエンジニア転職〜年収・スキル・参入法' },
    { id: '108', title: 'ChatGPTで面接練習〜想定問答と回答改善法' },
    { id: '109', title: 'Perplexityで企業研究〜AI情報収集術' },
    { id: '116', title: 'AI活用経験を職務経歴書に書く方法' },
    { id: '117', title: 'Notion AIで転職活動を管理〜応募・タスクを一元化' },
    { id: '118', title: 'Deep Research活用の企業研究〜AIで競合・財務分析' },
];

function buildBox(currentId) {
    const others = aiArticles.filter(a => a.id !== currentId);
    const lis = others.map(a =>
        `                    <li><a href="/knowhow/detail/knowhow-${a.id}.html">${a.title}</a></li>`
    ).join('\n');
    return `            <!-- AI Series Box -->
            <aside class="article-series-box">
                <h3>AI×転職活動 関連シリーズ</h3>
                <p>当サイトでは AI・ChatGPT を活用した転職ノウハウをシリーズで公開しています。あわせて読むことで、自己分析から内定後まで AI を使いこなした転職活動が実践できます。</p>
                <ul>
${lis}
                </ul>
            </aside>

`;
}

const dir = 'public_html/knowhow/detail';
let changed = 0;

aiArticles.forEach(({ id }) => {
    const fp = path.join(dir, `knowhow-${id}.html`);
    if (!fs.existsSync(fp)) { console.log(`MISSING: ${fp}`); return; }
    let html = fs.readFileSync(fp, 'utf8');

    // skip if already inserted
    if (html.includes('article-series-box')) {
        console.log(`SKIP (already has box) knowhow-${id}.html`);
        return;
    }

    const box = buildBox(id);
    // Insert just before <!-- CTA --> section
    const marker = '            <!-- CTA -->';
    if (!html.includes(marker)) {
        console.log(`NO MARKER knowhow-${id}.html`);
        return;
    }
    html = html.replace(marker, box + marker);
    fs.writeFileSync(fp, html);
    console.log(`OK knowhow-${id}.html`);
    changed++;
});

console.log(`\nTotal changed: ${changed}`);
