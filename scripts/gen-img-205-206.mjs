import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("GEMINI_API_KEY not set"); process.exit(1); }
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const NOTEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-205.webp",
    prompt: "A warm, friendly flat-illustration representing organizing important documents after leaving a job. Show neatly arranged paper documents, an envelope, and a checklist folder on a desk with a soft office-plant motif, a calm Japanese person sorting papers. Warm cream and soft green color palette, gentle professional editorial illustration.",
  },
  {
    out: "public_html/assets/knowhow-206.webp",
    prompt: "A warm, friendly flat-illustration representing writing a job application, comparing two documents side by side. Show a person at a desk with two sheets of paper and a pen, thoughtful expression, subtle arrows and speech-bubble motifs suggesting contrast, laptop nearby. Warm cream and soft green color palette, clean modern editorial illustration.",
  },
];

for (const j of jobs) {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: j.prompt + NOTEXT }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const part = result.response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) { console.error("No image for", j.out); process.exit(1); }
  const buf = Buffer.from(part.inlineData.data, "base64");
  await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(j.out);
  console.log("Saved:", j.out, fs.statSync(j.out).size, "bytes");
}
