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
        id: 113,
        prompt: "A soft pastel rainbow arc curving across a calm horizon, with abstract silhouettes of a small tree, a house, and rolling hills below. Warm cream sky, sage green accents, peaceful editorial illustration evoking life stages and personal growth. Minimalist flat design, soft brush strokes, no people, no signs, no symbols."
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
