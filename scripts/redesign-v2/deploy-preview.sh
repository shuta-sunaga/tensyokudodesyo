#!/bin/bash
# =============================================================
# deploy-preview.sh — デザイン v2 のプレビュー環境（https://www.tensyokudodesyo.com:8443/）を作る／更新する
#
#   bash scripts/redesign-v2/deploy-preview.sh --setup USER PASSWORD   # 初回: ディレクトリ作成・本番コピー・Basic認証・nginx
#   bash scripts/redesign-v2/deploy-preview.sh                         # 更新: v2 の静的ファイルと生成ページを上書き
#   bash scripts/redesign-v2/deploy-preview.sh --sync-prod             # 本番の最新データ/MTページをプレビューへ再同期してから更新
#
# プレビューは本番 /var/www/html のコピー（インタビュー等の MT 生成ページ・実データ）に
# v2 の静的ファイル（css/js/includes/assets/404）と、MT テンプレから生成した index.html・47県 index.html、
# 新着/件数 JSON（make-feeds.py）を重ねたもの。本番 /var/www/html には一切触れない。
# =============================================================
set -euo pipefail

REMOTE_USER="ec2-user"
REMOTE_HOST="13.230.204.170"
KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"
SSH="ssh -i $KEY_FILE -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST}"
SCP="scp -i $KEY_FILE -o StrictHostKeyChecking=no"
PREVIEW="/var/www/preview-v2"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD="${TMPDIR:-/tmp}/tensyoku-preview-build"

quiet() { grep -v 'post-quantum\|store now\|may need to be upgraded' || true; }

if [[ "${1:-}" == "--setup" ]]; then
    USER_NAME="${2:?usage: --setup USER PASSWORD}"
    PASS="${3:?usage: --setup USER PASSWORD}"
    echo "=== [setup] create ${PREVIEW} as a copy of /var/www/html ==="
    $SSH "sudo mkdir -p ${PREVIEW} && sudo chown ${REMOTE_USER}:${REMOTE_USER} ${PREVIEW} && rsync -a --delete /var/www/html/ ${PREVIEW}/ && du -sh ${PREVIEW}" 2>&1 | quiet
    echo "=== [setup] basic auth + nginx ==="
    $SCP "$ROOT/scripts/redesign-v2/preview-nginx.conf" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/preview-v2.conf" 2>&1 | quiet
    $SSH "sudo htpasswd -bc /etc/nginx/.htpasswd-preview '${USER_NAME}' '${PASS}' && sudo cp /tmp/preview-v2.conf /etc/nginx/conf.d/preview-v2.conf && sudo nginx -t && sudo systemctl reload nginx && echo nginx reloaded" 2>&1 | quiet
fi

if [[ "${1:-}" == "--sync-prod" ]]; then
    echo "=== sync production → preview (data + MT pages) ==="
    $SSH "rsync -a /var/www/html/data/ ${PREVIEW}/data/ && rsync -a /var/www/html/interviews/ ${PREVIEW}/interviews/ && rsync -a /var/www/html/companies/ ${PREVIEW}/companies/ && rsync -a /var/www/html/knowhow/ ${PREVIEW}/knowhow/ && rsync -a /var/www/html/assets/ ${PREVIEW}/assets/ && echo synced" 2>&1 | quiet
fi

echo "=== build index.html + 47 prefecture pages from mt-template ==="
rm -rf "$BUILD"; mkdir -p "$BUILD"
node "$ROOT/scripts/redesign-v2/build-static-from-mtml.mjs" --all --out "$BUILD" | tail -1

echo "=== upload v2 static files + generated pages ==="
( cd "$ROOT/public_html" && tar czf - css/style.css css/contact.css css/client-detail.css css/article-detail.css \
    includes/header.html includes/footer.html \
    js/includes.js js/main.js js/prefecture-page.js js/job-taxonomy.js js/home-v2.js js/data-cache.js js/categories.js js/related-articles.js js/clients-page.js js/client-detail.js js/contact.js js/article-toc.js \
    assets/v2 assets/ogp.png 404.html clients contact terms.html privacy.html ) | $SSH "tar xzf - -C ${PREVIEW}" 2>&1 | quiet
( cd "$BUILD" && tar czf - . ) | $SSH "tar xzf - -C ${PREVIEW}" 2>&1 | quiet

echo "=== generate jobs-latest.json / jobs-summary.json on server ==="
$SCP "$ROOT/scripts/redesign-v2/make-feeds.py" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/make-feeds.py" 2>&1 | quiet
$SSH "python3 /tmp/make-feeds.py ${PREVIEW}" 2>&1 | quiet

echo ""
echo "preview: https://www.tensyokudodesyo.com:8443/"
