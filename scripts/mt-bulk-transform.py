#!/usr/bin/env python3
"""
MT mt_template テーブルのテンプレを Python regex で複雑置換する。
SSHでこのファイルを送り、リモートで実行する。

使い方 (ローカル):
  scp ... mt-bulk-transform.py ec2:/tmp/
  ssh ec2 "python3 /tmp/mt-bulk-transform.py [--apply]"

DRY-RUN (デフォルト):
  対象件数だけ表示
APPLY:
  実際に UPDATE
"""
import os, re, sys, subprocess, json

APPLY = '--apply' in sys.argv
MT_DIR = '/var/www/mt'

# DB認証情報を mt-config.cgi から取得
def get_db_creds():
    with open(os.path.join(MT_DIR, 'mt-config.cgi')) as f:
        cfg = f.read()
    db   = re.search(r'^Database\s+(\S+)', cfg, re.M).group(1)
    user = re.search(r'^DBUser\s+(\S+)', cfg, re.M).group(1)
    pwd  = re.search(r'^DBPassword\s+(\S+)', cfg, re.M).group(1)
    host = re.search(r'^DBHost\s+(\S+)', cfg, re.M).group(1)
    return db, user, pwd, host

DB, USER, PWD, HOST = get_db_creds()

def mysql_query(sql, fetch=True):
    cmd = ['mysql', '-h', HOST, '-u', USER, f'-p{PWD}', DB,
           '--default-character-set=utf8mb4', '-N', '-B', '-e', sql]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"mysql error: {p.stderr}")
    return p.stdout if fetch else None

# ----- 変換関数 ----------------------------------------------------------

# 古い line-cta セクション全体を新しい contact-cta セクションへ
LINE_CTA_SECTION_RE = re.compile(r'<section class="line-cta">.*?</section>', re.DOTALL)

NEW_CTA_SECTION = '''<!-- Contact CTA -->
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

# 残存の <img src="...LINE_Brand_icon..." ...> img タグを削除
LINE_ICON_IMG_RE = re.compile(r'\s*<img\s[^>]*LINE_Brand_icon[^>]*/?>\s*')

def transform(text):
    if text is None:
        return None
    # 1. line-cta section 全体を新CTAセクションに置換
    text = LINE_CTA_SECTION_RE.sub(NEW_CTA_SECTION, text)
    # 2. 残ったLINEアイコン img タグを削除
    text = LINE_ICON_IMG_RE.sub('', text)
    return text

# ----- 対象レコード取得 → 変換 → 更新 ------------------------------------
print(f"Mode: {'APPLY' if APPLY else 'DRY-RUN'}")
print(f"DB: {DB}@{HOST}")

# 対象テンプレ取得 (LINE_Brand_icon または line-cta を含む)
rows = mysql_query("""
SELECT template_id, template_blog_id, template_name, template_text
FROM mt_template
WHERE template_text LIKE '%line-cta%'
   OR template_text LIKE '%LINE_Brand_icon%'
""")

# 結果は TSV (id\tblog\tname\ttext)
import re as _re
records = []
# mysql -B (batch mode) はタブ区切りだが、template_text に改行が含まれるので難しい
# → 別アプローチ: id だけ取得して、各レコードを個別に SELECT

ids = mysql_query("""
SELECT template_id FROM mt_template
WHERE template_text LIKE '%line-cta%'
   OR template_text LIKE '%LINE_Brand_icon%'
""")
id_list = [int(x) for x in ids.strip().split('\n') if x.strip()]
print(f"対象テンプレート: {len(id_list)} 件")

if not id_list:
    print("変換不要")
    sys.exit(0)

changed = 0
for tid in id_list:
    # text を1件ずつ取得 (改行混在のため別経路)
    p = subprocess.run(
        ['mysql', '-h', HOST, '-u', USER, f'-p{PWD}', DB,
         '--default-character-set=utf8mb4', '-N', '-B', '-e',
         f'SELECT template_text FROM mt_template WHERE template_id={tid}'],
        capture_output=True, text=True)
    if p.returncode != 0:
        print(f"  ✗ id={tid}: SELECT 失敗")
        continue
    # mysql -B は \n を \\n に変換するので戻す
    raw = p.stdout
    # rstrip \n だけ
    if raw.endswith('\n'):
        raw = raw[:-1]
    # \\n → \n の変換 (-B mode)
    text = raw.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\')
    new_text = transform(text)
    if new_text == text:
        continue
    if not APPLY:
        print(f"  · id={tid}: 変更予定 ({len(text)} → {len(new_text)} chars)")
        changed += 1
        continue
    # UPDATE: 一時ファイル経由で安全に
    import tempfile
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', delete=False, suffix='.sql') as f:
        # MySQL の文字列リテラルにエスケープ
        esc = new_text.replace('\\', '\\\\').replace("'", "\\'")
        f.write(f"UPDATE mt_template SET template_text='{esc}', template_modified_on=NOW() WHERE template_id={tid};\n")
        sql_path = f.name
    p2 = subprocess.run(
        ['mysql', '-h', HOST, '-u', USER, f'-p{PWD}', DB,
         '--default-character-set=utf8mb4', '-e', f'SOURCE {sql_path};'],
        capture_output=True, text=True)
    os.unlink(sql_path)
    if p2.returncode != 0:
        print(f"  ✗ id={tid}: UPDATE 失敗 - {p2.stderr.strip()}")
    else:
        print(f"  ✓ id={tid}: 更新")
        changed += 1

print(f"\n結果: {changed}/{len(id_list)} 件 {'更新' if APPLY else '変更予定'}")
