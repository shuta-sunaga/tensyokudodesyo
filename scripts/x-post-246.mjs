import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

const title = '面接「何か質問はありますか」に質問なしはNG？対処法';
const url = 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-246.html';
const text = `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${url}\n\n#転職 #転職ノウハウ`;
const len = text.replace(url, 'x'.repeat(23)).length;
if (len > 140) throw new Error(`文字数超過 (${len})`);
const result = await client.v2.tweet(text);
console.log(`投稿完了 (${len}字): https://x.com/tensyokudodesyo/status/${result.data.id}`);
