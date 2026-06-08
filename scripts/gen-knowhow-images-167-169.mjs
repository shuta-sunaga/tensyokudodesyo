import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-167.webp",
    prompt: "A clean, modern flat-style illustration about using AI carefully and safely. A person at a laptop with a glowing AI assistant icon, surrounded by abstract caution symbols like a shield, a lock protecting documents, and a balance scale suggesting careful judgment. Convey 'use AI wisely, watch for pitfalls'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Calm, thoughtful, trustworthy mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-168.webp",
    prompt: "A clean, modern flat-style illustration about creating an ID photo with AI. A smartphone showing a neat portrait frame of a person in business attire, with abstract icons of a camera, sparkles suggesting AI enhancement, and a soft studio backdrop. Convey 'AI-generated professional headshot'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Clean, professional, friendly mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-169.webp",
    prompt: "A clean, modern flat-style illustration about planning the first 90 days at a new job. A person stepping forward along a path with three milestone markers, a calendar, a checklist, and a small AI assistant icon helping plan. Convey 'onboarding plan, steady progress, growth'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Optimistic, organized, forward-looking mood. Wide 16:9 composition.",
  },
];

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

for (const job of jobs) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: job.prompt + NO_TEXT }] }],
      generationConfig: { responseModalities: ["image", "text"] },
    });
    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find((p) => p.inlineData);
    if (!imagePart) throw new Error("No image generated");
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
    console.log("OK:", job.out, fs.statSync(job.out).size, "bytes");
  } catch (e) {
    console.error("FAIL:", job.out, e.message);
  }
}
