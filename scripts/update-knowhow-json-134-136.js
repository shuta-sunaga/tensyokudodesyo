const fs = require("fs");

const jsonPath = "public_html/data/knowhow.json";
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const newArticles = [
    {
        id: 136,
        title: "ワーママの転職活動｜両立可能な仕事の見つけ方",
        category: "kh05",
        excerpt: "ワーママの転職活動を解説。仕事と育児を両立できる職場の見極め方、職務経歴書の書き方、面接での子育てアピール、復職タイミング、両立可能な業界選びまで具体的に紹介します。",
        image: "/assets/knowhow-136.webp",
        postDate: "2026-05-21",
        detailUrl: "/knowhow/detail/knowhow-136.html"
    },
    {
        id: 135,
        title: "LinkedIn転職術｜プロフ最適化と運用",
        category: "kh02",
        excerpt: "LinkedInを使った転職術を解説。プロフィールの最適化、スカウトが届く設定、業界別ヘッドライン例文、運用のコツ、外資系・スタートアップ転職の活かし方まで具体的に紹介します。",
        image: "/assets/knowhow-135.webp",
        postDate: "2026-05-21",
        detailUrl: "/knowhow/detail/knowhow-135.html"
    },
    {
        id: 134,
        title: "フルリモート求人の探し方｜在宅転職の極意",
        category: "kh05",
        excerpt: "フルリモート求人の探し方を解説。専門求人サイト・タグ活用・募集要項の見抜き方・面接で確認すべきポイント・地方在住での応募戦略まで、在宅勤務で働きたい人に必要な情報を網羅します。",
        image: "/assets/knowhow-134.webp",
        postDate: "2026-05-21",
        detailUrl: "/knowhow/detail/knowhow-134.html"
    }
];

data.articles = [...newArticles, ...data.articles];
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
console.log(`Added 3 articles. Total: ${data.articles.length}`);
