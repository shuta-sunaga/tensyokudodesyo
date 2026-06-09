import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const NO_TEXT = "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. In particular do NOT draw the letters A or I or the word AI. The image must be purely visual with no textual elements whatsoever.";

const jobs = [
  {
    out: "public_html/assets/knowhow-170.webp",
    prompt: "A clean, modern flat-style illustration about studying and researching a new industry before a career change. A curious person at a desk with an open book and a laptop emitting a soft glowing orb of light (a friendly assistant, no letters), surrounded by abstract icons of a lightbulb, a map with location pins, gears, and a magnifying glass. Convey 'learning the basics of an unfamiliar field'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Curious, optimistic, studious mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-171.webp",
    prompt: "A clean, modern flat-style illustration about preparing for a job reference check. Two people connected by a speech-bubble conversation, with abstract icons of a checkmark badge, a document being reviewed, a telephone/headset, and a handshake suggesting trust and recommendation. Convey 'a trusted colleague vouching for you'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Reassuring, professional, trustworthy mood. Wide 16:9 composition.",
  },
  {
    out: "public_html/assets/knowhow-172.webp",
    prompt: "A clean, modern flat-style illustration about creating a resume by speaking using voice input and AI. A person talking into a smartphone with sound waves coming from a microphone icon, the words transforming into an organized document on a laptop screen, with a soft glowing assistant orb (no letters). Convey 'speak, then it becomes written text'. Warm soft palette with green (#5a9e6f) and orange (#e8a85a) accents on a cream background. Friendly, effortless, modern mood. Wide 16:9 composition.",
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
    await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
    console.log("OK:", job.out, fs.statSync(job.out).size, "bytes");
  } catch (e) {
    console.error("FAIL:", job.out, e.message);
  }
}
