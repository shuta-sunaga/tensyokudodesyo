---
description: Miyabiプロジェクトステータス確認
---

# Miyabiプロジェクトステータス確認

以下の手順を順番に実行してください。

## Step 1: .env 読み込み + miyabi status 実行

```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs) && npx miyabi status
```

## Step 2: 補足情報の取得

Open Issuesの一覧も取得して表示する：

```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs) && gh issue list --state open --limit 20
```

## Step 3: 結果をユーザーに報告

miyabi status の結果と Open Issues 一覧を、見やすいテーブル形式でまとめて報告してください。
