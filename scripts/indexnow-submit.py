#!/usr/bin/env python3
"""IndexNow incremental submission for rhinocount.cn.

Usage:
  python3 scripts/indexnow-submit.py            # submit URLs from sitemap.xml not yet submitted
  python3 scripts/indexnow-submit.py URL [URL..] # submit explicit URLs
State: .indexnow-submitted.json (gitignored) tracks already-pushed URLs.
"""
import json
import os
import re
import sys
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_FILE = "84eb7ec8dcac1b223dc0dda79d8f7997.txt"
STATE = os.path.join(REPO, ".indexnow-submitted.json")
ENDPOINT = "https://api.indexnow.org/indexnow"


def load_key():
    with open(os.path.join(REPO, KEY_FILE)) as f:
        return f.read().strip()


def sitemap_urls():
    with open(os.path.join(REPO, "sitemap.xml")) as f:
        return re.findall(r"<loc>(.*?)</loc>", f.read())


def main():
    key = load_key()
    done = set()
    if len(sys.argv) > 1:
        urls = [u for u in sys.argv[1:] if u.startswith("http")]
    else:
        if os.path.exists(STATE):
            with open(STATE) as f:
                done = set(json.load(f))
        urls = [u for u in sitemap_urls() if u not in done]
    if not urls:
        print("nothing to submit")
        return

    payload = {"host": "rhinocount.cn", "key": key, "urlList": urls}
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow HTTP {r.status} for {len(urls)} URL(s)")
            ok = r.status in (200, 202)
    except Exception as e:
        print(f"IndexNow error: {e}")
        sys.exit(1)

    if ok and len(sys.argv) == 1:
        done.update(urls)
        with open(STATE, "w") as f:
            json.dump(sorted(done), f)
        print(f"state saved: {len(done)} total submitted")


if __name__ == "__main__":
    main()
