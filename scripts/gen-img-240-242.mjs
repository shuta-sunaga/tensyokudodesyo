import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const STYLE = `Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any screens, papers, or speech bubbles must contain only abstract shapes, lines, or blank space, never readable characters.`;

const jobs = {
  240: `A warm, flat-design illustration for a Japanese career advice blog article about using an AI assistant to discover and put into words one's own weaknesses during self-analysis for a job change. A young professional sits at a cozy desk facing a laptop; from the laptop floats a friendly glowing chat bubble made of abstract wavy lines. Beside the person, a hand mirror reflects a slightly different silhouette of the same person, symbolizing seeing a hidden side of oneself. Several small puzzle pieces drift from the mirror toward the person's hands and click together. A notebook, a mug, and a potted plant on the desk. Large window with soft morning light. ${STYLE}`,
  241: `A warm, flat-design illustration for a Japanese career advice blog article about using an AI assistant to create a business handover document before leaving a company. Two professionals at an office desk: one person handing a neatly organized binder with colored tabs to a colleague who receives it with both hands. Between them a tablet shows an abstract document layout of blank rectangles and lines, with a small friendly glowing AI orb hovering above it and projecting a few floating abstract checklist boxes (empty squares with check-mark shapes only). A small cardboard box with a plant and a mug on the edge of the desk hints at moving on. Bright office window in the background. ${STYLE}`,
  242: `A warm, flat-design illustration for a Japanese career advice blog article about using an AI assistant to polish a one-minute self-introduction for a job interview. A young professional stands confidently in front of a mirror practicing speaking, one hand on chest, with abstract sound-wave lines flowing from the mouth. Next to the mirror, a smartphone on a small stand shows a friendly glowing AI orb and abstract sound-wave patterns, with a round stopwatch icon (blank face, no numerals) floating nearby. In the soft background, a faint silhouette of an interview table with two chairs. A potted plant and soft round shapes complete the scene. ${STYLE}`,
};

const id = process.argv[2];
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: jobs[id] }] }],
  generationConfig: { responseModalities: ["image", "text"] }
});
const parts = result.response.candidates[0].content.parts;
const imagePart = parts.find(p => p.inlineData);
if (!imagePart) throw new Error("No image generated: " + parts.map(p => p.text || "").join(" ").slice(0, 300));
await sharp(Buffer.from(imagePart.inlineData.data, "base64"))
  .resize(1200, 675, { fit: "cover" }).webp({ quality: 85 })
  .toFile(`public_html/assets/knowhow-${id}.webp`);
console.log(`OK: public_html/assets/knowhow-${id}.webp`);
