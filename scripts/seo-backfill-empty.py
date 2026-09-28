#!/usr/bin/env python3
"""One-off repair: backfill empty og:description / twitter:description /
JSON-LD "description" fields left behind by a buggy extract_description().

Idempotent: only rewrites fields that are currently an empty string, so it is
safe to re-run. Prints a summary and exits non-zero if anything was still
empty afterwards.

Root cause (2026-09-28): seo-batch-fix.py only matched
`<meta name="description" content="...">`, but the wechat-export template
emits `<meta content="..." name="description"/>`. extract_description() now
handles both orders; this script repairs what the bad run already wrote.
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DIRS = ["notes", "ai-daily", "articles"]
SKIP = {"template.html", "index.html"}

DESC_PATTERNS = (
    r'<meta\s+name="description"\s+content="([^"]*)"',
    r'<meta\s+content="([^"]*)"\s+name="description"',
)
MAX_DESC = 160


def extract_description(html: str) -> str:
    for pat in DESC_PATTERNS:
        m = re.search(pat, html, re.IGNORECASE)
        if m and m.group(1).strip():
            return " ".join(m.group(1).split())
    return ""


def truncate(text: str, limit: int = MAX_DESC) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit]
    for sep in ("。", "；", "，", " ", "、"):
        idx = cut.rfind(sep)
        if idx >= limit * 0.6:
            return cut[: idx + 1] if sep != " " else cut[:idx]
    return cut + "…"


def jsd_escape(text: str) -> str:
    """Escape for a JSON string, then make it safe inside an HTML attribute.

    json.dumps() turns a quote into `\"`, which is correct JSON but *breaks* an
    HTML attribute: the browser closes content="..." at the first `"` and the
    rest becomes garbage attributes. 11 notes shipped this way (2026-07-09
    gpt-live-voice-model, 2026-07-22 kimi-k3, 4 articles, …).
    So after JSON-escaping, convert \" back to the HTML entity &quot;.
    """
    escaped = json.dumps(text, ensure_ascii=False)[1:-1]
    return escaped.replace('\\"', "&quot;")


def extract_first_paragraph(html: str) -> str:
    """Derive a description from the article body when no meta exists.

    Used for the ~12 pages that were published without a description meta at
    all. Skips nav/blockquote/核心判断/目录 boilerplate and any line that looks
    like a source disclaimer or byline.
    """
    body = html.split("<body", 1)[-1]
    # drop script/style and the sticky nav/footer the injector added
    body = re.sub(r"<script.*?</script>", " ", body, flags=re.DOTALL | re.I)
    body = re.sub(r"<style.*?</style>", " ", body, flags=re.DOTALL | re.I)
    for marker in ('class="site-nav"', 'class="site-footer"', "核心判断", "事实来自", "整理｜"):
        idx = body.find(marker)
        if idx != -1:
            body = body[:idx] + body[body.find("</p>", idx) + 4 :] if "</p>" in body[idx:] else body[:idx]
    for m in re.finditer(r"<p[^>]*>(.*?)</p>", body, re.DOTALL | re.I):
        text = re.sub(r"<[^>]+>", "", m.group(1))
        text = " ".join(text.split())
        if len(text) < 40:
            continue
        if text.startswith(("N°", "整理｜", "事实来自", "关注", "阅读约")):
            continue
        if re.match(r"^\d{4}-\d{2}-\d{2}", text):
            continue
        return text
    return ""


def fix_file(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    desc = truncate(extract_description(html))
    if not desc:
        desc = truncate(extract_first_paragraph(html))
        if not desc:
            print(f"  !! no description source found: {path.name}", file=sys.stderr)
            return False
    if not re.search(r'<meta[^>]*name="description"', html, re.IGNORECASE):
        # page shipped without a description meta: add one derived from the body
        anchor = re.search(r'(<meta[^>]*name="keywords"[^>]*>)', html, re.IGNORECASE)
        tag = f'\n<meta name="description" content="{jsd_escape(desc)}" />'
        if anchor:
            html = html[: anchor.end()] + tag + html[anchor.end() :]
        else:
            head = re.search(r"</head>", html, re.IGNORECASE)
            if head:
                html = html[: head.start()] + tag + html[head.start() :]

    original = html

    # meta tags with an empty content="" (exactly two quotes, no stray third)
    html = re.sub(
        r'(<meta\s+property="og:description"\s+content=)""',
        lambda m: m.group(1) + '"' + jsd_escape(desc) + '"',
        html,
        flags=re.IGNORECASE,
    )
    html = re.sub(
        r'(<meta\s+name="twitter:description"\s+content=)""',
        lambda m: m.group(1) + '"' + jsd_escape(desc) + '"',
        html,
        flags=re.IGNORECASE,
    )

    # JSON-LD blocks: patch the "description" key when it is empty
    def patch_jsonld(match: re.Match) -> str:
        block = match.group(0)
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            return block
        changed = False

        def walk(node):
            nonlocal changed
            if isinstance(node, dict):
                if node.get("description") == "":
                    node["description"] = desc
                    changed = True
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)

        walk(data)
        if not changed:
            return block
        body = json.dumps(data, ensure_ascii=False, indent=2)
        return (
            '<script type="application/ld+json">\n'
            + body
            + "\n    </script>"
        )

    html = re.sub(
        r'<script type="application/ld\+json">.*?</script>',
        patch_jsonld,
        html,
        flags=re.DOTALL,
    )

    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> int:
    changed = 0
    checked = 0
    for d in DIRS:
        for f in sorted((REPO / d).glob("*.html")):
            if f.name in SKIP or f.name.startswith("_retired"):
                continue
            checked += 1
            if fix_file(f):
                changed += 1
                print(f"  fixed {d}/{f.name}")

    print(f"\nchecked={checked} fixed={changed}")

    still = []
    for d in DIRS:
        for f in sorted((REPO / d).glob("*.html")):
            if f.name in SKIP or f.name.startswith("_retired"):
                continue
            html = f.read_text(encoding="utf-8")
            for m in re.findall(
                r'<meta property="og:description" content="([^"]*)"', html
            ):
                if not m.strip():
                    still.append(f"{d}/{f.name} (og)")
                    break
            else:
                for m in re.findall(
                    r'<meta name="twitter:description" content="([^"]*)"', html
                ):
                    if not m.strip():
                        still.append(f"{d}/{f.name} (twitter)")
                        break

    if still:
        print("STILL EMPTY:", file=sys.stderr)
        for s in still:
            print("  " + s, file=sys.stderr)
        return 1
    print("all og/twitter descriptions non-empty")
    return 0


if __name__ == "__main__":
    sys.exit(main())
