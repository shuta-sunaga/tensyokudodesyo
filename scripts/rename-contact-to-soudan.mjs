/**
 * 「お問い合わせ」→「転職相談」へのコンテキスト依存リネーム
 *
 * 文脈に応じて「転職相談」/「ご相談」を使い分け:
 *   - ラベル・タイトル系: 転職相談
 *   - 文章・お礼・感謝系:  ご相談
 *   - 「お問い合わせフォーム」: 転職相談フォーム
 *
 * 実行: node scripts/rename-contact-to-soudan.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 順序が重要: 長いマッチを先に処理する
const replacements = [
    // 文章中の自然な「ご相談」化
    [/お問い合わせいただ(き|いた|ければ)/g, 'ご相談いただ$1'],
    [/お問い合わせありがとうございます/g, 'ご相談ありがとうございます'],
    [/お問い合わせありがとうございました/g, 'ご相談ありがとうございました'],
    [/お問い合わせ後/g, 'ご相談後'],
    [/お問い合わせの内容/g, 'ご相談内容'],
    [/お問い合わせを承りました/g, 'ご相談を承りました'],
    [/お問い合わせを受け付け/g, 'ご相談を受け付け'],
    [/お問い合わせを受付/g, 'ご相談を受付'],

    // ボタン・CTA
    [/お問い合わせフォームへ/g, '転職相談はこちら'],

    // ラベル系 (一括変換)
    [/お問い合わせフォーム/g, '転職相談フォーム'],
    [/お問い合わせ/g, '転職相談'],
];

async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === '.aws-sam' || e.name === 'tmp') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) yield* walk(full);
        else if (e.isFile() && /\.(html|mtml|mjs|js|css|md|txt|json|yaml|yml)$/i.test(e.name)) yield full;
    }
}

const summary = { scanned: 0, modified: 0, perRule: {} };

const TARGETS = [
    path.join(ROOT, 'public_html'),
    path.join(ROOT, 'mt-template'),
    path.join(ROOT, 'backend', 'lambda', 'submit-form', 'src'),
    path.join(ROOT, 'backend', 'local-dev'),
    path.join(ROOT, 'backend'),
    path.join(ROOT, 'docs'),
];

const SKIP_FILES = [
    'docs/lark-base-setup.md',  // システムドキュメントは触らない
    'docs/security-measures.md',
    'docs/ses-setup-guide.md',
    'docs/mt-template-deploy-guide.md',
    'docs/terms-draft.txt',     // 規約は別途
    'mt-template/README.md',
];

async function main() {
    for (const dir of TARGETS) {
        try { await fs.access(dir); } catch { continue; }
        for await (const file of walk(dir)) {
            const rel = path.relative(ROOT, file).replace(/\\/g, '/');
            if (SKIP_FILES.includes(rel)) continue;
            summary.scanned++;
            let src = await fs.readFile(file, 'utf8');
            const before = src;
            for (const [pat, rep] of replacements) {
                const matches = src.match(pat);
                if (matches) {
                    src = src.replace(pat, rep);
                    const key = String(pat);
                    summary.perRule[key] = (summary.perRule[key] || 0) + matches.length;
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
    Object.entries(summary.perRule).forEach(([k, v]) => console.log('  ', k.slice(0, 60).padEnd(60), '→', v));
}

main().catch(e => { console.error(e); process.exit(1); });
