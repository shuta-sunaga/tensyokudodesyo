import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("GEMINI_API_KEY not set"); process.exit(1); }

const genAI = new GoogleGenerativeAI(apiKey);

const prompt = `A warm, friendly flat-illustration style image representing declining a job interview politely via email and phone. Show a calm Japanese person at a desk with a laptop and smartphone, thoughtfully composing a message, with soft office-plant and paper envelope motifs. Warm cream and soft green color palette, gentle and professional atmosphere, clean modern editorial illustration.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.`;

const outputPath = "public_html/assets/knowhow-204.webp";

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
});

const response = result.response;
const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
if (!imagePart) { console.error("No image generated"); process.exit(1); }

const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outputPath);
console.log("Image saved:", outputPath, fs.statSync(outputPath).size, "bytes");
