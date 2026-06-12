import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const targets = [
  {
    out: "public_html/assets/knowhow-177.webp",
    prompt: "A warm, friendly flat-design illustration for a Japanese career blog article about writing farewell and thank-you emails when leaving a job. A Japanese businessperson in their 30s sits at a tidy desk, typing a heartfelt message on a laptop. Floating envelope icons and a gentle paper-plane motif suggest sending greetings to colleagues. Soft green and warm orange color palette, cream background, clean modern vector style, 16:9 composition."
  },
  {
    out: "public_html/assets/knowhow-178.webp",
    prompt: "A clean flat-design illustration for a Japanese career blog article about proofreading job application documents before submission. A large magnifying glass hovers over neatly stacked resume documents on a desk, with subtle check marks floating nearby and a laptop in the background. A calm, focused atmosphere. Soft green and warm orange color palette, cream background, modern vector style, 16:9 composition."
  },
  {
    out: "public_html/assets/knowhow-179.webp",
    prompt: "A cozy flat-design illustration for a Japanese career blog article about setting up an AI assistant as a personal career advisor. A Japanese person in casual office wear sits in a comfortable chair at home in the evening, having a relaxed conversation with a friendly glowing AI assistant orb floating above a laptop, with empty speech bubbles between them. Soft green and warm orange color palette, cream background, modern vector style, 16:9 composition."
  }
];

async function generateImage(prompt, outputPath) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt + NO_TEXT }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const imagePart = result.response.candidates[0].content.parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("No image generated for " + outputPath);
  const buf = Buffer.from(imagePart.inlineData.data, "base64");
  await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outputPath);
  console.log("OK:", outputPath);
}

for (const t of targets) {
  await generateImage(t.prompt, t.out);
}
