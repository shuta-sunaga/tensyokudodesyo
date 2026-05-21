const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT_INSTRUCTION = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const images = [
    {
        id: 134,
        prompt: "A modern, professional illustration depicting a peaceful home office setup in a Japanese home. A comfortable workspace with a laptop, ergonomic chair, plants, and warm natural light streaming through windows. Show subtle elements suggesting remote work freedom like a coffee cup, mountains visible from window suggesting countryside, or a cozy atmosphere. Warm color palette with greens and creams, minimalist Japanese design aesthetic, flat illustration style, high quality."
    },
    {
        id: 135,
        prompt: "A modern, professional illustration depicting professional networking and career building. Show a person at a clean desk with a laptop displaying an abstract professional profile interface, surrounded by subtle network connection lines or floating profile cards. Warm color palette with blues and creams suggesting professionalism, minimalist Japanese design aesthetic with subtle international elements like a globe or world map silhouette in the background. Flat illustration style, high quality."
    },
    {
        id: 136,
        prompt: "A modern, professional illustration of a working mother in Japan balancing career and family. Show a warm scene of a mother working from home or in a flexible workspace with children playing or studying nearby in the background. Soft natural lighting, warm color palette with peaches and creams, minimalist Japanese design aesthetic, conveying harmony between work and family life. Flat illustration style, high quality, no text or logos."
    }
];

async function generateImage(prompt, outputPath) {
    const fullPrompt = prompt + NO_TEXT_INSTRUCTION;
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
}

(async () => {
    for (const img of images) {
        const outputPath = path.join("public_html", "assets", `knowhow-${img.id}.webp`);
        try {
            console.log(`Generating image for article ${img.id}...`);
            await generateImage(img.prompt, outputPath);
            const stats = fs.statSync(outputPath);
            console.log(`  Done: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        } catch (e) {
            console.error(`  FAILED for ${img.id}:`, e.message);
        }
    }
})();
