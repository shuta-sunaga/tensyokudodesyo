/**
 * 会社紹介パイプライン用 Word(.docx) 取り込みヘルパー
 *
 * 使い方:
 *   node scripts/extract-client-docx.mjs <input.docx>
 *
 * 出力:
 *   ./tmp/client-extract/<basename>.md   - 変換後 Markdown
 *   ./tmp/client-extract/<basename>.json - 構造化抽出 (見出し別の中身)
 *
 * 構造化のマッピング規則:
 *   見出し "会社名" or H1 第1要素 -> name
 *   "タグライン" / "キャッチコピー"        -> tagline
 *   "業界"                             -> industryHint (人手でID紐付け)
 *   "所在地" / "本社"                  -> address (都道府県/市区町村を別途抽出)
 *   "設立"                             -> established
 *   "代表" / "CEO" / "代表者"          -> ceo
 *   "従業員" / "社員数"                -> employees
 *   "事業内容" / "事業"                -> businessContent
 *   "ビジョン" / "ミッション"          -> vision
 *   "カルチャー" / "社風" / "文化"     -> culture
 *   "求める人物像" / "求める人材"      -> idealPerson
 *   "メッセージ" / "求職者へ"          -> message
 */
import mammoth from 'mammoth';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const SECTION_MAP = [
    { key: 'tagline',          aliases: ['タグライン', 'キャッチコピー', 'コピー'] },
    { key: 'industryHint',     aliases: ['業界'] },
    { key: 'address',          aliases: ['所在地', '本社', '住所'] },
    { key: 'established',      aliases: ['設立', '創業'] },
    { key: 'ceo',              aliases: ['代表者', '代表', 'CEO', '社長'] },
    { key: 'employees',        aliases: ['従業員数', '社員数', '従業員', '社員'] },
    { key: 'businessContent',  aliases: ['事業内容', '事業'] },
    { key: 'vision',           aliases: ['ビジョン', 'ミッション', 'ビジョン・ミッション'] },
    { key: 'culture',          aliases: ['企業カルチャー', 'カルチャー', '社風', '文化'] },
    { key: 'idealPerson',      aliases: ['求める人物像', '求める人材', '求める人物'] },
    { key: 'message',          aliases: ['メッセージ', '求職者へ', '求職者の皆さまへ', '求職者の方へ'] },
];

function findKeyForHeading(text) {
    if (!text) return null;
    const normalized = text.replace(/\s+/g, '').toLowerCase();
    for (const entry of SECTION_MAP) {
        for (const alias of entry.aliases) {
            if (normalized.includes(alias.replace(/\s+/g, '').toLowerCase())) {
                return entry.key;
            }
        }
    }
    return null;
}

function extractFromMarkdown(md) {
    const lines = md.split(/\r?\n/);
    const result = {};
    let currentKey = null;
    let buffer = [];
    let firstH1 = null;

    const flush = () => {
        if (!currentKey) return;
        const value = buffer.join('\n').trim();
        if (value) {
            result[currentKey] = (result[currentKey] ? result[currentKey] + '\n\n' : '') + value;
        }
        buffer = [];
    };

    for (const raw of lines) {
        const line = raw.trim();
        const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            if (level === 1 && !firstH1) firstH1 = text;
            flush();
            currentKey = findKeyForHeading(text);
            continue;
        }
        if (!currentKey) continue;
        if (line === '') {
            if (buffer.length) buffer.push('');
            continue;
        }
        buffer.push(line);
    }
    flush();

    if (firstH1 && !result.name) {
        result.name = firstH1;
    }
    return result;
}

async function main() {
    const input = process.argv[2];
    if (!input) {
        console.error('Usage: node scripts/extract-client-docx.mjs <input.docx>');
        process.exit(1);
    }

    const inputPath = path.resolve(input);
    const exists = await fs.access(inputPath).then(() => true).catch(() => false);
    if (!exists) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
    }

    const outDir = path.resolve('tmp/client-extract');
    await fs.mkdir(outDir, { recursive: true });

    const basename = path.basename(inputPath, path.extname(inputPath));
    const mdPath = path.join(outDir, `${basename}.md`);
    const jsonPath = path.join(outDir, `${basename}.json`);

    const result = await mammoth.convertToMarkdown({ path: inputPath });
    const markdown = result.value || '';
    await fs.writeFile(mdPath, markdown, 'utf8');

    const structured = extractFromMarkdown(markdown);
    await fs.writeFile(jsonPath, JSON.stringify(structured, null, 2), 'utf8');

    console.log('--- conversion summary ---');
    console.log(`markdown : ${mdPath} (${markdown.length} chars)`);
    console.log(`json     : ${jsonPath} (${Object.keys(structured).length} fields)`);
    if (result.messages?.length) {
        console.log('mammoth messages:');
        for (const msg of result.messages) console.log(' -', msg.type, msg.message);
    }
    console.log('--- structured fields ---');
    for (const key of Object.keys(structured)) {
        const preview = String(structured[key]).slice(0, 80).replace(/\n/g, ' ');
        console.log(`  ${key.padEnd(18)}: ${preview}${structured[key].length > 80 ? '…' : ''}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
