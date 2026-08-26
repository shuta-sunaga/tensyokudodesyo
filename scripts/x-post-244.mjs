import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const url = 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-244.html';
const title = '履歴書の日付はいつ？提出日・面接日の書き方';
const text = `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${url}\n\n#転職 #転職ノウハウ`;

// 文字数チェック（URLは23文字換算）
const weighted = text.replace(url, 'x'.repeat(23)).length;
console.log('投稿文字数(URL23換算):', weighted, weighted <= 140 ? 'OK' : 'NG');
if (weighted > 140) { console.error('140字超過のため中止'); process.exit(1); }

const result = await client.v2.tweet(text);
console.log('投稿完了:', `https://x.com/tensyokudodesyo/status/${result.data.id}`);
