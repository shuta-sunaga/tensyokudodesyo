const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
});

const posts = [
    {
        id: 131,
        title: "AIで給与交渉｜オファー額を上げる準備術",
    },
    {
        id: 132,
        title: "AIで英語面接対策｜外資転職のスピーキング術",
    },
    {
        id: 133,
        title: "AIっぽさを消す職務経歴書｜自然な文章に直すコツ",
    },
];

function buildText(title, url) {
    return `まいど！テンショくまやで！\n\n転職ノウハウブログを更新したから読んでみてや！\n今回のテーマは「${title}」や。\n\n感想ぜひ教えてな！拡散も頼むわ！\n${url}\n\n#転職 #転職ノウハウ`;
}

function visualLength(text) {
    // X counts URLs as 23 chars
    return text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length;
}

(async () => {
    for (const post of posts) {
        const url = `https://www.tensyokudodesyo.com/knowhow/detail/knowhow-${post.id}.html`;
        let text = buildText(post.title, url);
        const len = visualLength(text);
        console.log(`\n=== Post ${post.id} (visual length: ${len}) ===`);
        console.log(text);
        if (len > 280) {
            console.warn(`SKIPPED: too long (${len} > 280)`);
            continue;
        }
        try {
            const result = await client.v2.tweet(text);
            console.log(`✅ Posted: https://x.com/tensyokudodesyo/status/${result.data.id}`);
        } catch (e) {
            console.error(`❌ Failed for ${post.id}:`, e.message);
            if (e.data) console.error("  data:", JSON.stringify(e.data));
        }
        // 30 sec gap to avoid rate limit
        if (post !== posts[posts.length - 1]) await new Promise(r => setTimeout(r, 30000));
    }
})();
