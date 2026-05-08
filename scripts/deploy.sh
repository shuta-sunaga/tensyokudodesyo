#!/bin/bash
# =============================================================
# deploy.sh - MT管理ファイル保護付きSCPデプロイスクリプト
#
# 使い方:
#   bash scripts/deploy.sh file1 file2 ...
#   bash scripts/deploy.sh public_html/js/prefecture-page.js public_html/css/style.css
#
# site.config.yaml の deploy 設定を使用
# =============================================================

set -euo pipefail

# --- 設定 ---
REMOTE_USER="ec2-user"
REMOTE_HOST="13.230.204.170"
REMOTE_PATH="/var/www/html/"
KEY_FILE="$HOME/.ssh/tensyoku-portal.pem"
SCP_OPTS="-i $KEY_FILE -o StrictHostKeyChecking=no"

# --- MT管理ファイルのブロックリスト（正規表現パターン） ---
# これらのパスに一致するファイルはデプロイ禁止
# 都道府県を新規追加するときは PREFECTURE_DIRS に追記すること
PREFECTURE_DIRS="(shiga|shizuoka)"
BLOCKED_PATTERNS=(
    # 都道府県ページ（MT再構築で生成）
    "public_html/${PREFECTURE_DIRS}/index\.html"
    "public_html/${PREFECTURE_DIRS}/jobs/.*\.html"
    # トップページ・一覧ページ
    "public_html/index\.html"
    "public_html/interviews/index\.html"
    "public_html/companies/index\.html"
    "public_html/knowhow/index\.html"
    # 詳細ページ（MT生成分）— パイプライン生成の knowhow-NNN.html は許可
    "public_html/interviews/detail/.*\.html"
    "public_html/companies/detail/.*\.html"
    # MT生成JSON
    "public_html/data/knowhow-mt\.json"
    # ヘッダー/フッター（MT生成）
    "public_html/includes/header\.html"
    "public_html/includes/footer\.html"
    # 都道府県別データJSON（MT生成）
    "public_html/data/jobs/.*\.json"
    "public_html/data/interviews/.*\.json"
    "public_html/data/companies/.*\.json"
)

# ノウハウ詳細はパイプライン生成分（knowhow-NNN.html）のみ許可
# MT生成分（数字のみ.html: 1.html, 2.html等）はブロック
BLOCKED_PATTERNS+=("public_html/knowhow/detail/[0-9]+\.html")

# --- 引数チェック ---
if [ $# -eq 0 ]; then
    echo "エラー: デプロイするファイルを指定してください"
    echo "使い方: bash scripts/deploy.sh <file1> [file2] ..."
    echo ""
    echo "例:"
    echo "  bash scripts/deploy.sh public_html/js/prefecture-page.js"
    echo "  bash scripts/deploy.sh public_html/css/style.css public_html/js/main.js"
    exit 1
fi

# --- ブロックチェック ---
BLOCKED_FILES=()
ALLOWED_FILES=()

for filepath in "$@"; do
    # public_html/ プレフィックスの正規化
    normalized="$filepath"

    blocked=false
    for pattern in "${BLOCKED_PATTERNS[@]}"; do
        if echo "$normalized" | grep -qE "^${pattern}$"; then
            blocked=true
            break
        fi
    done

    if $blocked; then
        BLOCKED_FILES+=("$filepath")
    else
        ALLOWED_FILES+=("$filepath")
    fi
done

# ブロックされたファイルがあれば表示して中止
if [ ${#BLOCKED_FILES[@]} -gt 0 ]; then
    echo "=========================================="
    echo "  MT管理ファイルのデプロイをブロックしました"
    echo "=========================================="
    echo ""
    echo "以下のファイルはMT（Movable Type）が管理するため、"
    echo "SCPデプロイで上書きできません："
    echo ""
    for f in "${BLOCKED_FILES[@]}"; do
        echo "  x $f"
    done
    echo ""
    echo "MT管理ファイルの変更手順："
    echo "  1. mt-template/*.mtml を修正"
    echo "  2. MT管理画面にテンプレートをコピー"
    echo "  3. MT管理画面で再構築"
    echo ""

    if [ ${#ALLOWED_FILES[@]} -gt 0 ]; then
        echo "デプロイ可能なファイル:"
        for f in "${ALLOWED_FILES[@]}"; do
            echo "  o $f"
        done
        echo ""
        read -p "ブロックされたファイルを除外して続行しますか？ (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "デプロイを中止しました"
            exit 1
        fi
    else
        echo "デプロイ可能なファイルがありません。中止します。"
        exit 1
    fi
fi

# --- デプロイ実行 ---
if [ ${#ALLOWED_FILES[@]} -eq 0 ]; then
    echo "デプロイするファイルがありません"
    exit 0
fi

echo ""
echo "デプロイ開始..."
echo "対象: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
echo ""

FAILED=0
for filepath in "${ALLOWED_FILES[@]}"; do
    # public_html/ からの相対パスをリモートパスに変換
    remote_subpath="${filepath#public_html/}"
    remote_dir=$(dirname "$remote_subpath")

    # リモートディレクトリが存在することを確認
    if [ "$remote_dir" != "." ]; then
        ssh $SCP_OPTS "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_PATH}${remote_dir}" 2>/dev/null || true
    fi

    # SCP実行
    if scp $SCP_OPTS "$filepath" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}${remote_subpath}" 2>/dev/null; then
        echo "  OK $filepath -> ${remote_subpath}"
    else
        echo "  NG $filepath"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
if [ $FAILED -eq 0 ]; then
    echo "デプロイ完了 (${#ALLOWED_FILES[@]}ファイル)"
else
    echo "デプロイ完了 (成功: $((${#ALLOWED_FILES[@]} - FAILED)), 失敗: $FAILED)"
    exit 1
fi
