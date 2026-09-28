#!/usr/bin/env python3
"""Generate /notes/archive/ and /ai-daily/archive/ index pages.

Why: data.js `journal.notes` is a curated, N°-numbered list capped by
prerender at 100 items, and a bad merge in the past dropped 14 note files out
of data.js entirely (2026-07-08 xAI, 2026-08-21 DeepSeek vision, 2026-09-17
朱啸虎 …). Those files exist and are indexed in sitemap.xml but have no
inbound link, i.e. they are orphan pages.

Renumbering data.js to re-absorb them would break the N° continuity contract
(SKILL.md: 编号 N° 01 起连续递增). Instead this script builds a flat,
date-sorted archive of *every* file on disk. Crawlers and AI assistants get a
single one-hop entry point to all 117 notes / 51 dailies; the curated list
stays untouched.

Idempotent — regenerates from scratch each run.
"""
import json
import re
import sys
from html import escape, unescape
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = "https://rhinocount.cn"

NOTE_CSS = """
    :root { --ink:#12140f; --ink-soft:#3d4237; --muted:#6b7160; --line:#e2e4da;
            --line-2:#cfd2c4; --accent:#14532d; --surface:#fbfbf7; --radius:10px;
            --serif: "Songti SC","STSong",Georgia,serif; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--surface); color:var(--ink);
           font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
           line-height:1.7; }
    .container { max-width: 780px; margin: 0 auto; padding: 48px 20px 72px; }
    .back-link { display:inline-block; margin-bottom: 28px; color: var(--muted);
                 text-decoration:none; font-size:14px; }
    .back-link:hover { color: var(--accent); }
    .label { font-size:12px; letter-spacing:0.28em; color:var(--muted);
             text-transform:uppercase; margin:0 0 10px; }
    h1 { font-family:var(--serif); font-size:32px; line-height:1.35;
         margin:0 0 12px; font-weight:700; }
    .blurb { color:var(--ink-soft); margin:0 0 8px; font-size:15px; }
    .count { color:var(--muted); font-size:13px; margin:0 0 32px; }
    h2.month { font-family:var(--serif); font-size:19px; margin:40px 0 14px;
               padding-bottom:8px; border-bottom:1px solid var(--line-2);
               color:var(--ink); }
    ul.month-list { list-style:none; margin:0 0 8px; padding:0; }
    li.month-list > a { display:flex; gap:14px; align-items:baseline;
                        padding:11px 12px; border-radius:var(--radius);
                        text-decoration:none; color:var(--ink);
                        border:1px solid transparent; }
    li.month-list > a:hover { background:#fff; border-color:var(--line); }
    .d { flex:0 0 92px; color:var(--muted); font-size:13px;
         font-variant-numeric:tabular-nums; }
    .t { flex:1; font-size:15px; }
    .x { flex:0 0 100%; color:var(--muted); font-size:13px; margin:2px 0 0 106px; }
    .site-footer { border-top:1px solid var(--line); margin-top:48px;
                   padding:24px 20px; text-align:center; color:var(--muted);
                   font-size:13px; }
    @media (max-width:600px) {
      .d { flex-basis:76px; font-size:12px; }
      .x { margin-left:90px; }
    }
"""


def strip_tags(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", "", fragment)
    return " ".join(unescape(text).split())


def read_meta(path: Path) -> dict:
    html = path.read_text(encoding="utf-8", errors="ignore")
    out = {"title": "", "desc": ""}

    m = re.search(r"<title>(.*?)</title>", html, re.DOTALL)
    if m:
        out["title"] = strip_tags(m.group(1))

    if not out["title"]:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
        if m:
            out["title"] = strip_tags(m.group(1))

    for pat in (
        r'<meta\s+name="description"\s+content="([^"]*)"',
        r'<meta\s+content="([^"]*)"\s+name="description"',
    ):
        m = re.search(pat, html, re.IGNORECASE)
        if m and m.group(1).strip():
            out["desc"] = strip_tags(m.group(1))
            break

    if not out["desc"]:
        m = re.search(
            r'<meta\s+property="og:description"\s+content="([^"]*)"', html
        )
        if m:
            out["desc"] = strip_tags(m.group(1))

    return out


def collect(directory: str) -> list:
    base = REPO / directory
    rows = []
    for f in sorted(base.glob("*.html")):
        if f.name in ("index.html", "template.html"):
            continue
        if f.name.startswith("_retired"):
            continue
        meta = read_meta(f)
        if not meta["title"]:
            print(f"  !! no title, skipped: {directory}/{f.name}", file=sys.stderr)
            continue
        date_match = re.match(r"(\d{4})-(\d{2})-(\d{2})", f.stem)
        y = m = d = ""
        if date_match:
            y, m, d = date_match.groups()
            date = f"{y}-{m}-{d}"
        else:
            date = ""
        rows.append(
            {
                "file": f.name,
                "stem": f.stem,
                "date": date,
                "month": f"{y}-{m}" if date_match else "其他",
                "title": meta["title"],
                "desc": meta["desc"][:150],
                "href": f"../../{directory}/{f.name}",
                "url": f"{SITE}/{directory}/{f.name}",
            }
        )
    rows.sort(key=lambda r: (r["date"], r["stem"]), reverse=True)
    return rows


def build(
    directory: str, title: str, heading: str, blurb: str, crumb_name: str
) -> tuple:
    rows = collect(directory)
    grouped: dict = {}
    for r in rows:
        grouped.setdefault(r["month"], []).append(r)

    parts = [
        "<!DOCTYPE html>",
        '<html lang="zh-CN">',
        "<head>",
        '<meta charset="utf-8"/>',
        '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>',
        f"<title>{escape(title)}｜犀牛伯爵</title>",
        f'<meta name="description" content="{escape(blurb)}" />',
        f'<link rel="canonical" href="{SITE}/{directory}/archive/" />',
        '<meta name="robots" content="index,follow" />',
        '<link rel="alternate" type="application/rss+xml" '
        'title="犀牛伯爵" href="' + SITE + '/rss.xml" />',
        f'<meta property="og:type" content="website" />',
        f'<meta property="og:title" content="{escape(title)}｜犀牛伯爵" />',
        f'<meta property="og:description" content="{escape(blurb)}" />',
        f'<meta property="og:url" content="{SITE}/{directory}/archive/" />',
        f'<meta property="og:image" content="{SITE}/temple-of-heaven.png" />',
        '<meta property="og:site_name" content="犀牛伯爵" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        '<meta name="twitter:title" content="' + escape(title) + '｜犀牛伯爵" />',
        f'<meta name="twitter:description" content="{escape(blurb)}" />',
        f'<meta name="twitter:image" content="{SITE}/temple-of-heaven.png" />',
        '<script type="application/ld+json">',
        json.dumps(
            {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": title,
                "description": blurb,
                "url": f"{SITE}/{directory}/archive/",
                "inLanguage": "zh-CN",
                "isPartOf": {
                    "@type": "WebSite",
                    "name": "犀牛伯爵",
                    "url": SITE,
                },
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "犀牛伯爵",
                            "item": SITE + "/",
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": crumb_name,
                            "item": f"{SITE}/{directory}/",
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": heading,
                            "item": f"{SITE}/{directory}/archive/",
                        },
                    ],
                },
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": len(rows),
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": idx + 1,
                            "url": r["url"],
                            "name": r["title"],
                        }
                        for idx, r in enumerate(rows)
                    ],
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        "</script>",
        "<style>" + NOTE_CSS + "</style>",
        "</head>",
        "<body>",
        '<div class="container">',
        f'<a class="back-link" href="../../{directory}/">← 返回{"观察笔记" if directory == "notes" else "AI 日报"}</a>',
        '<p class="label">ARCHIVE</p>',
        f"<h1>{escape(heading)}</h1>",
        f'<p class="blurb">{escape(blurb)}</p>',
        f'<p class="count">共 {len(rows)} 篇，按日期倒序</p>',
    ]

    for month in sorted(grouped, reverse=True):
        items = grouped[month]
        label = month if month != "00" else "未标注日期"
        parts.append(f'<h2 class="month">{escape(label)} · {len(items)} 篇</h2>')
        parts.append('<ul class="month-list">')
        for r in items:
            date_cell = r["date"] or "—"
            parts.append(
                f'<li><a href="{escape(r["href"])}">'
                f'<span class="d">{escape(date_cell)}</span>'
                f'<span class="t">{escape(r["title"])}</span>'
                "</a>"
            )
            if r["desc"]:
                parts.append(
                    f'<div class="x">{escape(r["desc"])}</div>'
                )
            parts.append("</li>")
        parts.append("</ul>")

    parts.extend(
        [
            "</div>",
            '<footer class="site-footer">© 2026 犀牛伯爵</footer>',
            "</body>",
            "</html>",
        ]
    )
    return "\n".join(parts), len(rows)


TARGETS = [
    (
        "notes",
        "犀牛伯爵观察笔记归档",
        "全部观察笔记",
        "犀牛伯爵全部观察笔记归档，按发布日期倒序排列，覆盖从 AI 商业化、"
        "大模型竞争到具身智能与 AI 原生工作方式的长期观察。",
        "观察笔记",
    ),
    (
        "ai-daily",
        "犀牛伯爵 AI 日报归档",
        "全部 AI 日报",
        "犀牛伯爵 AI 日报历史归档，按日期倒序排列，覆盖每日 AI 大模型与"
        "产业动态速览。",
        "AI 日报",
    ),
]


def main() -> int:
    total = 0
    for directory, title, heading, blurb, crumb in TARGETS:
        out_dir = REPO / directory / "archive"
        out_dir.mkdir(parents=True, exist_ok=True)
        html, count = build(directory, title, heading, blurb, crumb)
        (out_dir / "index.html").write_text(html, encoding="utf-8")
        print(f"  wrote {directory}/archive/index.html ({count} items)")
        total += count
    print(f"\ntotal archived items: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
