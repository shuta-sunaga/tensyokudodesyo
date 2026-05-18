// 一回限りの画像生成スクリプト (#125, #126, #127)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const TASKS = [
  {
    id: "125",
    prompt: "A warm, professional illustration of a Japanese business person sitting at a wooden desk, working on a laptop to refine their resume document. Soft afternoon light from a window. A printed document lies next to the laptop. The atmosphere conveys careful craftsmanship and the elegance of polished writing. Modern flat illustration style, warm cream and soft green color palette. No text whatsoever."
  },
  {
    id: "126",
    prompt: "A warm illustration showing a Japanese business person sitting in front of a laptop computer, practicing for a job interview via a video call interface. The screen shows a multimodal AI assistant analyzing the person's posture and facial expressions, depicted with subtle glowing accent rings around the face area. Calm home office environment, soft natural lighting. Modern flat illustration style, warm cream and soft green color palette with gentle blue accents for the digital elements. No text whatsoever."
  },
  {
    id: "127",
    prompt: "A warm illustration of a Japanese business person at a desk surrounded by stacks of printed industry reports, PDF documents, and a laptop displaying an analytical research workspace. Soft glowing connection lines suggest AI consolidating multiple sources into insight. Library-like atmosphere with subtle warmth, wooden desk, soft natural light. Modern flat illustration style, warm cream and soft green color palette with subtle gold accents. No text whatsoever."
  }
];

async function generateOne(genAI, task) {
  const fullPrompt = task.prompt + NO_TEXT;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const response = result.response;
  const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!imagePart) throw new Error(`No image generated for #${task.id}`);
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  const outputPath = path.join("public_html/assets", `knowhow-${task.id}.webp`);
  await sharp(imageBuffer)
    .resize(1200, 675, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile(outputPath);
  return outputPath;
}

(async () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  for (const task of TASKS) {
    try {
      console.log(`[#${task.id}] generating...`);
      const out = await generateOne(genAI, task);
      const stat = fs.statSync(out);
      console.log(`[#${task.id}] OK -> ${out} (${(stat.size/1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`[#${task.id}] ERROR:`, e.message);
    }
  }
})();
