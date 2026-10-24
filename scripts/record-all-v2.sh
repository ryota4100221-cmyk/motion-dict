#!/bin/zsh
# 全項目を録画v2で撮り直す（並列3）。使い方: scripts/record-all-v2.sh [base]
# 既定の base はローカルの静的ビルド（out/ を /motion-dict で配信している前提）。
cd "${0:A:h}/.."
BASE="${1:-http://localhost:3913/motion-dict}"
export NODE_PATH="${MONACA_PW_PATH:-$HOME/projects/mona-cafe/node_modules}"
mkdir -p /tmp/rec-all-logs
python3 -c "import json;print('\n'.join(r['slug'] for r in json.load(open('public/entries.json'))))" |
  xargs -P 3 -I{} zsh -c "node scripts/record-v2.cjs {} --base $BASE > /tmp/rec-all-logs/{}.log 2>&1 && python3 scripts/rec-qa.py public/v2/videos/{}.mp4 >> /tmp/rec-all-logs/{}.log || echo FAIL {}"
echo "done: $(ls public/v2/videos | wc -l) videos"
