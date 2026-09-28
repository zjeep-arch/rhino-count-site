#!/usr/bin/env python3
"""Regenerate llms.txt from the actual note/daily files on disk.

The hand-maintained version drifted badly (it was still pointing at August
notes while the site was publishing daily). AI search crawlers read this file
to decide what to cite, so stale entries are worse than none.

Structure:
  - positioning blurb
  - entry points (index, archives, RSS, sitemap)
  - latest 20 notes, date-sorted
  - latest 8 dailies
  - evergreen notes (the non-dated / methodology pieces)

Idempotent. WeChat export duplicates are skipped (they are noindex).
"""
import glob
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = "https://rhinocount.cn"

BLURB = (
    "犀牛伯爵（Jeep）主理的 AI 原生杂志。聚焦 AI 大模型动态、具身智能、"
    "AI 商业化与行业格局的中文深度观察。每日更新 AI 日报，每周更新观察笔记。"
)

EVERGREEN = {
    "why-rhino-count.html": "品牌宣言——恋爱的犀牛 × 基督山伯爵 × 灰犀牛，Count 双关与站的世界观",
    "agent-is-operating-system.html": "从 App 思维迁移到 Agent 思维需要的 5 个转变",
    "prompt-is-the-skill.html": "为什么 prompt 是 2026 年最被低估的核心技能",
    "agent-coding-three-months.html": "Agent 辅助编程三个月实践，省下的时间都去哪了",
    "how-to-learn-new-tech.html": "把陌生学科拆成三层：直觉、框架、推演",
    "deleted-47-tools.html": "工具链做减法的实践，删掉 47 个工具之后",
    "what-pku-didnt-teach-me.html": "毕业之后才明白，专业不是身份，是工具箱",
}


def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    # Titles carry several different brand suffixes depending on which
    # template published them: "｜犀牛伯爵", "· 犀牛伯爵笔记", "| 犀牛伯爵".
    text = re.split(r"[｜|]\s*犀牛伯爵", text)[0]
    text = re.sub(r"[·|]\s*犀牛伯爵(笔记)?\s*$", "", text)
    text = re.sub(r"\s+笔记\s*$", "", text)
    return " ".join(text.split()).strip()


def read(path: Path):
    html = path.read_text(encoding="utf-8", errors="ignore")
    title = ""
    m = re.search(r"<title>(.*?)</title>", html, re.DOTALL)
    if m:
        title = clean(re.sub(r"<[^>]+>", "", m.group(1)))
    desc = ""
    for pat in (
        r'<meta\s+name="description"\s+content="([^"]*)"',
        r'<meta\s+content="([^"]*)"\s+name="description"',
    ):
        m = re.search(pat, html, re.IGNORECASE)
        if m and m.group(1).strip():
            desc = " ".join(m.group(1).split())
            break
    if not desc:
        m = re.search(r'<meta\s+property="og:description"\s+content="([^"]*)"', html)
        if m:
            desc = " ".join(m.group(1).split())
    return title, desc


def collect(directory: str, skip_wechat=True):
    rows = []
    for f in sorted((REPO / directory).glob("*.html")):
        if f.name in ("index.html", "template.html") or f.name.startswith("_retired"):
            continue
        if skip_wechat and f.name.endswith("-wechat.html"):
            continue
        title, desc = read(f)
        if not title:
            continue
        dm = re.match(r"(\d{4}-\d{2}-\d{2})", f.stem)
        rows.append(
            {
                "date": dm.group(1) if dm else "",
                "title": title,
                "desc": desc,
                "url": f"{SITE}/{directory}/{f.name}",
                "name": f.name,
            }
        )
    rows.sort(key=lambda r: (r["date"], r["name"]), reverse=True)
    return rows


def main() -> int:
    notes = collect("notes")
    dailies = collect("ai-daily")

    out = [
        "# RHINO COUNT 犀牛伯爵",
        "",
        f"> {BLURB}",
        "",
        "## 入口",
        "",
        f"- [首页]({SITE}/): 站点总入口",
        f"- [观察笔记]({SITE}/notes/): 精选笔记列表（N° 编号）",
        f"- [观察笔记归档]({SITE}/notes/archive/): 全部 {len(notes)} 篇笔记，按月份分组",
        f"- [AI 日报]({SITE}/ai-daily/): 每日 AI 大模型与产业动态速览",
        f"- [AI 日报归档]({SITE}/ai-daily/archive/): 全部 {len(dailies)} 期日报，按月份分组",
        f"- [RSS]({SITE}/rss.xml): 全站最新 30 条内容",
        f"- [sitemap]({SITE}/sitemap.xml): 全站 URL 清单",
        "",
        "## 最新观察笔记",
        "",
    ]

    for r in [x for x in notes if x["date"]][:20]:
        suffix = f": {r['desc'][:110]}" if r["desc"] else ""
        out.append(f"- [{r['title']}]({r['url']}){suffix}")

    out += [
        "",
        "## 常读笔记",
        "",
    ]
    for name, desc in EVERGREEN.items():
        path = REPO / "notes" / name
        if not path.exists():
            continue
        title, _ = read(path)
        out.append(f"- [{title}]({SITE}/notes/{name}): {desc}")

    out += [
        "",
        "## 最新 AI 日报",
        "",
    ]
    for r in [x for x in dailies if x["date"]][:8]:
        suffix = f": {r['desc'][:110]}" if r["desc"] else ""
        out.append(f"- [{r['title']}]({r['url']}){suffix}")

    out += [
        "",
        "## 关于主理人",
        "",
        "犀牛伯爵（Jeep），前百度智能云产品市场负责人，现任数美科技市场总监。"
        "关注 AI、Physical AI、机器人仿真、AI 商业化与品牌叙事。站点以中文为主。",
        "",
    ]

    (REPO / "llms.txt").write_text("\n".join(out), encoding="utf-8")
    print(f"wrote llms.txt: {len(notes)} notes, {len(dailies)} dailies")
    return 0


if __name__ == "__main__":
    sys.exit(main())
