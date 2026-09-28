#!/usr/bin/env bash
# rhinocount.cn SEO 管线：一条命令跑完全部发布前处理
#
# 用法:
#   bash scripts/seo-pipeline.sh            # 完整跑（含 --apply 写入）
#   bash scripts/seo-pipeline.sh --check    # 只跑只读校验，不改文件
#
# 顺序是有依赖的，不要重排:
#   1. seo-batch-fix      补 canonical/OG/Twitter/JSON-LD 骨架
#   2. seo-backfill-empty 回填空 description（1 的产物可能有空值）
#   3. nav-dedupe         1/2 会给部分页面叠第二套 nav，收敛回单套
#   4. noindex-wechat     副本去重（必须在 3 之后，避免 nav 干扰正则）
#   5. generate-archives  归档页（依赖 4 的 noindex 决定收录范围）
#   6. internal-links     内链注入（依赖 5，归档页要能被发现）
#   7. daily-to-notes     日报→笔记互链
#   8. generate-llms-txt  AI 爬虫入口
#   9. generate-sitemap   URL 清单
#   10. rebuild-rss       订阅源
#   11. prerender          预渲染（必须最后，会写回 HTML）
#   12. 校验               check-links / audit-orphans / publish-check
#
# 退出码: 0=全部通过  1=有阻断
set -uo pipefail
cd "$(dirname "$0")/.."

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

PASS=0; FAIL=0; STEP=0
step() { STEP=$((STEP+1)); printf '\n\033[1m[%02d] %s\033[0m\n' "$STEP" "$1"; }
ok()   { PASS=$((PASS+1)); printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { FAIL=$((FAIL+1)); printf '  \033[31m❌\033[0m %s\n' "$1"; }

# apply 模式才写文件；--check 模式全部走 dry-run
APPLY_FLAG=""
if [ $CHECK_ONLY -eq 0 ]; then APPLY_FLAG="--apply"; fi

run() {  # run <说明> <命令...>
  local desc="$1"; shift
  local out rc
  out=$("$@" 2>&1); rc=$?
  if [ $rc -ne 0 ]; then
    fail "$desc (exit=$rc)"
    printf '%s\n' "$out" | tail -5 | sed 's/^/      /'
    return 1
  fi
  ok "$desc"
  return 0
}

printf '\033[1m=== rhino-count.cn SEO 管线 ===\033[0m\n'
if [ $CHECK_ONLY -eq 1 ]; then
  echo "模式: --check（只读校验，不改文件）"
else
  echo "模式: apply（会修改工作区文件）"
fi

# ---- 1) SEO 骨架 ----
# seo-batch-fix.py 没有 --dry-run 参数：无参运行即为 dry-run，
# 加 --apply 才写文件。internal-links.py 同理（APPLY = "--apply" in argv）。
step "批量 SEO 骨架修复"
if [ $CHECK_ONLY -eq 1 ]; then
  run "seo-batch-fix dry-run" python3 scripts/seo-batch-fix.py
else
  run "seo-batch-fix" python3 scripts/seo-batch-fix.py --apply
fi

# ---- 2) 空 description 回填 ----
step "回填空 OG/Twitter/JSON-LD description"
run "seo-backfill-empty" python3 scripts/seo-backfill-empty.py

# ---- 3) nav/footer 去重 ----
step "nav/footer 去重"
if [ $CHECK_ONLY -eq 1 ]; then
  run "nav-dedupe dry-run" python3 scripts/nav-dedupe.py --dry-run
else
  run "nav-dedupe" python3 scripts/nav-dedupe.py
fi

# ---- 4) 微信副本去重 ----
step "wechat 副本 noindex + canonical"
run "noindex-wechat-dupes" python3 scripts/noindex-wechat-dupes.py

# ---- 4b) head 重复块去重 ----
# seo-batch-fix 的老格式分支曾无幂等保护，给 107 个文件叠了 2-8 套
# canonical/OG/JSON-LD。脚本已修好，但历史残留要单独清一次。
step "head 重复块去重"
if [ $CHECK_ONLY -eq 1 ]; then
  run "dedupe-head dry-run" python3 scripts/dedupe-head.py
else
  run "dedupe-head --apply" python3 scripts/dedupe-head.py --apply
fi

# ---- 5) 归档页 ----
step "生成归档页"
run "generate-archives" python3 scripts/generate-archives.py

# ---- 6/7) 内链 ----
step "内链注入"
if [ $CHECK_ONLY -eq 1 ]; then
  run "internal-links dry-run" python3 scripts/internal-links.py
  run "daily-to-notes dry-run" python3 scripts/daily-to-notes-links.py
else
  run "internal-links --apply" python3 scripts/internal-links.py --apply
  run "daily-to-notes-links --apply" python3 scripts/daily-to-notes-links.py --apply
fi
# ---- 8) llms.txt ----
step "AI 爬虫入口"
run "generate-llms-txt" python3 scripts/generate-llms-txt.py

# ---- 9/10) sitemap + rss ----
step "sitemap / RSS"
run "generate-sitemap" python3 scripts/generate-sitemap.py
run "rebuild-rss" python3 scripts/rebuild-rss.py

# ---- 11) 预渲染 ----
step "预渲染"
if [ $CHECK_ONLY -eq 1 ]; then
  echo "  （--check 模式跳过 prerender：它会写回 HTML）"
  ok "prerender 已跳过"
else
  if out=$(python3 scripts/prerender.py 2>&1); then
    printf '%s\n' "$out" | grep -E "words" | sed 's/^/      /'
    ok "prerender"
  else
    fail "prerender"
    printf '%s\n' "$out" | tail -6 | sed 's/^/      /'
  fi
fi

# ---- 12) 校验 ----
step "终检"
if out=$(python3 scripts/check-links.py 2>&1); then
  ok "check-links: $(printf '%s' "$out" | tail -1)"
else
  fail "check-links 有坏链"
  printf '%s\n' "$out" | grep -E "BROKEN|obsolete" | head -8 | sed 's/^/      /'
fi

# audit-orphans 在 verify 阶段只报不阻断：站长验证文件/实验页本来就无入链。
# 这里用显式白名单而不是模糊匹配 —— 之前用 `grep -E "verify|jelly-baby|curtain"`
# 会漏掉驼峰的 ByteDanceVerify.html 和不带 verify 字样的
# google549c86588c2e00bb.html，导致 6 个非内容页被算成内容孤儿。
NON_CONTENT_RE='(ByteDanceVerify|baidu_verify_|google[0-9a-f]{8,}|\.txt$|jelly-baby/|temple-of-heaven-curtain-share|network-check|template\.html)'
orph=$(python3 scripts/audit-orphans.py 2>&1)
total_orphans=$(printf '%s\n' "$orph" | grep -c "ORPHAN" || true)
non_content=$(printf '%s\n' "$orph" | grep "ORPHAN" | grep -cE "$NON_CONTENT_RE" || true)
content_orphans=$((total_orphans - non_content))
if [ "$content_orphans" -eq 0 ]; then
  ok "内容孤儿页 0（余 $non_content 个为验证文件/实验页）"
else
  fail "内容孤儿页 $content_orphans 个"
  printf '%s\n' "$orph" | grep "ORPHAN" | grep -vE "$NON_CONTENT_RE" | head -8 | sed 's/^/      /'
fi

# publish-check 必须跑在 git add 之后才有意义（默认查暂存区）
if [ $CHECK_ONLY -eq 1 ]; then
  echo "  （--check 模式跳过 publish-check：它读 git 暂存区）"
else
  git add -A
  if out=$(bash scripts/publish-check.sh 2>&1); then
    ok "publish-check: 全部通过"
  else
    fail "publish-check 有阻断项"
    printf '%s\n' "$out" | grep "❌" | head -8 | sed 's/^/      /'
  fi
fi

printf '\n\033[1m=== 结果: %d 通过 / %d 失败 ===\033[0m\n' "$PASS" "$FAIL"

if [ "$FAIL" -eq 0 ]; then
  if [ $CHECK_ONLY -eq 1 ]; then
    printf '\n\033[32m✅ 只读校验全通过。\033[0m apply 模式: bash scripts/seo-pipeline.sh\n'
  else
    printf '\n\033[32m✅ 管线全部完成，可以 commit + push。\033[0m\n'
    printf '   git commit -m "chore(seo): SEO 管线自动处理"\n'
    printf '   git push origin main\n'
  fi
  exit 0
else
  printf '\n\033[31m⛔ %d 项失败，先修完再 push。\033[0m\n' "$FAIL"
  exit 1
fi
