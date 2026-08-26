#!/bin/bash
# rhino-count-site prerender watchdog
# Pulls latest main; if new commits arrived, prerender index.html and push
# back if the rendered output actually changed (deterministic render => no loops).
set -euo pipefail
REPO="$HOME/codex/rhino-count-site"
cd "$REPO"

BEFORE=$(git rev-parse origin/main 2>/dev/null || echo "")
git fetch origin main
AFTER=$(git rev-parse origin/main)

if [ -n "$BEFORE" ] && [ "$BEFORE" = "$AFTER" ]; then
    exit 0   # nothing new
fi

git pull --rebase origin main >/dev/null

# Only prerender if index/data actually changed in the pulled range
CHANGED=$(git diff --name-only "$BEFORE" HEAD -- index.html data.js ai-daily/ notes/ 2>/dev/null || true)
if [ -z "$CHANGED" ]; then
    git update-ref refs/remotes/origin/main "$AFTER" 2>/dev/null || true
    exit 0
fi

python3 scripts/rebuild-rss.py
python3 scripts/prerender.py

if ! git diff --quiet index.html; then
    git add index.html
    git commit -m "chore(prerender): bake rendered DOM for crawlers after update $(date +%F-%H%M)"
    for i in 1 2 3; do
        if git push origin main; then break; fi
        sleep 10 && git pull --rebase origin main
    done
fi
