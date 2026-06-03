import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const jobs = [
  {
    out: "public_html/assets/knowhow-158.webp",
    prompt: "A warm, friendly flat-style illustration of a person sitting at a desk writing a job application document on a laptop, with a glowing AI assistant icon helping beside them. Soft green and cream color palette. Calm, hopeful atmosphere of career change. Modern minimal vector illustration style."
  },
  {
    out: "public_html/assets/knowhow-159.webp",
    prompt: "A warm, friendly flat-style illustration of a person thoughtfully choosing a direction at a crossroads, with a balance scale and a glowing AI assistant guiding them. Soft green and cream color palette. Theme of deciding career priorities and values. Modern minimal vector illustration style."
  },
  {
    out: "public_html/assets/knowhow-160.webp",
    prompt: "A warm, friendly flat-style illustration of a person researching a company using a laptop and a magnifying glass, with charts, buildings, and a glowing AI assistant analyzing data beside them. Soft green and cream color palette. Theme of deep company research for a job interview. Modern minimal vector illustration style."
  }
];

const NOTEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

async function gen({ out, prompt }) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt + NOTEXT }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const part = result.response.candidates[0].content.parts.find(p => p.inlineData);
  if (!part) throw new Error("No image generated for " + out);
  const buf = Buffer.from(part.inlineData.data, "base64");
  await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(out);
  console.log("OK:", out);
}

for (const j of jobs) {
  try {
    await gen(j);
  } catch (e) {
    console.error("FAIL:", j.out, e.message);
  }
}
