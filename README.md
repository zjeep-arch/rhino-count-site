# 犀牛伯爵 · 个人站

**rhino-count-site** — 犀牛伯爵的个人网站。AI 时代的记录者，每晚一篇宏观时评。

## 目录结构

```
rhino-count-site/
├── index.html                # 首页（个人介绍 + 笔记 + 时评）
├── data.js                   # 全站内容数据
├── articles/
│   ├── index.html            # 时评文章列表页
│   ├── template.html         # 文章模板（供 cron job 使用）
│   └── feed.json             # 文章列表数据源
├── robots.txt
├── sitemap.xml
└── README.md                 # 本文件
```

## 本地预览

```bash
cd rhino-count-site
python3 -m http.server 8080
```

浏览器打开 <http://localhost:8080>

## 改内容

**95% 的修改只改 `data.js` 即可**。`data.js` 里按页面顺序分成了 8 大块，改字面就行。

### 增加一篇笔记

在 `data.js` 的 `journal.notes` 数组里复制一段 `{ ... },` 整体粘贴，改字段即可。

### 增加时评文章

时评文章**由每日 cron job 自动生成**。每篇文章是一个独立的 HTML 文件放在 `articles/` 目录下，同时自动追加一条记录到 `articles/feed.json`。

## 部署到 GitHub Pages

### 方式一：一键部署（推荐）

1. 在 GitHub 上创建新仓库，比如 `rhino-count-site`
2. 将本地项目推送到 GitHub：

```bash
cd rhino-count-site
git init
git add .
git commit -m "初始提交"
git branch -M main
git remote add origin https://github.com/你的用户名/rhino-count-site.git
git push -u origin main
```

3. 在 GitHub 仓库页点 **Settings → Pages**：
   - Source: **Deploy from a branch**
   - Branch: **main**, 目录: **/ (root)**
   - 点 Save

4. 等 1-2 分钟，你的网站就是 `https://你的用户名.github.io/rhino-count-site/`

> ⚠️ 如果你想把域名映射成 `https://你的用户名.github.io/`（不带仓库名），仓库名必须叫 `你的用户名.github.io`

### 方式二：用 gh CLI

```bash
# 安装 gh（如果没装）
brew install gh

# 登录
gh auth login

# 创建远程仓库并推送
gh repo create rhino-count-site --public --source=. --push
```

然后去 GitHub Pages 设置里开启。

### 自定义域名

1. 购买域名（推荐 Namesilo / GoDaddy / 阿里云）
2. 在域名 DNS 设置里添加一条 **CNAME 记录**：
   - 主机记录: `@` 或 `www`
   - 目标值: `你的用户名.github.io`
3. 在项目根目录创建 `CNAME` 文件：

```bash
echo "你的域名.com" > CNAME
```

4. 重新推送，GitHub Pages 设置里会自动识别，或手动填入你的域名。

## 更新 data.js 后的缓存处理

如果改完 `data.js` 访客看到旧内容，给加载链接加版本号。在 `index.html` 里找到这一行：

```html
<script src="data.js"></script>
```

改成：

```html
<script src="data.js?v=2026-06-01"></script>
```

每次改完 `data.js` 更新日期即可强制浏览器拉新版本。

## 上线 checklist

- [ ] `data.js` 里 `meta.siteUrl` 改成真实域名
- [x] `sitemap.xml` 里 `yourdomain.com` 替换成 GitHub Pages 域名
- [ ] `robots.txt` 里 sitemap 链接替换成真实域名
- [ ] DNS 已解析到 GitHub Pages IP
- [ ] HTTPS 自动生效
- [ ] 用手机打开一次检查排版
- [ ] 检查时评区是否能正常加载 `articles/feed.json`

## 每日时评生成

每晚 7 点自动生成一篇「肖磊看世界」风格的宏观评论文章。文章存放在 `articles/` 目录下，同时更新 `feed.json` 和 `sitemap.xml`。

如果你改动了 `template.html`，需要手动重新发布之前渲染过的文章才能生效——它只是未来文章的模板。
