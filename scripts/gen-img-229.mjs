import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, flat-design illustration for a Japanese career advice blog article about the chemical industry and AI-powered industry research. On the left side, a friendly modern chemical plant scene: rounded storage tanks, distillation towers, connected pipes, and a few glass laboratory flasks and beakers with soft green and blue liquid, plus abstract molecule diagrams (circles connected by lines) floating above. On the right side, a young professional person sitting at a desk with a laptop, and a friendly floating robot assistant beside them projecting a holographic panel with abstract bar charts and a magnifying glass, symbolizing AI research. Soft arrows connect the plant scene to the laptop, suggesting analysis. A few leaves and sparkles float around. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents, soft blue highlights). Hopeful, analytical, calm mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The charts, panels, and molecule diagrams must contain only abstract shapes, never readable characters or labels.`;

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
    .toFile("public_html/assets/knowhow-229.webp");
console.log("OK: public_html/assets/knowhow-229.webp");
