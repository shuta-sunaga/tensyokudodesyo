const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateImage(prompt, outputPath) {
    const fullPrompt = prompt + "\n\nIMPORTANT: Do NOT include any text, letters, numbers, words, logos, watermarks, or written characters anywhere in the image. The image must be purely visual with no textual elements whatsoever.";
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ["image", "text"] }
    });
    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error("No image generated");
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await sharp(imageBuffer).resize(1200, 675, { fit: "cover" }).webp({ quality: 85 }).toFile(outputPath);
    console.log("画像生成成功:", outputPath);
}

const jobs = [
    {
        out: "public_html/assets/knowhow-190.webp",
        prompt: "A bright, modern flat-illustration style image representing the beauty industry as a career field. Show a clean, elegant beauty salon and cosmetics counter scene: a styling chair and mirror, shelves with cosmetic bottles and skincare jars, makeup brushes in a holder, and soft natural lighting. Convey a calm, professional, welcoming atmosphere. Use a warm, soft color palette with gentle greens, cream, and warm orange accents. Clean minimal composition suitable for a career advice website."
    },
    {
        out: "public_html/assets/knowhow-191.webp",
        prompt: "A bright, modern flat-illustration style image representing employment paperwork and onboarding for a new job. Show a tidy desk with official documents and forms, a pen, a personal seal/stamp (hanko) and ink pad, a folder, and a cup of coffee, with soft warm lighting. Convey a sense of careful, trustworthy preparation. Use a warm, calm color palette with soft greens, cream, and warm orange accents. Clean minimal composition suitable for a career advice website."
    },
    {
        out: "public_html/assets/knowhow-192.webp",
        prompt: "A bright, modern flat-illustration style image representing a job interview. Show a calm interview scene: a candidate sitting across a small table from an interviewer in a bright meeting room, with a notebook and a glass of water on the table, plants in the background, and soft natural lighting. Convey a positive, professional, encouraging mood. Use a warm, soft color palette with gentle greens, cream, and warm orange accents. Clean minimal composition suitable for a career advice website."
    }
];

(async () => {
    let failed = 0;
    for (const j of jobs) {
        try { await generateImage(j.prompt, j.out); }
        catch (e) { console.error("ERROR", j.out, e.message); failed++; }
    }
    process.exit(failed > 0 ? 1 : 0);
})();
