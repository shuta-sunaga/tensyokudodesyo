#!/usr/bin/env python3
"""
/var/www/html 配下の出力済 HTML を直接書き換える (テンプレDBは既に正しい)
LINE→/contact/, line-cta section→contact-cta section, etc.
sudo で実行する必要がある (root所有のファイル多数)。
"""
import os, re, sys

ROOTS = ['/var/www/html']
APPLY = '--apply' in sys.argv

LINE_CTA_RE = re.compile(r'<section class="line-cta">.*?</section>', re.DOTALL)
LINE_ICON_IMG_RE = re.compile(r'\s*<img\s[^>]*LINE_Brand_icon[^>]*/?>\s*', re.DOTALL)

NEW_CTA = '''<!-- Contact CTA -->
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
                    <a href="/contact/" class="btn btn-primary btn-lg">転職相談はこちら</a>
                    <p class="contact-cta-note">※ご相談・面談はすべて無料です</p>
                </div>
            </div>
        </div>
    </section>'''

# 置換ペア (順序大事)
SIMPLE_REPLACEMENTS = [
    ('https://lin.ee/xZ1Tksm', '/contact/'),
    ('btn btn-line btn-lg', 'btn btn-primary btn-lg'),
    ('btn btn-line', 'btn btn-primary'),
    ('友だち追加して相談する', '転職相談はこちら'),
    ('LINEで相談する', '転職相談はこちら'),
    ('LINEで気軽に転職相談', '転職のご相談はこちらから'),
    ('LINEで気軽にご相談ください', 'お気軽にご相談ください'),
    ('LINEで相談', '転職相談'),
    ('お問い合わせフォームへ', '転職相談はこちら'),
    ('お問い合わせフォーム', '転職相談フォーム'),
    ('お問い合わせいただ', 'ご相談いただ'),
    ('お問い合わせありがとうございます', 'ご相談ありがとうございます'),
    ('お問い合わせありがとうございました', 'ご相談ありがとうございました'),
    ('お問い合わせ', '転職相談'),
]

def transform(text):
    text = LINE_CTA_RE.sub(NEW_CTA, text)
    text = LINE_ICON_IMG_RE.sub('', text)
    for f, t in SIMPLE_REPLACEMENTS:
        text = text.replace(f, t)
    return text

scanned = 0
changed = 0
errors = 0

for root in ROOTS:
    for dirpath, dirs, files in os.walk(root):
        # /contact/, /css/, /js/ 等は対象外
        for d in list(dirs):
            if d in ('css', 'js', 'assets', 'data', 'node_modules', '.well-known'):
                dirs.remove(d)
        for fname in files:
            if not fname.endswith('.html'):
                continue
            full = os.path.join(dirpath, fname)
            # skip /contact/, /terms.html, /privacy.html, /index.html (top), /interviews/, /companies/, /knowhow/
            if '/contact/' in full or full.endswith('/terms.html') or full.endswith('/privacy.html'):
                continue
            scanned += 1
            try:
                with open(full, 'r', encoding='utf-8') as f:
                    src = f.read()
            except Exception as e:
                errors += 1
                continue
            new = transform(src)
            if new == src:
                continue
            if not APPLY:
                changed += 1
                continue
            try:
                with open(full, 'w', encoding='utf-8') as f:
                    f.write(new)
                changed += 1
            except PermissionError:
                errors += 1
                # try sudo via subprocess
                import subprocess, tempfile
                with tempfile.NamedTemporaryFile('w', encoding='utf-8', delete=False) as tf:
                    tf.write(new)
                    tmp = tf.name
                r = subprocess.run(['sudo', 'mv', tmp, full], capture_output=True)
                if r.returncode == 0:
                    changed += 1
                    errors -= 1
            except Exception as e:
                errors += 1

print(f'Scanned: {scanned}')
print(f'Modified: {changed}')
print(f'Errors:  {errors}')
print(f'Mode: {"APPLY" if APPLY else "DRY-RUN"}')
