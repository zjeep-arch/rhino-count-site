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
      { label: "日报",  href: "#daily" },
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
    eyebrow: "RHINO COUNT · AI NATIVE STUDIO",
    titleMain: "HI, I'M",
    titleAccent: "RHINO",
    lede: "把 AI 观察、Agent 工作流、产业判断和内容实验，压缩成一套持续生长的个人创作系统。",
    ctaPrimary:   { label: "进入创作矩阵 →", href: "#builds" },
    ctaSecondary: { label: "阅读最新笔记",     href: "#notes" },
    motion: {
      src: "assets/hero-rhino-scene.mp4",
      backdrop: "assets/hero-rhino-scene.mp4"
    },
    keywords: [
      "AI NATIVE",
      "SIGNAL CURATION",
      "AGENT WORKFLOW",
      "MODEL WATCH",
      "CONTENT SYSTEM"
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
    blurb: "这里不放想法，放做出来的东西——网站、游戏、H5、交互实验。",
    tracks: [
      {
        tag: "GAME",
        title: "鸭骗战争：真鸭假鹅",
        desc: "扮演鹅腿阿姨，用鸭腿冒充鹅腿。荒诞答题小游戏，测试轻量游戏化表达。",
        linkLabel: "玩游戏",
        href: "games/duck-scare-war.html"
      },
      {
        tag: "PLAY",
        title: "3D AI 工作室",
        desc: "Iron Man 风格的 3D AI 工作室——方舟反应堆、全息屏幕、贾维斯 HUD、全球数据流。可拖拽旋转、点击交互。",
        linkLabel: "进入工作室",
        href: "ai-studio-3d.html"
      },
      {
        tag: "LAB",
        title: "AI 创作实验室",
        desc: "沉浸式 3D 交互页面——悬浮水晶体、滚动驱动的相机运动、作品矩阵、能力图谱、实时数据面板。",
        linkLabel: "进入实验室",
        href: "ai-lab-3d.html"
      },
      {
        tag: "WORKFLOW",
        title: "AI Workflow Lab",
        desc: "把日常创作、资料整理、网页生成和自动化流程拆成可复用工作流。",
        linkLabel: "查看站点",
        href: "https://zjeep-arch.github.io/rhino-count-site/"
      }
    ],
    featured: [
      {
        type: "Essay",
        title: "微软裁了4800人，转头招了6000人干AI",
        desc: "不是AI替代你，是会用AI的人在替代不会用AI的人。",
        href: "notes/2026-07-07-microsoft-layoff-ai-hiring.html"
      },
      {
        type: "Essay",
        title: "谷歌掐了Meta的电闸，AI争夺战杀到了变压器",
        desc: "Meta被限算力后被迫卖算力，半导体暴跌6.27%。AI的战争已从算法打到了电力。",
        href: "notes/2026-07-06-ai-compute-crisis-google-meta-power.html"
      },
      {
        type: "Essay",
        title: "Anthropic把最强模型送给了政府",
        desc: "Fable 5解禁背后，是一场22天的交易。Anthropic用Mythos 5的政府专属访问权，换回了Fable 5的商业自由。",
        href: "notes/2026-07-05-anthropic-mythos5-government-trade.html"
      }
    ],
    roadmap: [
      "每周复盘一个 AI workflow 实验",
      "每月发布一个交互实验或小游戏",
      "把聊天、网页、文章和自动化流程串成个人创作系统",
      "探索 H5 内容产品化的新形态"
    ]
  },

  /* ---------- AI 早报 Daily Brief ---------- */
  daily: {
    label: "AI MORNING BRIEF · 日报",
    headingLine1: "每天 8 点，",
    headingLine2: "读懂 AI 世界昨夜的新信号。",
    blurb: "精选 AI 大模型、产品更新、资本动向与产业洞察，把昨夜最值得关注的变化压缩成一份早间速览。",
    href: "ai-daily/",
    ctaLabel: "查看全部早报",
    stats: [
      { k: "08:00", v: "DAILY UPDATE" },
      { k: "5 MIN", v: "SIGNAL BRIEF" },
      { k: "AI", v: "MODEL · PRODUCT · CAPITAL" }
    ],
    latest: [
      {
        tag: "LATEST",
        title: "GPT-5.6 正式发布：中国模型、开放生态与产品分发的新信号",
        desc: "用一份早报快速扫描模型发布、产品更新、资本动向和产业变化。",
        href: "ai-daily/"
      }
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
        title: "先学会问对问题",
        excerpt: "为什么 prompt 是 2026 年最被低估的核心技能。",
        img: "assets/note-01.svg",
        href: "notes/prompt-is-the-skill.html"
      },
      {
        cat: "学习方法", num: "N° 02",
        title: "怎么学一门新技术？",
        excerpt: "把陌生学科拆成三层：直觉、框架、推演。",
        img: "assets/note-02.svg",
        href: "notes/how-to-learn-new-tech.html"
      },
      {
        cat: "大厂手记", num: "N° 03",
        title: "我删掉了 47 个工具",
        excerpt: "工具越多，越要警惕被工具反向定义。",
        img: "assets/note-03.svg",
        href: "notes/deleted-47-tools.html"
      },
      {
        cat: "踩坑实录", num: "N° 04",
        title: "Agent 写代码三个月，省的时间去哪了？",
        excerpt: "花在 review、改 prompt 和向同事解释上。",
        img: "assets/note-04.svg",
        href: "notes/agent-coding-three-months.html"
      },
      {
        cat: "AI 趋势", num: "N° 05",
        title: "Agent 是新一代操作系统",
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
        cat: "AI 趋势", num: "N° 10",
        title: "微软裁了4800人，转头招了6000人干AI",
        excerpt: "不是AI替代你，是会用AI的人在替代不会用AI的人。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-07-microsoft-layoff-ai-hiring.html"
      },
      {
        cat: "AI 趋势", num: "N° 09",
        title: "谷歌掐了Meta的电闸，AI争夺战杀到了变压器",
        excerpt: "Meta被限算力后被迫卖算力，半导体暴跌6.27%。AI的战争已从算法打到了电力。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-06-ai-compute-crisis-google-meta-power.html"
      },
      {
        cat: "AI 趋势", num: "N° 08",
        title: "Anthropic把最强模型送给了政府",
        excerpt: "Fable 5解禁背后，是一场22天的交易。Anthropic用Mythos 5的政府专属访问权，换回了Fable 5的商业自由。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-05-anthropic-mythos5-government-trade.html"
      },
      {
        cat: "AI 趋势", num: "N° 07",
        title: "Anthropic做芯片、xAI做语音、Sonnet 5下放Agent",
        excerpt: "让Agent更便宜、更独立。不是产品迭代，是战略转向。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-04-anthropic-chip-xai-voice-sonnet5-agent.html"
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
        cat: "科技 · 商业", date: "2026-06-23",
        title: "（闲聊）巴菲特接班人百亿砸AI基建——不是“追涨”，是“抄底”",
        excerpt: "伯克希尔新任CEO阿贝尔向谷歌定向增发100亿美元。AI涨了三年，最保守的价值投资者为什么偏偏在这时候重仓？",
        href: "articles/2026-06-23-berkshire-google-ai-infra.html"
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
