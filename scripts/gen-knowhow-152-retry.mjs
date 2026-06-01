import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NOTEXT = "\n\nABSOLUTELY CRITICAL: The image must contain NO text of any kind. Do NOT draw any letters, words, numbers, headings, labels, logos, or written characters anywhere. Document lines must be drawn as plain abstract horizontal lines only — never as readable words. If you are about to render text, render a blank line instead.";

const prompt =
  "A clean, modern flat-style illustration about preparing a resume for a job change. A wooden desk seen from above with a blank document showing only abstract horizontal lines (absolutely no readable words), a green ballpoint pen, a small potted plant, and a cup of coffee. Warm cream background with soft green accents. Calm, professional, encouraging mood. Minimalist Japanese business illustration style.";

const out = "public_html/assets/knowhow-152.webp";

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt + NOTEXT }] }],
  generationConfig: { responseModalities: ["image", "text"] },
});
const imagePart = result.response.candidates[0].content.parts.find((p) => p.inlineData);
if (!imagePart) throw new Error("No image generated");
const buf = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(out);
console.log("OK:", out, Math.round(fs.statSync(out).size / 1024) + "KB");
