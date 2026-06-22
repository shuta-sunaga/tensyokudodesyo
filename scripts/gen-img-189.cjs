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

const prompt = "A bright, modern flat-illustration style image representing the apparel and fashion industry as a career field. Show a stylish clothing retail boutique interior with neatly arranged garments on racks, mannequins wearing fashionable outfits, folded clothes on shelves, and soft warm lighting. Include subtle elements suggesting fashion work: a clothing rack, fabric swatches, and a tablet device for e-commerce. Use a warm, calm, professional color palette with soft greens, cream, and warm orange accents. Clean minimal composition, friendly and approachable mood suitable for a career advice website.";

generateImage(prompt, "public_html/assets/knowhow-189.webp").catch(e => { console.error("ERROR:", e.message); process.exit(1); });
