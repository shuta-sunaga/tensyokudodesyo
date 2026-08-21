import { TwitterApi } from 'twitter-api-v2';
const client = new TwitterApi({ appKey: process.env.X_API_KEY, appSecret: process.env.X_API_SECRET, accessToken: process.env.X_ACCESS_TOKEN, accessSecret: process.env.X_ACCESS_SECRET });
const posts = [
  [240, 'AIで短所・弱みを言語化する方法｜転職の自己分析'],
  [241, 'AIで引き継ぎ資料を作る｜円満退職の準備術'],
  [242, 'AIで面接の自己紹介を磨く｜1分・3分の例文作成'],
];
for (const [id, title] of posts) {
  const url = `https://www.tensyokudodesyo.com/knowhow/detail/knowhow-${id}.html`;
  let text = `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${url}\n\n#転職 #転職ノウハウ`;
  let w = text.replace(url, 'x'.repeat(23)).length;
  if (w > 140) { text = text.replace('\n\n#転職 #転職ノウハウ', ''); w = text.replace(url, 'x'.repeat(23)).length; }
  console.log(id, '文字数(URL23換算):', w);
  if (w > 140) { console.error('140字超過、スキップ'); continue; }
  try { const r = await client.v2.tweet(text); console.log('投稿完了:', `https://x.com/tensyokudodesyo/status/${r.data.id}`); }
  catch (e) { console.error('X ERR', id, e.data?.detail || e.message); console.log('--- 手動投稿用 ---\n' + text + '\n---'); }
}
