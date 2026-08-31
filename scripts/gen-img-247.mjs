import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about how to fill in the health condition field of a resume. A young professional sitting at a cozy desk, calmly writing on a blank paper document with a pen, looking healthy and confident. Beside the document, a soft glowing green heart shape with a gentle pulse-line motif rendered as a purely abstract zigzag (no readable characters), symbolizing good health. A small stethoscope resting loosely on the desk corner and a cup of herbal tea, suggesting health checkups handled with ease. A potted plant and soft round shapes in the background. Large window with soft morning light. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, reassuring, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The paper document must be blank or contain only abstract horizontal lines, never readable characters.`;

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
    .toFile("public_html/assets/knowhow-247.webp");
console.log("OK: public_html/assets/knowhow-247.webp");
