# 首页 Builds 展示规则

- 项目入口唯一数据源是 `builds-catalog.js`，独立于文章数据 `data.js`。果冻实验室保留在首位（它是封面特稿），更新日报和文章不得覆盖项目目录。
- 版面为杂志跨页式（magazine spread）：目录第 1 项渲染为封面特稿 `lab-hero`（左封面右文案），第 2–4 项渲染为中卡 `lab-med`，其余渲染为 hairline 索引行 `lab-row`。编号 N°01… 按目录顺序派生，不手工维护。
- 卡片高度随内容自适应：hero 摘要最多 3 行、中卡摘要最多 2 行（CSS line-clamp），标题最多 2 行，索引行标题/摘要单行省略；底部入口保持可见。不要靠增加高度容纳长文案。
- 封面 word（英文刊名字）与 hero chips 是可选字段（`word` / `chips`），缺省回退到 `tag`。类型点缀色由 `data-tag` 决定（PLAY=accent、TOOL/LAB=electric、GAME=gold、EXPERIMENT=accent-2）。
- Featured Work 侧栏与 Creation Roadmap 已于 2026-10 改版移除：文章入口由 SIGNALS 板块承担，渲染代码不得恢复侧栏，文章数据（`lab.featured`）不得回流 Builds。同次改版移除了 Builds 3D Flip Cards（旧 `.lab-card` rotateY 入场效果）：卡片动效统一走 `.fade-in`，不得给 `.lab-card` 恢复卡片级 transform（索引行会被旋转破坏）。
- `index.html` 中的静态内容必须与运行后的内容一致（结构、卡片数、链接）。改渲染模板后用 `node scripts/check-builds-layout.mjs` 同步校验，必要时重跑 `python3 scripts/prerender.py` 烘平。
- 发布前执行 `node scripts/check-builds-layout.mjs`。Vercel 构建和 GitHub Pages 发布都会执行此检查；它会用 50 篇输入文章验证文章不会泄漏进 Builds，并核对果冻入口、项目链接与静态/运行时一致性。
- 修改布局时检查 1440px、1024px、390px 下的实际高度、文字截断及按钮可见性，避免仅靠源码判断。断点：中卡 ≥1100 三列 / ≥680 两列；hero <920 单列；索引行 <880 隐藏 DOI、<620 隐藏摘要与箭头。
