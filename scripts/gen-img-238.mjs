import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about discovering one's character strengths through a personality assessment and using them in a job change. A young professional standing confidently in a bright, cozy room, holding up a glowing abstract gem or crystal in one hand, while around them float many soft, colorful abstract shapes (rounded gems, leaves, stars, hearts, shields, keys) in pastel colors, each representing a different inner strength. A few of the shapes are gathering into a small bright cluster near the person's chest, symbolizing "signature strengths". A large window with soft morning light, a potted plant, a small desk with a mug and a closed notebook. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, uplifting, introspective mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The notebook must be closed and blank, and none of the shapes may contain readable characters or symbols resembling letters.`;

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
    .toFile("public_html/assets/knowhow-238.webp");
console.log("OK: public_html/assets/knowhow-238.webp");
