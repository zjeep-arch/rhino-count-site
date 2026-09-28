# SEO 管线与重复 head 治理记录

日期：2026-09-28
范围：notes / articles / ai-daily 全站内容页

## 一、问题现象

107 个内容页的 `<head>` 里累积了 2–8 套重复的 SEO block
（canonical / OG / Twitter Card / robots / JSON-LD），合计 326 个重复块。

单文件示例 `notes/2026-07-06-ai-compute-crisis-google-meta-power.html`
在修复前有 8 个 `<link rel="canonical">`。

## 二、根因

`scripts/seo-batch-fix.py` 里的 `process_old_format_note()` **没有幂等保护**：
每次运行都无条件再插入一整套 SEO block + nav + footer。

同文件的 `process_new_format_note()` 有 `if changed:` 保护，
`process_article()` 也有 —— 只有老格式分支漏了。
两个函数设计不一致，这是问题长期没被发现的原因。

之所以一直没暴露，是因为过去每次运行都走 dry-run，
或者跑完后用 `nav-dedupe.py` 收拾 body（`nav-dedupe` 只管 body，
管不到 head 里的重复）。首次以 `--apply` 跑完整管线时才暴露。

## 三、重复块并非完全相同

诊断（`scripts/diagnose-dupe-head.py`）结果：

- 107/107 的 canonical URL 完全一致 → 属纯重复注入，可安全折叠
- 但 og:image 已退化：只有第一份保留真实封面
  （如 `notes/note-09-cover.jpg`），后续份全部 fallback 到
  `temple-of-heaven.png`
- 部分后续份丢失了 `<meta name="robots">`

所以去重策略不是「保留第一份」，而是**按信息完整度评分保留最优块**：

| 加分项 | 分值 |
|---|---:|
| og:image 为真实封面（非默认图） | +10 |
| 含 `<meta name="robots">` | +2 |
| 含 JSON-LD | +1 |
| 块长度（上限 4000） | 0–4 |

## 四、修复内容

### 4.1 `scripts/dedupe-head.py`（新增）

折叠重复 head block，只保留评分最高的一份。
支持 `--apply`；无参数为 dry-run。

只动 `<head>`，保留第一个 block 之前的内容和最后一个 block 之后的内容。

### 4.2 `scripts/diagnose-dupe-head.py`（新增）

只读诊断脚本，分类重复模式、输出份数分布、标记 href 不一致的异常文件。
先诊断后动手，避免凭猜测写去重逻辑。

### 4.3 `scripts/seo-batch-fix.py`

给 `process_old_format_note()` 加守卫：

```python
if '<link rel="canonical"' in html:
    return False
```

### 4.4 `scripts/noindex-wechat-dupes.py`

`fix_file()` 返回 `False` 有两种含义 ——「已正确无需改」和「执行失败」——
原 `main()` 把前者当失败，导致第二遍运行必报 5 个假失败，管线永远不幂等。

修正后 `checked=5 fixed=0` → `EXIT=0`。

### 4.5 `scripts/dedupe-head.py` 自身的一处 bug

`--apply` 早期版本在内存里算了删除数量，但**没有调用真正写盘的
`dedupe_file()`** —— 会打印 "fixed 107 files" 但磁盘上没变。
改为 `n = dedupe_file(path)` 后重跑，才真正落盘。

这个 bug 值得记一笔：它和 `noindex-wechat-dupes` 是同一类错误
（把「计算结果」当成「执行结果」）。

## 五、发布管线

新增 `scripts/seo-pipeline.sh`，11 个阶段串成一条命令：

| # | 阶段 | 脚本 |
|---|---|---|
| 1 | SEO 骨架修复 | `seo-batch-fix.py --apply` |
| 2 | description 回填 | `seo-backfill-empty.py` |
| 3 | nav/footer 去重 | `nav-dedupe.py` |
| 4 | wechat 副本 noindex | `noindex-wechat-dupes.py` |
| 5 | head 重复块去重 | `dedupe-head.py --apply` |
| 6 | 归档页生成 | `generate-archives.py` |
| 7 | 内容内链注入 | `internal-links.py --apply` |
| 8 | 日报→笔记互链 | `daily-to-notes-links.py --apply` |
| 9 | AI 爬虫入口 | `generate-llms-txt.py` |
| 10 | sitemap / RSS | `generate-sitemap.py`、`rebuild-rss.py` |
| 11 | 预渲染 | `prerender.py` |
| 终 | 坏链 / 孤儿页 / 发布关卡 | `check-links.py`、`audit-orphans.py`、`publish-check.sh` |

两种模式：

- `bash scripts/seo-pipeline.sh` —— apply，会改文件
- `bash scripts/seo-pipeline.sh --check` —— 只读校验

`--check` 模式已用 md5 比对验证过零文件改动；
其中 `prerender` 和 `publish-check` 会被跳过
（前者会写回 HTML，后者读 git 暂存区）。

## 六、验收结果

| 指标 | 修复前 | 修复后 |
|---|---:|---:|
| 重复 canonical 的文件 | 107 | **0** |
| 重复 SEO block | 326 | 0 |
| 内容孤儿页 | 68（8 月） | 0 |
| 内部坏链 | 5（误报） | 0 |
| JSON-LD 损坏 | — | 0 |

管线连跑三遍，第三遍 `15 通过 / 0 失败`，确认稳态幂等。

`node scripts/check-builds-layout.mjs` 通过：
Jelly Lab 已 pin、目标存在、静态与动态 featured 上限在 50 篇来稿下成立。

## 七、遗留事项

- `seo-pipeline.sh` 运行时，`generate-sitemap` 阶段会打印一段
  「A gateway is already running under launchd」提示。
  该步骤退出码为 0、sitemap 正常生成，不影响发布，
  但说明 sitemap 生成流程里某处误触发了 Hermes gateway，值得后续追一下。

## 八、同类 bug 的排查方向

本轮修的三个 bug（老格式分支无幂等、noindex 误判 False、
dedupe-head 不写盘）都属于同一类：
**把「计算/判断结果」当成「执行结果」**。

新增脚本时值得默认检查：
1. 写文件的函数是否真的被调用
2. 返回 `False` 的语义是否唯一
3. 同一管线连跑两次，第二次是否零变更
