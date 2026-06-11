import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TEXT_BAN = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-174.webp",
    prompt: "A warm, modern flat-style illustration representing job interview preparation with AI assistance. A calm Japanese person sitting at a desk practicing for an interview, talking with a friendly AI chat assistant shown as a glowing speech bubble on a laptop screen. Soft natural lighting, cream and green color palette, professional and reassuring atmosphere, clean minimal vector illustration."
  },
  {
    out: "public_html/assets/knowhow-175.webp",
    prompt: "A clean, modern flat-style illustration representing industry research using an AI assistant connected to web search. A person at a desk reviewing charts, graphs, and a magnifying glass over a market trend dashboard on a laptop, with abstract data visualizations and connection lines suggesting search results. Soft cream and green color palette, professional analytical mood, minimal vector illustration."
  },
  {
    out: "public_html/assets/knowhow-176.webp",
    prompt: "A warm, modern flat-style illustration representing writing a resume / work history document with the help of an AI assistant inside an online document editor. A person typing on a laptop with a clean document and an AI helper sparkle icon assisting, alongside a spreadsheet with bar charts. Soft cream and green color palette, organized and productive atmosphere, clean minimal vector illustration."
  }
];

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

for (const job of jobs) {
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: job.prompt + TEXT_BAN }] }],
      generationConfig: { responseModalities: ["image", "text"] }
    });
    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated");
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
    console.log("OK: " + job.out);
  } catch (e) {
    console.error("FAIL: " + job.out + " -> " + e.message);
  }
}
