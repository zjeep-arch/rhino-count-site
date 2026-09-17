#!/usr/bin/env python3
"""
Batch SEO fix for rhinocount.cn notes and articles.
Handles F2/F3/F5/F6/F12:
  - Add canonical, OG tags, Twitter Card, robots meta
  - Add BlogPosting JSON-LD structured data
  - Remove Google Fonts dependency
  - Add site header nav + footer (de-isolate pages)
  - Add brand suffix to titles
"""
import os
import re
import json
from pathlib import Path
from html import escape

REPO = Path(__file__).resolve().parent.parent
SITE_URL = "https://rhinocount.cn"
DEFAULT_OG_IMAGE = f"{SITE_URL}/temple-of-heaven.png"

# ---------- helpers ----------

def extract_title(html):
    """Extract <title> content."""
    m = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
    if m:
        return m.group(1).strip()
    return ""

def extract_description(html):
    """Extract meta description content."""
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return ""

def extract_date(filename):
    """Extract date from filename like 2026-08-20-xxx.html."""
    m = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
    return m.group(1) if m else ""

def find_cover_image(filepath, filename):
    """Find a cover image for the note/article."""
    directory = filepath.parent
    
    # Try patterns: date-prefix covers
    date_prefix = extract_date(filename)
    if date_prefix:
        for ext in ['.jpg', '.png', '.webp']:
            # {date}-cover{ext}
            candidate = directory / f"{date_prefix}-cover{ext}"
            if candidate.exists():
                return str(candidate.relative_to(REPO))
            # {date}-*cover*
            for f in directory.glob(f"{date_prefix}*cover*{ext}"):
                return str(f.relative_to(REPO))
    
    # Try {slug}-cover or cover-{slug}
    stem = filepath.stem
    for ext in ['.jpg', '.png', '.webp']:
        candidate = directory / f"{stem}-cover{ext}"
        if candidate.exists():
            return str(candidate.relative_to(REPO))
        candidate = directory / f"cover-{stem}{ext}"
        if candidate.exists():
            return str(candidate.relative_to(REPO))
    
    # Check assets/ directory for matching covers
    if date_prefix:
        for ext in ['.jpg', '.png', '.webp']:
            candidate = REPO / "assets" / f"cover-{date_prefix}{ext}"
            if candidate.exists():
                return str(candidate.relative_to(REPO))
    
    return None

def build_canonical(relative_path):
    """Build canonical URL."""
    url_path = str(relative_path).replace("\\", "/")
    return f"{SITE_URL}/{url_path}"

def build_seo_head(relative_path, title, description, date_str, cover_path, section):
    """Build SEO meta tags block to inject into <head>."""
    canonical = build_canonical(relative_path)
    og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
    
    # Clean title for OG (remove brand suffix if present)
    og_title = re.sub(r'\s*[·\-]\s*犀牛伯爵.*$', '', title).strip()
    
    tags = []
    
    # Canonical
    tags.append(f'  <link rel="canonical" href="{escape(canonical)}" />')
    
    # Robots
    tags.append('  <meta name="robots" content="index,follow" />')
    
    # OG tags
    tags.append('  <meta property="og:type" content="article" />')
    tags.append(f'  <meta property="og:title" content="{escape(og_title)}" />')
    tags.append(f'  <meta property="og:description" content="{escape(description)}" />')
    tags.append(f'  <meta property="og:url" content="{escape(canonical)}" />')
    tags.append(f'  <meta property="og:image" content="{escape(og_image)}" />')
    tags.append(f'  <meta property="og:site_name" content="犀牛伯爵" />')
    if date_str:
        tags.append(f'  <meta property="article:published_time" content="{date_str}" />')
    tags.append('  <meta property="article:author" content="犀牛伯爵" />')
    
    # Twitter Card
    tags.append('  <meta name="twitter:card" content="summary_large_image" />')
    tags.append(f'  <meta name="twitter:title" content="{escape(og_title)}" />')
    tags.append(f'  <meta name="twitter:description" content="{escape(description)}" />')
    tags.append(f'  <meta name="twitter:image" content="{escape(og_image)}" />')
    
    return "\n".join(tags)

def build_json_ld(relative_path, title, description, date_str, cover_path, section):
    """Build BlogPosting JSON-LD structured data."""
    canonical = build_canonical(relative_path)
    og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
    og_title = re.sub(r'\s*[·\-]\s*犀牛伯爵.*$', '', title).strip()
    
    data = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": og_title,
        "description": description,
        "url": canonical,
        "image": og_image,
        "author": {
            "@type": "Person",
            "name": "犀牛伯爵",
            "url": SITE_URL
        },
        "publisher": {
            "@type": "Organization",
            "name": "犀牛伯爵",
            "url": SITE_URL
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical
        }
    }
    if date_str:
        data["datePublished"] = date_str
        data["dateModified"] = date_str
    
    return f'  <script type="application/ld+json">\n  {json.dumps(data, ensure_ascii=False, indent=2)}\n  </script>'

def build_header_nav(section):
    """Build minimal site header nav for de-isolation."""
    return f'''<nav class="site-nav" style="position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(0,0,0,0.06);padding:12px 20px;">
    <div style="max-width:740px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
      <a href="/" style="font-weight:700;font-size:15px;color:#1a1a1a;text-decoration:none;">犀牛伯爵</a>
      <div style="display:flex;gap:20px;font-size:14px;">
        <a href="/notes/" style="color:#666;text-decoration:none;">笔记</a>
        <a href="/articles/" style="color:#666;text-decoration:none;">时评</a>
        <a href="/ai-daily/" style="color:#666;text-decoration:none;">日报</a>
      </div>
    </div>
  </nav>'''

def build_site_footer():
    """Build minimal site footer for de-isolation."""
    return '''<footer class="site-footer" style="border-top:1px solid rgba(0,0,0,0.06);padding:24px 20px;text-align:center;font-size:13px;color:#999;margin-top:40px;">
    <div style="max-width:740px;margin:0 auto;">
      <a href="/" style="color:#666;text-decoration:none;">犀牛伯爵</a>
      <span style="margin:0 8px;color:#ddd;">·</span>
      <a href="/notes/" style="color:#666;text-decoration:none;">全部笔记</a>
      <span style="margin:0 8px;color:#ddd;">·</span>
      <a href="/articles/" style="color:#666;text-decoration:none;">时评</a>
      <span style="margin:0 8px;color:#ddd;">·</span>
      <a href="/ai-daily/" style="color:#666;text-decoration:none;">日报</a>
      <p style="margin:8px 0 0;color:#bbb;font-size:12px;">&copy; 2026 犀牛伯爵 · AI Native Studio</p>
    </div>
  </footer>'''

def remove_google_fonts(html):
    """Remove Google Fonts links and preconnect."""
    # Remove preconnect lines
    html = re.sub(r'\s*<link\s+rel="preconnect"\s+href="https://fonts\.googleapis\.com"\s*/?>', '', html)
    html = re.sub(r'\s*<link\s+rel="preconnect"\s+href="https://fonts\.gstatic\.com"\s+crossorigin\s*/?>', '', html)
    # Remove stylesheet link
    html = re.sub(r'\s*<link\s+href="https://fonts\.googleapis\.com/css2[^"]*"\s+rel="stylesheet"\s*/?>', '', html)
    return html

def add_brand_suffix(title, section):
    """Add brand suffix to title if missing."""
    suffix_map = {
        "notes": " · 犀牛伯爵笔记",
        "articles": " · 犀牛伯爵时评",
        "ai-daily": " · 犀牛伯爵日报",
    }
    suffix = suffix_map.get(section, " · 犀牛伯爵")
    if "犀牛伯爵" not in title:
        return f"{title}{suffix}"
    return title

def has_canonical(html):
    return 'rel="canonical"' in html or "rel='canonical'" in html

def has_json_ld(html):
    return 'application/ld+json' in html

def has_nav(html):
    return 'site-nav' in html or 'class="back"' in html

def has_footer_links(html):
    return 'site-footer' in html or 'class="article-footer"' in html

# ---------- main processors ----------

def process_old_format_note(filepath, relative_path):
    """Process old-format note (no data-theme, minimal head)."""
    html = filepath.read_text(encoding="utf-8")
    filename = filepath.name
    title = extract_title(html)
    description = extract_description(html)
    date_str = extract_date(filename)
    cover_path = find_cover_image(filepath, filename)
    section = "notes"
    
    # Add brand suffix to title
    new_title = add_brand_suffix(title, section)
    if new_title != title:
        html = html.replace(f'<title>{title}</title>', f'<title>{new_title}</title>')
    
    # Build SEO block
    seo_block = build_seo_head(relative_path, title, description, date_str, cover_path, section)
    json_ld = build_json_ld(relative_path, title, description, date_str, cover_path, section)
    
    # Insert SEO block before </head>
    # Old format has </style>\n</head> pattern
    insert_point = html.find('</head>')
    if insert_point == -1:
        print(f"  WARN: no </head> in {filepath}")
        return False
    
    # Insert JSON-LD before SEO block
    head_injection = f"\n  {seo_block}\n  {json_ld}\n"
    html = html[:insert_point] + head_injection + html[insert_point:]
    
    # Add nav after <body>
    nav = build_header_nav(section)
    body_pos = html.find('<body>')
    if body_pos != -1:
        body_end = html.find('>', body_pos) + 1
        html = html[:body_end] + f"\n  {nav}\n" + html[body_end:]
    
    # Add footer before </body>
    footer = build_site_footer()
    body_close = html.rfind('</body>')
    if body_close != -1:
        html = html[:body_close] + f"  {footer}\n" + html[body_close:]
    
    filepath.write_text(html, encoding="utf-8")
    return True

def process_new_format_note(filepath, relative_path):
    """Process new-template-format note (has data-theme, partial SEO, Google Fonts)."""
    html = filepath.read_text(encoding="utf-8")
    filename = filepath.name
    title = extract_title(html)
    description = extract_description(html)
    date_str = extract_date(filename)
    cover_path = find_cover_image(filepath, filename)
    section = "notes"
    
    changed = False
    
    # Remove Google Fonts
    new_html = remove_google_fonts(html)
    if new_html != html:
        html = new_html
        changed = True
    
    # Add canonical if missing
    if not has_canonical(html):
        seo_block = build_seo_head(relative_path, title, description, date_str, cover_path, section)
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f"\n  {seo_block}\n" + html[insert_point:]
            changed = True
    
    # Add JSON-LD if missing
    if not has_json_ld(html):
        json_ld = build_json_ld(relative_path, title, description, date_str, cover_path, section)
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f"  {json_ld}\n" + html[insert_point:]
            changed = True
    
    # Add og:image and og:url if missing
    if 'og:image' not in html:
        og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
        og_tag = f'  <meta property="og:image" content="{escape(og_image)}" />\n'
        # Insert after last og tag
        last_og = html.rfind('og:', 0, html.find('</head>'))
        if last_og != -1:
            line_end = html.find('\n', last_og)
            if line_end != -1:
                html = html[:line_end+1] + og_tag + html[line_end+1:]
                changed = True
    
    if 'og:url' not in html:
        canonical = build_canonical(relative_path)
        og_url_tag = f'  <meta property="og:url" content="{escape(canonical)}" />\n'
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + og_url_tag + html[insert_point:]
            changed = True
    
    # Add Twitter Card if missing
    if 'twitter:card' not in html:
        og_title = re.sub(r'\s*[·\-]\s*犀牛伯爵.*$', '', title).strip()
        og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
        twitter_block = f'''  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(og_title)}" />
  <meta name="twitter:description" content="{escape(description)}" />
  <meta name="twitter:image" content="{escape(og_image)}" />
'''
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + twitter_block + html[insert_point:]
            changed = True
    
    # Add og:site_name if missing
    if 'og:site_name' not in html:
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + '  <meta property="og:site_name" content="犀牛伯爵" />\n' + html[insert_point:]
            changed = True
    
    # Add site nav if missing (new format has "back" link but no site nav)
    if not has_nav(html):
        nav = build_header_nav(section)
        body_pos = html.find('<body>')
        if body_pos != -1:
            body_end = html.find('>', body_pos) + 1
            html = html[:body_end] + f"\n  {nav}\n" + html[body_end:]
            changed = True
    
    # Add site footer (new format has article-footer but no site-footer with links)
    if 'site-footer' not in html:
        footer = build_site_footer()
        body_close = html.rfind('</body>')
        if body_close != -1:
            html = html[:body_close] + f"  {footer}\n" + html[body_close:]
            changed = True
    
    if changed:
        filepath.write_text(html, encoding="utf-8")
    return changed

def process_article(filepath, relative_path):
    """Process article page."""
    html = filepath.read_text(encoding="utf-8")
    filename = filepath.name
    title = extract_title(html)
    description = extract_description(html)
    date_str = extract_date(filename)
    cover_path = find_cover_image(filepath, filename)
    section = "articles"
    
    changed = False
    
    # Remove Google Fonts
    new_html = remove_google_fonts(html)
    if new_html != html:
        html = new_html
        changed = True
    
    # Add canonical if missing
    if not has_canonical(html):
        seo_block = build_seo_head(relative_path, title, description, date_str, cover_path, section)
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f"\n  {seo_block}\n" + html[insert_point:]
            changed = True
    
    # Add JSON-LD if missing
    if not has_json_ld(html):
        json_ld = build_json_ld(relative_path, title, description, date_str, cover_path, section)
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f"  {json_ld}\n" + html[insert_point:]
            changed = True
    
    # Add og:image if missing
    if 'og:image' not in html:
        og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f'  <meta property="og:image" content="{escape(og_image)}" />\n' + html[insert_point:]
            changed = True
    
    # Add og:url if missing
    if 'og:url' not in html:
        canonical = build_canonical(relative_path)
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + f'  <meta property="og:url" content="{escape(canonical)}" />\n' + html[insert_point:]
            changed = True
    
    # Add Twitter Card if missing
    if 'twitter:card' not in html:
        og_title = re.sub(r'\s*[·\-]\s*犀牛伯爵.*$', '', title).strip()
        og_image = f"{SITE_URL}/{cover_path}" if cover_path else DEFAULT_OG_IMAGE
        twitter_block = f'''  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape(og_title)}" />
  <meta name="twitter:description" content="{escape(description)}" />
  <meta name="twitter:image" content="{escape(og_image)}" />
'''
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + twitter_block + html[insert_point:]
            changed = True
    
    # Add og:site_name if missing
    if 'og:site_name' not in html:
        insert_point = html.find('</head>')
        if insert_point != -1:
            html = html[:insert_point] + '  <meta property="og:site_name" content="犀牛伯爵" />\n' + html[insert_point:]
            changed = True
    
    # Add nav if missing
    if not has_nav(html):
        nav = build_header_nav(section)
        body_pos = html.find('<body>')
        if body_pos != -1:
            body_end = html.find('>', body_pos) + 1
            html = html[:body_end] + f"\n  {nav}\n" + html[body_end:]
            changed = True
    
    # Add site footer if missing
    if 'site-footer' not in html:
        footer = build_site_footer()
        body_close = html.rfind('</body>')
        if body_close != -1:
            html = html[:body_close] + f"  {footer}\n" + html[body_close:]
            changed = True
    
    if changed:
        filepath.write_text(html, encoding="utf-8")
    return changed

def main():
    notes_dir = REPO / "notes"
    articles_dir = REPO / "articles"
    ai_daily_dir = REPO / "ai-daily"
    
    stats = {"old_notes": 0, "new_notes": 0, "articles": 0, "ai_daily": 0, "skipped": 0}
    
    # Process notes
    for f in sorted(notes_dir.glob("*.html")):
        if f.name in ("template.html", "index.html"):
            stats["skipped"] += 1
            continue
        
        rel_path = f.relative_to(REPO)
        html = f.read_text(encoding="utf-8")
        
        if 'data-theme' in html[:500]:
            # New template format
            if process_new_format_note(f, rel_path):
                stats["new_notes"] += 1
                print(f"  ✓ (new) {f.name}")
            else:
                stats["skipped"] += 1
                print(f"  - (new, no change) {f.name}")
        else:
            # Old format
            if process_old_format_note(f, rel_path):
                stats["old_notes"] += 1
                print(f"  ✓ (old) {f.name}")
            else:
                stats["skipped"] += 1
                print(f"  ✗ (old, failed) {f.name}")
    
    # Process articles
    for f in sorted(articles_dir.glob("*.html")):
        if f.name in ("template.html", "index.html") or f.name.startswith("_retired"):
            stats["skipped"] += 1
            continue
        
        rel_path = f.relative_to(REPO)
        if process_article(f, rel_path):
            stats["articles"] += 1
            print(f"  ✓ (article) {f.name}")
        else:
            stats["skipped"] += 1
            print(f"  - (article, no change) {f.name}")
    
    # Process ai-daily
    for f in sorted(ai_daily_dir.glob("*.html")):
        if f.name in ("template.html", "index.html"):
            stats["skipped"] += 1
            continue
        
        rel_path = f.relative_to(REPO)
        html = f.read_text(encoding="utf-8")
        
        # AI daily pages are treated like articles
        if process_article(f, rel_path):
            stats["ai_daily"] += 1
            print(f"  ✓ (daily) {f.name}")
        else:
            stats["skipped"] += 1
            print(f"  - (daily, no change) {f.name}")
    
    print(f"\n=== Summary ===")
    print(f"  Old-format notes fixed: {stats['old_notes']}")
    print(f"  New-format notes fixed:  {stats['new_notes']}")
    print(f"  Articles fixed:         {stats['articles']}")
    print(f"  AI Daily fixed:         {stats['ai_daily']}")
    print(f"  Skipped:                {stats['skipped']}")

if __name__ == "__main__":
    main()
