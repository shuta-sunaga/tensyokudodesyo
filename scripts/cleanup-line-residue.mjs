/**
 * 1次置換後に残った LINE 関連の表示要素 (アイコン・コピー) をクリーンアップする。
 * - <img src="...LINE_Brand_icon..."> を削除
 * - "btn btn-line" → "btn btn-primary"
 * - 残った "LINEで気軽" "LINEで" 等のコピーをフォーム導線に書き換え
 * - "友だち追加して相談する" 等のボタンラベルを書き換え
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');

const replacements = [
    // <img> の LINE アイコンを削除 (空白も含めて綺麗に)
    {
        name: 'line-icon-img',
        pattern: /\s*<img\s[^>]*alt="LINE"[^>]*\/?>(\s*)/g,
        replacement: '$1',
    },
    // 別表記もカバー
    {
        name: 'line-icon-img-alt',
        pattern: /\s*<img\s[^>]*src="[^"]*LINE_Brand_icon[^"]*"[^>]*\/?>(\s*)/g,
        replacement: '$1',
    },
    // .btn-line クラス
    {
        name: 'btn-line-class-lg',
        pattern: /class="btn btn-line btn-lg"/g,
        replacement: 'class="btn btn-primary btn-lg"',
    },
    {
        name: 'btn-line-class',
        pattern: /class="btn btn-line"/g,
        replacement: 'class="btn btn-primary"',
    },
    // ボタン内の LINE 文言
    { name: 'btn-text-add-friend', pattern: /友だち追加して相談する/g, replacement: 'お問い合わせはこちら' },
    { name: 'btn-text-line-add', pattern: /LINE友だち追加(?:して相談する|でご相談)?/g, replacement: 'お問い合わせはこちら' },
    { name: 'btn-text-line-consul', pattern: /LINEで相談する/g, replacement: 'お問い合わせはこちら' },
    { name: 'btn-text-line-consul-short', pattern: /LINEで相談/g, replacement: 'お問い合わせ' },
    // 周辺コピー
    { name: 'copy-line-easy', pattern: /LINEで気軽に転職相談/g, replacement: '転職のご相談はこちらから' },
    { name: 'copy-line-easy2', pattern: /LINEで気軽にご相談ください/g, replacement: 'お気軽にご相談ください' },
    { name: 'copy-line-pre-talk', pattern: /LINEで(まずは)?(気軽に)?お(問い合わせ|気軽)?(相談)?/g, replacement: 'まずは$1お問い合わせ' },
];

async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) yield* walk(fullPath);
        else if (e.isFile() && /\.(html|mtml)$/i.test(e.name)) yield fullPath;
    }
}

const summary = { scanned: 0, modified: 0, perRule: {} };

async function main() {
    const targets = [path.join(ROOT, 'public_html'), path.join(ROOT, 'mt-template')];
    for (const dir of targets) {
        try { await fs.access(dir); } catch { continue; }
        for await (const file of walk(dir)) {
            summary.scanned++;
            if (file.includes('contact/index.html') || file.includes('contact\\index.html')) continue;

            let src = await fs.readFile(file, 'utf8');
            const before = src;
            for (const r of replacements) {
                const matches = src.match(r.pattern);
                if (matches) {
                    src = src.replace(r.pattern, r.replacement);
                    summary.perRule[r.name] = (summary.perRule[r.name] || 0) + matches.length;
                }
            }
            if (src !== before) {
                await fs.writeFile(file, src, 'utf8');
                summary.modified++;
            }
        }
    }
    console.log('Files scanned:', summary.scanned);
    console.log('Files modified:', summary.modified);
    console.log('Replacements per rule:');
    for (const [k, v] of Object.entries(summary.perRule)) console.log('  ', k, '→', v);
}

main().catch((e) => { console.error(e); process.exit(1); });
