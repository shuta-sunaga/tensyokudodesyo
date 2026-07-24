import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A clean, modern flat-illustration style header image for a career-change blog article about using an AI assistant to research companies through real-time social media voices.
Depict abstract concepts of gathering real people's opinions and conversations: floating speech-bubble shapes, connected network nodes, a magnifying glass over a stylized company building, and subtle data/graph motifs flowing into a friendly AI orb.
Use a warm, trustworthy color palette centered on soft green (#5a9e6f) and warm orange (#e8a85a) accents on a light cream background (#faf8f0).
Soft rounded shapes, gentle gradients, professional yet approachable, plenty of negative space, wide 16:9 composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.`;

async function main() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] }
  });
  const response = result.response;
  const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
  if (!imagePart) throw new Error("No image generated");
  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
  await sharp(imageBuffer)
    .resize(1200, 675, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile("public_html/assets/knowhow-224.webp");
  console.log("OK: public_html/assets/knowhow-224.webp");
}

main().catch(e => { console.error("ERR:", e.message); process.exit(1); });
