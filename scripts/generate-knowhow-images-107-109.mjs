import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NO_TEXT_INSTRUCTION = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const articles = [
    {
        id: 107,
        prompt: "A modern, soft-pastel illustration symbolizing a prompt engineer's work: an abstract human silhouette in soft warm green and orange tones, communicating with a glowing AI brain through flowing geometric light streams. Minimalist style with cream background, gentle gradients, professional and futuristic atmosphere. Editorial blog header style.",
    },
    {
        id: 108,
        prompt: "A warm, inviting illustration of a person practicing for a job interview with an AI chatbot. Soft pastel colors with cream and warm green accents. The person is depicted as a stylized silhouette sitting at a desk with a glowing screen showing abstract conversation bubbles. Cozy minimalist style, professional editorial blog header.",
    },
    {
        id: 109,
        prompt: "A clean, modern illustration of AI-powered company research. An abstract magnifying glass made of soft glowing light examining floating geometric shapes representing data and documents. Cream and warm orange background with subtle green accents. Minimalist editorial style, soft pastel tones, professional and futuristic feel.",
    }
];

async function generateImage(article) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const fullPrompt = article.prompt + NO_TEXT_INSTRUCTION;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });

    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error(`No image generated for #${article.id}`);

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const outputPath = path.join(__dirname, "..", "public_html", "assets", `knowhow-${String(article.id).padStart(3, "0")}.webp`);

    await sharp(imageBuffer)
        .resize(1200, 675, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`OK #${article.id}: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function main() {
    for (const article of articles) {
        try {
            await generateImage(article);
        } catch (e) {
            console.error(`FAILED #${article.id}: ${e.message}`);
            process.exitCode = 1;
        }
    }
}

main();
