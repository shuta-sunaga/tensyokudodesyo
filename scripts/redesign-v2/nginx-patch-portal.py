#!/usr/bin/env python3
"""
本番 nginx（/etc/nginx/conf.d/portal.conf）にデザイン v2 の設定を追加する（サーバー上で sudo 実行）。
冪等: 既に入っていれば何もしない。適用前に portal.conf.bak.YYYYMMDD_HHMMSS を作る。

  sudo python3 /tmp/v2/nginx-patch-portal.py [--apply]

追加内容（443 の server ブロック内）:
  - キャッシュ: location ^~ /data/ { expires 10m; } / css,js 1h / 画像 30d
    （add_header ではなく expires を使う: location 内で add_header を書くとセキュリティヘッダの継承が切れる）
  - gzip_vary on / gzip_comp_level 5 / gzip_min_length 1024
  - error_page 404 /404.html;
"""
import re, sys, shutil, datetime

PATH = '/etc/nginx/conf.d/portal.conf'
APPLY = '--apply' in sys.argv
src = open(PATH, encoding='utf-8').read()
out = src

MARK = '# ---- design v2 (2026-09): cache / 404 ----'
if MARK in out:
    print('already patched'); sys.exit(0)

block = '''
    %s
    error_page 404 /404.html;
    location ^~ /data/ { expires 10m; }
    location ~* \\.(?:css|js)$ { expires 1h; }
    location ~* \\.(?:webp|png|jpg|jpeg|gif|svg|ico|woff2?)$ { expires 30d; }
''' % MARK

# location / { ... } の直後に挿入（最初の server ブロック = 443）
m = re.search(r'    location / \{\n        try_files \$uri \$uri/ =404;\n    \}\n', out)
if not m:
    print('ERROR: location / block not found'); sys.exit(1)
out = out[:m.end()] + block + out[m.end():]

# gzip 設定
if 'gzip_vary' not in out:
    out = out.replace('    gzip on;\n', '    gzip on;\n    gzip_vary on;\n    gzip_comp_level 5;\n    gzip_min_length 1024;\n', 1)

# mt-static は prefix 優先（^~）にして確実に alias を使う
out = out.replace("    location /mt/mt-static {", "    location ^~ /mt/mt-static {")

if not APPLY:
    print('DRY-RUN diff:')
    import difflib
    sys.stdout.writelines(difflib.unified_diff(src.splitlines(True), out.splitlines(True), 'portal.conf', 'portal.conf(new)'))
    sys.exit(0)

bak = PATH + '.bak.' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copyfile(PATH, bak)
open(PATH, 'w', encoding='utf-8').write(out)
print('patched. backup:', bak)
