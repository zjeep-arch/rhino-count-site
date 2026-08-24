#!/usr/bin/env python3
"""Generate sitemap.xml for rhinocount.cn with real lastmod from git history."""
import os
import subprocess
import xml.sax.saxutils as saxutils
from datetime import datetime
from pathlib import Path

SITE_URL = "https://rhinocount.cn"
REPO_ROOT = Path(__file__).resolve().parent.parent

# Directories and files to include in sitemap
# Structure: (path_prefix, url_prefix, include_individual_files, include_index)
SECTIONS = [
    # Root pages
    ("", "", True, False),
    # Notes
    ("notes", "/notes", True, True),
    # Articles  
    ("articles", "/articles", True, True),
    # AI Daily
    ("ai-daily", "/ai-daily", True, True),
    # Dumate
    ("dumate", "/dumate", False, True),
]

# Files to exclude (not content pages, or retired)
EXCLUDE_FILES = {
    "baidu_verify_codeva-BwbC9G551S.html",
    "google549c86588c2e00bb.html",
    "84eb7ec8dcac1b223dc0dda79d8f7997.txt",
    "network-check.html",
    # 3D/game experimental pages (thin content)
    "ai-lab-3d.html",
    "ai-studio-3d.html",
    "anti-gravity-text.html",
    "stadium-3d.html",
    "temple-of-heaven-curtain-share.html",
    "whiteboard-recorder.html",
    # Templates
    "notes/template.html",
    "articles/template.html",
    "ai-daily/template.html",
}

EXCLUDE_PATTERNS = [
    "_retired",
    "draft",
]


def should_exclude(filename):
    """Check if a file should be excluded from sitemap."""
    if filename in EXCLUDE_FILES:
        return True
    for pattern in EXCLUDE_PATTERNS:
        if pattern in filename.lower():
            return True
    return False


def get_git_lastmod(filepath):
    """Get the last modified date from git log for a file."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ad", "--date=short", "--", filepath],
            capture_output=True, text=True, cwd=REPO_ROOT
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    # Fallback: use file modification time
    stat = os.stat(filepath)
    return datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")


def extract_date_from_filename(filename):
    """Extract date from filename like 2026-08-20-ai-equality-listener.html."""
    import re
    match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
    if match:
        return match.group(1)
    return None


def get_file_lastmod(filepath, filename=None):
    """Get lastmod: prefer filename date, fallback to git, then file mtime."""
    # 1. Try date from filename (most accurate for content pages)
    fname = filename or os.path.basename(filepath)
    file_date = extract_date_from_filename(fname)
    if file_date:
        return file_date
    
    # 2. Try git log
    git_mod = get_git_lastmod(filepath)
    if git_mod:
        return git_mod
    
    # 3. Fallback: file mtime
    stat = os.stat(filepath)
    return datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")


def collect_urls():
    """Collect all URLs with their lastmod dates."""
    urls = []
    
    # Homepage
    urls.append({
        "loc": f"{SITE_URL}/",
        "lastmod": get_file_lastmod("index.html"),
        "changefreq": "daily",
        "priority": "1.0"
    })
    
    # Section index pages and individual files
    section_dirs = ["notes", "articles", "ai-daily", "dumate"]
    
    for section in section_dirs:
        section_path = REPO_ROOT / section
        if not section_path.exists():
            continue
        
        # Section index page
        index_file = section_path / "index.html"
        if index_file.exists():
            rel_path = f"{section}/index.html"
            urls.append({
                "loc": f"{SITE_URL}/{section}/",
                "lastmod": get_file_lastmod(rel_path),
                "changefreq": "daily",
                "priority": "0.9"
            })
        
        # Individual HTML files in this section
        html_files = sorted(section_path.glob("*.html"))
        for f in html_files:
            if f.name == "index.html" or f.name == "template.html":
                continue
            if should_exclude(f.name):
                continue
            
            rel_path = f"{section}/{f.name}"
            lastmod = get_file_lastmod(rel_path)
            
            # Determine priority based on content type
            if section == "notes":
                priority = "0.8"
                changefreq = "monthly"
            elif section == "articles":
                priority = "0.7"
                changefreq = "monthly"
            elif section == "ai-daily":
                priority = "0.6"
                changefreq = "monthly"
            else:
                priority = "0.5"
                changefreq = "monthly"
            
            urls.append({
                "loc": f"{SITE_URL}/{section}/{f.name}",
                "lastmod": lastmod,
                "changefreq": changefreq,
                "priority": priority
            })
    
    return urls


def generate_sitemap(urls):
    """Generate sitemap.xml content."""
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    for url in urls:
        lines.append('  <url>')
        lines.append(f'    <loc>{saxutils.escape(url["loc"])}</loc>')
        lines.append(f'    <lastmod>{url["lastmod"]}</lastmod>')
        lines.append(f'    <changefreq>{url["changefreq"]}</changefreq>')
        lines.append(f'    <priority>{url["priority"]}</priority>')
        lines.append('  </url>')
    
    lines.append('</urlset>')
    lines.append('')  # trailing newline
    return '\n'.join(lines)


def main():
    urls = collect_urls()
    sitemap = generate_sitemap(urls)
    
    output_path = REPO_ROOT / "sitemap.xml"
    output_path.write_text(sitemap, encoding="utf-8")
    
    print(f"Generated sitemap.xml with {len(urls)} URLs")
    print(f"Output: {output_path}")
    
    # Print summary
    print("\n=== URL Summary ===")
    sections = {}
    for url in urls:
        path = url["loc"].replace(SITE_URL, "")
        if path == "/":
            section = "homepage"
        elif path.endswith("/"):
            section = f"{path.strip('/')} (index)"
        else:
            parts = path.strip("/").split("/")
            section = parts[0] if len(parts) > 1 else "root"
        sections[section] = sections.get(section, 0) + 1
    
    for section, count in sorted(sections.items()):
        print(f"  {section}: {count}")
    
    # Show latest lastmod dates
    print("\n=== Latest 10 lastmod ===")
    sorted_urls = sorted(urls, key=lambda u: u["lastmod"], reverse=True)
    for url in sorted_urls[:10]:
        print(f"  {url['lastmod']} | {url['loc']}")


if __name__ == "__main__":
    main()
