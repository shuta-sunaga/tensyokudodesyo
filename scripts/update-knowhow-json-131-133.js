const fs = require("fs");

const jsonPath = "public_html/data/knowhow.json";
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const newArticles = [
    {
        id: 133,
        title: "AIっぽさを消す職務経歴書｜自然な文章に直すコツ",
        category: "kh02",
        excerpt: "ChatGPTやClaudeで作った職務経歴書のAIっぽさを消す手直し術を解説。バレやすい言い回しの修正、AI検出ツールの使い方、人間らしい温度感の出し方まで具体的な書き換え例付きで紹介します。",
        image: "/assets/knowhow-133.webp",
        postDate: "2026-05-20",
        detailUrl: "/knowhow/detail/knowhow-133.html"
    },
    {
        id: 132,
        title: "AIで英語面接対策｜外資転職のスピーキング術",
        category: "kh01",
        excerpt: "外資系・グローバル企業の英語面接対策にAIを活用する方法を解説。ChatGPT Voiceでスピーキング練習、Claudeで回答精度のチェック、Geminiで発音改善まで実例とプロンプト付きで紹介します。",
        image: "/assets/knowhow-132.webp",
        postDate: "2026-05-20",
        detailUrl: "/knowhow/detail/knowhow-132.html"
    },
    {
        id: 131,
        title: "AIで給与交渉｜オファー額を上げる準備術",
        category: "kh05",
        excerpt: "AIを使って給与交渉を有利に進める準備術を解説。Perplexityで相場調査、Claudeで市場価値の言語化、ChatGPTで交渉スクリプト作成、ロールプレイで本番想定まで実例付きで紹介します。",
        image: "/assets/knowhow-131.webp",
        postDate: "2026-05-20",
        detailUrl: "/knowhow/detail/knowhow-131.html"
    }
];

data.articles = [...newArticles, ...data.articles];
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
console.log(`Added 3 articles. Total: ${data.articles.length}`);
