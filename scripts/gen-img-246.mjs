import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about the end of a job interview, when the interviewer asks if the candidate has any questions. Scene: a bright meeting room, a job candidate and an interviewer sitting across a wooden table facing each other. The interviewer has an open, inviting posture with palms up. The candidate is leaning slightly forward, hand raised gently as if about to ask something, with a confident, friendly smile. Above the candidate's head float a few soft abstract speech-bubble shapes and a glowing lightbulb, all empty with no characters inside. On the table: a closed notebook, a pen, two cups of tea. Large window with soft afternoon light, a potted plant in the corner. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, reassuring, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Speech bubbles must be completely empty, and the notebook must be closed with a plain cover.`;

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
    .toFile("public_html/assets/knowhow-246.webp");
console.log("OK: public_html/assets/knowhow-246.webp");
