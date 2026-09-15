#!/usr/bin/env python3
"""
プレビュー環境用: MT の新テンプレと同じ形の JSON を、本番の（detail 付き）求人 JSON から生成する。
本番では MT が生成するので、これはプレビュー専用。

  python3 make-feeds.py <preview_root> [source_root]
     preview_root: 例 /var/www/preview-v2
     source_root : 本番の detail 付き JSON がある root（既定 /var/www/html）

生成物（preview_root/data 配下）:
  jobs-latest.json           全県横断の新着 24 件（親サイトの jobs-latest-json.mtml 相当）
  jobs-summary.json          県別件数（jobs-summary-json.mtml 相当）
  jobs/{id}.json             一覧 JSON schema 2（jobs-child-json.mtml 相当。tags を正規表現で判定）
  jobs/{id}.kw.json          キーワード索引（jobs-child-kw-json.mtml 相当。仕事内容 300 字 + 求める人材 150 字）
"""
import glob, json, os, re, sys, datetime

root = sys.argv[1] if len(sys.argv) > 1 else '/var/www/preview-v2'
src = sys.argv[2] if len(sys.argv) > 2 else '/var/www/html'
prefs = json.load(open(os.path.join(root, 'data', 'prefectures.json'), encoding='utf-8'))['prefectures']
name_by_id = {p['id']: p['name'] for p in prefs}
BASE = 'https://www.tensyokudodesyo.com/'

# job-taxonomy.js / jobs-child-json.mtml と同じ判定
TAGS = [
    ('mikeiken',  re.compile(r'未経験(歓迎|OK|ＯＫ|可|者歓迎|でも|から|・)')),
    ('donichi',   re.compile(r'土日祝(休|日)|土・日・祝|完全週休2日制（土日')),
    ('nenkyu120', re.compile(r'年間?休日\s*1[2-9]\d\s*日|年休\s*1[2-9]\d')),
    ('zangyo',    re.compile(r'残業(少なめ|なし|ほぼなし|ゼロ|は?月平均?\s*(10|15|20)時間(未満|以下|程度)|月\s*(10|15|20)時間(未満|以下|程度))')),
    ('tenkin',    re.compile(r'転勤(なし|無し|は?ありません)')),
    ('shikaku',   re.compile(r'資格取得(支援|補助|制度)|資格支援')),
    ('kenshu',    re.compile(r'研修(充実|制度|期間|あり)|教育制度|OJT')),
    ('shataku',   re.compile(r'社宅|寮(完備|あり|制度)')),
    ('car',       re.compile(r'車通勤|マイカー通勤')),
    ('remote',    re.compile(r'リモート|在宅|テレワーク')),
    ('uiturn',    re.compile(r'U・?Iターン|UIターン|Ｕ・?Ｉターン|Iターン')),
    ('gakureki',  re.compile(r'学歴不問')),
]
HAY_FIELDS = ['description', 'requirements', 'location', 'workHours', 'salaryDetail', 'benefits', 'holidays', 'recommendPoint1', 'recommendPoint2', 'recommendPoint3']
TAG_RE = re.compile(r'<[^>]+>')

def strip_html(s):
    return TAG_RE.sub('', s or '')

latest, summary = [], []
os.makedirs(os.path.join(root, 'data', 'jobs'), exist_ok=True)
for f in sorted(glob.glob(os.path.join(src, 'data', 'jobs', '*.json'))):
    base = os.path.basename(f)
    if base.endswith('.kw.json'):
        continue
    pid = os.path.splitext(base)[0]
    try:
        d = json.load(open(f, encoding='utf-8'))
    except Exception as e:
        print('skip', f, e); continue
    jobs = d.get('jobs') or []
    pname = d.get('prefecture') or name_by_id.get(pid, pid)
    summary.append({'name': pname, 'url': BASE + pid + '/', 'count': len(jobs)})

    light, kw = [], {}
    for j in jobs:
        det = j.get('detail') or {}
        hay = ' '.join([j.get('title', ''), j.get('conditions') or '', j.get('keywords') or ''] + [str(det.get(k) or '') for k in HAY_FIELDS])
        tags = ''.join(t + ',' for t, rx in TAGS if rx.search(hay))
        light.append({
            'id': j.get('id'), 'title': j.get('title', ''), 'postDate': j.get('postDate', ''),
            'company': j.get('company', ''), 'city': j.get('city', ''), 'salary': j.get('salary', ''),
            'category': j.get('category', ''), 'employmentType': j.get('employmentType', ''),
            'conditions': j.get('conditions') or '', 'tags': tags, 'detailUrl': j.get('detailUrl', ''),
        })
        kw[str(j.get('id'))] = (strip_html(det.get('description'))[:300] + ' ' + strip_html(det.get('requirements'))[:150]).strip()
        latest.append({
            'id': j.get('id'), 'title': j.get('title', ''), 'postDate': j.get('postDate', ''),
            'company': j.get('company', ''), 'prefecture': pname, 'city': j.get('city', ''),
            'salary': j.get('salary', ''), 'category': j.get('category', ''),
            'employmentType': j.get('employmentType', ''), 'conditions': j.get('conditions', '') or '',
            'detailUrl': BASE + (j.get('detailUrl') or '').lstrip('/'),
        })
    now = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
    json.dump({'schema': 2, 'prefecture': pname, 'prefecture_id': pid, 'lastUpdated': d.get('lastUpdated') or now, 'jobs': light},
              open(os.path.join(root, 'data', 'jobs', pid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(kw, open(os.path.join(root, 'data', 'jobs', pid + '.kw.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

latest.sort(key=lambda j: (j['postDate'], j['id'] or 0), reverse=True)
now = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
json.dump({'generated': now, 'jobs': latest[:24]}, open(os.path.join(root, 'data', 'jobs-latest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
order = [p['id'] for p in prefs]
summary.sort(key=lambda s: order.index(s['url'].rstrip('/').split('/')[-1]) if s['url'].rstrip('/').split('/')[-1] in order else 99)
json.dump({'generated': now, 'prefectures': summary}, open(os.path.join(root, 'data', 'jobs-summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
sizes = sorted(((os.path.getsize(p), os.path.basename(p)) for p in glob.glob(os.path.join(root, 'data', 'jobs', '*.json'))), reverse=True)[:4]
print('jobs-latest.json: %d jobs (top 24 of %d), jobs-summary.json: %d prefectures, total %d' % (min(24, len(latest)), len(latest), len(summary), sum(s['count'] for s in summary)))
print('largest schema-2 files:', ', '.join('%s %dKB' % (n, s // 1024) for s, n in sizes))
