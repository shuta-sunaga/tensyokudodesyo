/**
 * デザイン v2 用の写真素材を Gemini で生成する（製造業・ドキュメンタリー調・AIっぽさゼロ）
 *
 * 使い方:
 *   node scripts/redesign-v2/generate-photos.mjs [--only hero-main,tile-jobs] [--model MODEL] [--out DIR]
 *
 * 出力: public_html/assets/v2/<name>.webp (1920x1080 q80) と scratch の元 PNG
 * 生成後は必ず目視で確認し、擬似文字・指の異常・貼り付け感があれば --only で再生成する。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', path.join(ROOT, 'public_html', 'assets', 'v2')));
const RAW = path.resolve(opt('--raw', path.join(ROOT, 'scripts', 'redesign-v2', 'raw')));
const ONLY = opt('--only', '').split(',').filter(Boolean);
const MODEL = opt('--model', 'gemini-3-pro-image-preview');
const KEY = (fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^GEMINI_API_KEY=(.+)$/m) || [])[1]?.trim() || process.env.GEMINI_API_KEY;
if (!KEY) { console.error('GEMINI_API_KEY not found'); process.exit(1); }

// 写実性の共通指示。「AI っぽさ」を出す要素を徹底的に排除する
const STYLE = `PHOTOGRAPHIC STYLE (mandatory): an unstaged, candid documentary photograph taken by a newspaper photojournalist inside a real, ordinary small-to-mid-size Japanese manufacturing company. Shot on a full-frame DSLR with a 35mm prime lens at f/4, ISO 1600, so there is visible fine natural grain and only slight background softness (absolutely NO creamy bokeh, NO shallow-depth portrait look). Lighting is the real mixed light of the building: cool fluorescent ceiling tubes plus some daylight from windows, with a slightly greenish-neutral cast, uneven brightness, ordinary shadows, no fill light, no rim light, no studio look. Colors are a little muted and desaturated like a real workplace, medium contrast, slightly flat highlights, nothing glossy. Composition is imperfect and casual: slightly off-center, some clutter at the edges, things partially cut off by the frame, the camera at eye level, not perfectly level. The workplace is lived-in and a bit worn: scuffed painted floors with faded yellow safety lines, scratched machine covers, tool carts, cardboard boxes, cables, hand-written-looking but unreadable notes on walls, dust, fingerprints, oil stains. People are ordinary Japanese workers with completely natural imperfect skin (pores, uneven tone, slight shine on the forehead), tired-looking but genuine expressions, messy hair under caps, wrinkled gray or navy work uniforms with a plain company patch that has no readable letters, cotton gloves. They are absorbed in what they are doing and never look at the camera, never pose, never smile at the camera; if they smile it is a small natural smile toward a colleague. Hands must be anatomically correct with five fingers. STRICTLY AVOID everything that looks computer-generated or stock-photo-like: no glossy plastic skin, no beauty retouching, no over-sharpening, no HDR glow, no lens flare, no dramatic cinematic teal-orange grading, no perfect symmetry, no floating or duplicated objects, no idealized clean factory, no smiling-at-camera model, no dramatic god rays. ABSOLUTELY NO readable text, letters, numbers, logos, brand names, signs, labels, posters or gibberish writing anywhere in the frame; any sign, screen, whiteboard or label must be blank, turned away, out of focus or too small to read. Landscape 16:9.`;

const SHOTS = [
  { name: 'hero-main', prompt: `Wide shot of a machining floor in a small Japanese factory in the morning. In the right half, a man in his late 20s in a gray work uniform and cap stands at the open door of a CNC machining center, listening while an older colleague in his 50s points at a workpiece; both are looking at the part, not at the camera. Behind them, more machines, a tool cart and high windows with daylight. The LEFT third of the frame is relatively calm and darker (a plain concrete wall and shadow) so that text can be placed over it. ${STYLE}` },
  { name: 'tile-jobs', prompt: `Medium shot at a workbench: a woman in her 30s in a navy work uniform measures a small turned steel part with a vernier caliper, seen from a three-quarter angle so her face is visible in profile and she is concentrating on the part. Metal chips and a few parts in a plastic tray on the bench, a lathe softly visible behind her. ${STYLE}` },
  { name: 'tile-clients', prompt: `Exterior of a small Japanese factory building in an industrial area in the late afternoon: a plain beige corrugated-steel building with a roller shutter half open, a small office entrance with a glass door, a bicycle and a light truck parked outside, a worker in a gray uniform walking toward the entrance carrying a box. No signage with readable text. ${STYLE}` },
  { name: 'tile-interview', prompt: `A woman in her early 30s in a gray work uniform sits at an assembly bench assembling a small electrical unit with a screwdriver; a male colleague in his 40s stands next to her and they are talking casually while looking at the unit; her face is clearly visible with a small natural expression. Parts bins, a magnifier lamp and a tool balancer are around the bench. ${STYLE}` },
  { name: 'tile-company', prompt: `A company president in his late 50s in a navy work jacket and a young employee in his 20s in a gray uniform stand in front of a press machine on the factory floor, looking at a drawing sheet the president is holding (the drawing is out of focus and unreadable). Both faces are visible from the side. ${STYLE}` },
  { name: 'tile-knowhow', prompt: `A man in his early 30s in plain casual clothes sits at a small dining table at home in the evening, writing in a paper notebook next to a closed plain dark-gray laptop whose lid has absolutely no logo, sticker or marking, and a mug; the room is a real modest Japanese apartment with a curtain, a plant and some clutter. He is looking down at the notebook, thoughtful. Warm lamp light mixed with cool window light. ${STYLE}` },
  { name: 'photo-consult', prompt: `Two people talking at a plain meeting table in a small office next to a factory: a career advisor in her 40s in a simple blouse and a job seeker in his 30s in a casual shirt; the job seeker is talking with his hands and the advisor is listening and taking notes; papers, a plain mug and a window with blinds; both faces visible from the side. ${STYLE}` },
  { name: 'photo-company', prompt: `A factory manager in his 40s in a gray uniform and helmet walks across a production floor while talking with a female staff member in her 30s who holds a clipboard; behind them an assembly line of industrial equipment and a few other workers; natural walking motion. ${STYLE}` },
];

async function generate(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '16:9', imageSize: '2K' } },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error(`No image: ${JSON.stringify(json).slice(0, 400)}`);
  return Buffer.from(part.inlineData.data, 'base64');
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(RAW, { recursive: true });
const sharp = (await import('sharp')).default;
for (const shot of SHOTS) {
  if (ONLY.length && !ONLY.includes(shot.name)) continue;
  process.stdout.write(`${shot.name} ... `);
  let png;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { png = await generate(shot.prompt); break; }
    catch (e) { console.error(`\n  attempt ${attempt} failed: ${e.message}`); if (attempt === 3) throw e; await new Promise(r => setTimeout(r, 5000)); }
  }
  fs.writeFileSync(path.join(RAW, `${shot.name}.png`), png);
  const meta = await sharp(png).metadata();
  await sharp(png).resize(1920, 1080, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(OUT, `${shot.name}.webp`));
  // 確認用の小さい JPG（Read ツールで目視するため）
  await sharp(png).resize(960, 540, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(path.join(RAW, `${shot.name}-preview.jpg`));
  console.log(`ok (${meta.width}x${meta.height})`);
}
