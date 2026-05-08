#!/bin/bash
# =============================================================
# MT全子サイトのテンプレートを一括置換するスクリプト
#
# 用途:
#   LINEで相談 → /contact/ ・ お問い合わせ → 転職相談 等の置換を、
#   全子サイト (blog_id) のmt_templateテーブルに一括適用する。
#
# 動作:
#   1. mt_template テーブルのバックアップ作成
#   2. 文字列レベルの REPLACE() で一括置換
#   3. 影響件数のレポート
#   4. (--rebuild オプションで) MT再構築をキック
#
# 使い方:
#   bash scripts/mt-bulk-replace.sh           # DRY-RUN (件数だけ)
#   bash scripts/mt-bulk-replace.sh --apply   # 実行
#   bash scripts/mt-bulk-replace.sh --apply --rebuild  # 実行 + 全再構築
# =============================================================

set -euo pipefail

REMOTE_USER="ec2-user"
REMOTE_HOST="13.230.204.170"
KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"
SSH_OPTS="-i $KEY_FILE -o StrictHostKeyChecking=no"

APPLY=false
REBUILD=false
for arg in "$@"; do
    case "$arg" in
        --apply)   APPLY=true ;;
        --rebuild) REBUILD=true ;;
    esac
done

echo "=========================================="
echo "  MT bulk template replacement"
echo "=========================================="
echo "Mode    : $($APPLY && echo APPLY || echo DRY-RUN)"
echo "Rebuild : $REBUILD"
echo ""

# 置換ペアリスト (順序が意味を持つので複数 SQL を順次実行)
# 形式: "FROM_STRING|TO_STRING|COMMENT"
REPLACEMENTS=(
    "https://lin.ee/xZ1Tksm|/contact/|LINE URL"
    "btn btn-line btn-lg|btn btn-primary btn-lg|btn class lg"
    "btn btn-line|btn btn-primary|btn class"
    "友だち追加して相談する|お問い合わせはこちら|btn label"
    "LINEで相談する|お問い合わせはこちら|btn label2"
    "LINEで気軽に転職相談|転職のご相談はこちらから|copy1"
    "LINEで気軽にご相談ください|お気軽にご相談ください|copy2"
    "LINEで相談|お問い合わせ|inline"
    "お問い合わせフォームへ|転職相談はこちら|cta button"
    "お問い合わせフォーム|転職相談フォーム|form name"
    "お問い合わせいただ|ご相談いただ|sentence"
    "お問い合わせありがとうございます|ご相談ありがとうございます|gratitude"
    "お問い合わせありがとうございました|ご相談ありがとうございました|gratitude2"
    "お問い合わせ|転職相談|noun"
)

BACKUP_TABLE="mt_template_backup_$(date +%Y%m%d_%H%M%S)"

# DB接続情報を取得する SSH コマンドの組み立て
DB_VARS_CMD='cd /var/www/mt && DB=$(grep "^Database " mt-config.cgi | awk "{print \$2}") && USER=$(grep "^DBUser " mt-config.cgi | awk "{print \$2}") && PASS=$(grep "^DBPassword " mt-config.cgi | awk "{print \$2}")'

if ! $APPLY; then
    echo "=== DRY-RUN: 各置換パターンの影響件数 ==="
    SQL=""
    for entry in "${REPLACEMENTS[@]}"; do
        IFS='|' read -r FROM TO COMMENT <<< "$entry"
        FROM_ESC=$(printf '%s' "$FROM" | sed "s/'/''/g")
        SQL="${SQL}SELECT '${COMMENT} (${FROM} -> ${TO})' AS pattern, COUNT(*) AS templates FROM mt_template WHERE template_text LIKE '%${FROM_ESC}%';"$'\n'
    done
    ssh $SSH_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "$DB_VARS_CMD && mysql -u\$USER -p\$PASS \$DB -t -e \"$SQL\" 2>&1 | grep -v 'mysql: \[Warning\]'"
    echo ""
    echo "DRY-RUN 終了。--apply で実行。"
    exit 0
fi

# === APPLY ===
echo "=== Step 1: バックアップ ($BACKUP_TABLE) ==="
ssh $SSH_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "$DB_VARS_CMD && mysql -u\$USER -p\$PASS \$DB -e 'CREATE TABLE $BACKUP_TABLE LIKE mt_template; INSERT INTO $BACKUP_TABLE SELECT * FROM mt_template;' 2>&1 | grep -v 'mysql: \[Warning\]'"
echo "✓ バックアップ完了 ($BACKUP_TABLE)"
echo ""

echo "=== Step 2: 一括置換 ==="
# 全置換 SQL を1つの SET expression にネスト (順序: 後ろの REPLACE が外側)
# ネストすると可読性悪いので、UPDATEを順次実行する方式に。
TOTAL_AFFECTED=0
for entry in "${REPLACEMENTS[@]}"; do
    IFS='|' read -r FROM TO COMMENT <<< "$entry"
    FROM_ESC=$(printf '%s' "$FROM" | sed "s/'/''/g")
    TO_ESC=$(printf '%s' "$TO" | sed "s/'/''/g")
    OUT=$(ssh $SSH_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "$DB_VARS_CMD && mysql -u\$USER -p\$PASS \$DB -e \"UPDATE mt_template SET template_text = REPLACE(template_text, '$FROM_ESC', '$TO_ESC'), modified_on = NOW() WHERE template_text LIKE '%${FROM_ESC}%';\" 2>&1 | grep -v 'mysql: \[Warning\]'")
    AFFECTED=$(ssh $SSH_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "$DB_VARS_CMD && mysql -u\$USER -p\$PASS \$DB -e 'SELECT ROW_COUNT();' -BN 2>/dev/null")
    echo "  $COMMENT: '$FROM' -> '$TO'"
done
echo ""
echo "✓ 全置換完了"
echo ""

echo "=== Step 3: 残存パターン確認 ==="
SQL=""
for entry in "${REPLACEMENTS[@]}"; do
    IFS='|' read -r FROM TO COMMENT <<< "$entry"
    FROM_ESC=$(printf '%s' "$FROM" | sed "s/'/''/g")
    SQL="${SQL}SELECT '${COMMENT} (${FROM})' AS leftover, COUNT(*) AS remaining FROM mt_template WHERE template_text LIKE '%${FROM_ESC}%';"$'\n'
done
ssh $SSH_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "$DB_VARS_CMD && mysql -u\$USER -p\$PASS \$DB -t -e \"$SQL\" 2>&1 | grep -v 'mysql: \[Warning\]'"
echo ""

if $REBUILD; then
    echo "=== Step 4: 全再構築 ==="
    echo "(MT管理画面で『システム > すべて再構築』をクリックしてください)"
    echo "もしくは下記コマンドをサーバーで実行:"
    echo "  cd /var/www/mt && perl tools/rebuild-pages -all"
fi

echo ""
echo "=========================================="
echo "完了。動作確認後、不具合があればロールバック可:"
echo "  mysql ... -e 'TRUNCATE mt_template; INSERT INTO mt_template SELECT * FROM $BACKUP_TABLE;'"
echo "=========================================="
