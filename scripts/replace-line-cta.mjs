/**
 * LINE 相談 CTA を /contact/ フォーム CTA に置換するワンショットスクリプト。
 *
 * 実行: node scripts/replace-line-cta.mjs
 *
 * 対象パターン:
 *   1. ヘッダー/フッターinclude (既に手動で対応済み・スキップ)
 *   2. LINE CTA セクション (line-cta クラス) — 大きなCTA、置換版を出力
 *   3. インラインの "LINEで相談" / "LINEで相談する" ボタン
 *   4. フッターの「LINEで相談」リンク (already done in includes)
 *
 * MT 管理ページもローカルプレビュー用に書き換える (デプロイは別途 mt-template 経由)。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..');
const PUBLIC = path.join(ROOT, 'public_html');

// ----- パターン定義 -------------------------------------------------------
const replacements = [
    // line-cta セクション全体
    {
        name: 'line-cta-section',
        pattern: /<!--\s*LINE CTA\s*-->\s*<section class="line-cta">[\s\S]*?<\/section>/g,
        replacement: `<!-- Contact CTA -->
    <section class="contact-cta">
        <div class="container">
            <div class="contact-cta-content">
                <div class="contact-cta-icon" aria-hidden="true">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="contact-cta-text">
                    <h2 class="contact-cta-title">転職のご相談はこちらから</h2>
                    <p class="contact-cta-description">
                        在職中の情報収集から、本格的な転職活動まで。<br>
                        あなたのペースで、地域に詳しいキャリアアドバイザーがご案内します。
                    </p>
                </div>
                <div class="contact-cta-action">
                    <a href="/contact/" class="btn btn-primary btn-lg">お問い合わせフォームへ</a>
                    <p class="contact-cta-note">※ご相談・面談はすべて無料です</p>
                </div>
            </div>
        </div>
    </section>`,
    },
    // インライン CTA (大きいボタン、画像つき) — 末尾改行や微妙な空白差を許容
    {
        name: 'inline-line-btn-lg',
        pattern: /<a href="https:\/\/lin\.ee\/xZ1Tksm" class="btn btn-line btn-lg"[^>]*>\s*<img[^>]*alt="LINE"[^>]*>\s*LINE[で相談する]+\s*<\/a>/g,
        replacement: `<a href="/contact/" class="btn btn-primary btn-lg">お問い合わせはこちら</a>`,
    },
    // インライン CTA (小さいボタン、画像つき)
    {
        name: 'inline-line-btn-sm',
        pattern: /<a href="https:\/\/lin\.ee\/xZ1Tksm" class="btn btn-line"[^>]*>\s*<img[^>]*alt="LINE"[^>]*>\s*LINE[で相談する]+\s*<\/a>/g,
        replacement: `<a href="/contact/" class="btn btn-primary">お問い合わせ</a>`,
    },
    // フッター・ナビ系 (テキストリンク)
    {
        name: 'footer-line-link',
        pattern: /<a href="https:\/\/lin\.ee\/xZ1Tksm"[^>]*>LINE[で相談する]*<\/a>/g,
        replacement: `<a href="/contact/">お問い合わせ</a>`,
    },
    // 残りの "https://lin.ee/xZ1Tksm" リンク (target/rel ありなしを許容)
    {
        name: 'remaining-line-href',
        pattern: /href="https:\/\/lin\.ee\/xZ1Tksm"/g,
        replacement: `href="/contact/"`,
    },
];

// ----- 実行 ---------------------------------------------------------------
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
    const targets = [PUBLIC, path.join(ROOT, 'mt-template')];
    for (const dir of targets) {
        try { await fs.access(dir); } catch { continue; }
        for await (const file of walk(dir)) {
            summary.scanned++;
            // includes は既に手動編集済み
            if (file.includes('includes/header.html') || file.includes('includes\\header.html')) continue;
            if (file.includes('includes/footer.html') || file.includes('includes\\footer.html')) continue;
            // contact ページ自体は除外
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
                console.log('  ✓', path.relative(ROOT, file));
            }
        }
    }
    console.log('\n=== Summary ===');
    console.log('Files scanned:', summary.scanned);
    console.log('Files modified:', summary.modified);
    console.log('Replacements per rule:');
    for (const [k, v] of Object.entries(summary.perRule)) console.log('  ', k, '→', v);
}

main().catch((e) => { console.error(e); process.exit(1); });
