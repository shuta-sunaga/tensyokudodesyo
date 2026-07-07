import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("GEMINI_API_KEY not set"); process.exit(1); }
const genAI = new GoogleGenerativeAI(KEY);

const NOTEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const OUT = "public_html/assets";

const jobs = [
  {
    file: "knowhow-207.webp",
    prompt: "A modern, optimistic flat-illustration style image representing a person using AI assistants for a job change journey. A person at a desk having a friendly conversation with several glowing abstract AI assistant orbs floating around a laptop, each orb a different soft color, connected by gentle light lines to icons of a resume document, a briefcase, a speech bubble and a magnifying glass, warm and hopeful mood, soft green and cream color palette, clean composition."
  }
];

async function gen(job) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: job.prompt + NOTEXT }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const response = result.response;
  const part = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("No image generated for " + job.file);
  const buf = Buffer.from(part.inlineData.data, "base64");
  const outPath = path.join(OUT, job.file);
  await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outPath);
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`OK ${job.file} (${kb} KB)`);
}

for (const job of jobs) {
  try { await gen(job); }
  catch (e) { console.error(`FAIL ${job.file}: ${e.message}`); process.exit(1); }
}
