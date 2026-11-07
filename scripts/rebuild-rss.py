#!/usr/bin/env python3
"""Rebuild RSS from published notes and daily briefs, omitting duplicate exports."""
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
SITE = "https://rhinocount.cn"


def text_only(fragment):
    fragment = re.sub(r"<(script|style)\b[^>]*>[\s\S]*?</\1>", " ", fragment, flags=re.I)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def description_from(markup, filename):
    match = re.search(
        r'<meta\b(?=[^>]*\bname=["\']description["\'])(?=[^>]*\bcontent=["\']([^"\']*)["\'])[^>]*>',
        markup, flags=re.I
    )
    if match and html.unescape(match.group(1)).strip():
        return html.unescape(match.group(1)).strip()

    if filename.endswith("-ai-daily.html"):
        headings = re.findall(r"<h3\b[^>]*>([\s\S]*?)</h3>", markup, flags=re.I)
        focus = next((text_only(h) for h in headings if text_only(h)), "")
        prefix = "AI 大模型与安全动态日报，整理模型、产品、融资及安全进展。"
        return (prefix + ("本期重点：" + focus if focus else ""))[:155]

    paragraphs = re.findall(r"<p\b[^>]*>([\s\S]*?)</p>", markup, flags=re.I)
    first = next((text_only(p) for p in paragraphs if len(text_only(p)) > 40), "")
    return first[:155]


def collect(pattern, section):
    items = []
    for path in sorted(glob.glob(os.path.join(REPO, pattern)), reverse=True):
        filename = os.path.basename(path)
        match = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
        if not match or "template" in filename or "-wechat.html" in filename.lower():
            continue

        with open(path, encoding="utf-8") as source:
            markup = source.read()
        if re.search(r'<meta\b[^>]*\bname=["\']robots["\'][^>]*\bnoindex', markup, flags=re.I):
            continue

        title_match = re.search(r"<title\b[^>]*>([\s\S]*?)</title>", markup, flags=re.I)
        title = text_only(title_match.group(1)) if title_match else filename
        description = description_from(markup, filename)
        date = datetime.strptime(match.group(1), "%Y-%m-%d").replace(hour=9, tzinfo=CST)
        link = f"{SITE}/{section}/{filename}"
        items.append((date, link, title, description))
    return items


def cdata(value):
    return str(value).replace("]]>", "]]]]><![CDATA[>")


def main():
    items = collect("notes/2*.html", "notes") + collect("ai-daily/2*.html", "ai-daily")
    items.sort(key=lambda item: item[0], reverse=True)
    items = items[:30]
    if not items:
        print("no items found; aborting", file=sys.stderr)
        sys.exit(1)

    build = max(item[0] for item in items)
    parts = [f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RHINO COUNT · 犀牛伯爵</title>
    <link>{SITE}/</link>
    <description>AI Native Magazine — 记录 AI 如何改变技术、商业与人的工作方式。</description>
    <language>zh-CN</language>
    <lastBuildDate>{format_datetime(build)}</lastBuildDate>
    <atom:link href="{SITE}/rss.xml" rel="self" type="application/rss+xml" />"""]
    for date, link, title, description in items:
        parts.append(f"""    <item>
      <title><![CDATA[{cdata(title)}]]></title>
      <link>{link}</link>
      <guid isPermaLink="true">{link}</guid>
      <pubDate>{format_datetime(date)}</pubDate>
      <description><![CDATA[{cdata(description)}]]></description>
    </item>""")
    parts.append("  </channel>\n</rss>\n")

    xml_text = "\n".join(parts)
    minidom.parseString(xml_text)
    with open(os.path.join(REPO, "rss.xml"), "w", encoding="utf-8") as output:
        output.write(xml_text)
    print(f"rss.xml rebuilt: {len(items)} items, lastBuildDate={build.date()}")


if __name__ == "__main__":
    main()
