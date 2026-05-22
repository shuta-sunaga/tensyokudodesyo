import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

const articles = [
    { id: 137, title: 'エニアグラム9タイプ別｜転職活用ガイド' },
    { id: 138, title: 'ホテル・観光業界の転職｜職種・年収・将来性' },
    { id: 139, title: 'アルムナイ転職｜出戻り採用の進め方と注意点' }
];

function tweetLength(text) {
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
        // 2秒待機（連投制御）
        await new Promise(r => setTimeout(r, 2000));
    }
})();
