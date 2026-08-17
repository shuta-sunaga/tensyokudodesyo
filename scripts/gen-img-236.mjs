import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about what to do when you have no certifications or licenses to write on your resume. A young professional sitting at a cozy wooden desk, holding a pen thoughtfully above a blank sheet of paper (a resume-like document with only faint horizontal ruled lines and blank rectangular boxes, no writing at all). Instead of worry, the person has a calm, hopeful expression. Beside them, a small stack of study books, a laptop, and a mug of tea suggest ongoing learning. Above the desk, a few soft glowing abstract shapes float upward like gentle sparks, symbolizing potential and hidden strengths. A potted plant and a window with soft morning light in the background. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, encouraging, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The paper on the desk must show only blank boxes and faint ruled lines, never readable characters.`;

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
});

const parts = result.response.candidates[0].content.parts;
const imagePart = parts.find(p => p.inlineData);
if (!imagePart) throw new Error("No image generated: " + JSON.stringify(parts.map(p => p.text || "").join(" ").slice(0, 300)));

const buf = Buffer.from(imagePart.inlineData.data, "base64");
await sharp(buf)
    .resize(1200, 675, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile("public_html/assets/knowhow-236.webp");
console.log("OK: public_html/assets/knowhow-236.webp");
