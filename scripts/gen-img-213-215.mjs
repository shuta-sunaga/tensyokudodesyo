import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any screens, books, or papers must be blank or show only abstract shapes.`;

const jobs = [
    {
        out: "public_html/assets/knowhow-213.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about reskilling (learning new skills) for a career change with AI assistance. A motivated young professional person studying at a cozy desk at home in the evening, laptop open showing abstract colorful chart shapes, surrounded by open books, a steaming mug, and a small plant. Floating above the desk: gentle abstract icons suggesting growth — an upward staircase of blocks, a lightbulb, gear shapes, and a small friendly robot assistant hovering and pointing helpfully at the staircase. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Encouraging, hopeful, focused mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    },
    {
        out: "public_html/assets/knowhow-214.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about practicing consulting case interviews with an AI assistant. A confident young professional person in smart business casual sitting at a clean desk, gesturing while explaining, facing a laptop from which a friendly abstract AI assistant (soft glowing round robot face) projects holographic abstract diagrams: a branching logic tree, pie chart shapes, and building blocks — all purely geometric with no letters. A blank whiteboard with abstract tree-diagram lines stands in the background. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Sharp, intellectual, energetic yet friendly mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition.`
    },
    {
        out: "public_html/assets/knowhow-215.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about sorting and replying to job scout emails with AI help. A relaxed young professional person sitting on a comfortable chair with a laptop, while floating envelopes stream toward them; a friendly small robot assistant sorts the envelopes into two neat trays — one glowing warmly (important) and one plain (bulk). Some envelopes have a small heart or star shape, others are plain. Abstract funnel shape suggesting filtering. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Organized, calm, reassuring mood. Clean modern flat vector illustration style with soft shadows. 16:9 wide composition. All envelopes must be blank without any writing.`
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
