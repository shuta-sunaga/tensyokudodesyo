import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about commute time on a resume and relocating for a new job. A young professional standing at a cozy desk at home, writing on a blank document sheet with a pen. Beside the desk, a large window shows a gentle cityscape with a small train running along a curved rail line and a tiny house on one side and an office building on the other, connected by a soft dotted path, suggesting the journey from home to workplace. A round wall clock with plain hands (no numerals) hangs on the wall. Near the desk sits a cardboard moving box with a small potted plant on top, hinting at an upcoming relocation. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, hopeful, fresh-start mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The document sheet must be blank or contain only abstract lines, the clock face must have no numerals, and no signage or labels may appear anywhere.`;

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
    .toFile("public_html/assets/knowhow-239.webp");
console.log("OK: public_html/assets/knowhow-239.webp");
