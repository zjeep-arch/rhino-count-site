#!/usr/bin/env python3
"""Orphan-page audit: which content pages have zero inbound internal links.

Normalizes every href to an absolute site path, handling root-relative paths,
document-relative paths (`../notes/x.html`), and absolute rhinocount.cn URLs.
Query strings and fragments are stripped. Index/archive/listing pages are
excluded from the orphan verdict because they are navigation hubs, not
content — but they still count as link sources.

Exits 1 if any content page is orphaned.
"""
import collections
import glob
import os
import re
import sys
import urllib.parse

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "rhinocount.cn"
HUB = re.compile(r"/(index|archive)\.html$")


def normalize(href: str, source: str):
    target = href.split("#", 1)[0].split("?", 1)[0].strip()
    if not target or target.startswith(("mailto:", "tel:", "data:", "javascript:")):
        return None
    if target.startswith("http://") or target.startswith("https://"):
        parsed = urllib.parse.urlparse(target)
        if parsed.netloc and SITE not in parsed.netloc:
            return None
        target = parsed.path
    if target.startswith("/"):
        return urllib.parse.unquote(target)
    base = os.path.dirname(source)
    return "/" + urllib.parse.unquote(
        os.path.normpath(os.path.join(base, target))
    ).replace(os.sep, "/")


def main() -> int:
    os.chdir(REPO)
    all_html = sorted(glob.glob("**/*.html", recursive=True))

    content = set()
    for f in all_html:
        if os.path.basename(f) in ("template.html",) or f.startswith("_retired"):
            continue
        if HUB.search("/" + f.replace(os.sep, "/")):
            continue
        content.add("/" + f.replace(os.sep, "/"))

    inbound = collections.Counter()
    for f in all_html:
        try:
            html = open(f, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        base = "/" + f.replace(os.sep, "/")
        for href in re.findall(r'href="([^"]+)"', html):
            path = normalize(href, f)
            if path and path in content and path != base:
                inbound[path] += 1

    orphans = sorted(p for p in content if inbound[p] == 0)
    thin = sorted((p, inbound[p]) for p in content if 0 < inbound[p] <= 1)

    print(f"content pages: {len(content)}")
    print(f"with >=2 inbound links: {len(content) - len(orphans) - len(thin)}")
    print(f"with exactly 1 inbound link: {len(thin)}")
    print(f"orphans (0 inbound): {len(orphans)}")
    for p in orphans:
        print("  ORPHAN " + p)
    for p, c in thin:
        print(f"  THIN({c}) {p}")

    return 1 if orphans else 0


if __name__ == "__main__":
    sys.exit(main())
