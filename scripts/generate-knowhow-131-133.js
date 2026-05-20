const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT_INSTRUCTION = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const images = [
    {
        id: 131,
        prompt: "A modern, professional Japanese business scene illustration depicting a confident young professional in business attire sitting at a clean desk, calmly reviewing documents during a salary negotiation. Soft natural lighting, warm color palette with greens and oranges, minimalist Japanese design aesthetic, subtle AI/technology elements like glowing data visualization in the background, friendly and trustworthy atmosphere. Flat illustration style, high quality."
    },
    {
        id: 132,
        prompt: "A modern, professional illustration of a Japanese person practicing for an English job interview at home with a laptop showing a video call interface. Soft natural lighting, warm color palette, minimalist Japanese design aesthetic, subtle international/global elements like world map silhouettes or globe in soft background, confident and aspirational atmosphere. Flat illustration style, high quality, no text or logos."
    },
    {
        id: 133,
        prompt: "A modern, professional illustration depicting the concept of refining and editing a document on a desk. Show hands holding a pen reviewing printed pages with subtle highlights, alongside a laptop displaying an abstract document. Soft natural lighting, warm color palette with greens and oranges, minimalist Japanese design aesthetic, conveying the idea of human touch refining AI-generated content. Flat illustration style, high quality."
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
