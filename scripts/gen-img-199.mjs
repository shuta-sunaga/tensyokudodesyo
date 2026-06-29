import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A clean, modern flat-illustration style image representing a professional creative portfolio for a job change. Show an open laptop and a tablet displaying abstract colorful design layouts, wireframe shapes, charts and grid panels arranged neatly on a desk, with stylized geometric shapes, a coffee cup, and design tools like a pen and ruler around it. Warm and friendly color palette with soft greens, oranges and cream tones. Soft natural lighting, gentle shadows, professional and approachable mood suitable for a Japanese career-advice blog thumbnail.

Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.`;

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
});
const part = result.response.candidates[0].content.parts.find(p => p.inlineData);
if (!part) throw new Error("No image generated");
const buf = Buffer.from(part.inlineData.data, "base64");
await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile("public_html/assets/knowhow-199.webp");
console.log("OK: public_html/assets/knowhow-199.webp");
