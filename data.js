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
    domain: "zjeep-arch.github.io",           // ← 上线时改成你的真实域名
    repo: "rhino-count-site",           // GitHub 仓库名
    articlesFeed: "articles/feed.json",  // 文章列表数据源
  },

  /* ---------- 浏览器标签 + SEO ---------- */
  meta: {
    title: "犀牛伯爵 · AI 创作实验室",
    description: "犀牛伯爵 — AI-native builder。记录 Agent 工作流、AI 写作、宏观科技观察与内容产品化实验。",
    keywords: "犀牛伯爵, AI, Agent, AI-native, 大模型, 学习方法, 北大, 小红书, AI 大厂, Prompt, 时评, 宏观分析, 创作实验室",
    author: "犀牛伯爵",
    siteUrl: "https://zjeep-arch.github.io/rhino-count-site/",
    ogImage: "assets/og-card.svg"
  },

  /* ---------- 顶栏 ---------- */
  header: {
    brand: "犀牛伯爵",
    badge: "EST · BJ",
    nav: [
      { label: "关于",  href: "#profile" },
      { label: "笔记",  href: "#notes" },
      { label: "创作",  href: "#builds" },
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
    eyebrow: "RHINO COUNT · LIVE SIGNAL",
    titleMain: "HI, I'M",
    titleAccent: "RHINO",
    lede: "北大本科，高考数学满分。AI 大厂从业者。用 AI agent 把观察、写作、产品实验和工作流，沉淀成可复用的个人创作系统。",
    ctaPrimary:   { label: "进入创作矩阵 →", href: "#builds" },
    ctaSecondary: { label: "阅读最新笔记",     href: "#notes" },
    motion: {
      src: "assets/hero-motion.mp4"
    },
    keywords: [
      "AI NATIVE",
      "AGENT WORKFLOW",
      "MACRO RADAR",
      "PROMPT ENGINEERING",
      "SYSTEM THINKING",
      "MODEL WATCH",
      "TREND SIGNAL",
      "DAILY BRIEF"
    ],
    stats: [
      { num: "50000+", lbl: "followers" },
      { num: "10000+", lbl: "likes" }
    ]
  },

  /* ---------- 创作矩阵 Builds / Playbooks ---------- */
  lab: {
    label: "CREATION MATRIX · 创作矩阵",
    headingLine1: "把想法，",
    headingLine2: "做成作品。",
    blurb: "这里不只放页面，而是把每一次 AI 实验整理成可读、可复用、可继续迭代的内容资产。",
    tracks: [
      {
        tag: "BUILD",
        title: "AI Workflow Lab",
        desc: "把日常创作、资料整理、网页生成和自动化流程拆成可复用工作流。",
        linkLabel: "查看站点",
        href: "https://zjeep-arch.github.io/rhino-count-site/"
      },
      {
        tag: "WRITE",
        title: "AI-native Writing",
        desc: "记录模型变化、Agent 思维、学习方法，以及普通人如何用 AI 放大表达。",
        linkLabel: "读 AI 笔记",
        href: "#notes"
      },
      {
        tag: "RADAR",
        title: "Macro & Model Watch",
        desc: "把宏观事件、科技公司、模型发布和产业信号压缩成每晚可读的判断。",
        linkLabel: "看每日时评",
        href: "#commentary"
      },
      {
        tag: "PLAY",
        title: "Interactive Experiments",
        desc: "用小游戏、教程页和交互页面测试内容的新形态，让表达变得可玩。",
        linkLabel: "玩一个实验",
        href: "games/duck-scare-war.html"
      }
    ],
    featured: [
      {
        type: "Essay",
        title: "Agent 不是产品，是新一代操作系统",
        desc: "从 App 思维迁移到 Agent 思维需要的 5 个转变。",
        href: "notes/agent-is-operating-system.html"
      },
      {
        type: "Guide",
        title: "百度 DuMate 从 0 到 1 上手教程",
        desc: "把一个 AI 产品拆成可操作、可复用、可传播的教程资产。",
        href: "dumate/"
      },
      {
        type: "Game",
        title: "鸭骗战争：真鸭假鹅",
        desc: "把内容创作做成互动玩法，测试轻量游戏化表达。",
        href: "games/duck-scare-war.html"
      }
    ],
    roadmap: [
      "每周复盘一个 AI workflow 实验",
      "每周沉淀一篇 AI-native 写作 / 产品观察",
      "每月整理一个可复用 playbook",
      "把聊天、网页、文章和自动化流程串成个人创作系统"
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
    blurb: "每一篇笔记都是一次小型田野调查：关于模型、关于人、关于我们如何被这个时代重新塑形。",
    notes: [
      {
        cat: "AI 趋势", num: "N° 01",
        title: "当大模型开始替你思考，先学会问对问题",
        excerpt: "为什么 prompt 是 2026 年最被低估的核心技能。",
        img: "assets/note-01.svg",
        href: "notes/prompt-is-the-skill.html"
      },
      {
        cat: "学习方法", num: "N° 02",
        title: "高考数学满分的人，怎么学一门新技术？",
        excerpt: "把陌生学科拆成三层：直觉、框架、推演。",
        img: "assets/note-02.svg",
        href: "notes/how-to-learn-new-tech.html"
      },
      {
        cat: "大厂手记", num: "N° 03",
        title: "在 AI 大厂的第 365 天，我删掉了 47 个工具",
        excerpt: "工具越多，越要警惕被工具反向定义。",
        img: "assets/note-03.svg",
        href: "notes/deleted-47-tools.html"
      },
      {
        cat: "踩坑实录", num: "N° 04",
        title: "用 Agent 写代码三个月，省下的时间都去哪儿了？",
        excerpt: "答案：花在 review、改 prompt 和向同事解释上。",
        img: "assets/note-04.svg",
        href: "notes/agent-coding-three-months.html"
      },
      {
        cat: "AI 趋势", num: "N° 05",
        title: "Agent 不是产品，是新一代操作系统",
        excerpt: "从 App 思维迁移到 Agent 思维需要的 5 个转变。",
        img: "assets/note-05.svg",
        href: "notes/agent-is-operating-system.html"
      },
      {
        cat: "随笔", num: "N° 06",
        title: "北大那四年没教我的事",
        excerpt: "毕业之后才明白，专业不是身份，是工具箱。",
        img: "assets/note-06.svg",
        href: "notes/what-pku-didnt-teach-me.html"
      },
      {
        cat: "小游戏", num: "🎮",
        title: "鸭骗战争：真鸭假鹅",
        excerpt: "扮演鹅腿阿姨，用鸭腿冒充鹅腿！荒诞答题小游戏，你能骗过几个学生？",
        img: null,
        href: "games/duck-scare-war.html"
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
    blurb: "每晚 7 点，闲聊拆解当天宏观大事。纯属瞎扯，打发时间刚好。",
    defaultFeatured: [
      {
        cat: "地缘 · 宏观", date: "2026-06-03",
        title: "（瞎聊）伊朗战争打到第96天，油价没涨、中国没急、英国跑来北京",
        excerpt: "美国在波斯湾打到第96天——但国际油价没涨、中国没有乱、英国外相反而跑去北京。这里面有几个大的背景。",
        href: "articles/2026-06-03-iran-war-uk-china-thaw.html"
      }
    ]
  },

  /* ---------- 主张 Manifesto / 引用 ---------- */
  quote: {
    text: "输出不是作品的全部。真正的工作，发生在观察、判断、拆解和反复迭代里。",
    attr: "— 犀牛伯爵 · 2026"
  },

  /* ---------- 联络 Contact ---------- */
  contact: {
    label: "REACH · 联络",
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
    left:  "© 2026 犀牛伯爵 · AI Creation Lab",
    right: "Build · Write · Think · Ship"
  }
};
