#!/usr/bin/env python3
"""Prerender index.html: bake the JS-rendered DOM back into the static file.

Flow: serve repo dir locally -> headless Chrome renders -> save full DOM
back to index.html. Visual/JS behavior unchanged (JS still runs on load);
crawlers / share cards now see full content.

Run after any data.js/index.html change (daily publish cron calls this).
"""
import re
import subprocess
import sys
import tempfile
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8791
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL = f"http://127.0.0.1:{PORT}/index.html"


def main():
    # Marker: if already prerendered, JS re-render is idempotent anyway.
    with open(os.path.join(REPO, "index.html"), encoding="utf-8") as f:
        src = f.read()
    words_before = visible_words(src)

    # Serve repo root
    os.chdir(REPO)
    server = HTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler)
    import threading
    threading.Thread(target=server.serve_forever, daemon=True).start()

    try:
        out = tempfile.NamedTemporaryFile(suffix=".html", delete=False).name  # noqa
        dom = subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu",
             "--virtual-time-budget=15000", "--dump-dom", URL],
            check=True, capture_output=True, text=True, timeout=120).stdout
    finally:
        server.shutdown()

    words_after = visible_words(dom)
    print(f"visible words: {words_before} -> {words_after}")
    if words_after < max(300, words_before * 3):
        print("ERROR: rendered DOM looks empty; aborting write.", file=sys.stderr)
        sys.exit(1)

    with open(os.path.join(REPO, "index.html"), "w", encoding="utf-8") as f:
        f.write(dom)
    print(f"prerendered index.html written ({len(dom)} bytes)")


def visible_words(html: str) -> int:
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    return len(t.split())


if __name__ == "__main__":
    main()
