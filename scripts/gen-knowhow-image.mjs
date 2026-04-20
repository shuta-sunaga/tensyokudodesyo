import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const [,, idArg, ...promptParts] = process.argv;
if (!idArg || promptParts.length === 0) {
    console.error("Usage: node gen-knowhow-image.mjs <NNN> <prompt>");
    process.exit(1);
}

const id = String(idArg).padStart(3, "0");
const prompt = promptParts.join(" ");
const outDir = path.resolve("public_html/assets");
const outPath = path.join(outDir, `knowhow-${id}.webp`);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const fullPrompt = prompt + "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
});

const response = result.response;
const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
if (!imagePart) {
    console.error("No image generated");
    process.exit(1);
}

const buf = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outPath);
console.log(`OK: ${outPath}`);
