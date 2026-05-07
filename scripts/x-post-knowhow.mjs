import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

const articles = [
    { id: '104', title: '面接の「最後に一言」で印象を残す回答例' },
    { id: '105', title: '飲食・サービス業界の転職ガイド〜職種・年収' },
    { id: '106', title: '試用期間中の過ごし方〜本採用への流れと注意点' },
];

function buildTweet({ id, title }) {
    const url = `https://www.tensyokudodesyo.com/knowhow/detail/knowhow-${id}.html`;
    return `まいど！テンショくまやで！

転職ノウハウブログを更新したから読んでみてや！
今回のテーマは「${title}」や。

感想ぜひ教えてな！拡散も頼むわ！
${url}

#転職 #転職ノウハウ`;
}

function twitterCharCount(text) {
    const normalized = text.replace(/https?:\/\/\S+/g, 'x'.repeat(23));
    return [...normalized].length;
}

for (const a of articles) {
    const text = buildTweet(a);
    const len = twitterCharCount(text);
    console.log(`--- #${a.id} (chars: ${len}) ---`);
    console.log(text);
    if (len > 140) {
        console.error(`SKIP: ${a.id} exceeds 140 chars`);
        continue;
    }
    try {
        const res = await client.v2.tweet(text);
        console.log(`POSTED: https://x.com/tensyokudodesyo/status/${res.data.id}`);
    } catch (e) {
        console.error(`ERROR posting ${a.id}:`, e?.data || e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
}
