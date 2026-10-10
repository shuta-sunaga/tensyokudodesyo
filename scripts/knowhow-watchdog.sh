#!/bin/bash
# 毎朝9時のノウハウ記事自動生成が当日中に完了したかを確認し、未完了なら macOS 通知で知らせる
REPO="/Users/sunaga.shuta/Documents/dev/tensyokudodesyo"
LOG="$HOME/Library/Logs/knowhow-watchdog.log"
today=$(date +%Y-%m-%d)
# クラウド（/schedule ルーティン）が push するため、リモートの master を確認する
if ! git -C "$REPO" fetch -q origin master 2>>"$LOG"; then
  echo "$(date '+%F %T') WARN: git fetch 失敗。ローカルのみで判定" >> "$LOG"
fi
count=$(git -C "$REPO" log origin/master master --since="$today 00:00" --grep="転職ノウハウ記事" --oneline 2>/dev/null | sort -u | wc -l | tr -d ' ')
if [ "$count" -ge 1 ]; then
  echo "$(date '+%F %T') OK ($count commit)" >> "$LOG"
else
  echo "$(date '+%F %T') NG: 本日のノウハウ記事コミットなし" >> "$LOG"
  osascript -e 'display notification "本日9時のノウハウ記事自動生成が完了していません。Claude Code セッションを確認してください。" with title "転職どうでしょう: 定時実行失敗" sound name "Basso"'
  osascript -e 'display dialog "本日9時のノウハウ記事自動生成が12:00時点で完了していません。\nClaude Code セッションが終了・停止していないか確認してください。" with title "転職どうでしょう: 定時実行失敗" buttons {"OK"} with icon caution giving up after 86400' >/dev/null 2>&1 &
fi
