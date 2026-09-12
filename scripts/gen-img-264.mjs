import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any documents, screens, charts, contracts, or panels must contain only abstract shapes and blank ruled lines, never readable characters, labels, or digits.`;
const jobs = [
  { out: "public_html/assets/knowhow-264.webp", prompt: `A warm, flat-design illustration for a Japanese career advice blog article about the relationship between changing jobs and taking out a home mortgage. In the center, a simple modern house with a soft green roof and a small front door sits on a gentle grassy mound. To the left of the house stands a young office worker in a light green shirt holding a slim briefcase, looking toward the house with a hopeful expression. Between the person and the house lies a short wooden footbridge over a small gap, symbolizing the timing between a career move and a housing purchase. Above, a few blank rounded document sheets and a small blank key float lightly in the air, all unmarked. A soft stack of blank coins sits near the house base. Absolutely no signboards, no contracts with writing, no bank logos, no numbers. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a warm orange accents). Calm, reassuring, planning-ahead mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT },
];
for (const job of jobs) { let done=false; for (let attempt=1; attempt<=4 && !done; attempt++) { try {
  if (fs.existsSync(job.out)) { console.log("SKIP (exists):", job.out); break; }
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: job.prompt }] }], generationConfig: { responseModalities: ["image", "text"] } });
  const parts = result.response.candidates[0].content.parts;
  const imagePart = parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("No image for " + job.out + ": " + parts.map(p => p.text || "").join(" ").slice(0, 300));
  await sharp(Buffer.from(imagePart.inlineData.data, "base64")).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
  console.log("OK:", job.out); done=true; } catch (e) { console.log(`attempt ${attempt} failed:`, e.message.slice(0,120)); if (attempt===4) throw e; } }
}
