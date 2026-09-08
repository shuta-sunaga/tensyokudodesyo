import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any documents, screens, charts, or panels must contain only abstract shapes and blank lines, never readable characters, labels, or digits.`;
const jobs = [
  { out: "public_html/assets/knowhow-259.webp", prompt: `A warm, flat-design illustration for a Japanese career advice blog article about writing job-application documents that pass a stricter hiring bar. Scene: a calm hiring manager in a cardigan sits at a tidy desk, holding a sheet of paper (a resume drawn only with blank lines and a few small highlighted bars, no characters) up against a checklist board on an easel beside the desk; the checklist board shows a column of empty tick boxes with green check marks, and one row is being matched to a highlighted bar on the resume by a thin green connecting line. On the desk: a small rising bar chart made of abstract blocks, a magnifying glass, a cup of tea. In the soft background, a job seeker in a neat shirt stands with a folder, looking hopeful. Autumn touches: a small potted plant and a warm window light. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Precise, trustworthy, encouraging mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT },
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
