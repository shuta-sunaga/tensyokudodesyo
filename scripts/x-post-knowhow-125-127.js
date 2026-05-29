const { TwitterApi } = require('twitter-api-v2');

const POSTS = [
  {
    id: '125',
    title: 'Claudeで職務経歴書を作る｜ChatGPTとの違い',
    url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-125.html'
  },
  {
    id: '126',
    title: 'Geminiで面接対策｜動画分析で表情まで改善',
    url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-126.html'
  },
  {
    id: '127',
    title: 'NotebookLMで業界研究｜PDF・動画を一括解析',
    url: 'https://www.tensyokudodesyo.com/knowhow/detail/knowhow-127.html'
  }
];

function buildText(post) {
  return `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${post.title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${post.url}\n\n#転職 #転職ノウハウ`;
}

function effectiveLength(text) {
  // URL を 23 文字換算（X の挙動）
  const urlPattern = /https?:\/\/\S+/g;
  let bare = text.replace(urlPattern, '___URL___');
  // ___URL___ は10文字、本来 23 文字なので +13 加算
  const urlCount = (text.match(urlPattern) || []).length;
  return bare.length + urlCount * 13;
}

(async () => {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  for (const post of POSTS) {
    const text = buildText(post);
    const len = effectiveLength(text);
    console.log(`\n--- #${post.id} (${len}字) ---`);
    console.log(text);
    if (len > 140) {
      console.error(`SKIP: over 140 chars (${len})`);
      continue;
    }
    try {
      const result = await client.v2.tweet(text);
      console.log(`OK: https://x.com/tensyokudodesyo/status/${result.data.id}`);
    } catch (e) {
      console.error(`ERROR #${post.id}:`, e.message || JSON.stringify(e));
      if (e.data) console.error('detail:', JSON.stringify(e.data));
    }
    await new Promise(r => setTimeout(r, 2000));
  }
})();
