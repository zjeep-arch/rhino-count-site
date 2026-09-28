#!/usr/bin/env python3
"""Prerender JS-rendered pages: bake the JS-rendered DOM back into static files.

Pages: index.html, notes/index.html, ai-daily/index.html.
Flow: serve repo dir locally -> headless Chrome renders each page -> save
full DOM back. Visual/JS behavior unchanged (JS still runs on load);
crawlers / share cards / AI bots now see full content.

Run after any data.js/index.html change; the launchd watchdog calls this.
"""
import re
import subprocess
import sys
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8791
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# rel path -> (minimum expected visible words after render, hard floor as a
# fraction of the currently-baked DOM)
#
# The relative check exists to catch a catastrophically empty render, not to
# catch normal content rotation. It kept false-firing on ai-daily/index.html:
# that page is rebuilt from feed.json at prerender time, so its inline DOM is
# always slightly shorter than the previous bake (HEAD 184 words -> render 160)
# even though the card count is identical (24/24). 0.9 was too tight for a page
# whose content rotates every publishing run.
PAGES = {
    "index.html": (300, 0.75),
    "notes/index.html": (100, 0.75),
    "ai-daily/index.html": (50, 0.70),
}


def main():
    os.chdir(REPO)
    server = HTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    results = []
    try:
        for rel, (min_words, floor) in PAGES.items():
            url = f"http://127.0.0.1:{PORT}/{rel}"
            before = visible_words(open(rel, encoding="utf-8").read())
            dom = subprocess.run(
                [CHROME, "--headless=new", "--disable-gpu",
                 "--virtual-time-budget=15000", "--dump-dom", url],
                check=True, capture_output=True, text=True, timeout=120).stdout
            after = visible_words(dom)
            print(f"{rel}: {before} -> {after} words")
            if after < min_words or after < before * floor:
                # min_words catches empty renders; the relative check catches
                # catastrophic loss while tolerating content rotation.
                print(f"ERROR: {rel} render looks empty; aborting.", file=sys.stderr)
                sys.exit(1)
            with open(rel, "w", encoding="utf-8") as f:
                f.write(dom)
            results.append((rel, len(dom)))
    finally:
        server.shutdown()

    for rel, size in results:
        print(f"prerendered {rel} ({size} bytes)")


def visible_words(html: str) -> int:
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return len(t.split())


if __name__ == "__main__":
    main()
