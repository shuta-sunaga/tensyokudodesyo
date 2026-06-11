import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const TEXT_BAN = "\n\nABSOLUTELY CRITICAL: The image must contain ZERO text. Do NOT include any text, letters, alphabets, numbers, words, captions, labels, buttons with words, logos, watermarks, or any written or typographic characters anywhere in the image, including on screens, badges, or UI elements. Use only abstract shapes, icons, lines, and dots to suggest interface elements. Purely visual, no typography at all.";

const prompt = "A clean, modern flat-style illustration representing industry and market research. A person at a desk studying abstract charts: a pie chart, a rising line graph, and bar graphs floating around a laptop, with a large magnifying glass over the data and thin connecting dotted lines suggesting linked information sources. Use blank placeholder rectangles instead of any text. Soft cream and sage green color palette, professional analytical mood, clean minimal vector illustration, no words.";

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt + TEXT_BAN }] }],
  generationConfig: { responseModalities: ["image", "text"] }
});
const imagePart = result.response.candidates[0].content.parts.find(p => p.inlineData);
if (!imagePart) throw new Error("No image generated");
const buf = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile("public_html/assets/knowhow-175.webp");
console.log("OK: knowhow-175.webp regenerated");
