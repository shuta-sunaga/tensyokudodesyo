const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT_INSTRUCTION = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const images = [
    {
        id: 137,
        prompt: "A modern, professional illustration depicting personality types and self-discovery for career change. Show nine abstract human silhouettes arranged in a circle, each in slightly different poses and colors representing diversity of personality. Center features a soft gradient sphere suggesting introspection and balance. Warm color palette with creams, soft greens, and gentle oranges. Minimalist Japanese design aesthetic, flat illustration style, high quality, abstract and symbolic, no text or letters."
    },
    {
        id: 138,
        prompt: "A modern, professional illustration of the Japanese hotel and tourism industry. Show an elegant hotel lobby or front desk scene with subtle Japanese architectural elements, a concierge area with warm lighting, and hints of international travel like a globe or suitcases. Include subtle elements suggesting hospitality and luxury such as flowers, modern interior design. Warm color palette with creams, soft greens, and gold accents. Minimalist Japanese design aesthetic, flat illustration style, high quality, no text or logos."
    },
    {
        id: 139,
        prompt: "A modern, professional illustration depicting an alumni or boomerang employee returning to a company. Show a figure walking back toward a stylized office building with subtle visual cues of welcome - open doors, warm light from windows, and a circular path or arrow suggesting return. Abstract human silhouettes in business attire visible inside the building windows. Warm color palette with creams, soft greens, and gentle blues. Minimalist Japanese design aesthetic, flat illustration style, high quality, no text or letters."
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
