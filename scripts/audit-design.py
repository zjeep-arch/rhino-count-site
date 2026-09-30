#!/usr/bin/env python3
"""Extract measurable design/UX metrics from the rhinocount.cn site.

Use when asked to review the site's design and no vision tool is available:
turn every judgement a designer would make into a number, then argue from
the numbers. Baseline captured 2026-09-28 lives in
references/design-metric-audit.md.

Style note: never put a backslash inside an f-string expression
(Python 3.11+ SyntaxError). Assign the re.findall result first.

Run:  python3 scripts/audit-design.py
"""
import re
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def read(p):
    return Path(p).read_text(encoding="utf-8", errors="ignore")


def lum(hexstr):
    h = hexstr.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    try:
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    except ValueError:
        return None

    def f(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    if la is None or lb is None:
        return None
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main():
    home = read(REPO / "index.html")
    notes = read(REPO / "notes" / "index.html")
    daily = read(REPO / "ai-daily" / "index.html")
    article = read(REPO / "notes" / "2026-09-27-claude-kexue-faxian.html")

    print("=" * 62)
    print("1. 首屏信息密度")
    print("=" * 62)
    end = home.find("</main>")
    fold = home[:end] if end > 0 else home[:40000]
    print(f"  首页 main 区域 HTML: {len(fold) / 1024:.0f} KB")
    print(f"  首屏可见卡片数(h2/h3): {len(re.findall(r'<h[23]', fold))}")
    cta = len(re.findall(r'class="[^"]*cta[^"]*"', fold))
    print(f"  首屏 CTA 按钮数: {cta}")
    print(f"  首屏图片数: {len(re.findall(r'<img', fold))}")

    print()
    print("=" * 62)
    print("2. 字体层级 (首页)")
    print("=" * 62)
    sizes = Counter()
    for m in re.finditer(r'font-size:\s*([\d.]+)px', home):
        sizes[float(m.group(1))] += 1
    for m in re.finditer(r'font-size:\s*([\d.]+)rem', home):
        sizes[round(float(m.group(1)) * 16)] += 1
    print("  px 字号使用频次 (前 12):")
    for s, c in sorted(sizes.items(), key=lambda x: -x[1])[:12]:
        bar = "#" * min(c, 40)
        print(f"    {s:>5.0f}px  x{c:<3} {bar}")
    distinct = len([s for s in sizes if s >= 11])
    print(f"  >=11px 的不同字号数: {distinct}  (设计惯例 5-8 个为宜)")

    print()
    print("=" * 62)
    print("3. 颜色与对比度")
    print("=" * 62)
    cols = Counter(re.findall(r'#[0-9a-fA-F]{6}\b', home))
    print(f"  颜色总数: {len(cols)}   (设计惯例 6-12 个为宜)")
    print("  使用最多的 10 个:")
    for c, n in cols.most_common(10):
        print(f"    {c}  x{n}")
    m = re.search(r'--muted:\s*(#[0-9a-fA-F]{6})', home)
    bgs = re.findall(r'--(?:bg|surface)[^:]*:\s*(#[0-9a-fA-F]{6})', home)
    if m and bgs:
        cr = contrast(m.group(1), bgs[0])
        if cr:
            note = "OK(AA)" if cr >= 4.5 else "偏浅"
            print(f"\n  --muted {m.group(1)} vs --bg {bgs[0]}: "
                  f"{cr:.2f}:1  {note}")

    print()
    print("=" * 62)
    print("4. 触控目标 (移动端可点击区)")
    print("=" * 62)
    for label, html in (("首页", home), ("笔记列表", notes), ("日报", daily)):
        small = sum(1 for m in re.finditer(r'(?:min-)?height:\s*([\d.]+)px', html)
                    if float(m.group(1)) < 44)
        taps = len(re.findall(r'<a\s', html))
        print(f"  {label:<8} <a> 链接 {taps:>4}   <44px 的 height 声明 {small:>3}")

    print()
    print("=" * 62)
    print("5. 图片与体积")
    print("=" * 62)
    for label, html in (("首页", home), ("笔记列表", notes),
                        ("文章页", article), ("日报", daily)):
        imgs = re.findall(r'<img[^>]*src="([^"]+)"', html)
        lazy = len(re.findall(r'loading="lazy"', html))
        alts = len(re.findall(r'<img[^>]*alt="[^"]+"', html))
        total = len(html.encode("utf-8"))
        print(f"  {label:<8} {total / 1024:>6.0f} KB   img {len(imgs):>3}  "
              f"lazy {lazy:>3}  有alt {alts:>3}")

    print()
    print("=" * 62)
    print("6. 文章页排版 (可读性)")
    print("=" * 62)
    sel = r'(?:\.article-body|\.note-body|\.post-content|\.entry-content)'
    w = re.search(sel + r'[^{]*\{[^}]*max-width:\s*([\d.]+)px', article)
    mw = w.group(1) + "px" if w else "未设置"
    print(f"  正文 max-width: {mw}  (中文 ideal 30-40 字/行 ≈ 640-720px)")
    fs = re.search(sel + r'[^{]*\{[^}]*font-size:\s*([\d.]+)px', article)
    print(f"  正文字号: {fs.group(1) + 'px' if fs else '未设置'}  (16-18px 宜)")
    lh = re.search(sel + r'[^{]*\{[^}]*line-height:\s*([\d.]+)', article)
    print(f"  行高: {lh.group(1) if lh else '未设置'}  (1.6-1.8 宜)")
    print(f"  h2 数量: {len(re.findall(r'<h2', article))}   "
          f"h3: {len(re.findall(r'<h3', article))}")
    print(f"  段落数: {len(re.findall(r'<p[ >]', article))}")

    print()
    print("=" * 62)
    print("7. 导航与可达性")
    print("=" * 62)
    for label, html in (("首页", home), ("笔记", notes), ("日报", daily)):
        navs = len(re.findall(r'class="[^"]*site-nav', html))
        h1 = len(re.findall(r'<h1', html))
        aria = len(re.findall(r'aria-label=', html))
        print(f"  {label:<8} site-nav x{navs}  h1 x{h1}  aria-label {aria}")

    print()
    print("=" * 62)
    print("8. 导航项内容")
    print("=" * 62)
    m = re.search(r'class="[^"]*site-nav[^"]*".*?</nav>', home, re.S)
    if m:
        items = re.findall(r'>([^<>]{1,30})</a>', m.group(0))
        print("  首页导航:", " | ".join(i.strip() for i in items if i.strip()))
    else:
        print("  未匹配到 site-nav 块")

    print()
    print("=" * 62)
    print("9. 加载性能隐患")
    print("=" * 62)
    for label, html in (("首页", home), ("笔记", notes), ("文章", article)):
        scripts = len(re.findall(r'<script(?![^>]*application/ld)', html))
        fonts = len(re.findall(r'fonts\.(googleapis|gstatic)', html))
        video = len(re.findall(r'<video', html))
        canvas = len(re.findall(r'<canvas', html))
        print(f"  {label:<6} script {scripts:>3}  google-fonts {fonts:>2}  "
              f"video {video}  canvas {canvas}")

    print()
    print("=" * 62)
    print("10. 归档/发现性")
    print("=" * 62)
    for f, label in ((REPO / "notes" / "index.html", "笔记列表"),
                     (REPO / "ai-daily" / "index.html", "日报列表")):
        h = read(f)
        cards = len(re.findall(r'class="note-card', h)) or \
            len(re.findall(r'article-card', h))
        archive = "有" if "archive/" in h else "无"
        print(f"  {label:<8} 归档入口: {archive}   卡片: {cards}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
