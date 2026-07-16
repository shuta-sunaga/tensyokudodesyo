import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. All papers and screens must be completely blank or contain only abstract lines and shapes, never readable characters.`;

const jobs = [
    {
        out: "public_html/assets/knowhow-216.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about using a brand-new cutting-edge AI assistant with three different modes for job hunting. A young professional person at a clean desk choosing between three friendly floating orbs of different sizes and colors — a large radiant sun-like golden orb, a medium calm green earth-like orb, and a small swift pale-blue moon-like orb — each orb glowing softly above the open laptop with an abstract blank interface. The person points thoughtfully at one orb. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Optimistic, decision-making, futuristic-yet-friendly mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    },
    {
        out: "public_html/assets/knowhow-217.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about a powerful next-generation AI assistant that can read enormous amounts of documents at once for job hunting. A young professional person handing a tall but tidy stack of blank papers to a friendly large rounded robot assistant with a soft glowing face, the robot calmly absorbing many floating blank pages that swirl gently around it like a spiral galaxy, while producing one neat organized blank summary sheet. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Calm, capable, deep-thinking mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    },
    {
        out: "public_html/assets/knowhow-218.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article comparing the latest AI models from three companies for job hunting. A young professional person standing before three friendly distinct robot assistants lined up side by side on soft podiums — one round golden-accented robot, one square-ish green-accented robot, one triangular blue-accented robot — each holding a blank card, while the person examines them with a magnifying glass, balance-scale motif floating subtly in the air. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Curious, comparative, optimistic mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    }
];

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

for (const job of jobs) {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: job.prompt + NO_TEXT }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });
    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated for " + job.out + ": " + JSON.stringify(parts.map(p => p.text || "").join(" ").slice(0, 300)));
    const buf = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(buf)
        .resize(1200, 675, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(job.out);
    console.log("OK:", job.out);
}
