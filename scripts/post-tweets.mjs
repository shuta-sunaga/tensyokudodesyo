import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

const articles = [
    { id: 89, title: '履歴書の趣味・特技欄〜採用担当に響く書き方' },
    { id: 90, title: '自分史の作り方〜過去から強みを見つける方法' },
    { id: 91, title: '面接の入退室マナー〜ノックの回数からお辞儀まで' }
];

function tweetLength(text) {
    // X counts URLs as 23 chars regardless of actual length
    const urlRegex = /https?:\/\/\S+/g;
    const urls = text.match(urlRegex) || [];
    let len = text.length;
    for (const u of urls) {
        len = len - u.length + 23;
    }
    return len;
}

(async () => {
    for (const a of articles) {
        const nnn = String(a.id).padStart(3, '0');
        const url = `https://www.tensyokudodesyo.com/knowhow/detail/knowhow-${nnn}.html`;
        const text = `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${a.title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${url}\n\n#転職 #転職ノウハウ`;
        const len = tweetLength(text);
        console.log(`#${a.id} length=${len}`);
        if (len > 140) {
            console.error(`  SKIP: tweet exceeds 140 chars`);
            continue;
        }
        try {
            const result = await client.v2.tweet(text);
            console.log(`  OK https://x.com/tensyokudodesyo/status/${result.data.id}`);
        } catch (e) {
            console.error(`  FAIL:`, e.message || e);
            if (e.data) console.error('  ', JSON.stringify(e.data));
        }
    }
})();
