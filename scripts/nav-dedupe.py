#!/usr/bin/env python3
"""Deduplicate site-nav AND site-footer blocks injected multiple times.

Root cause: seo-batch-fix.py / inject-nav.py each append their own nav+footer
without checking for existing ones (has_nav() short-circuited by class="back";
'site-footer' check in process_article used wrong sentinel), so repeated batch
runs stacked 2-4 identical blocks per page. Visually: stacked multi-line nav
bar at top AND stacked footer rows at bottom.

Fix: keep FIRST occurrence of each block type per file, drop the rest.
Idempotent. Usage: python3 scripts/nav-dedupe.py [--dry-run]
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DRY = "--dry-run" in sys.argv

BLOCK_RES = [
    ("nav", re.compile(r'[ \t]*<nav class="site-nav"[^>]*>.*?</nav>\s*\n?', re.DOTALL)),
    ("footer", re.compile(r'[ \t]*<footer class="site-footer"[^>]*>.*?</footer>\s*\n?', re.DOTALL)),
]

fixed, skipped, checked = 0, 0, 0
for d in ("notes", "articles", "ai-daily"):
    for f in sorted((REPO / d).glob("*.html")):
        html = f.read_text(encoding="utf-8")
        checked += 1
        orig = html
        for name, rx in BLOCK_RES:
            matches = list(rx.finditer(html))
            if len(matches) > 1:
                for m in reversed(matches[1:]):
                    html = html[: m.start()] + html[m.end() :]
                print(f"  fix {f.relative_to(REPO)}: {len(matches)} {name}s -> 1")
        if html == orig:
            skipped += 1
            continue
        # collapse blank-line runs left after removals
        html = re.sub(r"(<body[^>]*>)\n{3,}", r"\1\n", html)
        html = re.sub(r"\n{4,}(</body>)", r"\n\1", html)
        if not DRY:
            f.write_text(html, encoding="utf-8")
        fixed += 1

print(f"\nchecked={checked} fixed={fixed} clean={skipped} dry_run={DRY}")
if fixed == 0:
    print("All pages already clean (0 or 1 nav/footer each). Nothing to do.")
