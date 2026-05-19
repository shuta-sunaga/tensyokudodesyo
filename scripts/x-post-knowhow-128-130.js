const { TwitterApi } = require('twitter-api-v2');

const POSTS = [
  { id: '128', title: 'Copilotで職務経歴書｜Office連携の強み活用', url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-128.html' },
  { id: '129', title: 'Claudeで深掘り自己分析｜長対話で価値観発見', url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-129.html' },
  { id: '130', title: 'ChatGPT Voiceで面接練習｜音声リアル会話術', url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-130.html' }
];

function buildText(p) {
  return `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${p.title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${p.url}\n\n#転職 #転職ノウハウ`;
}
function effLen(t) {
  const u = /https?:\/\/\S+/g;
  return t.replace(u, '___URL___').length + (t.match(u)||[]).length * 13;
}

(async () => {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });
  for (const p of POSTS) {
    const text = buildText(p);
    const len = effLen(text);
    console.log(`\n--- #${p.id} (${len}字) ---`);
    console.log(text);
    if (len > 140) { console.error('SKIP over 140'); continue; }
    try {
      const r = await client.v2.tweet(text);
      console.log(`OK: https://x.com/tensyokudodesyo/status/${r.data.id}`);
    } catch (e) {
      console.error(`ERROR #${p.id}:`, e.message || JSON.stringify(e));
      if (e.data) console.error('detail:', JSON.stringify(e.data));
    }
    await new Promise(r => setTimeout(r, 2000));
  }
})();
