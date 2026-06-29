# 犀牛伯爵 · AI 创作实验室

这是犀牛伯爵的个人创作站，也是一个持续迭代的 AI-native 内容实验室。

我在这里记录 Agent 工作流、AI 写作、宏观科技观察、产品教程和轻量互动实验。目标不是把内容堆成目录，而是把每一次观察、写作和工具尝试沉淀成可以复用的个人创作系统。

> AI-native builder. Build, write, think, ship.

## 在线入口

- 个人站：[zjeep-arch.github.io/rhino-count-site](https://zjeep-arch.github.io/rhino-count-site/)
- 小红书：[犀牛伯爵](https://www.xiaohongshu.com/user/profile/60572004000000000101ce41)
- DuMate 教程：[百度 DuMate 从 0 到 1 上手教程](https://zjeep-arch.github.io/rhino-count-site/dumate/)
- 互动实验：[鸭骗战争：真鸭假鹅](https://zjeep-arch.github.io/rhino-count-site/games/duck-scare-war.html)

## 我在做什么

### AI Workflow Lab

把日常创作、资料整理、网页生成和自动化流程拆成可复用工作流。重点关注：Agent 如何参与真实创作，而不是停留在演示。

### AI-native Writing

记录模型变化、Agent 思维、学习方法，以及普通人如何用 AI 放大表达。写作不是输出结果，而是观察、判断、拆解和迭代的过程。

### Macro & Model Watch

把宏观事件、科技公司、模型发布和产业信号压缩成每晚可读的判断。关注世界变化如何影响技术、职业和个人选择。

### Interactive Experiments

用小游戏、教程页和交互页面测试内容的新形态，让表达不只是一篇文章，也可以是一段流程、一个页面、一个可玩的作品。

## 精选内容

| 类型 | 作品 | 说明 |
| --- | --- | --- |
| Essay | [Agent 不是产品，是新一代操作系统](https://zjeep-arch.github.io/rhino-count-site/notes/agent-is-operating-system.html) | 从 App 思维迁移到 Agent 思维需要的 5 个转变 |
| Guide | [百度 DuMate 从 0 到 1 上手教程](https://zjeep-arch.github.io/rhino-count-site/dumate/) | 把一个 AI 产品拆成可操作、可复用、可传播的教程资产 |
| Game | [鸭骗战争：真鸭假鹅](https://zjeep-arch.github.io/rhino-count-site/games/duck-scare-war.html) | 用轻量游戏化测试内容表达的新形态 |
| Commentary | [每日时评合集](https://zjeep-arch.github.io/rhino-count-site/articles/) | 每晚拆解宏观、科技和产业信号 |

## 内容结构

```text
rhino-count-site/
├── index.html                # 首页：个人介绍、创作矩阵、笔记、时评
├── data.js                   # 全站核心内容数据
├── notes/                    # AI 笔记与方法论文章
├── articles/                 # 每日宏观/科技时评
├── dumate/                   # AI 产品教程页
├── games/                    # 互动内容实验
├── post-to-wechat/           # 可分发到公众号/社媒的长文素材
└── assets/                   # 首屏视频、卡片图和视觉素材
```

## 创作路线图

- 每周复盘一个 AI workflow 实验
- 每周沉淀一篇 AI-native 写作 / 产品观察
- 每月整理一个可复用 playbook
- 把聊天、网页、文章和自动化流程串成个人创作系统

## 本地预览

```bash
cd rhino-count-site
python3 -m http.server 8080
```

浏览器打开：

```text
http://localhost:8080
```

## 更新内容

大多数页面文案都集中在 `data.js`：

- 修改首页标题、介绍、关键词：更新 `meta` 和 `hero`
- 修改导航：更新 `header.nav`
- 修改创作矩阵：更新 `lab`
- 修改笔记列表：更新 `journal.notes`
- 修改时评精选：更新 `commentary.defaultFeatured`
- 修改联络方式：更新 `contact`

新增长文时，优先放入对应目录：

- AI 方法论：`notes/`
- 每日时评：`articles/`
- 产品教程：独立目录，例如 `dumate/`
- 互动实验：`games/`

## 部署

本站通过 GitHub Pages 部署：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

部署地址：

```text
https://zjeep-arch.github.io/rhino-count-site/
```

## 下一步

这个仓库会继续从“个人站”升级为“创作系统”：

- 补充更多 AI workflow playbooks
- 把高质量聊天共创沉淀成文章或工具页
- 为每个实验添加更清晰的 README 和复盘
- 将 GitHub 主页、个人站和小红书内容统一成一条创作线索
