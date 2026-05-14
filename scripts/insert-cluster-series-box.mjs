// Phase 2 STEP 2: トピッククラスター内部リンクハブを追加
// 面接対策 / 履歴書・職務経歴書 / 業界研究 の3クラスタに article-series-box を挿入

import fs from 'node:fs';
import path from 'node:path';

const pipeline = JSON.parse(fs.readFileSync('public_html/data/knowhow.json', 'utf8'));
const mt = JSON.parse(fs.readFileSync('public_html/data/knowhow-mt.json', 'utf8'));
const allArticles = [...pipeline.articles, ...(mt.articles || [])];
const byId = Object.fromEntries(allArticles.map(a => [a.id, a]));

const clusters = {
    kh01: {
        title: '面接対策の関連シリーズ',
        intro: '面接対策に関する記事をシリーズで公開しています。よく聞かれる質問・逆質問・自己紹介・退職理由の答え方など、内定獲得までの準備が一通り揃います。',
        members: [8, 20, 25, 29, 40, 68, 71, 80, 88, 93, 104]
    },
    kh02: {
        title: '履歴書・職務経歴書の関連シリーズ',
        intro: '応募書類の書き方に関する記事をシリーズで公開しています。志望動機・自己PR・フォーマット選びから個別欄の埋め方まで、書類選考の通過率を上げる実践テンプレが揃います。',
        members: [4, 21, 26, 30, 37, 50, 59, 77, 92, 95, 110]
    },
    kh04: {
        title: '業界研究の関連シリーズ',
        intro: '業界別の転職事情と研究方法に関する記事をシリーズで公開しています。業界研究のやり方から個別業界の動向・年収・職種まで、ミスマッチのない業界選びにお役立てください。',
        members: [7, 32, 38, 43, 51, 56, 70, 72, 75, 79, 82]
    }
};

function buildBox(clusterKey, currentId) {
    const c = clusters[clusterKey];
    const items = c.members.filter(id => id !== currentId);
    const lis = items.map(id => {
        const a = byId[id];
        if (!a) return null;
        let url;
        if (a.detailUrl) {
            url = a.detailUrl;
            if (!url.startsWith('/')) url = '/' + url;
        } else {
            // MT-managed article: /knowhow/detail/{id}.html
            url = `/knowhow/detail/${id}.html`;
        }
        return `                    <li><a href="${url}">${a.title}</a></li>`;
    }).filter(Boolean).join('\n');
    return `            <!-- Cluster Series Box -->
            <aside class="article-series-box">
                <h3>${c.title}</h3>
                <p>${c.intro}</p>
                <ul>
${lis}
                </ul>
            </aside>

`;
}

let totalOk = 0, totalSkip = 0;
for (const [clusterKey, c] of Object.entries(clusters)) {
    const clusterArticles = pipeline.articles.filter(a => a.category === clusterKey);
    console.log(`\n=== ${clusterKey} ${c.title} (${clusterArticles.length} articles) ===`);
    for (const art of clusterArticles) {
        const fname = path.basename(art.detailUrl || '');
        if (!fname) { console.log(`  SKIP (no detailUrl): id=${art.id}`); totalSkip++; continue; }
        const fpath = path.join('public_html/knowhow/detail', fname);
        if (!fs.existsSync(fpath)) { console.log(`  SKIP (no file): ${fname}`); totalSkip++; continue; }
        let html = fs.readFileSync(fpath, 'utf8');
        if (html.includes(c.title)) { console.log(`  SKIP (already has): ${fname}`); totalSkip++; continue; }
        const box = buildBox(clusterKey, art.id);
        const ctaCommentMarker = '            <!-- CTA -->';
        const ctaSectionMarker = '            <section class="article-cta">';
        if (html.includes(ctaCommentMarker)) {
            html = html.replace(ctaCommentMarker, box + ctaCommentMarker);
        } else if (html.includes(ctaSectionMarker)) {
            html = html.replace(ctaSectionMarker, box + ctaSectionMarker);
        } else {
            console.log(`  SKIP (no CTA marker): ${fname}`); totalSkip++; continue;
        }
        fs.writeFileSync(fpath, html);
        console.log(`  OK: ${fname}`);
        totalOk++;
    }
}

console.log(`\n=== Summary: ${totalOk} files modified, ${totalSkip} skipped ===`);
