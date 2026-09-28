#!/usr/bin/env python3
"""Mark WeChat export duplicates as noindex and point canonical at the original.

The `notes/*-wechat.html` files are HTML exports of the WeChat article, kept
for republishing. They are near-duplicates of the canonical note, so they must
not compete in search results. This script:

  1. sets <meta name="robots" content="noindex,follow">
  2. repoints <link rel="canonical"> to the non-wechat sibling
  3. repoints og:url + JSON-LD url/@id to the canonical sibling
  4. injects a "canonical article" link for users who land here from WeChat

Idempotent. Exits non-zero if a wechat file has no sibling to point at.
"""
import json
import re
import sys
from pathlib import Path
from typing import Optional

REPO = Path(__file__).resolve().parent.parent
NOTES = REPO / "notes"


def canonical_sibling(path: Path) -> Optional[Path]:
    candidate = path.with_name(path.name.replace("-wechat.html", ".html"))
    return candidate if candidate.exists() else None


def patch_jsonld(html: str, url: str) -> str:
    def fix(match: re.Match) -> str:
        block = match.group(0)
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            return block
        changed = False

        def walk(node):
            nonlocal changed
            if isinstance(node, dict):
                for key in ("url", "@id", "mainEntityOfPage"):
                    val = node.get(key)
                    if isinstance(val, str) and "-wechat.html" in val:
                        node[key] = url
                        changed = True
                    elif isinstance(val, dict) and "-wechat.html" in str(val.get("@id", "")):
                        val["@id"] = url
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
        return '<script type="application/ld+json">\n' + body + "\n    </script>"

    return re.sub(
        r'<script type="application/ld\+json">.*?</script>',
        fix,
        html,
        flags=re.DOTALL,
    )


def fix_file(path: Path) -> bool:
    sibling = canonical_sibling(path)
    if not sibling:
        print(f"  !! no canonical sibling for {path.name}", file=sys.stderr)
        return False

    url = f"https://rhinocount.cn/notes/{sibling.name}"
    html = path.read_text(encoding="utf-8")
    original = html

    # 1. robots noindex
    if re.search(r'<meta\s+name="robots"', html, re.IGNORECASE):
        html = re.sub(
            r'(<meta\s+name="robots"\s+content=")[^"]*(")',
            lambda m: m.group(1) + "noindex,follow" + m.group(2),
            html,
            flags=re.IGNORECASE,
        )
    else:
        anchor = re.search(r'(<meta[^>]*name="description"[^>]*>)', html, re.IGNORECASE)
        tag = '\n<meta name="robots" content="noindex,follow" />'
        if anchor:
            html = html[: anchor.end()] + tag + html[anchor.end() :]
        else:
            head = re.search(r"</head>", html, re.IGNORECASE)
            if head:
                html = html[: head.start()] + tag + html[head.start() :]

    # 2. canonical -> original
    if re.search(r'<link\s+rel="canonical"', html, re.IGNORECASE):
        html = re.sub(
            r'(<link\s+rel="canonical"\s+href=")[^"]*(")',
            lambda m: m.group(1) + url + m.group(2),
            html,
            flags=re.IGNORECASE,
        )
    else:
        html = html.replace(
            "</head>", f'  <link rel="canonical" href="{url}" />\n</head>', 1
        )

    # 3. og:url
    if re.search(r'<meta\s+property="og:url"', html, re.IGNORECASE):
        html = re.sub(
            r'(<meta\s+property="og:url"\s+content=")[^"]*(")',
            lambda m: m.group(1) + url + m.group(2),
            html,
            flags=re.IGNORECASE,
        )

    html = patch_jsonld(html, url)

    # 4. human-facing pointer, inserted right after <body>
    if "本文正式版本" not in html:
        note = (
            '\n<p style="margin:0 0 24px 0;font-size:13px;color:#8a8a8a;line-height:1.8;">'
            '本文正式版本：'
            f'<a href="{url}" style="color:#14532d;">{sibling.stem}.html</a>'
            "（本页为公众号导出副本，不参与搜索排序）</p>\n"
        )
        body = re.search(r"(<body[^>]*>)", html, re.IGNORECASE)
        if body:
            html = html[: body.end()] + note + html[body.end() :]

    if html != original:
        path.write_text(html, encoding="utf-8")
        return True
    return False


def main() -> int:
    targets = sorted(NOTES.glob("*-wechat.html"))
    if not targets:
        print("no wechat duplicates found")
        return 0

    changed = 0
    failures = []
    for f in targets:
        if fix_file(f):
            changed += 1
            print(f"  fixed {f.name}")
        else:
            failures.append(f.name)

    print(f"\nchecked={len(targets)} fixed={changed}")
    if failures:
        print("FAILED:", file=sys.stderr)
        for name in failures:
            print("  " + name, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
