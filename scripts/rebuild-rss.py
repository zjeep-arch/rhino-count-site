#!/usr/bin/env python3
"""Rebuild rss.xml from notes/ and ai-daily/ HTML files.

Derives title/description/date from each article's meta tags and filename,
keeps the latest 30 items, sets lastBuildDate to newest item date.
Run after publishing (the daily cron pipeline / watchdog can call this).
"""
import glob
import html
import os
import re
import sys
import xml.dom.minidom as minidom
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CST = timezone(timedelta(hours=8))


def collect(pattern, base):
    out = []
    for p in sorted(glob.glob(os.path.join(REPO, pattern)), reverse=True):
        fn = os.path.basename(p)
        m = re.match(r"(\d{4}-\d{2}-\d{2})", fn)
        if not m or "template" in fn:
            continue
        s = open(p, encoding="utf-8").read()
        t = re.search(r"<title>(.*?)</title>", s)
        d = re.search(r'name="description" content="([^"]*)"', s)
        title = html.unescape(t.group(1)) if t else fn
        desc = html.unescape(d.group(1)) if d else ""
        dt = datetime.strptime(m.group(1), "%Y-%m-%d").replace(hour=9, tzinfo=CST)
        out.append((dt, f"https://rhinocount.cn/{base}/{fn}", title, desc))
    return out


def main():
    items = collect("notes/2*.html", "notes") + collect("ai-daily/2*.html", "ai-daily")
    items.sort(key=lambda x: x[0], reverse=True)
    items = items[:30]
    if not items:
        print("no items found; aborting", file=sys.stderr)
        sys.exit(1)

    build = max(i[0] for i in items)
    parts = [f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RHINO COUNT · 犀牛伯爵</title>
    <link>https://rhinocount.cn/</link>
    <description>AI Native Magazine — 记录 AI 如何改变技术、商业与人的工作方式。</description>
    <language>zh-CN</language>
    <lastBuildDate>{format_datetime(build)}</lastBuildDate>
    <atom:link href="https://rhinocount.cn/rss.xml" rel="self" type="application/rss+xml" />"""]
    for dt, link, title, desc in items:
        parts.append(f"""    <item>
      <title><![CDATA[{title}]]></title>
      <link>{link}</link>
      <guid isPermaLink="true">{link}</guid>
      <pubDate>{format_datetime(dt)}</pubDate>
      <description><![CDATA[{desc}]]></description>
    </item>""")
    parts.append("  </channel>\n</rss>\n")

    xml_text = "\n".join(parts)
    minidom.parseString(xml_text)  # validate
    with open(os.path.join(REPO, "rss.xml"), "w", encoding="utf-8") as f:
        f.write(xml_text)
    print(f"rss.xml rebuilt: {len(items)} items, lastBuildDate={build.date()}")


if __name__ == "__main__":
    main()
