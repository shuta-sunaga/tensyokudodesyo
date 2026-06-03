# -*- coding: utf-8 -*-
import json, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

def vjson(s):
    try:
        json.loads(s); return True
    except Exception:
        return False

_catdata = json.load(open('public_html/data/categories/knowhow-categories.json', encoding='utf-8'))
_catlist = _catdata['categories'] if isinstance(_catdata, dict) else _catdata
cats = set(c['id'] for c in _catlist)
kj = json.load(open('public_html/data/knowhow.json', encoding='utf-8'))['articles']
sm = open('public_html/sitemap.xml', encoding='utf-8').read()
forbidden = ['補助金・助成金']
arts = {a['id']: a for a in kj}
print('記事 | JSON-LD | 画像 | カテゴリ | 文字数 | 禁止語 | OGP | 内部Link | sitemap | DOM')
for n in (158, 159, 160):
    f = f'public_html/knowhow/detail/knowhow-{n}.html'
    h = open(f, encoding='utf-8').read()
    lds = re.findall(r'application/ld\+json">\s*(\{.*?\})\s*</script>', h, re.S)
    ldok = 'OK' if len(lds) >= 2 and all(vjson(x) for x in lds) else 'NG'
    imok = 'OK' if os.path.exists(f'public_html/assets/knowhow-{n}.webp') else 'NG'
    cat = arts[n]['category']; catok = 'OK' if cat in cats else 'NG'
    m = re.search(r'<div class="article-body" id="articleBody">(.*?)</div>\s*<!-- CTA', h, re.S)
    cc = len(re.sub(r'\s', '', re.sub(r'<[^>]+>', '', m.group(1))))
    ccok = str(cc) + ('OK' if 5000 <= cc <= 7000 else 'NG')
    fbok = 'OK' if not any(w in h for w in forbidden) else 'NG'
    ogok = 'OK' if all(p in h for p in ['og:title', 'og:description', 'og:image']) else 'NG'
    duok = 'OK' if arts[n]['detailUrl'] == f'/knowhow/detail/knowhow-{n}.html' else 'NG'
    smok = 'OK' if f'knowhow-{n}.html' in sm else 'NG'
    domok = 'OK' if '<div class="article-body" id="articleBody">' in h and 'article-content' not in h else 'NG'
    print(f'{n} | {ldok} | {imok} | {catok} | {ccok} | {fbok} | {ogok} | {duok} | {smok} | {domok}')
