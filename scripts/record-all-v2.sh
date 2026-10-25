#!/bin/zsh
# 全項目を録画v2で撮り直す（並列3）。使い方: scripts/record-all-v2.sh [base] [slug ...]
# 既定の base はローカルの静的ビルド（out/ を /motion-dict で配信している前提）。slug を渡すとその項目だけ。
# ⚠️ 旧版は xargs -I で長いコマンドを組んでいて、macOS では「command line cannot be assembled, too long」で
#    1件も撮らずに終わっていた（最後の done 行だけ出るので成功に見える）。-n 1 で slug を引数に渡す。
cd "${0:A:h}/.."
BASE="${1:-http://localhost:3913/motion-dict}"
shift 2>/dev/null
export NODE_PATH="${MONACA_PW_PATH:-$HOME/projects/mona-cafe/node_modules}"
export BASE
mkdir -p /tmp/rec-all-logs
if (( $# )); then print -l -- "$@"; else
  python3 -c "import json;print('\n'.join(r['slug'] for r in json.load(open('public/entries.json'))))"
fi | xargs -P 3 -n 1 zsh -c 'node scripts/record-v2.cjs "$1" --base "$BASE" > /tmp/rec-all-logs/$1.log 2>&1 && python3 scripts/rec-qa.py public/v2/videos/$1.mp4 >> /tmp/rec-all-logs/$1.log || echo FAIL $1' _
echo "done: $(ls /tmp/rec-all-logs | wc -l) logs / $(grep -l '"ghost"' /tmp/rec-all-logs/*.log | wc -l) recorded with r7"
