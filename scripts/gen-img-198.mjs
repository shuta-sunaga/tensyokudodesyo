import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A clean, modern flat-style illustration representing salary negotiation success in a job change. Two professional people sitting across a desk in a bright office, having a friendly business discussion with documents and an upward trending arrow/graph suggesting income growth. Warm, optimistic color palette with soft greens and warm oranges. Professional and trustworthy mood. Minimalist vector illustration style.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.`;

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
});

const response = result.response;
const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
if (!imagePart) throw new Error("No image generated");

const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(imageBuffer)
    .resize(1200, 675, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile("public_html/assets/knowhow-198.webp");

console.log("画像生成完了: public_html/assets/knowhow-198.webp");
