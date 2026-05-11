import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const articles = [
    {
        id: 110,
        prompt: "A modern editorial-style illustration of a desk with a Japanese resume document, a red highlighter pen lying nearby, crumpled draft papers in the background, soft warm cream background, calm green plant accent. Conveys the idea of revising and improving a written application. Clean minimalist style. No text on the resume."
    },
    {
        id: 111,
        prompt: "A modern flat illustration showing colorful abstract puzzle pieces of different shapes coming together, representing personal strengths and self-discovery. Soft cream and sage green palette, warm minimalist composition, conceptual visualization of inner talents being revealed. Editorial style. No text or letters."
    },
    {
        id: 112,
        prompt: "A modern Japanese executive boardroom scene from a wide angle, polished long wooden table with elegant chairs facing each other, soft natural daylight from tall windows, a glass of water and notebook on the table, calm and dignified corporate atmosphere suggesting a final-stage executive interview. No people visible. No text or signage. Editorial photography style with subtle green accent."
    }
];

async function generateImage(prompt, outputPath) {
    const fullPrompt = prompt + "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });

    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated");

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(imageBuffer)
        .resize(1200, 675, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`OK ${path.basename(outputPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
}

(async () => {
    for (const article of articles) {
        const id = String(article.id).padStart(3, "0");
        const out = `public_html/assets/knowhow-${id}.webp`;
        try {
            console.log(`Generating knowhow-${id}.webp ...`);
            await generateImage(article.prompt, out);
        } catch (e) {
            console.error(`FAIL knowhow-${id}.webp:`, e.message);
            process.exitCode = 1;
        }
    }
})();
