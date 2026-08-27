import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about self-analysis by repeatedly asking why. A young professional sitting at a cozy desk, chin resting on hand, thoughtfully looking at an open notebook. Above the notebook floats a chain of five soft glowing speech-bubble shapes connected by a winding path, each bubble slightly smaller and deeper in color than the last, leading down to a small glowing seed or root shape at the bottom, symbolizing digging to the root cause. The bubbles are empty, purely graphic. A potted plant, a mug, and a pen on the desk. Large window with soft morning light. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Introspective, calm, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The graph panel must contain only abstract bars and lines, never readable characters; the speech bubbles and notebook must be blank, never containing question marks, digits, or letters.`;

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
    .toFile("public_html/assets/knowhow-245.webp");
console.log("OK: public_html/assets/knowhow-245.webp");
