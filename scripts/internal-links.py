#!/usr/bin/env python3
"""Inject '相关阅读' related-links module into notes/articles pages.

Similarity: character bigram Jaccard over title+description. Chinese-aware,
no external deps. Links use absolute URLs and full-title anchors (SEO juice).
Dry-run mode prints plan; --apply writes files.
"""
import glob
import os
import re
import sys
from pathlib import Path

REPO = Path("/Users/jeep/codex/rhino-count-site")
SITE = "https://rhinocount.cn"
APPLY = "--apply" in sys.argv

def clean_title(t):
    return re.sub(r"\s*\|\s*犀牛伯爵.*$", "", t).strip()

pages = {}
for f in sorted(glob.glob(str(REPO / "notes/*.html")) + glob.glob(str(REPO / "articles/*.html"))):
    name = os.path.basename(f)
    rel_dir = "notes" if "/notes/" in f else "articles"
    if name in ("index.html", "template.html") or name.startswith("_retired"):
        continue
    s = open(f).read()
    tm = re.search(r"<title>(.*?)</title>", s, re.S)
    dm = re.search(r'<meta name="description" content="([^"]*)"', s)
    if not tm:
        continue
    key = f"{rel_dir}/{name}"
    title = clean_title(tm.group(1))
    pages[key] = {
        "path": f, "key": key, "title": title,
        "desc": (dm.group(1) if dm else "")[:60],
        "text": title + " " + (dm.group(1) if dm else ""),
        "url": f"{SITE}/{key}",
    }

keys = list(pages)

def bigrams(text):
    t = re.sub(r"[^\u4e00-\u9fff\w]+", "", text.lower())
    return {t[i:i+2] for i in range(len(t)-1)} if len(t) > 1 else {t}

grams = {k: bigrams(v["text"]) for k, v in pages.items()}

plan = {}
for k in keys:
    scores = []
    for other in keys:
        if other == k:
            continue
        g1, g2 = grams[k], grams[other]
        inter = len(g1 & g2)
        union = len(g1 | g2)
        if union:
            scores.append((inter / union, other))
    scores.sort(reverse=True)
    top = [o for sc, o in scores[:3] if sc > 0.02]
    plan[k] = top

# ---- print plan ----
for k in keys:
    if plan[k]:
        pairs = ", ".join(pages[o]["title"][:18] for o in plan[k])
        print(f"{pages[k]['title'][:22]:24s} -> {pairs}")

if not APPLY:
    print(f"\nDRY RUN: {sum(1 for v in plan.values() if v)}/{len(keys)} pages would get links")
    sys.exit(0)

MODULE = (
    '<section class="related-notes" aria-label="相关阅读" '
    'style="max-width:740px;margin:36px auto 0;padding:0 20px;font-family:-apple-system,sans-serif;">\n'
    '  <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:20px;">\n'
    '    <div style="font-size:13px;font-weight:600;color:#999;letter-spacing:0.1em;margin-bottom:12px;">相关阅读</div>\n'
    "    <ul style=\"list-style:none;margin:0;padding:0;\">{items}</ul>\n"
    "  </div>\n</section>\n"
)
ITEM = (
    '<li style="margin:0 0 10px;"><a href="{url}" '
    'style="font-size:15px;font-weight:600;color:#1a1a1a;text-decoration:none;line-height:1.5;">{title}</a>'
    '<span style="display:block;font-size:13px;color:#888;margin-top:2px;line-height:1.5;">{desc}</span></li>'
)

changed = 0
for k, targets in plan.items():
    if not targets:
        continue
    p = pages[k]["path"]
    s = open(p).read()
    if "related-notes" in s:
        continue
    items = "".join(
        ITEM.format(url=pages[o]["url"], title=esc_t, desc=esc_d)
        for o, esc_t, esc_d in [
            (o, pages[o]["title"].replace('"', "&quot;"), pages[o]["desc"].replace('"', "&quot;"))
            for o in targets
        ]
    )
    module = MODULE.format(items=items)
    for anchor in ('<footer class="site-footer"', '<div class="ending"', "</body>"):
        if anchor in s:
            break
    else:
        print(f"SKIP no anchor: {k}")
        continue
    s = s.replace(anchor, module + anchor, 1)
    open(p, "w").write(s)
    changed += 1

print(f"\nAPPLIED: injected related-links into {changed} pages")
