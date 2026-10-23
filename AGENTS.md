# 网站维护约定

修改首页 Builds、文章数据、预渲染或发布流程前，阅读并遵守 `BUILDS_RULES.md`。Build 项目目录使用 `builds-catalog.js`，与日更文章分开维护。Builds 为杂志跨页式版面：首项（果冻实验室）为封面特稿，随后 3 张中卡，其余为索引行；Featured Work 侧栏已移除，文章数据不得回流 Builds。发布前运行 `node scripts/check-builds-layout.mjs`。
