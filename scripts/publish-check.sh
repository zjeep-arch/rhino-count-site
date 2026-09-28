#!/usr/bin/env bash
# rhinocount.cn 发文关卡：push 前拦截 SEO 污染复发（2026-09-03 治理）
# 用法: bash scripts/publish-check.sh [--staged | <文件列表>]
#   默认检查 git 暂存区的新增/修改 html；也可显式传文件路径
# 退出码: 0=通过  1=有阻断项
set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
fail() { echo "❌ $1"; FAIL=$((FAIL+1)); }
ok()   { echo "✓  $1"; }

# ---- 收集待检文件 ----
if [ "${1:-}" = "--staged" ] || [ $# -eq 0 ]; then
    FILES=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null | grep -E '\.html$' || true)
else
    FILES="$*"
fi
if [ -z "$FILES" ]; then
    echo "publish-check: 暂存区/参数中没有 html 文件，跳过"; exit 0
fi

echo "== publish-check: 检查 $(echo "$FILES" | wc -l | tr -d ' ') 个文件 =="

for f in $FILES; do
    [ -f "$f" ] || continue
    # 1) 旧域名污染（canonical/og:url/@id 层面；先剥离 HTML 注释与 giscus data-repo 白名单）
    if python3 -c "
import re, sys
s = open('$f', encoding='utf-8').read()
s = re.sub(r'<!--.*?-->', '', s, flags=re.S)          # 剥注释（模板里的警示注释会提到旧域名）
s = re.sub(r'data-repo=\"[^\"]*\"', '', s)            # giscus 仓库名不是 URL
sys.exit(0 if 'zjeep-arch.github.io' in s else 1)
" 2>/dev/null; then
        fail "$f 旧域名污染 → 修复: sed -i '' 's|https://zjeep-arch.github.io/rhino-count-site|https://rhinocount.cn|g' $f"
    else
        ok "$f 无旧域名"
    fi
    # 2) canonical 必须存在且指向本页
    if grep -q '<link rel="canonical" href="https://rhinocount.cn' "$f"; then
        ok "$f canonical 正确"
    else
        fail "$f 缺 canonical（参考 notes/template.html / ai-daily/template.html 的 SEO 块）"
    fi
    # 3) JSON-LD 存在且可解析
    if grep -q 'application/ld+json' "$f"; then
        if python3 -c "
import re, json, sys
s = open('$f', encoding='utf-8').read()
blocks = re.findall(r'<script type=\"application/ld\+json\">\s*(\{.*?\})\s*</script>', s, re.S)
assert blocks, 'no ld+json block'
for b in blocks: json.loads(b)
" 2>/dev/null; then
            ok "$f JSON-LD 合法"
        else
            fail "$f JSON-LD 解析失败（占位符 {{TITLE}} 等未替换？）"
        fi
    else
        fail "$f 缺 JSON-LD"
    fi
    # 4) meta description 非空
    # The wechat-export template writes attributes in the order
    # `<meta content="..." name="description"/>` while the site template writes
    # `<meta name="description" content="...">`. Matching only the latter
    # reported 40+ false "missing description" failures.
    if grep -qE '<meta content="[^"]{20,}" name="description"|<meta name="description" content="[^"]{20,}' "$f"; then
        ok "$f description 就位"
    else
        fail "$f 缺 meta description（RSS 空描述根因）"
    fi
done

# 5) 新文章必须进 sitemap
# `-wechat.html` copies are deliberately excluded from sitemap.xml: they carry
# noindex,follow and a canonical pointing at the original. Requiring them here
# would fight that decision.
NEW_ARTICLES=$(echo "$FILES" | grep -E '^(notes|ai-daily|articles)/' | grep -v 'template\.html\|index\.html' | grep -v -- '-wechat\.html' || true)
if [ -n "$NEW_ARTICLES" ]; then
    MISS=0
    for f in $NEW_ARTICLES; do
        url="https://rhinocount.cn/${f}"
        if ! grep -q "<loc>${url}</loc>" sitemap.xml 2>/dev/null; then
            fail "sitemap 缺 $url → 修复: python3 scripts/generate-sitemap.py"
            MISS=$((MISS+1))
        fi
    done
    [ "$MISS" -eq 0 ] && ok "新文章全部在 sitemap"
fi

# 6) WeChat 导出副本必须 noindex + canonical 指回原文
# The cron publishing agent emits `notes/<slug>-wechat.html` next to the real
# article but never runs scripts/noindex-wechat-dupes.py, so every new article
# shipped a duplicate that competed in search. Caught in the wild on
# 2026-09-28 (2026-09-28-nscale-nvidia-wechat.html was index,follow with a
# self-referencing canonical). Fix: python3 scripts/noindex-wechat-dupes.py
WECHAT_DUPES=$(echo "$FILES" | grep -- '-wechat\.html' || true)
if [ -n "$WECHAT_DUPES" ]; then
    BAD=0
    for f in $WECHAT_DUPES; do
        [ -f "$f" ] || continue
        original="notes/$(basename "$f" -wechat.html).html"
        if ! grep -q 'content="noindex,follow"' "$f"; then
            fail "$f 缺 noindex（重复内容）→ 修复: python3 scripts/noindex-wechat-dupes.py"
            BAD=$((BAD+1))
            continue
        fi
        if ! grep -q "<link rel=\"canonical\" href=\"https://rhinocount.cn/${original}\"" "$f"; then
            fail "$f canonical 未指向原文 ${original} → 修复: python3 scripts/noindex-wechat-dupes.py"
            BAD=$((BAD+1))
        fi
    done
    [ "$BAD" -eq 0 ] && ok "wechat 副本均已 noindex 且 canonical 指回原文"
fi

echo ""
echo "== 结果: $( [ $FAIL -eq 0 ] && echo '✅ 全部通过，可以 push' || echo "⛔ $FAIL 项阻断，禁止 push" ) =="
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
