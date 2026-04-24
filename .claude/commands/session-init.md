---
description: セッション開始時の一括確認 - プロジェクト概要・メモリ・エージェント・Git・GitHub・環境
---

# セッション初期化チェック

新しい作業セッション開始時に、プロジェクトの状態を一括把握するためのチェックリスト。

## 実行内容

以下を順に実行し、結果を簡潔にサマリーして報告する。

### 1. プロジェクト概要の把握

```bash
# CLAUDE.md を読み込む（既にセッションコンテキストに含まれている場合はスキップ）
cat CLAUDE.md
```

### 2. メモリファイル全読み込み

```bash
# ~/.claude/projects/ 配下の本プロジェクトのメモリを全読み込み
MEMORY_DIR="$HOME/.claude/projects/C--Users-shuta-Documents-dev-tensyokudodesyo/memory"
ls -la "$MEMORY_DIR"
cat "$MEMORY_DIR"/*.md
```

### 3. Miyabi エージェント稼働状況

```bash
# .env を読み込んで miyabi status を実行
export $(grep -v '^#' .env | grep -v '^$' | xargs) && npx miyabi status
```

### 4. Git 状態

```bash
git branch -a
git status
git log --oneline -10
```

### 5. GitHub Issue/PR 状態

```bash
export $(grep -v '^#' .env | grep -v '^$' | xargs)
gh issue list --limit 20
gh pr list --limit 20
```

### 6. 開発環境

```bash
node -v
npm -v
ls -la .env
ls node_modules 2>/dev/null | head -5 && echo "node_modules: OK" || echo "node_modules: MISSING"
```

## 並行実行

独立したコマンドは Bash ツールの並行呼び出しで同時実行すること。依存関係があるのは `.env` の読み込みが必要な `miyabi status` / `gh` コマンドのみ。

## 出力形式

以下のテーブル形式でサマリーを提示：

```
| カテゴリ | 状態 | 備考 |
|---------|------|------|
| プロジェクト概要 | ✅/❌ | CLAUDE.md から要点 |
| メモリ | ✅/❌ | N 件読み込み |
| Miyabi | ✅/❌ | Open Issues N / Active agents N |
| Git | ✅/❌ | branch / 変更ファイル数 |
| GitHub | ✅/❌ | Open Issues N / Open PRs N |
| 環境 | ✅/❌ | node / .env / node_modules |
```

最後に「次の作業に進める状態」か「要対応項目あり」かを明示する。
