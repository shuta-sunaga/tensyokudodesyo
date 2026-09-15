#!/usr/bin/env python3
"""
プレビュー環境用: MT の新テンプレ（jobs-latest-json / jobs-summary-json）と同じ形の JSON を
既存の data/jobs/{pref}.json から生成する。本番では MT が生成するので、これはプレビュー専用。

  python3 make-feeds.py /var/www/preview-v2
"""
import glob, json, os, sys, datetime

root = sys.argv[1] if len(sys.argv) > 1 else '/var/www/preview-v2'
prefs = json.load(open(os.path.join(root, 'data', 'prefectures.json'), encoding='utf-8'))['prefectures']
name_by_id = {p['id']: p['name'] for p in prefs}
BASE = 'https://www.tensyokudodesyo.com/'

latest, summary = [], []
for f in sorted(glob.glob(os.path.join(root, 'data', 'jobs', '*.json'))):
    pid = os.path.splitext(os.path.basename(f))[0]
    try:
        d = json.load(open(f, encoding='utf-8'))
    except Exception as e:
        print('skip', f, e); continue
    jobs = d.get('jobs') or []
    pname = d.get('prefecture') or name_by_id.get(pid, pid)
    summary.append({'name': pname, 'url': BASE + pid + '/', 'count': len(jobs)})
    for j in jobs:
        latest.append({
            'id': j.get('id'), 'title': j.get('title', ''), 'postDate': j.get('postDate', ''),
            'company': j.get('company', ''), 'prefecture': pname, 'city': j.get('city', ''),
            'salary': j.get('salary', ''), 'category': j.get('category', ''),
            'employmentType': j.get('employmentType', ''), 'conditions': j.get('conditions', '') or '',
            'detailUrl': BASE + (j.get('detailUrl') or '').lstrip('/'),
        })

latest.sort(key=lambda j: (j['postDate'], j['id'] or 0), reverse=True)
now = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
json.dump({'generated': now, 'jobs': latest[:24]}, open(os.path.join(root, 'data', 'jobs-latest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
order = [p['id'] for p in prefs]
summary.sort(key=lambda s: order.index(s['url'].rstrip('/').split('/')[-1]) if s['url'].rstrip('/').split('/')[-1] in order else 99)
json.dump({'generated': now, 'prefectures': summary}, open(os.path.join(root, 'data', 'jobs-summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('jobs-latest.json: %d jobs (top 24 of %d), jobs-summary.json: %d prefectures, total %d' % (min(24, len(latest)), len(latest), len(summary), sum(s['count'] for s in summary)))
