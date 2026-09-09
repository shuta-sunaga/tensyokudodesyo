import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any documents, screens, calendars, or panels must contain only abstract shapes and blank lines, never readable characters, labels, digits, currency symbols, or weekday abbreviations. The calendar must have no header row at all.`;
const jobs = [
  { out: "public_html/assets/knowhow-260.webp", prompt: `A warm, flat-design illustration for a Japanese career advice blog article about planning a job change so that you receive your winter bonus and start the new job in spring. Scene: a calm office worker in a cardigan sits at a tidy desk in soft winter light, looking at a large wall calendar drawn purely as a grid of empty squares (NO header row, NO weekday markings, NO symbols inside cells) with a few squares filled in soft green and one square marked with a small orange circle; a thin dotted arrow curves across the calendar from a snowflake-decorated square toward a square decorated with a small cherry blossom branch. On the desk: a small plain envelope, a cup of steaming tea, a pen, and a notebook with blank lines. Through the window behind, a bare winter tree gradually transitions into a blooming cherry tree on the right side. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Organized, hopeful, reassuring mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT },
];
for (const job of jobs) {
  if (fs.existsSync(job.out)) { console.log("SKIP (exists):", job.out); continue; }
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: job.prompt }] }], generationConfig: { responseModalities: ["image", "text"] } });
  const parts = result.response.candidates[0].content.parts;
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("No image for " + job.out + ": " + parts.map(p => p.text || "").join(" ").slice(0, 300));
  await sharp(Buffer.from(imagePart.inlineData.data, "base64")).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
  console.log("OK:", job.out);
}
