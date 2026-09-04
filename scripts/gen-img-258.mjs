import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any documents, screens, charts, or panels must contain only abstract shapes and blank lines, never readable characters, labels, or digits.`;
const jobs = [
  { out: "public_html/assets/knowhow-258.webp", prompt: `A warm, flat-design illustration for a Japanese career advice blog article about industries where job openings are growing in the second half of the year: AI data centers, defense manufacturing, and semiconductors. A confident job seeker in a neat shirt stands at the center holding a folder, looking toward three stylized scenes arranged left to right: on the left, a modern data center building with rows of glowing server racks and a small cooling tower; in the middle, a precision factory floor with a robotic arm and a technician in a helmet inspecting a metal component; on the right, a clean semiconductor fab with a round silicon wafer held up in gloved hands under soft light. A gentle upward-curving path connects the three scenes, with small green sprouts and arrows along it suggesting growth. Autumn touches: a few orange ginkgo leaves drifting. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Hopeful, forward-looking, industrious mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT },
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
