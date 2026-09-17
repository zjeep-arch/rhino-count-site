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

# --- SEO 污染自动免疫（2026-09-03 治理第 4 层）---
# pull 进来的新文章若带旧域名 canonical/og:url，自动替换并汇报
NEW_HTML=$(git diff --name-only "$BEFORE" HEAD -- 'ai-daily/*.html' 'notes/*.html' 'articles/*.html' 2>/dev/null | grep -v 'template\.html\|index\.html' || true)
if [ -n "$NEW_HTML" ]; then
    AUTO_FIXED=0
    for f in $NEW_HTML; do
        [ -f "$f" ] || continue
        if grep -q 'zjeep-arch\.github\.io/rhino-count-site' "$f"; then
            sed -i '' 's|https://zjeep-arch.github.io/rhino-count-site|https://rhinocount.cn|g' "$f"
            AUTO_FIXED=$((AUTO_FIXED+1))
            echo "$(date '+%F %T') watchdog: auto-fixed domain pollution in $f" >> "$HOME/.hermes/cache/prerender-watchdog.log"
        fi
    done
    # sitemap 与污染修复保持同步
    python3 scripts/generate-sitemap.py >/dev/null 2>&1 || true
    python3 scripts/rebuild-rss.py
    if [ "$AUTO_FIXED" -gt 0 ]; then
        git add ai-daily notes articles sitemap.xml rss.xml
        git commit -m "fix(seo-watchdog): auto-replace domain pollution in $AUTO_FIXED file(s); refresh sitemap/RSS" >/dev/null
    fi
fi

python3 scripts/prerender.py

if ! git diff --quiet index.html; then
    git add index.html
    git commit -m "chore(prerender): bake rendered DOM for crawlers after update $(date +%F-%H%M)"
    for i in 1 2 3; do
        if git push origin main; then break; fi
        sleep 10 && git pull --rebase origin main
    done
fi
