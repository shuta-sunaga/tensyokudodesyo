import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const prompt = `A warm, friendly flat-design illustration for a Japanese career advice blog article about "what to do when you are about to be late for a job interview".
Scene: A young Japanese businessperson in a neat suit standing on a train station platform, looking slightly worried while making a polite phone call on a smartphone. In the background, a stopped commuter train and a large station clock showing urgency. Soft morning light.
Style: modern flat vector illustration, soft warm color palette with green (#5a9e6f) and orange (#e8a85a) accents, cream background, clean shapes, gentle and reassuring mood (not scary or stressful).
Aspect ratio 16:9, wide composition.

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. The station clock must have no numbers, only simple tick marks or plain hands.`;

async function main() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["image", "text"] },
  });

  const parts = result.response.candidates[0].content.parts;
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) throw new Error("No image generated");

  const buf = Buffer.from(imagePart.inlineData.data, "base64");
  await sharp(buf)
    .resize(1200, 675, { fit: "cover" })
    .webp({ quality: 85 })
    .toFile("public_html/assets/knowhow-235.webp");
  console.log("saved: public_html/assets/knowhow-235.webp");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
