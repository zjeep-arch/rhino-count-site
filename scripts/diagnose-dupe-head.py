#!/usr/bin/env python3
"""Diagnose duplicate <head> blocks in content pages.

seo-batch-fix.py's process_old_format_note had no idempotence guard, so every
run appended another canonical + OG + Twitter + JSON-LD block to </head>.
107 files carry 2-8 copies. nav-dedupe.py only cleans <body>, so it never
caught these.

This script is read-only: it classifies the duplication pattern per file so
the fix can be written against real data rather than guesses.

Run:  python3 scripts/diagnose-dupe-head.py
"""
import collections
import glob
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

MARKERS = [
    "canonical",
    'property="og:title"',
    'property="og:description"',
    'name="twitter:card"',
    'application/ld+json',
    '<meta name="robots"',
]


def head_of(html: str) -> str:
    i = html.find("<head>")
    j = html.find("</head>")
    if i == -1 or j == -1 or j < i:
        return ""
    return html[i:j]


def split_blocks(head: str):
    """Return the head split just before each canonical marker."""
    positions = [m.start() for m in re.finditer(r'<link rel="canonical"', head)]
    if not positions:
        return []
    bounds = []
    start = 0
    for p in positions:
        bounds.append(head[start:p])
        start = p
    bounds.append(head[start:])
    return bounds


def main() -> int:
    files = []
    for d in ("notes", "articles", "ai-daily"):
        files += sorted(glob.glob(str(REPO / d / "*.html")))
    files = [f for f in files if os.path.basename(f) not in
             ("index.html", "template.html")]

    dup_files = []
    patterns = collections.Counter()
    for f in files:
        html = Path(f).read_text(encoding="utf-8", errors="ignore")
        head = head_of(html)
        n = head.count('<link rel="canonical"')
        if n <= 1:
            continue
        dup_files.append((f, n, len(split_blocks(head))))

        # Are all canonical hrefs identical? If yes the duplicates are pure
        # noise and safe to collapse to one. If they differ, something else
        # is going on and needs a human look.
        hrefs = set(re.findall(r'<link rel="canonical" href="([^"]*)"', head))
        markers = {m: head.count(m) for m in MARKERS}
        key = (
            "same-href" if len(hrefs) == 1 else f"DIFFERENT-hrefs({len(hrefs)})",
            tuple(sorted((k, v) for k, v in markers.items() if v != n)),
        )
        patterns[key] += 1

    print(f"scanned {len(files)} content pages")
    print(f"files with duplicate canonical in <head>: {len(dup_files)}")
    if not dup_files:
        return 0

    print("\n-- duplication pattern --")
    for (kind, odd), count in patterns.most_common():
        detail = ", ".join(f"{k}x{v}" for k, v in odd) or "all markers == canonical count"
        print(f"  {count:>4}  {kind:<24} {detail}")

    print("\n-- copy counts --")
    dist = collections.Counter(n for _, n, _ in dup_files)
    for n, c in sorted(dist.items()):
        print(f"  {c:>4}  files with {n} copies")

    same = sum(c for (k, _), c in patterns.items() if k == "same-href")
    print(f"\nsame canonical href everywhere: {same}/{len(dup_files)}")
    if same != len(dup_files):
        print("\n!! files with DIFFERENT canonical hrefs need manual review:")
        for f, n, _ in dup_files:
            html = Path(f).read_text(encoding="utf-8", errors="ignore")
            hrefs = set(re.findall(r'<link rel="canonical" href="([^"]*)"',
                                   head_of(html)))
            if len(hrefs) > 1:
                print(f"   {os.path.relpath(f, REPO)}  x{n}  {sorted(hrefs)}")

    print("\nsample files:")
    for f, n, _ in dup_files[:6]:
        print(f"  x{n}  {os.path.relpath(f, REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
