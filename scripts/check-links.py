#!/usr/bin/env python3
"""Full-site internal link audit for rhinocount.cn.

Checks every href/src in local HTML files against:
1. Local file existence (relative links)
2. Anchor targets (#id exists in target page)
3. Obsolete domains (zjeep-arch.github.io, rhino-count.site as URL)
4. Trivially malformed hrefs (empty, javascript:, spaces)
Prints a per-issue report and exits non-zero on failure.
"""
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", "node_modules", "scripts", "assets", "builds"}
BAD_DOMAINS = ("zjeep-arch.github.io", "https://rhino-count.site")


class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []  # (kind, value, line)

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        for attr in ("href", "src"):
            v = d.get(attr)
            if v:
                self.links.append((attr, v.strip(), self.getpos()[0]))


def collect_ids(path):
    with open(path, encoding="utf-8") as f:
        html = f.read()
    return set(re.findall(r'id="([^"]+)"', html)), html


def main():
    pages = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".html"):
                pages.append(os.path.join(dirpath, fn))

    issues = []
    for page in pages:
        rel = os.path.relpath(page, ROOT)
        try:
            parser = LinkCollector()
            with open(page, encoding="utf-8") as f:
                parser.feed(f.read())
        except Exception as e:  # unreadable page is itself an issue
            issues.append(f"{rel}: UNREADABLE {e}")
            continue
        for kind, href, line in parser.links:
            # 1. obsolete domains
            for bad in BAD_DOMAINS:
                if bad in href:
                    issues.append(f"{rel}:{line} obsolete-domain {href[:90]}")
            # 2. malformed (data: URIs legitimately contain spaces)
            if href.startswith("data:"):
                continue
            if not href or href.strip() in ("javascript:void(0)",):
                issues.append(f"{rel}:{line} empty/void {kind}")
            if " " in href and not href.startswith(("mailto:", "tel:")) and "%20" not in href:
                issues.append(f"{rel}:{line} space-in-url {href[:90]}")
            # 3. local targets (relative, root-absolute, not external, not anchor-only)
            if href.startswith(("http", "mailto:", "tel:", "//")):
                continue
            target = href.split("#")[0].split("?")[0]
            fragment = href.split("#")[1].split("?")[0] if "#" in href else None
            if target:
                if target.startswith("/"):
                    tpath = os.path.normpath(os.path.join(ROOT, target.lstrip("/")))
                else:
                    tpath = os.path.normpath(os.path.join(os.path.dirname(page), target))
                if not os.path.exists(tpath):
                    issues.append(f"{rel}:{line} BROKEN {kind}={href[:90]}")
            if fragment:
                base = (
                    os.path.normpath(os.path.join(ROOT, target.lstrip("/")))
                    if target.startswith("/")
                    else (
                        os.path.normpath(os.path.join(os.path.dirname(page), target))
                        if target
                        else page
                    )
                )
                if os.path.exists(base):
                    ids, _ = collect_ids(base)
                    if fragment not in ids:
                        issues.append(f"{rel}:{line} MISSING-ANCHOR #{fragment} in {os.path.relpath(base, ROOT)}")

    print(f"checked {len(pages)} pages")
    if issues:
        print(f"\n{len(issues)} issue(s):")
        for i in issues:
            print(" ", i)
        sys.exit(1)
    print("all internal links OK")


if __name__ == "__main__":
    main()
