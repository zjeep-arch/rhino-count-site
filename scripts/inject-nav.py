#!/usr/bin/env python3
"""Patch script: inject site-nav into content pages that only have class="back" but no site-nav."""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

NAV_HTML = '''<nav class="site-nav" style="position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(0,0,0,0.06);padding:12px 20px;">
    <div style="max-width:740px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
      <a href="/" style="font-weight:700;font-size:15px;color:#1a1a1a;text-decoration:none;">犀牛伯爵</a>
      <div style="display:flex;gap:20px;font-size:14px;">
        <a href="/notes/" style="color:#666;text-decoration:none;">笔记</a>
        <a href="/articles/" style="color:#666;text-decoration:none;">时评</a>
        <a href="/ai-daily/" style="color:#666;text-decoration:none;">日报</a>
      </div>
    </div>
  </nav>'''

SKIP_FILES = {"template.html", "index.html"}

def inject_nav(filepath):
    """Inject site-nav right after <body> tag if not present."""
    html = filepath.read_text(encoding="utf-8")
    
    if 'site-nav' in html:
        return False
    
    # Find <body> tag and insert nav after it
    body_match = re.search(r'<body[^>]*>', html)
    if not body_match:
        print(f"  WARN: no <body> in {filepath}")
        return False
    
    insert_pos = body_match.end()
    html = html[:insert_pos] + f"\n  {NAV_HTML}\n" + html[insert_pos:]
    filepath.write_text(html, encoding="utf-8")
    return True

def main():
    fixed = 0
    
    # Process notes
    for f in sorted((REPO / "notes").glob("*.html")):
        if f.name in SKIP_FILES:
            continue
        if inject_nav(f):
            fixed += 1
            print(f"  ✓ notes/{f.name}")
    
    # Process articles (skip retired and template/index)
    for f in sorted((REPO / "articles").glob("*.html")):
        if f.name in SKIP_FILES or f.name.startswith("_retired"):
            continue
        if inject_nav(f):
            fixed += 1
            print(f"  ✓ articles/{f.name}")
    
    # Process ai-daily
    for f in sorted((REPO / "ai-daily").glob("*.html")):
        if f.name in SKIP_FILES:
            continue
        if inject_nav(f):
            fixed += 1
            print(f"  ✓ ai-daily/{f.name}")
    
    print(f"\nTotal: {fixed} pages got site-nav")

if __name__ == "__main__":
    main()
