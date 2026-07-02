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
    file: "knowhow-202.webp",
    prompt: "A warm, friendly flat-illustration style image representing gathering feedback from others to understand oneself. In the center, one person sits thoughtfully; around them, several friendly people offer supportive speech bubbles and gentle gesturing, symbolizing collecting opinions and perspectives from friends, colleagues and family. Abstract mirror or reflection motif hinting at self-discovery through others' eyes. Reassuring, collaborative and hopeful mood, soft muted green and warm cream color palette, soft natural light."
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
  catch (e) { console.error(`FAIL ${job.file}: ${e.message}`); }
}
