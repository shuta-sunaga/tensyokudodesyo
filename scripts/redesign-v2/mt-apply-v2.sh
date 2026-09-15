#!/bin/bash
# =============================================================
# mt-apply-v2.sh — デザイン v2 の MT テンプレートを本番に反映する（ローカルから実行）
#
#   bash scripts/redesign-v2/mt-apply-v2.sh            # DRY-RUN
#   bash scripts/redesign-v2/mt-apply-v2.sh --apply    # mt_template をバックアップ → 更新 → index 再構築
#
# 手順:
#   1. mt-template/{index-html,prefecture-page,jobs-latest-json,jobs-summary-json}.mtml と
#      mt-apply-v2.pl を EC2 の /tmp/v2/ へ scp
#   2. --apply 時は mt_template テーブルを mt_template_backup_YYYYMMDD_HHMMSS にコピー
#   3. perl mt-apply-v2.pl [--apply --rebuild]
#
# 静的アセット（css/js/includes/assets/404.html 等）は別途 bash scripts/deploy.sh で先にデプロイしておくこと。
# =============================================================
set -euo pipefail

REMOTE_USER="ec2-user"
REMOTE_HOST="13.230.204.170"
KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"
SSH="ssh -i $KEY_FILE -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST}"
SCP="scp -i $KEY_FILE -o StrictHostKeyChecking=no"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

echo "=== upload templates to /tmp/v2 ==="
$SSH "mkdir -p /tmp/v2"
$SCP "$ROOT/mt-template/index-html.mtml" "$ROOT/mt-template/prefecture-page.mtml" \
     "$ROOT/mt-template/jobs-latest-json.mtml" "$ROOT/mt-template/jobs-summary-json.mtml" \
     "$ROOT/scripts/redesign-v2/mt-apply-v2.pl" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/v2/"

if $APPLY; then
    TS=$(date +%Y%m%d_%H%M%S)
    echo "=== backup mt_template → mt_template_backup_${TS} ==="
    $SSH "cd /var/www/mt && DB=\$(grep '^Database ' mt-config.cgi | awk '{print \$2}') && U=\$(grep '^DBUser ' mt-config.cgi | awk '{print \$2}') && P=\$(grep '^DBPassword ' mt-config.cgi | awk '{print \$2}') && H=\$(grep '^DBHost ' mt-config.cgi | awk '{print \$2}') && mysql -h\"\$H\" -u\"\$U\" -p\"\$P\" \"\$DB\" -e 'CREATE TABLE mt_template_backup_${TS} LIKE mt_template; INSERT INTO mt_template_backup_${TS} SELECT * FROM mt_template; SELECT COUNT(*) AS backed_up FROM mt_template_backup_${TS};'" 2>&1 | grep -v 'Warning\|post-quantum\|store now\|may need to be upgraded'
    echo "=== apply + rebuild ==="
    $SSH "cd /var/www/mt && perl /tmp/v2/mt-apply-v2.pl --apply --rebuild" 2>&1 | grep -v 'post-quantum\|store now\|may need to be upgraded'
    echo ""
    echo "ロールバック: mysql ... -e 'TRUNCATE mt_template; INSERT INTO mt_template SELECT * FROM mt_template_backup_${TS};' → perl scripts/mt-rebuild-all-force.pl"
else
    echo "=== DRY-RUN ==="
    $SSH "cd /var/www/mt && perl /tmp/v2/mt-apply-v2.pl" 2>&1 | grep -v 'post-quantum\|store now\|may need to be upgraded'
fi
