#!/usr/bin/env python3
"""Collapse duplicated <head> SEO blocks in content pages.

seo-batch-fix.py's process_old_format_note had no idempotence guard and
appended a fresh canonical + OG + Twitter + JSON-LD block on every run.
107 files ended up with 2-8 copies. All 107 carry the *same* canonical href
(verified by scripts/diagnose-dupe-head.py), so collapsing to one is safe.

Which copy survives matters. The FIRST block is the only one that still has
the real cover art (og:image = note-XX-cover.jpg); every later run could no
longer find the cover and fell back to temple-of-heaven.png. A later variant
also lost the <meta name="robots"> line. So the rule is: keep the most
informative block, drop the rest.

Guards:
  - only touches <head>
  - only removes blocks whose canonical href matches the first one
  - never removes the last remaining copy
  - --apply writes; without it, dry-run

Run:  python3 scripts/dedupe-head.py [--apply]
"""
import argparse
import glob
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# One injected block runs from a canonical <link> to just before the next
# canonical <link> (or the end of <head>).
BLOCK_START = re.compile(r'[ \t]*<link rel="canonical"')
DEFAULT_OG = "temple-of-heaven.png"


def head_span(html: str):
    i = html.find("<head>")
    j = html.find("</head>")
    if i == -1 or j == -1 or j < i:
        return None
    return i, j


def block_keys(head: str):
    """Return (start, end, text) for each canonical block in head."""
    starts = [m.start() for m in BLOCK_START.finditer(head)]
    out = []
    for n, s in enumerate(starts):
        e = starts[n + 1] if n + 1 < len(starts) else len(head)
        out.append((s, e, head[s:e]))
    return out


def score(block: str) -> int:
    """Higher = more worth keeping."""
    s = 0
    og = re.search(r'property="og:image" content="([^"]*)"', block)
    if og and DEFAULT_OG not in og.group(1):
        s += 10          # real cover art
    if '<meta name="robots"' in block:
        s += 2           # robots directive
    if 'application/ld+json' in block:
        s += 1
    s += min(len(block), 4000) // 1000
    return s


def dedupe_head(head: str):
    """Return (new_head, removed_count) keeping only the best block."""
    blocks = block_keys(head)
    if len(blocks) <= 1:
        return head, 0

    keep = max(range(len(blocks)), key=lambda i: score(blocks[i][2]))
    kept_text = blocks[keep][2]

    # Rebuild the head: everything before the first canonical block, then the
    # winning block, then whatever trailed the last one.
    first_s = blocks[0][0]
    prefix = head[:first_s]
    last_e = blocks[-1][1]
    tail = head[last_e:]
    new_head = prefix + kept_text + tail
    return re.sub(r"\n{3,}", "\n\n", new_head), len(blocks) - 1


def dedupe_file(path: Path):
    html = path.read_text(encoding="utf-8", errors="ignore")
    span = head_span(html)
    if not span:
        return 0
    h_start, h_end = span
    new_head, n = dedupe_head(html[h_start:h_end])
    if n and new_head != html[h_start:h_end]:
        path.write_text(html[:h_start] + new_head + html[h_end:], encoding="utf-8")
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="write changes (default: dry-run)")
    args = ap.parse_args()

    files = []
    for d in ("notes", "articles", "ai-daily"):
        files += sorted(glob.glob(str(REPO / d / "*.html")))
    files = [f for f in files
             if os.path.basename(f) not in ("index.html", "template.html")]

    changed = removed = 0
    for f in files:
        p = Path(f)
        html = p.read_text(encoding="utf-8", errors="ignore")
        span = head_span(html)
        if not span:
            continue
        before = html[span[0]:span[1]].count('<link rel="canonical"')
        if before <= 1:
            continue
        if args.apply:
            # dedupe_file is what actually writes; computing the count
            # in-process would report success without touching disk.
            n = dedupe_file(p)
        else:
            n = before - 1
        if n:
            changed += 1
            removed += n
            print(f"  {'fixed' if args.apply else 'would fix'} "
                  f"{os.path.relpath(p, REPO)}: {before} -> 1")

    verb = "fixed" if args.apply else "would fix"
    print(f"\n{verb} {changed} files, {removed} duplicate blocks")
    if not args.apply and changed:
        print("re-run with --apply to write")
    return 0


if __name__ == "__main__":
    sys.exit(main())

