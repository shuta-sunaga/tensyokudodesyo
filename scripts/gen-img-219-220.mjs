import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any papers, screens, calendars, or labels must be blank or abstract without any characters.`;

const jobs = [
    {
        out: "public_html/assets/knowhow-219.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about recovering after failing several job interviews and getting back on track. A young professional person sitting at a desk thoughtfully reviewing blank notes, with a gentle upward staircase or rising path motif in the background symbolizing renewed hope and step-by-step improvement, a small supportive sun or light above. Encouraging, resilient, hopeful mood — setback turning into growth. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    },
    {
        out: "public_html/assets/knowhow-220.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about working in the human resources and recruitment industry. A scene of a friendly consultant at a desk connecting people and companies: on one side a job seeker, on the other side an abstract office building, with connecting lines or a handshake motif in the middle symbolizing matching people with jobs. Professional, supportive, optimistic mood. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    }
];

for (const job of jobs) {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: job.prompt + NO_TEXT }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });
    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated for " + job.out + ": " + parts.map(p => p.text || "").join(" ").slice(0, 300));
    const buf = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(buf)
        .resize(1200, 675, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(job.out);
    console.log("OK:", job.out);
}
