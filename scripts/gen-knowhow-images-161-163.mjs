import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-161.webp",
    prompt: "A clean, modern flat-style illustration representing job application skills. A tidy desk viewed from above with a laptop showing colorful bar and pie charts, a stack of neat documents, a pen, a coffee cup, and small icons suggesting language and certification. Soft warm cream background, professional and friendly tone, green and orange accent colors.",
  },
  {
    out: "public_html/assets/knowhow-162.webp",
    prompt: "A warm flat-style illustration of a businessperson at an office desk in the evening, working on a resume on a laptop while still employed, balancing current job and job-hunting. Calm, hopeful mood with soft lighting, a desk lamp, documents and a plant. Cream background, green and orange accent colors, no faces in close-up.",
  },
  {
    out: "public_html/assets/knowhow-163.webp",
    prompt: "A friendly flat-style illustration symbolizing a part-time worker transitioning to a full-time career. A cheerful retail or cafe worker with an apron, alongside upward arrows and a briefcase suggesting career growth toward a permanent position. Bright, encouraging mood, cream background, green and orange accent colors.",
  },
];

async function gen(model, prompt) {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt + NO_TEXT }] }],
    generationConfig: { responseModalities: ["image", "text"] },
  });
  const response = result.response;
  const imagePart = response.candidates[0].content.parts.find((p) => p.inlineData);
  if (!imagePart) throw new Error("No image generated");
  return Buffer.from(imagePart.inlineData.data, "base64");
}

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

for (const j of jobs) {
  try {
    const buf = await gen(model, j.prompt);
    await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(j.out);
    console.log("OK:", j.out);
  } catch (e) {
    console.error("FAIL:", j.out, e.message);
  }
}
