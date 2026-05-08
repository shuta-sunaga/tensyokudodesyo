#!/bin/bash
# v2: 1回の SSH 接続で全 SQL を実行する高速版

set -euo pipefail

REMOTE_USER="ec2-user"
REMOTE_HOST="13.230.204.170"
KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"

APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

# ヒアドキュメントで全SQLを生成
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP="mt_template_backup_${TIMESTAMP}"

if $APPLY; then
    SQL=$(cat <<EOF
-- バックアップ
DROP TABLE IF EXISTS ${BACKUP};
CREATE TABLE ${BACKUP} LIKE mt_template;
INSERT INTO ${BACKUP} SELECT * FROM mt_template;
SELECT '-- backup done' AS status;

-- 一括置換 (順序が大事: 長いマッチを先に)
UPDATE mt_template SET template_text = REPLACE(template_text, 'https://lin.ee/xZ1Tksm', '/contact/'), template_modified_on = NOW() WHERE template_text LIKE '%https://lin.ee/xZ1Tksm%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'btn btn-line btn-lg', 'btn btn-primary btn-lg'), template_modified_on = NOW() WHERE template_text LIKE '%btn btn-line btn-lg%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'btn btn-line', 'btn btn-primary'), template_modified_on = NOW() WHERE template_text LIKE '%btn btn-line%';
UPDATE mt_template SET template_text = REPLACE(template_text, '友だち追加して相談する', 'お問い合わせはこちら'), template_modified_on = NOW() WHERE template_text LIKE '%友だち追加して相談する%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'LINEで相談する', 'お問い合わせはこちら'), template_modified_on = NOW() WHERE template_text LIKE '%LINEで相談する%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'LINEで気軽に転職相談', '転職のご相談はこちらから'), template_modified_on = NOW() WHERE template_text LIKE '%LINEで気軽に転職相談%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'LINEで気軽にご相談ください', 'お気軽にご相談ください'), template_modified_on = NOW() WHERE template_text LIKE '%LINEで気軽にご相談ください%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'LINEで相談', 'お問い合わせ'), template_modified_on = NOW() WHERE template_text LIKE '%LINEで相談%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせフォームへ', '転職相談はこちら'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせフォームへ%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせフォーム', '転職相談フォーム'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせフォーム%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせいただ', 'ご相談いただ'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせいただ%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせありがとうございます', 'ご相談ありがとうございます'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせありがとうございます%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせありがとうございました', 'ご相談ありがとうございました'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせありがとうございました%';
UPDATE mt_template SET template_text = REPLACE(template_text, 'お問い合わせ', '転職相談'), template_modified_on = NOW() WHERE template_text LIKE '%お問い合わせ%';

-- 残存パターン確認
SELECT '-- leftover check --' AS status;
SELECT 'lin.ee'          AS pat, COUNT(*) c FROM mt_template WHERE template_text LIKE '%lin.ee/xZ1Tksm%';
SELECT 'btn-line'        AS pat, COUNT(*) c FROM mt_template WHERE template_text LIKE '%btn-line%';
SELECT 'LINEで'          AS pat, COUNT(*) c FROM mt_template WHERE template_text LIKE '%LINEで%';
SELECT 'お問い合わせ'    AS pat, COUNT(*) c FROM mt_template WHERE template_text LIKE '%お問い合わせ%';
SELECT 'LINE_Brand_icon' AS pat, COUNT(*) c FROM mt_template WHERE template_text LIKE '%LINE_Brand_icon%';
SELECT '-- done --' AS status;
EOF
)
    echo "=== APPLY: バックアップ${BACKUP} + 一括置換 ==="
else
    SQL=$(cat <<'EOF'
-- DRY-RUN: 影響件数のみ
SELECT 'lin.ee'                                AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%https://lin.ee/xZ1Tksm%';
SELECT 'btn-line'                              AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%btn-line%';
SELECT '友だち追加'                            AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%友だち追加%';
SELECT 'LINEで'                                AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%LINEで%';
SELECT 'お問い合わせ'                          AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%お問い合わせ%';
SELECT 'LINE_Brand_icon'                       AS pattern, COUNT(*) c FROM mt_template WHERE template_text LIKE '%LINE_Brand_icon%';
EOF
)
    echo "=== DRY-RUN ==="
fi

ssh -i $KEY_FILE -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} \
    "cd /var/www/mt && DB=\$(grep '^Database ' mt-config.cgi | awk '{print \$2}') && U=\$(grep '^DBUser ' mt-config.cgi | awk '{print \$2}') && P=\$(grep '^DBPassword ' mt-config.cgi | awk '{print \$2}') && mysql -u\"\$U\" -p\"\$P\" \"\$DB\" -t" <<< "$SQL" 2>&1 | grep -v 'mysql: \[Warning\]\|WARNING\|post-quantum\|store now\|may need to be upgraded\|^$'

if $APPLY; then
    echo ""
    echo "✅ 完了。ロールバックは:"
    echo "  mysql ... -e 'TRUNCATE mt_template; INSERT INTO mt_template SELECT * FROM ${BACKUP};'"
fi
