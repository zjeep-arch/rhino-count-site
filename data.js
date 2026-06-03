/* =========================================================
 * 犀牛伯爵 · 站点内容
 * ---------------------------------------------------------
 * 这是整站唯一需要你改的文件。
 * 改完保存，浏览器刷新即可看到效果。
 *
 * 注意 JavaScript 语法：
 *   - 字符串两边要有引号 " "
 *   - 每一项末尾留逗号
 *   - 中文标点 ， 别用，要英文逗号 ,
 * ========================================================= */

window.SITE_DATA = {

  /* ---------- 站点配置 ---------- */
  siteConfig: {
    domain: "yourdomain.com",           // ← 上线时改成你的真实域名
    repo: "rhino-count-site",           // GitHub 仓库名
    articlesFeed: "articles/feed.json",  // 文章列表数据源
  },

  /* ---------- 浏览器标签 + SEO ---------- */
  meta: {
    title: "犀牛伯爵 · AI 时代的记录者",
    description: "犀牛伯爵 — 北大本科、AI 大厂从业者。记录 AI 与趋势变化，分享学习方法与踩过的坑。每日时评，宏观视野。",
    keywords: "犀牛伯爵, AI, 大模型, 学习方法, 北大, 小红书, AI 大厂, Prompt, Agent, 时评, 宏观分析",
    author: "犀牛伯爵",
    siteUrl: "https://yourdomain.com/",
    ogImage: "https://count-rhino-ai.lovable.app/assets/rhino-count-hero-B4tc0a8K.jpg"
  },

  /* ---------- 顶栏 ---------- */
  header: {
    brand: "犀牛伯爵",
    badge: "EST · BJ",
    nav: [
      { label: "关于",  href: "#about" },
      { label: "笔记",  href: "#notes" },
      { label: "时评",  href: "#commentary" },
      { label: "主张",  href: "#manifesto" },
      { label: "联络",  href: "#contact" }
    ],
    cta: {
      label: "小红书 →",
      href: "https://www.xiaohongshu.com/user/profile/60572004000000000101ce41"
    }
  },

  /* ---------- 首屏 Hero ---------- */
  hero: {
    eyebrow: "AI · 趋势 · 记录",
    titleMain: "一只阅读时代的",
    titleAccent: "犀牛伯爵",
    lede: "北大本科，高考数学满分。如今在 AI 大厂打工，把每一次模型的呼吸、每一条趋势的暗涌，写成可以慢慢咀嚼的笔记。每晚一篇宏观时评，用肖磊的闲聊体陪你理解这个世界。",
    ctaPrimary:   { label: "阅读最新笔记 →", href: "#notes" },
    ctaSecondary: { label: "每日时评",         href: "#commentary" },
    portrait: {
      src: "https://count-rhino-ai.lovable.app/assets/rhino-count-hero-B4tc0a8K.jpg",
      alt: "犀牛伯爵 — 巴洛克风格肖像",
      caption: "OIL ON SILICON · 2026 N° 001"
    },
    stats: [
      { num: "6+", label: "笔记" },
      { num: "30+", label: "时评文章" },
      { num: "1K+", label: "获赞与收藏" }
    ]
  },

  /* ---------- 侧像 Profile ---------- */
  profile: {
    label: "PROFILE · 侧像",
    heading: "侧像 · Profile",
    blurb: "把一张名片摊开，给路过的人一个安静的坐标。",
    cells: [
      { k: "本名",  v: "犀牛伯爵" },
      { k: "学历",  v: "北京大学 · 本科" },
      { k: "履历",  v: "AI 大厂 · 互联网从业者" },
      { k: "坐标",  v: "IP 属地 · 北京" },
      { k: "勋章",  v: "高考数学 · 满分" },
      { k: "频道",  v: "小红书号 1147661654" }
    ]
  },

  /* ---------- 笔记 Journal ---------- */
  journal: {
    label: "JOURNAL · 笔记",
    headingLine1: "在喧嚣里，",
    headingLine2: "慢慢记。",
    blurb: "每一篇笔记都是一次小型的田野调查 —— 关于模型、关于人、关于我们如何被这个时代重新塑形。",
    notes: [
      {
        cat: "AI 趋势", num: "N° 01",
        title: "当大模型开始替你思考，先学会问对问题",
        excerpt: "为什么 prompt 是 2026 年最被低估的核心技能。",
        href: "#"
      },
      {
        cat: "学习方法", num: "N° 02",
        title: "高考数学满分的人，怎么学一门新技术？",
        excerpt: "把陌生学科拆成三层：直觉、框架、推演。",
        href: "#"
      },
      {
        cat: "大厂手记", num: "N° 03",
        title: "在 AI 大厂的第 365 天，我删掉了 47 个工具",
        excerpt: "工具越多，越要警惕被工具反向定义。",
        href: "#"
      },
      {
        cat: "踩坑实录", num: "N° 04",
        title: "用 Agent 写代码三个月，省下的时间都去哪儿了？",
        excerpt: "答案：花在 review、改 prompt 和向同事解释上。",
        href: "#"
      },
      {
        cat: "AI 趋势", num: "N° 05",
        title: "Agent 不是产品，是新一代操作系统",
        excerpt: "从 App 思维迁移到 Agent 思维需要的 5 个转变。",
        href: "#"
      },
      {
        cat: "随笔", num: "N° 06",
        title: "北大那四年没教我的事",
        excerpt: "毕业之后才明白，专业不是身份，是工具箱。",
        href: "#"
      }
    ]
  },

  /* ---------- 时评 Commentary ---------- */
  /* 这里的 articles 是手动精选列表。
   * 完整列表由每日 cron job 写入 articles/feed.json，
   * 前端会自动拉取 feed.json 并合并展示。 */
  commentary: {
    label: "COMMENTARY · 每日时评",
    headingLine1: "在喧嚣里，",
    headingLine2: "闲聊世界。",
    blurb: "每晚 7 点，用「肖磊看世界」的闲聊体聊一聊当天最值得关注的宏观事件。纯属个人瞎扯，供大家打发空闲时间。",
    defaultFeatured: [
      {
        cat: "地缘博弈", date: "2026-06-01",
        title: "这就是今晚第一篇时评文章了",
        excerpt: "今晚 7 点第一篇自动生成，敬请期待。",
        href: "articles/2026-06-01-welcome.html"
      }
    ]
  },

  /* ---------- 主张 Manifesto / 引用 ---------- */
  quote: {
    text: "模型每天都在变，提问的能力不会过期。慢一点，但走得更远。",
    attr: "— 犀牛伯爵 · 2026"
  },

  /* ---------- 联络 Contact ---------- */
  contact: {
    label: "CONTACT · 联络",
    headingLine1: "递一张",
    headingLine2: "名片给伯爵。",
    blurb: "欢迎在小红书私信交流 AI、学习方法、职业选择，或仅仅是想吐槽今天的模型又抽风了。",
    channel: {
      title: "小红书 · XIAOHONGSHU",
      handle: "@犀牛伯爵 · 小红书号 1147661654",
      ctaLabel: "前往主页",
      ctaSub: "xiaohongshu.com",
      url: "https://www.xiaohongshu.com/user/profile/60572004000000000101ce41"
    }
  },

  /* ---------- 页脚 ---------- */
  footer: {
    left:  "© 2026 犀牛伯爵 · 一切笔记，皆可咀嚼",
    right: "Crafted with patience · Beijing"
  }
};
