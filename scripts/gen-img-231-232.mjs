import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const NO_TEXT = `

IMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever. Any signs, boards, screens or documents must remain completely blank with only abstract shapes, never readable characters or labels.`;

const jobs = [
    {
        out: "public_html/assets/knowhow-231.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about planned happenstance career theory — how unexpected chance events shape a career. A person standing at the center of a winding path that branches in several unexpected directions across a gentle landscape. The path is not straight: it curves, forks, and loops, with small glowing dots scattered along and beside it representing chance encounters. Around the person, five soft floating circular icons drawn as simple abstract symbols: a magnifying glass shape, a climbing arrow, a bending flexible line, a sunrise arc, and a small paper airplane — all purely pictorial, no labels. A few small abstract human figures stand at some of the branch points, suggesting encounters with other people. Rolling hills and a few simple trees in the background, with a soft sunrise. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents). Optimistic, open, exploratory mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT
    },
    {
        out: "public_html/assets/knowhow-232.webp",
        prompt: `A warm, flat-design illustration for a Japanese career advice blog article about working in the aviation and railway industries. A wide scene split naturally between two transport worlds: on the left, a stylized passenger airplane on an airport apron with a simple control tower silhouette and a small ground-handling vehicle; on the right, a sleek modern high-speed train running along an elevated track beside a simple station platform. In the foreground, a few friendly abstract worker figures in flat style with no facial detail: one in a maintenance uniform with a toolbox, one ground staff figure gesturing, and one railway technician figure near the track. Soft clouds and a gentle horizon line connect both halves into one continuous landscape. All signage, displays, aircraft liveries and train fronts must remain completely blank with only abstract stripes and shapes. Soft cream and green color palette (#faf8f0 background tones, #5a9e6f green accents, #e8a85a orange accents), with light blue sky. Reliable, clean, forward-moving mood. Clean flat vector illustration style with soft shadows. 16:9 wide composition.` + NO_TEXT
    }
];

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

for (const job of jobs) {
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: job.prompt }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });
    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated for " + job.out + ": " + parts.map(p => p.text || "").join(" ").slice(0, 300));

    const buf = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(buf).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(job.out);
    console.log("OK:", job.out);
}
