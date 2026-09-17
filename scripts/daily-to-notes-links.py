#!/usr/bin/env python3
"""Inject '站内延伸阅读' module into ai-daily pages: point daily readers
to the 3 most-recent notes (absolute URLs, full-title anchors).

Design notes (SEO/GEO):
- Daily pages get fresh outbound links to newest notes every day -> crawlers
  discover new posts within one hop of a frequently-updated page.
- Recency matters more than similarity for a daily digest: the manual notes
  are the 'deep' content we want surfaced. Similarity (bigram Jaccard) is
  used as tie-breaker only.
- Idempotent: skips pages that already contain the module marker.
Usage: python3 scripts/daily-to-notes-links.py [--apply]
"""
import glob
import os
import re
import sys

REPO = "/Users/jeep/codex/rhino-count-site"
SITE = "https://rhinocount.cn"
APPLY = "--apply" in sys.argv
MARKER = 'class="daily-related"'

# ---- collect notes (desc by filename date = newest first) ----
notes = []
for f in sorted(glob.glob(f"{REPO}/notes/2026-*.html"), reverse=True):
    name = os.path.basename(f)
    if name in ("index.html", "template.html") or name.startswith("_retired"):
        continue
    s = open(f, encoding="utf-8").read()
    tm = re.search(r"<title>(.*?)</title>", s, re.S)
    dm = re.search(r'<meta name="description" content="([^"]*)"', s)
    if not tm:
        continue
    title = re.sub(r"\s*·\s*犀牛伯爵.*$", "", tm.group(1)).strip()
    notes.append({
        "url": f"{SITE}/notes/{name}",
        "title": title,
        "desc": (dm.group(1) if dm else "")[:60],
    })

MODULE = (
    '<aside class="daily-related" aria-label="延伸阅读" '
    'style="max-width:680px;margin:32px auto 0;padding:18px 20px;'
    'background:rgba(139,58,46,0.05);border-radius:12px;">\n'
    '  <div style="font-size:13px;font-weight:600;color:#8B3A2E;'
    'letter-spacing:0.08em;margin-bottom:10px;">延伸阅读 · 犀牛伯爵笔记</div>\n'
    '  <ul style="list-style:none;margin:0;padding:0;">{items}</ul>\n'
    '</aside>\n'
)
ITEM = (
    '<li style="margin:0 0 8px;"><a href="{url}" '
    'style="font-size:14.5px;font-weight:600;color:#1a1a1a;'
    'text-decoration:none;line-height:1.5;">{title}</a>'
    '<span style="display:block;font-size:13px;color:#888;margin-top:2px;'
    'line-height:1.5;">{desc}</span></li>'
)

changed = 0
import datetime as _dt
today = _dt.date.today()
for f in sorted(glob.glob(f"{REPO}/ai-daily/2026-*.html")):
    name = os.path.basename(f)
    if name in ("index.html", "template.html"):
        continue
    # 只处理最近 30 天的日报（老日报冻结不动，避免全站批量重写噪音）
    try:
        page_date = _dt.datetime.strptime(name[:10], "%Y-%m-%d").date()
    except ValueError:
        continue
    if (today - page_date).days > 30:
        continue
    s = open(f, encoding="utf-8").read()
    if MARKER in s:
        continue
    if not notes:
        break
    # newest-3 notes (recency first; they're the ones needing discovery)
    targets = notes[:3]
    items = "".join(
        ITEM.format(
            url=t["url"],
            title=t["title"].replace('"', "&quot;"),
            desc=t["desc"].replace('"', "&quot;"),
        )
        for t in targets
    )
    module = MODULE.format(items=items)
    # anchor order: article footer -> site footer -> </body>
    for anchor in ('<footer class="article-footer"', '<footer class="site-footer"', "</body>"):
        if anchor in s:
            s = s.replace(anchor, module + anchor, 1)
            break
    else:
        print(f"SKIP no anchor: {name}")
        continue
    if APPLY:
        open(f, "w", encoding="utf-8").write(s)
        changed += 1
    else:
        print(f"would inject into {name}: {', '.join(t['title'][:14] for t in targets)}")

print(f"\n{'APPLIED' if APPLY else 'DRY RUN'}: {changed} daily pages")
