import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NOTEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-152.webp",
    prompt: "A clean, modern flat-style illustration representing writing a professional resume summary for a job change. A desk with a stylized document, a pen, and a coffee cup, in warm cream and soft green tones. Calm, professional, encouraging atmosphere. Minimalist Japanese business style.",
  },
  {
    out: "public_html/assets/knowhow-153.webp",
    prompt: "A clean, modern flat-style illustration representing the trading company (sosha) industry: global trade and business. Cargo ships, shipping containers, a globe, and abstract trade flow arrows connecting continents, in warm cream, soft green and orange tones. Professional, dynamic, optimistic atmosphere. Minimalist Japanese business style.",
  },
  {
    out: "public_html/assets/knowhow-154.webp",
    prompt: "A clean, modern flat-style illustration representing a job interview salary negotiation. Two people facing each other across a table with stylized speech bubbles and abstract upward-trending coins/graph elements, in warm cream and soft green tones. Calm, balanced, professional atmosphere. Minimalist Japanese business style.",
  },
];

async function generateImage(prompt, outputPath) {
  const fullPrompt = prompt + NOTEXT;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ["image", "text"] },
  });
  const response = result.response;
  const imagePart = response.candidates[0].content.parts.find((p) => p.inlineData);
  if (!imagePart) throw new Error("No image generated");
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outputPath);
  const stat = fs.statSync(outputPath);
  console.log("OK:", outputPath, Math.round(stat.size / 1024) + "KB");
}

for (const job of jobs) {
  try {
    await generateImage(job.prompt, job.out);
  } catch (e) {
    console.error("FAIL:", job.out, e.message);
  }
}
