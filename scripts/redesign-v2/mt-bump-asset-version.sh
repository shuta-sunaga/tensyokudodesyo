#!/bin/bash
# =============================================================
# mt-bump-asset-version.sh — MT テンプレート内の CSS/JS 参照に ?v=YYYYMMDD を付ける（キャッシュバスター）
#
#   bash scripts/redesign-v2/mt-bump-asset-version.sh            # DRY-RUN（対象件数）
#   bash scripts/redesign-v2/mt-bump-asset-version.sh --apply [20260915]
#
# 対象: css/style.css" css/article-detail.css" js/includes.js" js/main.js" js/categories.js"
#       js/related-articles.js" js/article-toc.js"（閉じ引用符直前 = 未バージョンのものだけ。冪等）
# 反映には再構築が必要（scripts/mt-rebuild-all-force.pl）。mt_template のバックアップは mt-apply-v2.sh --apply が取る。
# =============================================================
set -euo pipefail
REMOTE_USER="ec2-user"; REMOTE_HOST="13.230.204.170"; KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"
APPLY=false; [[ "${1:-}" == "--apply" ]] && APPLY=true
V="${2:-20260915}"
ASSETS=(css/style.css css/article-detail.css js/includes.js js/main.js js/categories.js js/related-articles.js js/article-toc.js)

SQL=""
for a in "${ASSETS[@]}"; do
    if $APPLY; then
        SQL+="UPDATE mt_template SET template_text = REPLACE(template_text, '${a}\"', '${a}?v=${V}\"'), template_modified_on = NOW() WHERE template_text LIKE '%${a}\"%';
"
    fi
    SQL+="SELECT '${a}' AS asset, SUM(template_text LIKE '%${a}\"%') AS unversioned, SUM(template_text LIKE '%${a}?v=${V}\"%') AS versioned FROM mt_template;
"
done
echo "=== $($APPLY && echo APPLY || echo DRY-RUN) (v=${V}) ==="
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
    "cd /var/www/mt && DB=\$(grep '^Database ' mt-config.cgi | awk '{print \$2}') && U=\$(grep '^DBUser ' mt-config.cgi | awk '{print \$2}') && P=\$(grep '^DBPassword ' mt-config.cgi | awk '{print \$2}') && H=\$(grep '^DBHost ' mt-config.cgi | awk '{print \$2}') && mysql -h\"\$H\" -u\"\$U\" -p\"\$P\" \"\$DB\" --default-character-set=utf8mb4 -t" <<< "$SQL" 2>&1 | grep -v 'mysql: \[Warning\]\|WARNING\|post-quantum\|store now\|may need to be upgraded\|^$'
