import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NOTEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-186.webp",
    prompt: "A bright, modern flat-style illustration representing the video game industry as a career field. Show a cozy creative workspace with a game controller, a desktop monitor displaying colorful abstract game scenery, headphones, and small 3D character figurines on the desk. Use warm, friendly colors with green and orange accent tones. Soft natural lighting, clean minimalist composition, professional and inviting atmosphere.",
  },
  {
    out: "public_html/assets/knowhow-187.webp",
    prompt: "A clean, friendly flat-style illustration about tax filing and paperwork after changing jobs in Japan. Show a tidy desk with neatly stacked documents, a calculator, a magnifying glass, a coffee cup, and a laptop. Use a calm and organized atmosphere with warm cream background and green and orange accent colors. Soft lighting, professional and reassuring mood.",
  },
  {
    out: "public_html/assets/knowhow-188.webp",
    prompt: "A warm, encouraging flat-style illustration representing career advancement from temporary staffing to a permanent full-time position. Show an abstract upward path or staircase, a polished resume document on a desk, a pen, and a small potted plant symbolizing growth. Use warm cream background with green and orange accent colors. Clean minimalist composition, hopeful and positive atmosphere.",
  },
];

for (const job of jobs) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: job.prompt + NOTEXT }] }],
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
