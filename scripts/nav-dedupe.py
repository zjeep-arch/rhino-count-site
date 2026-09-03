#!/usr/bin/env python3
"""Deduplicate site-nav blocks injected multiple times into article pages.

Root cause: seo-batch-fix.py's process_new_format_note() uses `has_nav()` which
checks `'site-nav' in html or 'class="back"' in html`. For new-template notes
the "back" link is present, so has_nav() returns True... but process_article()
calls has_nav() too — repeated runs of different scripts each injected their own
nav, plus inject-nav.py also appends one. Result: up to 4 identical sticky navs
stacked at top of every note page, rendering as "three-line nav bar".

Fix strategy: keep the FIRST nav block per file, remove all subsequent
duplicates. Idempotent: running again changes nothing.

Usage: python3 scripts/nav-dedupe.py [--dry-run]
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DRY = "--dry-run" in sys.argv

NAV_RE = re.compile(
    r'[ \t]*<nav class="site-nav"[^>]*>.*?</nav>\s*\n?',
    re.DOTALL,
)

fixed, skipped, checked = 0, 0, 0
for d in ("notes", "articles", "ai-daily"):
    for f in sorted((REPO / d).glob("*.html")):
        html = f.read_text(encoding="utf-8")
        checked += 1
        matches = list(NAV_RE.finditer(html))
        if len(matches) <= 1:
            skipped += 1
            continue
        # keep first occurrence, drop the rest
        new_html = html
        for m in reversed(matches[1:]):
            new_html = new_html[: m.start()] + new_html[m.end() :]
        # also collapse blank-line runs left behind between body start and container
        new_html = re.sub(r"(<body[^>]*>)\n{3,}", r"\1\n", new_html)
        print(f"  fix {f.relative_to(REPO)}: {len(matches)} navs -> 1")
        if not DRY:
            f.write_text(new_html, encoding="utf-8")
        fixed += 1

print(f"\nchecked={checked} fixed={fixed} clean={skipped} dry_run={DRY}")
if fixed == 0:
    print("All pages already clean (0 or 1 nav each). Nothing to do.")
