import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any panels, charts, or signs must contain only abstract shapes, never readable characters, labels, or numbers.`;

const jobs = [
    {
        out: "public_html/assets/knowhow-248.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about the Holland RIASEC vocational interest theory used for self-analysis in job hunting. A young professional standing thoughtfully in front of a large floating hexagon panel, the hexagon divided into six soft pastel-colored segments, each segment holding a simple abstract icon: a wrench (hands-on work), a magnifying glass (research), a paintbrush (creativity), two joined hands (helping people), a small flag on a summit (leadership), and neatly stacked documents (organization). Gentle connecting lines between the person and the hexagon suggest matching personality with careers. A potted plant, a desk with a mug, soft round shapes in the background. Large window with soft morning light. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Warm, introspective, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT,
    },
    {
        out: "public_html/assets/knowhow-249.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about working in the mass media and entertainment industry. A lively creative scene: a young professional with headphones around the neck standing between a video camera on a tripod, a stack of books and magazines, a clapperboard, a microphone on a stand, and a large screen showing an abstract play-button triangle. Soft spotlights from above, floating music notes and film-reel shapes, a streaming smartphone with abstract video tiles. A potted plant and soft round shapes in the background. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents) with warm stage-light glow. Exciting yet friendly, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT,
    },
    {
        out: "public_html/assets/knowhow-250.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about working in the telecommunications industry. A young professional standing in a gentle cityscape at dusk, looking up at a friendly communication tower with soft concentric signal waves radiating from its top. Around the scene: a smartphone with abstract signal bars, a satellite dish on a rooftop, glowing fiber-optic lines flowing along the ground connecting small houses and buildings, and a floating cloud shape linked by dotted lines to devices. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents) with warm dusk lighting. Reassuring, connected, hopeful mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT,
    },
];

for (const job of jobs) {
    if (fs.existsSync(job.out)) { console.log("SKIP (exists):", job.out); continue; }
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: job.prompt }] }],
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
