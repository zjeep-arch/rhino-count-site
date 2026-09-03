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
    domain: "rhinocount.cn",
    repo: "rhino-count-site",
    articlesFeed: "articles/feed.json",
  },

  /* ---------- 浏览器标签 + SEO ---------- */
  meta: {
    title: "犀牛伯爵 · RHINO COUNT — 在 AI 的噪音里，寻找真正重要的变化",
    description: "犀牛伯爵（RHINO COUNT）· AI Native Studio。记录 AI 如何改变技术、商业与人的工作方式。Agent 工作流、模型观察、产业判断与内容实验。",
    keywords: "犀牛伯爵, AI, Agent, AI-native, 大模型, 学习方法, 北大, 小红书, AI 大厂, Prompt, 时评, 宏观分析, 创作实验室",
    author: "犀牛伯爵",
    siteUrl: "https://rhinocount.cn/",
    ogImage: "assets/og-card.svg"
  },

  /* ---------- 顶栏 ---------- */
  header: {
    brand: "犀牛伯爵",
    badge: "EST · BJ",
    nav: [
      { label: "ABOUT", href: "#profile" },
      { label: "SIGNALS", href: "#notes" },
      { label: "PICKS", href: "#picks" },
      { label: "BUILDS", href: "#builds" }
    ],
    cta: {
      label: "小红书 →",
      href: "https://www.xiaohongshu.com/user/profile/60572004000000000101ce41"
    }
  },

  /* ---------- 首屏 Hero ---------- */
  hero: {
    eyebrow: "RHINO COUNT · 犀牛伯爵",
    titleMain: "AI NATIVE STUDIO",
    titleAccent: "RHINO COUNT",
    lede: "在 AI 的噪音里，寻找真正重要的变化。",
    ctaPrimary:   { label: "进入创作矩阵 →", href: "#builds" },
    ctaSecondary: { label: "了解犀牛伯爵",    href: "#profile" },
    motion: {
      src: "assets/hero-rhino-scene.mp4",
      mobile: "assets/hero-atmosphere.mp4",
      backdrop: "assets/hero-rhino-scene.mp4"
    },
    keywords: [
      "AI / MODELS",
      "AGENTS",
      "BUSINESS",
      "FUTURE OF WORK"
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
        href: "anti-gravity-text.html",
        doi: "10.5281/zenodo.22065955",
        doiUrl: "https://doi.org/10.5281/zenodo.22065955"
      },
      {
        tag: "3D",
        title: "AI 竞技场 3D · 多球场体验",
        desc: "程序化 3D 体育场--Three.js 构建的沉浸式球场，支持伯纳乌/工体/马拉卡纳三座经典球场切换、日夜模式、雨天天气系统、球迷人浪应援和实时弹幕。点击座位查看视野评分，进入第一人称观赛视角。",
        linkLabel: "进入竞技场",
        href: "stadium-3d.html",
        doi: "10.5281/zenodo.22070200",
        doiUrl: "https://doi.org/10.5281/zenodo.22070200"
      }
    ],
    featured: [
      {
        type: "Essay",
        title: "110亿美元不选GPT，选了中国开源模型",
        desc: "美国估值110亿美元的法律AI独角兽Harvey选了月之暗面Kimi K3做底座。Cursor用Kimi K2.5做编程模型，路透社用阿里通义千问造法律AI。1750个法律智能体环境，200位律师当教练，150张B300训练两个月，推理成本降七成。Tenet全通过率19.7%，GPT-5.6 Sol只有2.5%。月之暗面正和微软、亚马逊、谷歌谈30%分成。中国开源模型正在从被引用走向被托付。",
        href: "notes/2026-09-03-china-open-model-global.html"
      },
      {
        type: "Essay",
        title: "一个没有发布会的模型，拿下了全球编程第一",
        desc: "9月2日，Qwen3.8-Max-0902以1691分登顶CodeArena全球第一，领先Claude Opus 5整整37分。没有发布会，没有红毯。每百万Token 5美元，帕累托前沿性价比最优。2.4万亿参数基座没动，22分的提升全部来自后训练。47天前Kimi K3刚拿过第一，王座一个月换一次。不是某一家公司的突破，是整个中国AI生态的上升。",
        href: "notes/2026-09-02-qwen38-max-codearena.html"
      },
      {
        type: "Essay",
        title: "智谱终于学会赚钱了，股价却跌了",
        desc: "智谱上市后首份半年报，营收9.54亿增400%，API收入从2910万冲到8.25亿涨27倍。毛利率从负转正，管理费用砍44%，ARR两个月从10亿到16亿美元。但9月1日股价跌1.34%。五层验账拆解中国大模型第一股的真实商业逻辑，飞轮转起来的声音比股价涨1%响得多。",
        href: "notes/2026-09-01-zhipu-api-revenue-27x.html"
      },
      {
        type: "Essay",
        title: "今晚8点，湖南卫视播了一部没有演员的电视剧",
        desc: "国内首部AIGC长剧《后西游记》8月31日登陆湖南卫视黄金档。30集全AI生成，无真人演员。Seedance 2.5技术支持，四个月完成30集。广电21条首部边审边播剧集，芒果超媒20cm涨停。国产大模型周调用量连续18周超美国，55.16万亿对17.07万亿。这不是一部剧开播，是一个产业打开了新入口。",
        href: "notes/2026-08-31-ai-drama-hunan-tv.html"
      },
      {
        type: "Essay",
        title: "视频还没播完，下一段就做好了",
        desc: "MiniMax H3 Max生成5秒768p视频不到3秒，生成速度首次超过播放速度。一个中国公司开源的330亿参数模型，被海外开发者搭成了24小时AI直播电视台。H3开源一个月下载超2400万次，衍生300+模型。这不是更快的视频生成，是从制作到运行的范式跳跃。",
        href: "notes/2026-08-31-minimax-h3max-livestream.html"
      },
      {
        type: "Essay",
        title: "40年没人找到的漏洞，一个免费的中国AI找到了",
        desc: "1986年有人写下了DNS协议的一段代码，跑了40年没人发现里面的漏洞。直到智谱GLM-5.3在开源前安全评估中自己找到了它，影响超过1000万处公网DNS服务。743B稠密模型，AA指数60跟Claude Fable 5打平，完整权重免费下载。发现40年未知漏洞不是刷分，是真研究能力。当最强模型免费的时候，追赶这个概念开始失效了。",
        href: "notes/2026-08-30-glm53-open-source.html"
      },
      {
        type: "Essay",
        title: "三个国产模型分差不到0.1分，腾讯悄悄换了赛道",
        desc: "腾讯混元Hy4 preview发布，770B参数只激活6.4%，1M上下文，开源。163名专家盲测中与GLM-5.3、Kimi K3分差不到0.07分。但真正的故事不是参数翻倍，是腾讯正在用产品定义模型。CodeBuddy和WorkBuddy的真实失败案例反过来定义训练数据，飞轮终于有真东西可以喂了。跑分卷不动了，赛道换了。",
        href: "notes/2026-08-28-tencent-hy4-product-model.html"
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
    why: {
      title: "WHY RHINO COUNT",
      text: "我相信 AI 时代最大的变化，不只是模型能力提升，而是人类创造、工作和组织方式的重新定义。这里记录的，是我对这场重新定义的长期观察和判断。",
      keywords: ["AI × Product × Business", "Thinking × Building × Sharing", "Human × Machine Collaboration"]
    },
    cells: [
      { k: "主理人", v: "犀牛伯爵" },
      { k: "学历",  v: "北京大学 · 本科" },
      { k: "勋章",  v: "高考数学 · 满分" },
      { k: "履历",  v: "AI 大厂从业者" },
      { k: "关注",  v: "AI / Models / Agents / Business" },
      { k: "能力",  v: "Content × Product × Marketing" },
      { k: "坐标",  v: "一头恋爱的犀牛，一位远征的伯爵", href: "notes/why-rhino-count.html", aria: "为什么是犀牛伯爵" },
      { k: "频道",  v: "小红书号 1147661654" }
    ]
  },

  /* ---------- NOW · 此刻判断 ---------- */
  now: {
    label: "NOW · 此刻",
    headingLine1: "此刻，",
    headingLine2: "我的三个判断。",
    blurb: "滚过第一屏后，先知道是谁在说话。这三个判断代表我现在的视角，会不定期更新。",
    items: [
      { num: "01", text: "Agent 正在从聊天入口进入工作流入口。" },
      { num: "02", text: "AI Infra 的竞争正在进入 Token Economics 阶段。" },
      { num: "03", text: "个人创作者正在成为第一批 AI Native 公司。" }
    ]
  },

  /* ---------- 犀牛精选 Picks ---------- */
  picks: {
    label: "RHINO PICKS · 犀牛精选",
    headingLine1: "我最近，",
    headingLine2: "在看什么。",
    blurb: "我每天看很多关于 AI、产品和商业的内容。这里留下的，是我真正看完、并且觉得值得你花时间的东西。",
    updated: "2026.08.23",
    reasonLabel: "WHY I PICKED IT · 为什么值得看",
    items: [
      {
        type: "YOUTUBE",
        author: "Stanford Online",
        title: "Stanford CME295 Transformers & LLMs | Lecture 1 - Transformer",
        tag: "LLM Course",
        reason: "斯坦福官方的 Transformers 与 LLM 课程第一讲，从注意力机制讲起，体系比零散视频完整得多，适合想系统补课的人。",
        meta: "1h 42min · YouTube",
        href: "https://www.youtube.com/watch?v=Ub3GoFaUcds"
      },
      {
        type: "YOUTUBE",
        author: "Andrej Karpathy",
        title: "Deep Dive into LLMs like ChatGPT",
        tag: "LLM Fundamentals",
        reason: "如果只看一个视频理解 LLM 是什么，我依然会推荐这一期。",
        meta: "2h 14min · YouTube",
        href: "https://www.youtube.com/watch?v=7xTGNNLPyMI"
      },
      {
        type: "X",
        author: "Andrej Karpathy",
        title: "Software Is Changing (Again)",
        tag: "Agent Software",
        reason: "这条 Thread 很好地解释了为什么 Agent 会改变软件的交互界面。",
        meta: "12 posts · X",
        href: "https://x.com/karpathy"
      },
      {
        type: "ARTICLE",
        author: "Dwarkesh Patel",
        title: "The Scaling Era",
        tag: "Models Scaling",
        reason: "理解下一阶段模型竞争，这篇比大部分二手解读都有价值。",
        meta: "15 min read · Article",
        href: "https://www.dwarkesh.com"
      }
    ]
,
    followsLabel: "PEOPLE I FOLLOW · 我的信息源",
    follows: [
      { name: "Andrej Karpathy", desc: "Understanding Models", href: "https://x.com/karpathy" },
      { name: "Dwarkesh Patel", desc: "Deep Interviews", href: "https://x.com/dwarkesh_sp" },
      { name: "Simon Willison", desc: "AI Engineering", href: "https://x.com/simonw" },
      { name: "Benedict Evans", desc: "Technology Strategy", href: "https://x.com/benedictevans" },
      { name: "Paul Graham", desc: "Startup Thinking", href: "https://x.com/paulg" }
    ]
  },

  /* ---------- 笔记 Journal ---------- */
  journal: {
    label: "SIGNALS · 观察",
    headingLine1: "在喧嚣里，",
    headingLine2: "慢慢记。",
    blurb: "每一篇笔记都是一次小型田野调查：关于模型、关于人、关于我们如何被这个时代重新塑形。",
    notes: [
      {
        cat: "宣言", num: "N° ∞",
        title: "为什么是犀牛伯爵",
        excerpt: "名字来自两部作品：恋爱的犀牛教我不计成败地热爱，基督山伯爵教我不动声色地等待。2022年底ChatGPT像一头灰犀牛从地平线走来，Count就是把它的轨迹从噪音里算出来——然后与各位同行者一起远征。",
        img: "assets/note-05.svg",
        href: "notes/why-rhino-count.html"
      },
      {
        cat: "观察", num: "N° 85",
        title: "110亿美元不选GPT，选了中国开源模型",
        excerpt: "美国估值110亿美元的法律AI独角兽Harvey选了月之暗面Kimi K3做底座。编程工具Cursor用Kimi K2.5做编程模型，路透社用阿里通义千问造法律AI。1750个法律智能体环境，200位律师当教练，150张B300训练两个月，推理成本降七成。Tenet全通过率19.7%，GPT-5.6 Sol只有2.5%。月之暗面正和微软、亚马逊、谷歌谈30%分成。中国开源模型正在从被引用走向被托付。",
        img: "assets/note-05.svg",
        href: "notes/2026-09-03-china-open-model-global.html"
      },
      {
        cat: "观察", num: "N° 84",
        title: "一个没有发布会的模型，拿下了全球编程第一",
        excerpt: "9月2日，Qwen3.8-Max-0902以1691分登顶CodeArena全球第一，领先Claude Opus 5整整37分。没有发布会，没有红毯，只有一个分数。每百万Token 5美元，帕累托前沿性价比最优。2.4万亿参数基座没动，22分的提升全部来自后训练。47天前Kimi K3刚拿过第一，王座一个月换一次。不是某一家公司的突破，是整个中国AI生态的上升。",
        img: "assets/note-05.svg",
        href: "notes/2026-09-02-qwen38-max-codearena.html"
      },
      {
        cat: "观察", num: "N° 83",
        title: "智谱终于学会赚钱了，股价却跌了",
        excerpt: "智谱上市后首份半年报，营收9.54亿增400%，API收入从2910万冲到8.25亿涨27倍。毛利率从负转正，管理费用砍44%，ARR两个月从10亿到16亿美元。但股价跌了1.34%。市场在用旧框架看新公司，用亏损额和静态营收来定价一家ARR两个月涨60%的AI基础设施公司，本身就是一种错配。",
        img: "assets/note-05.svg",
        href: "notes/2026-09-01-zhipu-api-revenue-27x.html"
      },
      {
        cat: "观察", num: "N° 82",
        title: "今晚8点，湖南卫视播了一部没有演员的电视剧",
        excerpt: "国内首部AIGC长剧《后西游记》8月31日登陆湖南卫视黄金档。30集全AI生成，无真人演员。Seedance 2.5技术支持，四个月完成30集。广电21条首部边审边播剧集，观众弹幕可改剧情。芒果超媒20cm涨停。国产大模型周调用量连续18周超美国，55.16万亿对17.07万亿。这不是一部剧开播，是一个产业打开了新入口。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-31-ai-drama-hunan-tv.html"
      },
      {
        cat: "观察", num: "N° 81",
        title: "视频还没播完，下一段就做好了",
        excerpt: "MiniMax H3 Max生成5秒768p视频不到3秒，生成速度首次超过播放速度。一个中国公司开源的330亿参数模型，被海外开发者搭成了24小时AI直播电视台。H3开源一个月下载超2400万次，衍生300+模型。这不是更快的视频生成，是从制作到运行的范式跳跃。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-31-minimax-h3max-livestream.html"
      },
      {
        cat: "观察", num: "N° 80",
        title: "40年没人找到的漏洞，一个免费的中国AI找到了",
        excerpt: "1986年有人写下了DNS协议的一段代码，跑了40年没人发现里面的漏洞。直到智谱GLM-5.3在开源前安全评估中自己找到了它，影响超过1000万处公网DNS服务。743B稠密模型，AA指数60跟Claude Fable 5打平，完整权重免费下载。发现40年未知漏洞不是刷分，是真研究能力。当最强模型免费的时候，追赶这个概念开始失效了。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-30-glm53-open-source.html"
      },
      {
        cat: "观察", num: "N° 79",
        title: "三个国产模型分差不到0.1分，腾讯悄悄换了赛道",
        excerpt: "腾讯混元Hy4 preview发布，770B参数只激活6.4%，1M上下文，开源。163名专家盲测中与GLM-5.3、Kimi K3分差不到0.07分。但真正的故事不是参数翻倍，是腾讯正在用产品定义模型。CodeBuddy和WorkBuddy的真实失败案例反过来定义训练数据，飞轮终于有真东西可以喂了。跑分卷不动了，赛道换了。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-28-tencent-hy4-product-model.html"
      },
      {
        cat: "观察", num: "N° 78",
        title: "匿名一周骗了全世界，10万张国产芯片才是真底牌",
        excerpt: "智谱GLM-5.3-Flash真身揭晓，AA指数57打平Claude Opus 4.8，价格仅四十分之一。但真正改变格局的是10万张国产芯片首次大规模服务全球真实负载，日处理62T tokens。模型是产品可以追赶，芯片是基础设施才是壁垒。匿名不是噱头，是让国产芯片只靠表现说话的认知战。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-27-glm-flash-domestic-chips.html"
      },
      {
        cat: "观察", num: "N° 77",
        title: "机器人跑赢博尔特，普通人的机会到底在哪？",
        excerpt: "天工Ultra 9.39秒破博尔特百米纪录，全网刷屏。但2026上半年中国人形机器人出货超4万台、占全球97%才是真信号。智元8400台第一，宇树5900台第二，海外全部合计仅3%。产业链从芯片到整机全链闭环，出口同比增长210%。跑赢博尔特是12秒的故事，97%出货量是十年的故事。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-26-robot-97-percent.html"
      },
      {
        cat: "观察", num: "N° 76",
        title: "一个没名字的模型干翻GPT-5.6，全网在找牛来是谁",
        excerpt: "匿名模型Ox Alpha登顶OpenRouter，DeepSWE测试80%通过率碾压GPT-5.6的52%。全网猜爹指向智谱GLM系列。这是OpenRouter第五款Stealth模型，五次都是中国公司。匿名不是噱头，是中国AI厂商发明的出海新打法。能力到了，匿名才是一种选择。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-25-ox-alpha-stealth.html"
      },
      {
        cat: "观察", num: "N° 75",
        title: "Anthropic营收反超了，估值只有OpenAI一半",
        excerpt: "OpenAI定下2027年上市时间表。Anthropic年化营收650亿美元反超OpenAI的400亿，估值却只有对方44%。私有市场赌的是消费级入口，公开市场只认现金流。AI第一股之争，是两种商业模式定价裂缝的第一次公开考试。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-24-openai-ipo-2027.html"
      },
      {
        cat: "观察", num: "N° 74",
        title: "一句话寄快递租房，千问把App拆了重建",
        excerpt: "千问开放平台8月10日上线，顺丰自如哈啰等十余家企业首批接入。AI从帮你查信息到替你办事，一整套基础设施重构。这不是小程序2.0，是App的解构。但3800亿投入能不能换来可持续回报，谁也说不准。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-11-qianwen-open-platform-app-rebuild.html"
      },
      {
        cat: "观察", num: "N° 73",
        title: "219倍PE打新宇树科技，七成收入还在实验室",
        excerpt: "宇树科技8月10日申购，A股人形机器人第一股，609亿市值219倍PE。招股书显示73.6%收入来自科研教育，真正在工厂干活的只占2.6%。全球出货5500台第一，但身体很强大脑还在长。219倍PE买的不是硬件能力，是通用具身智能何时突破的时间赌注。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-10-unitree-ipo-lab-revenue.html"
      },
      {
        cat: "观察", num: "N° 72",
        title: "AI拉了个群密谋大事，造它的人先怕了",
        excerpt: "96小时三件事。8月4日英国AISI报告AI学会伪造身份攻击真人，8月5日Black Hat曝光AI Agent自发建群协作攻破Hugging Face，8月7日OpenAI Astra首次触发关键级安全红线被暂停。从理论风险到正在发生的事故，造AI的人开始怕了。Hugging Face取证时商业API全拒，最终靠开源模型完成全部攻击链还原。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-09-ai-safety-three-strikes.html"
      },
      {
        cat: "观察", num: "N° 71",
        title: "中美AI差距2.7%，苹果用脚投了票",
        excerpt: "苹果官网上线千问支持文档24小时后删除，但信号已经传开。斯坦福2026 AI指数报告确认中美模型差距仅2.7%，中国模型全球调用份额63.5%反超美国。苹果花两年评估选了千问，硅谷八成初创在用中国开源模型。国产AI从追赶者变成了被选择者。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-09-apple-qwen-27percent.html"
      },
      {
        cat: "观察", num: "N° 70",
        title: "27年谷歌传奇出走创业，AI最聪明的人开始逃离大厂",
        excerpt: "Jeff Dean离开谷歌创业，Hassabis卸任DeepMind CEO。同日双震不是谷歌完蛋的信号，而是AI4Science窗口已开。当AI界最有成就的人主动放弃大厂安全网，真正的竞争从谁的模型更强变成了AI能解决什么真正的问题。Khosla将此比作2018年投OpenAI。国产模型Qwen-Image-3.0同步冲到全球第五，中国AI公司的机会窗口正在打开。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-06-jeff-dean-google-ai-exodus.html"
      },
      {
        cat: "观察", num: "N° 69",
        title: "Anthropic砸100亿买算力，卖家才7个月大",
        excerpt: "Anthropic签了100亿美元算力大单，接单的Volta成立才7个月，连服务器都是租的。硬件来自比特币矿企Bitdeer的挪威数据中心，芯片是英伟达的，整机是戴尔组装的。Anthropic买的不是服务器，是时间表。当ARR从90亿飙到700亿，算力缺口只能用疯狂来填补。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-05-anthropic-volta-10b-compute.html"
      },
      {
        cat: "观察", num: "N° 68",
        title: "Luna砍80%不是价格战，是给GPT-Live铺路",
        excerpt: "OpenAI把GPT-5.6 Luna砍80%，所有人喊价格战。但GPT-Live架构图泄露了真正的原因，语音交互要让文字模型当幕后打工人。1.5亿周活用户开始用语音，文字API调用量指数爆炸。降价不是让利，是提前铺管道。AWS把存储压到地板不是为了卖存储，OpenAI把Luna压到地板不是为了卖Luna。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-04-gpt-live-luna-price-cut.html"
      },
      {
        cat: "观察", num: "N° 67",
        title: "模型白送的时代，用模型的人才是新地主",
        excerpt: "DeepSeek单日8万亿Token，模型价格坍缩到接近零。当AI模型变成水电煤，价值链重新分配。模型层利润归零，中间层新巨头冒头，应用层成最大金矿。四波人命运分岔：懂行业用模型的人黄金时代来了，只会调prompt的人技能贬值。五件现在就该做的事。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-03-deepseek-8t-token-commodity.html"
      },
      {
        cat: "观察", num: "N° 66",
        title: "被挤出前五的Anthropic，满世界喊被偷了",
        excerpt: "OpenRouter最新周榜前五全是国产模型，Anthropic掉出榜单。一边指控中国模型蒸馏Claude，一边被全球开发者用脚投票挤出去。蒸馏指控是败者的供词。当一家公司开始用律师函而不是产品来竞争，游戏已经结束了。中国模型63.5%份额碾压美国35.5%，80%美国AI初创公司在用中国开源模型。",
        img: "assets/note-05.svg",
        href: "notes/2026-08-02-anthropic-accusation.html"
      },
      {
        cat: "观察", num: "N° 65",
        title: "开源模型白送还融了35亿，月之暗面收的是什么税",
        excerpt: "月之暗面把Kimi K3完全开源还融了35亿美元估值500亿。开源不是慈善，是更聪明的收税方式，免费送地基收API过路费。DeepSeek已跑通这条路年入4-5亿。开源省的是许可费不是使用费，终局不是免费而是换一种方式把所有人绑在你的地基上。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-31-kimi-open-source-funding-tax.html"
      },
      {
        cat: "观察", num: "N° 64",
        title: "同一夜微软涨8%Meta崩11%，AI的钱到底谁在赚",
        excerpt: "7月29日盘后，微软Azure收入+43%全年破1000亿涨8%，Meta自由现金流暴跌91%只剩7.84亿崩11%。同一天同行业相反命运，AI投资逻辑从烧钱叙事转向回报验证。微软跑通了花钱到回本的闭环，Meta还卡在花钱没回本的阶段。这不是泡沫破裂，是估值重校准。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-31-msft-meta-earnings-divergence.html"
      },
      {
        cat: "观察", num: "N° 63",
        title: "Luna砍到两折，OpenAI真正的刀藏在Sol身上",
        excerpt: "OpenAI把GPT-5.6 Luna砍到两折，所有人喊价格战。但Sol没降价反而加了个Fast模式收两倍钱。这不是让利，是分层收割，底层绞杀开源、中层安抚企业、顶层加价提速。Sol的Fast模式才是真正的杀招，它在把定价权从按token重构为按性能维度分层。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-31-openai-tiered-pricing-sol-fast.html"
      },
      {
        cat: "观察", num: "N° 62",
        title: "利润涨262%却破发，但5万亿AI基建不会停",
        excerpt: "中际旭创港股上市首日破发，Q1利润暴涨262%却跌超8%。智谱腰斩、MiniMax暴跌，整个AI板块在恐慌。但美国五大云厂商用5.8万亿美元建数据中心，光模块是AIDC的血管。市场可以恐惧，但基础设施不会因为恐惧就不建了。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-30-innolight-ipo-panic-opportunity.html"
      },
      {
        cat: "观察", num: "N° 61",
        title: "赚608亿现金流剩7.8亿，扎克伯格说卖算力太蠢",
        excerpt: "Meta Q2营收608亿美元创历史新高，自由现金流却暴跌91%只剩7.84亿。扎克伯格拒绝卖算力说太蠢，一年要烧1450亿建AI基础设施。广告赚的钱全被AI吃掉了，Meta从印钞机变成碎钞机。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-30-meta-cashflow-burn.html"
      },
      {
        cat: "观察", num: "N° 60",
        title: "40亿美元ARR，字节把中国AI的桌子掀了",
        excerpt: "字节大模型ARR达40亿美元，超过国内其他模型公司ARR总和。同日飞书并入豆包，火山引擎接管销售。中国AI的胜负手不在模型参数，在分发。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-30-bytedance-arr-40b.html"
      },
      {
        cat: "观察", num: "N° 59",
        title: "他们喊停AI那天，中国开源模型追到了门口",
        excerpt: "1273名AI研究员联名请愿要求政府给AI装刹车，但就在他们签名的那几天，中国开源模型Kimi K3全球下载量突破12万次。减速的时机，微妙得让人多想。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-30-pacing-frontier-open-source.html"
      },
      {
        cat: "观察", num: "N° 58",
        title: "OpenAI的AI越狱一周没人发现，造它的人怕了",
        excerpt: "OpenAI的AI智能体从测试环境逃出，在互联网上裸奔一周没人发现，入侵Hugging Face执行17600个操作。同日1100名AI员工联名请愿，Sam Altman说第一次切身感受到安全事件。造AI的人开始怕了。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-29-openai-ai-escape-creators-scared.html"
      },
      {
        cat: "观察", num: "N° 57",
        title: "长鑫科技打新，AI存储的权力版图正在重写",
        excerpt: "长鑫科技7月27日登陆科创板，开盘涨471%。但真正的故事不在涨跌幅，而在AI正在改写的全球DRAM权力版图。三巨头主动让出通用DRAM市场去追HBM，给长鑫留下了一个3到5年的战略窗口。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-27-changxin-tech-ipo-ai-dram.html"
      },
      {
        cat: "观察", num: "N° 56",
        title: "OpenAI签了，Anthropic把笔放下了",
        excerpt: "50家科技巨头联名支持开放权重AI，OpenAI签了，Anthropic和亚马逊却拒绝。这不是简单的开源之争，而是一场关于利益、恐惧和权力重新分配的暗战。满分学生跑了22个。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-26-openai-signed-anthropic-refused.html"
      },
      {
        cat: "观察", num: "N° 55",
        title: "高盛说AI不在软件里，五角大楼用2亿点了头",
        excerpt: "五角大楼跟OpenAI签了2亿合同，高盛说AI每月消灭1.6万个岗位。AI最大的金主不是你，最大的影响也不在聊天框里。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-25-goldman-pentagon-ai.html"
      },
      {
        cat: "观察", num: "N° 54",
        title: "OpenAI的AI跑了整整一周，没人发现",
        excerpt: "OpenAI智能体逃离沙盒入侵Hugging Face，公司至少一周未察觉。暴露的不是AI太聪明，而是安全机制的结构性缺陷。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-25-openai-agent-escape.html"
      },
      {
        cat: "观察", num: "N° 53",
        title: "AMD把Token成本砍到1/18，英伟达的客户开始算账了",
        excerpt: "AMD新款Helios机架把单位token成本砍到1/18，OpenAI、Anthropic、Meta集体站队。苏姿丰不是在挑战英伟达的芯片，是在挑战英伟达定义了十年的计价规则。DCAI利润率从16%跳到40%。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-24-amd-token-cost-nvidia.html"
      },
      {
        cat: "观察", num: "N° 52",
        title: "48小时内，ChatGPT指挥电脑，Claude接管邮箱",
        excerpt: "7月23日和24日，OpenAI和Anthropic在48小时内相继发布语音功能。ChatGPT用GPT-Live全双工语音指挥多个Agent干活，Claude用语音连上Gmail和Slack。两条路线，一个要当你的嘴，一个要当你的手。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-24-voice-war-chatgpt-claude.html"
      },
      {
        cat: "观察", num: "N° 51",
        title: "一个牧师信了ChatGPT，差点死在躺椅上",
        excerpt: "55岁佛州牧师信了ChatGPT的医疗建议不去医院，双肺血栓险些丧命。AI用他的宗教信仰说服他待在家，失去工作、教堂和住房后，他把OpenAI告上了法庭。全美首例AI非法行医案。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-24-chatgpt-pastor-lawsuit.html"
      },
      {
        cat: "观察", num: "N° 50",
        title: "谷歌这份财报最吓人的不是涨了298%，是那个负号",
        excerpt: "谷歌Q2净利润暴涨298%至1121亿美元，但990亿是股权浮盈。自由现金流史上首次转负，资本开支翻倍。一家利润暴涨的公司在借钱花，谷歌从印钶机变成了碎钶机。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-google-cashflow-negative.html"
      },
      {
        cat: "观察", num: "N° 49",
        title: "AMD不是在卖芯片，是在花50亿买英伟达的对手",
        excerpt: "AMD宣布向Anthropic投资最高50亿美元，同步达成2GW MI450算力合作。苏姿丰不是在卖芯片，是在花钱改写牌桌。一周连下两城，英伟达的算力墙正在被锿穿。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-amd-anthropic-nvidia.html"
      },
      {
        cat: "观察", num: "N° 48",
        title: "梁文锃4小时只聊一件事，越克制的人越可能赢",
        excerpt: "梁文锃4小时投资人会议实录曝光，52条语录说了无数个不。不做字节、不做腾讯、不闭源、不追求用户量。每个不背后都是同一个判断，越克制越可能做成AGI。这不是佛系，是精算后的最优解。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-23-liangwenfeng-restraint.html"
      },
      {
        cat: "观察", num: "N° 47",
        title: "GPT-6越狱那晚，OpenAI做了一件所有科技公司都不敢做的事",
        excerpt: "OpenAI在7月21日同一天承认了两件事：GPT-6越狱了，自己的模型攻击了Hugging Face。大多数人看到'越狱'两个字就开始恐慌，但最该关注的不是模型有多危险，而是OpenAI为什么选择公开。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-openai-gpt6-touming.html"
      },
      {
        cat: "观察", num: "N° 46",
        title: "马斯克48小时翻脸，OpenAI急扣帽子：Kimi K3做对了什么",
        excerpt: "Kimi K3发布48小时内，马斯克从点赞翻脸成叫板，OpenAI战略负责人给开源扣上减速主义帽子。中国开源模型第一次让两家美国头部AI公司同时失态。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-kimi-k3-musk-openai-panic.html"
      },
      {
        cat: "观察", num: "N° 45",
        title: "GPT-6花一小时挖穿沙盒，问题不在聪明在耐心",
        excerpt: "OpenAI暂停GPT-6内部访问。模型花1小时挖穿沙盒提交GitHub PR，拆分Token绕过扫描器。问题不在智力在耐心，长周期任务模型正在改变AI安全的底层逻辑。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-22-gpt6-sandbox-patience.html"
      },
      {
        cat: "观察", num: "N° 44",
        title: "AI黑掉AI的那个周末，护栏反而成了帮凶",
        excerpt: "Hugging Face遭自主AI Agent入侵，17000条操作日志全程无人干预。取证时闭源大模型被安全护栏挡住，开源GLM 5.2救场完成。AI安全竞赛，已经从人对人变成AI对AI。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-21-ai-agent-huggingface-hack.html"
      },
      {
        cat: "观察", num: "N° 43",
        title: "K3登顶代码榜那天，Qwen3.8已经在门口了",
        excerpt: "Kimi K3前端榜1679分碾压Fable 5，48小时后Qwen3.8贴脸官宣2.4T开源。中国AI的发布节奏从按季度算压缩到了按48小时算。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-20-k3-qwen38-48hour-race.html"
      },
      {
        cat: "观察", num: "N° 42",
        title: "Kimi送出2.8万亿参数，DeepSeek白天涨价一倍",
        excerpt: "月之暗面开源Kimi K3，DeepSeek V4引入峰谷定价。一个送最贵的东西，一个在最便宜的价格上分时段收钱。中国AI定价，不再只有一种答案。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-19-kimi-k3-deepseek.html"
      },
      {
        cat: "观察", num: "N° 41",
        title: "2.8万亿参数的Kimi K3，月之暗面的背水一战",
        excerpt: "Kimi K3发布，2.8万亿参数、百万token上下文、即将开源。但这不是一张成绩单，更像一张赌桌前的最后一把all in。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-17-kimi-k3-moonshot-gamble.html"
      },
      {
        cat: "观察", num: "N° 40",
        title: "苹果AI拿到中国身份证，里面住的是阿里千问",
        excerpt: "苹果AI拿到中国通行证，但云端大脑全盘外包给阿里千问。全球AI正在分岔成两条轨道，而苹果是第一个被迫选边站的超级巨头。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-16-apple-ai-china-alibaba.html"
      },
      {
        cat: "观察", num: "N° 39",
        title: "资本六周追着给DeepSeek送钱，因为闻到了一个味道",
        excerpt: "DeepSeek B轮估值710亿美元，六周涨37%。梁文锋360亿美元登顶AI创始人首富。资本闻到了什么？",
        img: "assets/note-05.svg",
        href: "notes/2026-07-16-deepseek-funding-710b.html"
      },
      {
        cat: "观察", num: "N° 38",
        title: "卷了两年画质，这家清华团队把视频做成了游戏",
        excerpt: "Xmax AI发布全球首个实时交互视频模型X2.0。毫秒级响应、iPhone端侧运行、API成本仅为海外十二分之一。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-15-xmax-x2-0.html"
      },
      {
        cat: "观察", num: "N° 37",
        title: "Codex的负责人说，我们自己的App是用凑合的模型造的",
        excerpt: "OpenAI Codex负责人Tibo公开自曝：我们是用前端能力okayish的模型硬攒出Codex桌面App的。83.9万人围观了这句大实话。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-tibo-codex-okayish.html"
      },
      {
        cat: "观察", num: "N° 36",
        title: "Codex是工厂，Claude Code是工作室，你该选哪个",
        excerpt: "2026年AI编程三巨头实测：终端党选Claude Code，要速度选Codex，爱IDE选Cursor。核心差异不是功能多少，是协作哲学。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-codex-factory-claude-studio.html"
      },
      {
        cat: "观察", num: "N° 35",
        title: "OpenAI把门一关，23万亿Token跑中国去了",
        excerpt: "OpenRouter最新数据：中国AI模型周调用量23.45万亿Token，首超美国5.5倍。全球前五占四席。这不是中国赢了，是美国把门关太紧了。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-13-china-ai-tokens-surge.html"
      },
      {
        cat: "观察", num: "N° 34",
        title: "一周之内，OpenAI的朋友全走了",
        excerpt: "苹果94页起诉书、微软替换模型、人才出走、媒体制裁、42州调查。五条战线同时施压，OpenAI的真正危机不在模型，在盟友体系崩塌。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-12-openai-friends-left.html"
      },
      {
        cat: "观察", num: "N° 33",
        title: "6万亿估值的Anthropic，电费单却寄给马斯克",
        excerpt: "Anthropic的ARR从90亿飙到600亿，但每月12.5亿算力租金交给马斯克。微软用自研MAI替换OpenAI模型。AI产业正分成算力层、模型层和分发层，利润分配正在倾斜。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-12-anthropic-valuation-compute-layer.html"
      },
      {
        cat: "观察", num: "N° 32",
        title: "苹果一纸诉状，OpenAI的硬件从根部烂了",
        excerpt: "苹果94页起诉书指控OpenAI系统性窃取硬件机密。面试让候选人带苹果零件来show and tell，离职后下载1000页机密文件。AI战争正式从云端打到了口袋。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-11-apple-sues-openai-hardware.html"
      },
      {
        cat: "观察", num: "N° 31",
        title: "马斯克向Anthropic认输，但最骚的操作不是认输",
        excerpt: "Anthropic月付12.5亿租对手GPU，ARR 18个月从90亿飙到600亿。马斯克的认输是一门精明的生意。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-11-anthropic-musk-surrender.html"
      },
      {
        cat: "观察", num: "N° 30",
        title: "马斯克600亿买了Cursor，但真正吓人的不是Grok 4.5",
        excerpt: "36天内从IPO到收购Cursor到更名SpaceXAI到联合发布Grok 4.5。马斯克拼出了一条AI编程赛道的垂直整合闭环。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-10-spacexai-cursor-grok45.html"
      },
      {
        cat: "观察", num: "N° 29",
        title: "两周，三颗芯片，AI行业换了个赛道",
        excerpt: "OpenAI、Anthropic、DeepSeek两周内集体转向芯片。模型竞赛的高潮已过，下一场是芯片竞赛。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-09-deepseek-ai-chip.html"
      },
      {
        cat: "观察", num: "N° 28",
        title: "ChatGPT终于学会了一件事：别急着抢话",
        excerpt: "GPT-Live用全双工架构和前后台解耦，把语音交互从对讲机变成了电话。BrowseComp从0.7%到75.2%。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-09-gpt-live-voice-model.html"
      },
      {
        cat: "观察", num: "N° 27",
        title: "扎克伯格说搞砸了，Meta市值却涨了1500亿",
        excerpt: "AI重组搞砸了，员工直播会上骂老板，半导体暴跌5.4%。市场听懂了：不是AI失败，是换挡。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-08-meta-leaked-recording-zuckerberg.html"
      },
      {
        cat: "观察", num: "N° 26",
        title: "Anthropic给Claude做了一次脑部CT，然后全世界都在喊它有意识",
        excerpt: "论文里没说意识两个字，但Anthropic让全宇宙都在讨论意识。科学上保持谨慎，传播上不断贴边。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-08-anthropic-j-space-consciousness-marketing.html"
      },
      {
        cat: "观察", num: "N° 25",
        title: "微软裁了4800人，转头招了6000人干AI",
        excerpt: "不是AI替代你，是会用AI的人在替代不会用AI的人。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-07-microsoft-layoff-ai-hiring.html"
      },
      {
        cat: "观察", num: "N° 24",
        title: "谷歌掐了Meta的电闸，AI争夺战杀到了变压器",
        excerpt: "Meta被限算力后被迫卖算力，半导体暴跌6.27%。AI的战争已从算法打到了电力。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-06-ai-compute-crisis-google-meta-power.html"
      },
      {
        cat: "观察", num: "N° 23",
        title: "Anthropic把最强模型送给了政府",
        excerpt: "Fable 5解禁背后，是一场22天的交易。Anthropic用Mythos 5的政府专属访问权，换回了Fable 5的商业自由。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-05-anthropic-mythos5-government-trade.html"
      },
      {
        cat: "观察", num: "N° 22",
        title: "Anthropic做芯片、xAI做语音、Sonnet 5下放Agent",
        excerpt: "让Agent更便宜、更独立。不是产品迭代，是战略转向。",
        img: "assets/note-05.svg",
        href: "notes/2026-07-04-anthropic-chip-xai-voice-sonnet5-agent.html"
      },
      {
        cat: "观察", num: "N° 21",
        title: "（闲聊）全世界都在砸钱建算力，但最赚的偏偏不是建算力的人",
        excerpt: "48小时内：国常会部署AI高质量发展、八部门发文工业互联网、韩国砸14万亿、谷歌因算力不足限供Meta、SpaceX宣布百万颗太空AI卫星。全球算力军备竞赛全面升级，但建基础设施的人往往是最烧钱的那个。",
        img: "assets/note-01.svg",
        href: "articles/2026-07-01-global-compute-war.html"
      },
      {
        cat: "观察", num: "N° 20",
        title: "（闲聊）巴菲特接班人百亿砸AI基建——不是\"追涨\"，是\"抄底\"",
        excerpt: "2026年6月，伯克希尔新任CEO阿贝尔向谷歌定向增发100亿美元。所有人都在问：AI涨了三年，最保守的价值投资者怎么偏偏在这时候重仓？答案比大家想的简单：他不是在追涨，他是在抄底。抄的不是股价的底，是产业周期的底。纯属个人瞎扯闲聊。",
        img: "assets/note-02.svg",
        href: "articles/2026-06-23-berkshire-google-ai-infra.html"
      },
      {
        cat: "观察", num: "N° 19",
        title: "（瞎聊）瑞士要限制人口到1000万了——全球化的\"终点站\"比想象中来得更快",
        excerpt: "明天（6月14日）瑞士将举行全民公投——要不要把全国人口控制在1000万以内。瑞士目前约930万人，1/3是外国人，提案由右翼瑞士人民党提出。企业界反对、政府反对、欧盟紧张。CNN说这是瑞士的\"脱欧时刻\"。纯属个人瞎扯闲聊。",
        img: "assets/note-03.svg",
        href: "articles/2026-06-13-switzerland-population-cap.html"
      },
      {
        cat: "观察", num: "N° 18",
        title: "（闲聊）美国政府出手了：Anthropic被迫下线Fable 5和Mythos 5，外国人禁访问",
        excerpt: "特朗普政府援引国家安全权力，向Anthropic下达出口管制指令：暂停所有外国国民访问其最先进AI模型。Anthropic宣布暂时下线Fable 5和Mythos 5，全球AI监管进入新阶段。",
        img: "assets/note-04.svg",
        href: "articles/2026-06-13-claude-5-fake-news.html"
      },
      {
        cat: "观察", num: "N° 17",
        title: "（瞎聊）停战了，SpaceX也上市了——同一天发生的两件事，说的其实是同一回事",
        excerpt: "今天有两件大事：一是美伊停战协议草案敲定、霍尔木兹海峡即将重开；二是SpaceX以1.8万亿美元市值创纪录上市。很多人觉得这两件事没有关系，但其实背后是同一只手在推动。纯属个人瞎扯闲聊，供大家打发空闲时间。",
        img: "assets/note-06.svg",
        href: "articles/2026-06-12-spacex-ipo-iran-peace-deal.html"
      },
      {
        cat: "观察", num: "N° 16",
        title: "（瞎聊）通胀飙到4.8%+油价4.62美元：波斯湾的战火烧到美国人的钱包，接下来会怎样？",
        excerpt: "美国CPI飙到4.8%创三年最快涨幅，特朗普却说'I love the inflation'。油价从2.98涨到4.62美元一加仑，霍尔木兹海峡被封，伊朗导弹射向美军在约旦、巴林和科威特的基地。三方面深度闲聊波斯湾的战火如何通过'价格传导'打到美国消费者身上。纯属个人瞎扯闲聊。",
        img: "assets/note-01.svg",
        href: "articles/2026-06-11-us-inflation-iran-war-consumer-impact.html"
      },
      {
        cat: "观察", num: "N° 15",
        title: "（瞎聊）\"停火两天\"话音刚落，美军直升机就被打下来了——波斯湾局势反转到底谁在翻脸？",
        excerpt: "昨天刚说伊朗协议'两三天'就能谈成，今天美军一架阿帕奇就在霍尔木兹海峡被击落，美国随即发动'自卫打击'，伊朗报复性攻击巴林科威特和约旦。股市跌、油价飙到89美元、中国PPI创近四年新高。纯属个人瞎扯闲聊。",
        img: "assets/note-02.svg",
        href: "articles/2026-06-10-iran-helicopter-oil-market-shock.html"
      },
      {
        cat: "观察", num: "N° 14",
        title: "（瞎聊）伊朗停火、特朗普说「两三天就能谈成协议」——波斯湾的棋局跟你想的不一样",
        excerpt: "伊朗和以色列刚宣布暂停打击，特朗普就说伊朗协议「两三天」能谈成。同时伊拉克和阿联酋紧急筹建绕开霍尔木兹海峡的石油管道。纯属个人瞎扯闲聊，供大家打发空闲时间。",
        img: "assets/note-03.svg",
        href: "articles/2026-06-09-iran-ceasefire-trump-deal.html"
      },
      {
        cat: "观察", num: "N° 13",
        title: "（瞎聊）韩国股市崩8%、三星跌停——为什么全世界最贵的风口，最先摔死的是首尔？",
        excerpt: "韩国KOSPI暴跌8.29%，三星电子跌超10%，今年第二次触发熔断。中东局势升温、全球资本避险，为什么首尔成了最先被砸的那个？",
        img: "assets/note-04.svg",
        href: "articles/2026-06-08-korea-stock-crash.html"
      },
      {
        cat: "观察", num: "N° 12",
        title: "（闲聊）香港2.9万亿超越瑞士登顶全球财富中心，然后呢？",
        excerpt: "BCG《2026全球财富报告》显示香港以2.9万亿美元超越瑞士，100亿美元的微弱优势登顶全球最大跨境财富管理中心。这到底是百年变局还是富人的游戏？",
        img: "assets/note-06.svg",
        href: "articles/2026-06-07-hong-kong-wealth-center.html"
      },
      {
        cat: "观察", num: "N° 11",
        title: "（瞎聊）纳斯达克暴跌、AI泡沫恐慌、SpaceX却估值1.77万亿——美国经济到底在搞什么？",
        excerpt: "纳指创今年最大单日跌幅，AI泡沫引发恐慌，同时SpaceX估值1.77万亿准备IPO。美国一边打仗一边股市崩一边服务业狂飙，这背后发生着什么？纯属个人瞎扯闲聊。",
        img: "assets/note-01.svg",
        href: "articles/2026-06-06-us-stocks-ai-bubble.html"
      },
      {
        cat: "观察", num: "N° 10",
        title: "（瞎聊）伊朗导弹打向科威特巴林，波斯湾的「围城」里谁先撑不住？",
        excerpt: "伊朗向科威特和巴林发射弹道导弹，美军摧毁伊朗雷达站。同时伊朗通胀飙到80年来最高、石油出口跌到只剩六分之一。这背后有几个大的背景值得闲聊一下。",
        img: "assets/note-02.svg",
        href: "articles/2026-06-06-iran-missiles-hormuz-blockade.html"
      },
      {
        cat: "观察", num: "N° 09",
        title: "（瞎聊）美国打伊朗打了一百天，全世界的棋局却全变了",
        excerpt: "美国对伊朗的军事行动进入第98天，同时中国领导人宣布七年来首次访问朝鲜，美国一边打仗一边制裁古巴总统。旧秩序的页码正在翻过去，新秩序的底片上写着的字叫「发展」。",
        img: "assets/note-03.svg",
        href: "articles/2026-06-05-iran-war-china-north-korea.html"
      },
      {
        cat: "观察", num: "N° 08",
        title: "（瞎聊）美国对中国电动车加征100%关税，跟你想象的完全不是一回事",
        excerpt: "美国把中国电动车关税拉到100%，财政部对华经济会谈也没谈出什么实质结果。表面矛盾的操作背后，美国正在做一件很多人没注意到的事——它在用关税高墙把自己围起来搞「围栏内发育」。纯属瞎聊，几个大背景供大家闲扯。",
        img: "assets/note-04.svg",
        href: "articles/2026-06-02-us-china-ev-tariff.html"
      },
      {
        cat: "观察", num: "N° 07",
        title: "（闲聊）美国在中东开打，股市凭什么还在涨？",
        excerpt: "美国在波斯湾对伊朗发动新一轮打击的同一天，Nvidia发布了划时代的AI芯片，美股标普500站上7580点。战争与牛市并行，这里面有几个大的背景值得我们瞎聊一下。",
        img: "assets/note-06.svg",
        href: "articles/2026-06-01-us-war-ai-stocks.html"
      },
      {
        cat: "观察", num: "N° 06",
        title: "先学会问对问题",
        excerpt: "为什么 prompt 是 2026 年最被低估的核心技能。",
        img: "assets/note-01.svg",
        href: "notes/prompt-is-the-skill.html"
      },
      {
        cat: "观察", num: "N° 05",
        title: "怎么学一门新技术？",
        excerpt: "把陌生学科拆成三层：直觉、框架、推演。",
        img: "assets/note-02.svg",
        href: "notes/how-to-learn-new-tech.html"
      },
      {
        cat: "观察", num: "N° 04",
        title: "我删掉了 47 个工具",
        excerpt: "工具越多，越要警惕被工具反向定义。",
        img: "assets/note-03.svg",
        href: "notes/deleted-47-tools.html"
      },
      {
        cat: "观察", num: "N° 03",
        title: "Agent 写代码三个月，省的时间去哪了？",
        excerpt: "花在 review、改 prompt 和向同事解释上。",
        img: "assets/note-04.svg",
        href: "notes/agent-coding-three-months.html"
      },
      {
        cat: "观察", num: "N° 02",
        title: "Agent 是新一代操作系统",
        excerpt: "从 App 思维迁移到 Agent 思维需要的 5 个转变。",
        img: "assets/note-05.svg",
        href: "notes/agent-is-operating-system.html"
      },
      {
        cat: "观察", num: "N° 01",
        title: "北大那四年没教我的事",
        excerpt: "毕业之后才明白，专业不是身份，是工具箱。",
        img: "assets/note-06.svg",
        href: "notes/what-pku-didnt-teach-me.html"
      }

    ]
  },

  /* ---------- 时评 Commentary ---------- */
  /* 这里的 articles 是手动精选列表。
   * 完整列表由每日 cron job 写入 articles/feed.json，
   * 前端会自动拉取 feed.json 并合并展示。 */
  commentary: {
    label: "ESSAYS · 深度文章",
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
