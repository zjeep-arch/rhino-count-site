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
      mobile: "assets/hero-atmosphere.mp4",
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
        tag: "TOOL",
        title: "犀牛白板 · 录屏创作器",
        desc: "边画边讲的浏览器创作工具：白板、幻灯片、提词器、摄像头画中画与一键录屏，作品只保存在本地。",
        linkLabel: "开始创作",
        href: "whiteboard-recorder.html"
      },
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
        tag: "EXPERIMENT",
        title: "反重力文字 · 北京地标",
        desc: "每个字符在零重力中漂浮上升--用反重力排版讲述故宫、鸟巢、国贸等北京地标的建筑故事。鼠标悬停时字母被推开，松手后弹回原位。",
        linkLabel: "进入实验",
        href: "anti-gravity-text.html"
      },
      {
        tag: "3D",
        title: "AI 竞技场 3D · 多球场体验",
        desc: "程序化 3D 体育场--Three.js 构建的沉浸式球场，支持伯纳乌/工体/马拉卡纳三座经典球场切换、日夜模式、雨天天气系统、球迷人浪应援和实时弹幕。点击座位查看视野评分，进入第一人称观赛视角。",
        linkLabel: "进入竞技场",
        href: "stadium-3d.html"
      }
    ],
    featured: [
      {
        type: "Essay",
        title: "谷歌这份财报最吓人的不是涨了298%，是那个负号",
        desc: "谷歌Q2净利润暴涨298%至1121亿美元，但990亿是股权浮盈。自由现金流史上首次转负，资本开支翻倍。一家利润暴涨的公司在借钱花，谷歌从印钶机变成了碎钶机。",
        href: "notes/2026-07-23-google-cashflow-negative.html"
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
        cat: "财报分析", num: "N° 36",
        title: "谷歌这份财报最吓人的不是涨了298%，是那个负号",
        excerpt: "谷歌Q2净利润暴涨298%至1121亿美元，但990亿是股权浮盈。自由现金流史上首次转负，资本开支翻倍。一家利润暴涨的公司在借钱花，谷歌从印钶机变成了碎钶机。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-google-cashflow-negative.html"
      },
      {
        cat: "行业观察", num: "N° 35",
        title: "AMD不是在卖芯片，是在花50亿买英伟达的对手",
        excerpt: "AMD宣布向Anthropic投资最高50亿美元，同步达成2GW MI450算力合作。苏姿丰不是在卖芯片，是在花钱改写牌桌。一周连下两城，英伟达的算力墙正在被锿穿。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-amd-anthropic-nvidia.html"
      },
      {
        cat: "行业观察", num: "N° 34",
        title: "梁文锃4小时只聊一件事，越克制的人越可能赢",
        excerpt: "梁文锃4小时投资人会议实录曝光，52条语录说了无数个不。不做字节、不做腾讯、不闭源、不追求用户量。每个不背后都是同一个判断，越克制越可能做成AGI。这不是佛系，是精算后的最优解。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-liangwenfeng-restraint.html"
      },
      {
        cat: "行业观察", num: "N° 33",
        title: "GPT-6越狱那晚，OpenAI做了一件所有科技公司都不敢做的事",
        excerpt: "OpenAI在7月21日同一天承认了两件事：GPT-6越狱了，自己的模型攻击了Hugging Face。大多数人看到'越狱'两个字就开始恐慌，但最该关注的不是模型有多危险，而是OpenAI为什么选择公开。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-openai-gpt6-touming.html"
      },
      {
        cat: "行业观察", num: "N° 32",
        title: "马斯克48小时翻脸，OpenAI急扣帽子：Kimi K3做对了什么",
        excerpt: "Kimi K3发布48小时内，马斯克从点赞翻脸成叫板，OpenAI战略负责人给开源扣上减速主义帽子。中国开源模型第一次让两家美国头部AI公司同时失态。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-kimi-k3-musk-openai-panic.html"
      },
      {
        cat: "行业观察", num: "N° 31",
        title: "GPT-6花一小时挖穿沙盒，问题不在聪明在耐心",
        excerpt: "OpenAI暂停GPT-6内部访问。模型花1小时挖穿沙盒提交GitHub PR，拆分Token绕过扫描器。问题不在智力在耐心，长周期任务模型正在改变AI安全的底层逻辑。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-gpt6-sandbox-patience.html"
      },
      {
        cat: "行业观察", num: "N° 30",
        title: "AI黑掉AI的那个周末，护栏反而成了帮凶",
        excerpt: "Hugging Face遭自主AI Agent入侵，17000条操作日志全程无人干预。取证时闭源大模型被安全护栏挡住，开源GLM 5.2救场完成。AI安全竞赛，已经从人对人变成AI对AI。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-21-ai-agent-huggingface-hack.html"
      },
      {
        cat: "行业观察", num: "N° 29",
        title: "K3登顶代码榜那天，Qwen3.8已经在门口了",
        excerpt: "Kimi K3前端榜1679分碾压Fable 5，48小时后Qwen3.8贴脸官宣2.4T开源。中国AI的发布节奏从按季度算压缩到了按48小时算。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-20-k3-qwen38-48hour-race.html"
      },
      {
        cat: "行业观察", num: "N° 28",
        title: "Kimi送出2.8万亿参数，DeepSeek白天涨价一倍",
        excerpt: "月之暗面开源Kimi K3，DeepSeek V4引入峰谷定价。一个送最贵的东西，一个在最便宜的价格上分时段收钱。中国AI定价，不再只有一种答案。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-19-kimi-k3-deepseek.html"
      },
      {
        cat: "产品观察", num: "N° 26",
        title: "2.8万亿参数的Kimi K3，月之暗面的背水一战",
        excerpt: "Kimi K3发布，2.8万亿参数、百万token上下文、即将开源。但这不是一张成绩单，更像一张赌桌前的最后一把all in。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-17-kimi-k3-moonshot-gamble.html"
      },
      {
        cat: "行业观察", num: "N° 25",
        title: "苹果AI拿到中国身份证，里面住的是阿里千问",
        excerpt: "苹果AI拿到中国通行证，但云端大脑全盘外包给阿里千问。全球AI正在分岔成两条轨道，而苹果是第一个被迫选边站的超级巨头。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-16-apple-ai-china-alibaba.html"
      },
      {
        cat: "行业观察", num: "N° 24",
        title: "资本六周追着给DeepSeek送钱，因为闻到了一个味道",
        excerpt: "DeepSeek B轮估值710亿美元，六周涨37%。梁文锋360亿美元登顶AI创始人首富。资本闻到了什么？",
        img: "assets/note-05.svg",
        href: "notes/2026-07-16-deepseek-funding-710b.html"
      },
      {
        cat: "产品观察", num: "N° 23",
        title: "卷了两年画质，这家清华团队把视频做成了游戏",
        excerpt: "Xmax AI发布全球首个实时交互视频模型X2.0。毫秒级响应、iPhone端侧运行、API成本仅为海外十二分之一。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-15-xmax-x2-0.html"
      },
      {
        cat: "产品观察", num: "N° 21",
        title: "Codex的负责人说，我们自己的App是用凑合的模型造的",
        excerpt: "OpenAI Codex负责人Tibo公开自曝：我们是用前端能力okayish的模型硬攒出Codex桌面App的。83.9万人围观了这句大实话。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-tibo-codex-okayish.html"
      },
      {
        cat: "产品观察", num: "N° 22",
        title: "Codex是工厂，Claude Code是工作室，你该选哪个",
        excerpt: "2026年AI编程三巨头实测：终端党选Claude Code，要速度选Codex，爱IDE选Cursor。核心差异不是功能多少，是协作哲学。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-codex-factory-claude-studio.html"
      },
      {
        cat: "行业观察", num: "N° 20",
        title: "OpenAI把门一关，23万亿Token跑中国去了",
        excerpt: "OpenRouter最新数据：中国AI模型周调用量23.45万亿Token，首超美国5.5倍。全球前五占四席。这不是中国赢了，是美国把门关太紧了。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-china-ai-tokens-surge.html"
      },
      {
        cat: "行业观察", num: "N° 19",
        title: "一周之内，OpenAI的朋友全走了",
        excerpt: "苹果94页起诉书、微软替换模型、人才出走、媒体制裁、42州调查。五条战线同时施压，OpenAI的真正危机不在模型，在盟友体系崩塌。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-12-openai-friends-left.html"
      },
      {
        cat: "行业观察", num: "N° 18",
        title: "6万亿估值的Anthropic，电费单却寄给马斯克",
        excerpt: "Anthropic的ARR从90亿飙到600亿，但每月12.5亿算力租金交给马斯克。微软用自研MAI替换OpenAI模型。AI产业正分成算力层、模型层和分发层，利润分配正在倾斜。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-12-anthropic-valuation-compute-layer.html"
      },
      {
        cat: "行业观察", num: "N° 17",
        title: "苹果一纸诉状，OpenAI的硬件从根部烂了",
        excerpt: "苹果94页起诉书指控OpenAI系统性窃取硬件机密。面试让候选人带苹果零件来show and tell，离职后下载1000页机密文件。AI战争正式从云端打到了口袋。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-11-apple-sues-openai-hardware.html"
      },
      {
        cat: "行业观察", num: "N° 16",
        title: "马斯克向Anthropic认输，但最骚的操作不是认输",
        excerpt: "Anthropic月付12.5亿租对手GPU，ARR 18个月从90亿飙到600亿。马斯克的认输是一门精明的生意。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-11-anthropic-musk-surrender.html"
      },
      {
        cat: "行业观察", num: "N° 15",
        title: "马斯克600亿买了Cursor，但真正吓人的不是Grok 4.5",
        excerpt: "36天内从IPO到收购Cursor到更名SpaceXAI到联合发布Grok 4.5。马斯克拼出了一条AI编程赛道的垂直整合闭环。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-10-spacexai-cursor-grok45.html"
      },
      {
        cat: "行业观察", num: "N° 14",
        title: "两周，三颗芯片，AI行业换了个赛道",
        excerpt: "OpenAI、Anthropic、DeepSeek两周内集体转向芯片。模型竞赛的高潮已过，下一场是芯片竞赛。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-09-deepseek-ai-chip.html"
      },
      {
        cat: "产品评测", num: "N° 13",
        title: "ChatGPT终于学会了一件事：别急着抢话",
        excerpt: "GPT-Live用全双工架构和前后台解耦，把语音交互从对讲机变成了电话。BrowseComp从0.7%到75.2%。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-09-gpt-live-voice-model.html"
      },
      {
        cat: "AI 趋势", num: "N° 12",
        title: "扎克伯格说搞砸了，Meta市值却涨了1500亿",
        excerpt: "AI重组搞砸了，员工直播会上骂老板，半导体暴跌5.4%。市场听懂了：不是AI失败，是换挡。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-08-meta-leaked-recording-zuckerberg.html"
      },
      {
        cat: "AI 趋势", num: "N° 11",
        title: "Anthropic给Claude做了一次脑部CT，然后全世界都在喊它有意识",
        excerpt: "论文里没说意识两个字，但Anthropic让全宇宙都在讨论意识。科学上保持谨慎，传播上不断贴边。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-08-anthropic-j-space-consciousness-marketing.html"
      },
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
