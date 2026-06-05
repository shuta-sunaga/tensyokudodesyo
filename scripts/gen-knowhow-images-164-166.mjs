import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-164.webp",
    prompt: "A clean, modern flat-style illustration representing self-analysis and career strategy. A person thoughtfully organizing ideas into a 2x2 four-quadrant grid layout (without any labels), with abstract icons like a magnifying glass, lightbulb, arrows pointing in four directions, and gears. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Professional, calm, optimistic mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-165.webp",
    prompt: "A clean, modern flat-style illustration representing administrative procedures for pension and social insurance when changing jobs in Japan. Abstract imagery of documents, a calendar, a piggy bank, a shield protecting savings, and a smooth transition arrow between two office buildings. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Reassuring, organized, trustworthy mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-166.webp",
    prompt: "A clean, modern flat-style illustration of a job interview preparation checklist scene. A neatly arranged business bag with items laid out beside it: a folder of documents, a pen, a smartphone, a folding umbrella, and a power bank, plus a laptop for online interviews. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Tidy, prepared, confident mood. Wide 16:9 composition.",
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
    await sharp(imageBuffer)
      .resize(1200, 675, { fit: "cover" })
      .webp({ quality: 85 })
      .toFile(job.out);
    console.log("OK:", job.out, fs.statSync(job.out).size, "bytes");
  } catch (e) {
    console.error("FAIL:", job.out, e.message);
  }
}
