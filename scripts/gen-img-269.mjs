import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any documents, screens, signs, labels, clipboards or papers must contain only abstract grey lines and blank checkbox squares, never readable characters or digits.`;
const jobs = [
  { out: "public_html/assets/knowhow-269.webp", prompt: `A warm, flat-design illustration for a Japanese career advice blog article about job interviews at a manufacturing company. Composition: a bright, clean meeting room inside a modern Japanese factory. On the right, two interviewers sit behind a simple table: a Japanese man in his fifties wearing a light grey factory work uniform and cap (the plant manager), and a Japanese woman in her thirties in a navy business suit (HR), both listening attentively with friendly expressions, one holding a clipboard showing only abstract grey lines. On the left, a Japanese man in his late twenties in a dark suit sits upright on a chair, speaking calmly with a confident, sincere expression, hands resting on his knees. Through a large window behind them, a soft-focus view of a tidy factory floor with a machine, conveyor and neatly stacked boxes. Calm, respectful, hopeful mood. Color palette: warm cream background, navy (#1B2430) and orange (#F5820D) accents, soft grey. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT },
];
for (const job of jobs) { let done=false; for (let attempt=1; attempt<=4 && !done; attempt++) { try {
  if (fs.existsSync(job.out)) { console.log("SKIP (exists):", job.out); break; }
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: job.prompt }] }], generationConfig: { responseModalities: ["image", "text"] } });
  const parts = result.response.candidates[0].content.parts;
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("No image for " + job.out + ": " + parts.map(p => p.text || "").join(" ").slice(0, 300));
  await sharp(Buffer.from(imagePart.inlineData.data, "base64")).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
  console.log("OK:", job.out); done=true; } catch (e) { console.log(`attempt ${attempt} failed:`, e.message.slice(0,120)); if (attempt===4) throw e; } }
}
