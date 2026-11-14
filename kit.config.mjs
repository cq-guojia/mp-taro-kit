// mp-taro-kit 完整默认配置：所有「名字对应一个值」的项都在这里。
// 这是唯一真源 —— 改皮肤只改这个文件（消费方则只写自己的差异文件）。
// src/design/_tokens.scss、demo/src/theme.json、*.generated.ts 等全是生成物，请勿手改。
//
// 值有三种形态：
//   字面量            '12px' / '#3b5bdb'
//   CSS 运行时别名    'var(--mptk-radius-md)' —— 原样写进 CSS，运行时跟随
//   配置层别名        '@blue' / '@light:gray-2' —— 生成时解析到字面量
// component / structure 两组也全是可配项；structure 改了会影响布局，慎改但允许改。
export default {
  schemaVersion: 1,                                                 // 配置结构版本：生成器据此校验，结构变更需同步 bump

  primitives: {                                                     // 基础色板：明暗各一套，语义色用 @name 引用，值只写一次
    light: {                                                        // 明色色板：浅底深字场景使用的 20 个基色
      "blue": "#3b5bdb",                                            // 基础蓝：品牌主色，业务色与控件激活色同源
      "green": "#22c55e",                                           // 基础绿：成功态语义色
      "orange": "#f59e0b",                                          // 基础橙：警告态语义色
      "red": "#ec1313",                                             // 基础红：危险态语义色
      "purple": "#9333ea",                                          // 基础紫：扩展语义色
      "cyan": "#0e7490",                                            // 基础青：扩展语义色
      "pink": "#db2777",                                            // 基础粉：扩展语义色
      "teal": "#0f766e",                                            // 基础蓝绿：扩展语义色
      "gray-1": "#f7f8fa",                                          // 中性灰 1 级：最浅一级背景
      "gray-2": "#f2f3f5",                                          // 中性灰 2 级：页面底色 / 次级背景
      "gray-3": "#e9ecf1",                                          // 中性灰 3 级：分隔面 / 轨道底
      "gray-4": "#dcdee0",                                          // 中性灰 4 级：较深底色
      "gray-5": "#c8c9cc",                                          // 中性灰 5 级：禁用态 / 弱元素
      "gray-6": "#969799",                                          // 中性灰 6 级：次级图标
      "gray-7": "#767d87",                                          // 中性灰 7 级：三级文字
      "gray-8": "#3b434d",                                          // 中性灰 8 级：深色面 / 强调文字
      "white": "#fff",                                              // 纯白：卡片与控件底色
      "ink-1": "#1f2328",                                           // 墨色 1 级：主文字
      "ink-2": "#5c6370",                                           // 墨色 2 级：次级文字
      "ink-3": "#9aa1ab",                                           // 墨色 3 级：占位符与弱文字
    },
    dark: {                                                         // 暗色色板：深底浅字场景使用的 20 个基色
      "blue": "#6b8afd",                                            // 基础蓝：品牌主色，业务色与控件激活色同源
      "green": "#34d399",                                           // 基础绿：成功态语义色
      "orange": "#fbbf24",                                          // 基础橙：警告态语义色
      "red": "#ff5c5c",                                             // 基础红：危险态语义色
      "purple": "#c084fc",                                          // 基础紫：扩展语义色
      "cyan": "#22d3ee",                                            // 基础青：扩展语义色
      "pink": "#f472b6",                                            // 基础粉：扩展语义色
      "teal": "#2dd4bf",                                            // 基础蓝绿：扩展语义色
      "gray-1": "#15181c",                                          // 中性灰 1 级：最浅一级背景
      "gray-2": "#1f2329",                                          // 中性灰 2 级：页面底色 / 次级背景
      "gray-3": "#262b32",                                          // 中性灰 3 级：分隔面 / 轨道底
      "gray-4": "#2d333b",                                          // 中性灰 4 级：较深底色
      "gray-5": "#3b434d",                                          // 中性灰 5 级：禁用态 / 弱元素
      "gray-6": "#626a75",                                          // 中性灰 6 级：次级图标
      "gray-7": "#858d98",                                          // 中性灰 7 级：三级文字
      "gray-8": "#a9b0ba",                                          // 中性灰 8 级：深色面 / 强调文字
      "white": "#fff",                                              // 纯白：卡片与控件底色
      "ink-1": "#e6e8eb",                                           // 墨色 1 级：主文字
      "ink-2": "#a9b0ba",                                           // 墨色 2 级：次级文字
      "ink-3": "#858d98",                                           // 墨色 3 级：占位符与弱文字
    },
  },

  base: {                                                           // 布局基线：圆角 / 间距 / 控件高 / 字号行高 / 动效时长与非颜色 token
    "box-sizing": "border-box",                                     // 页面盒模型：统一 border-box，宽度含内边距与描边
    "height": "100%",                                               // 页面根高度：铺满视口，供后代百分比高度继承
    "--mptk-radius-xs": "4px",                                      // 圆角最小档：按档位递增，控件与卡片统一引用
    "--mptk-radius-sm": "8px",                                      // 圆角小档：按档位递增，控件与卡片统一引用
    "--mptk-radius-md": "12px",                                     // 圆角中档：按档位递增，控件与卡片统一引用
    "--mptk-radius-lg": "16px",                                     // 圆角大档：按档位递增，控件与卡片统一引用
    "--mptk-radius-xl": "20px",                                     // 圆角特大档：按档位递增，控件与卡片统一引用
    "--mptk-radius-pill": "999px",                                  // 圆角胶囊档：Switch / Badge 两端全圆
    "--mptk-radius-none": "0",                                      // 圆角零档：直角，用于通栏与分隔元素
    "--mptk-control-radius": "var(--mptk-radius-sm)",               // 控件默认圆角：引用 radius-sm，改 sm 即全局跟随
    "--mptk-card-radius": "var(--mptk-radius-md)",                  // 卡片默认圆角：引用 radius-md
    "--mptk-card-spacing": "var(--mptk-space-3)",                   // 卡片内边距：引用 space-3
    "--mptk-space-0": "2px",                                        // 间距 0 档：由小到大的统一留白节奏
    "--mptk-space-1": "4px",                                        // 间距 1 档：由小到大的统一留白节奏
    "--mptk-space-2": "8px",                                        // 间距 2 档：由小到大的统一留白节奏
    "--mptk-space-3": "12px",                                       // 间距 3 档：由小到大的统一留白节奏
    "--mptk-space-4": "16px",                                       // 间距 4 档：由小到大的统一留白节奏
    "--mptk-control-h-sm": "32px",                                  // 控件高度小档：与 WeUI 按钮三档一致
    "--mptk-control-h-md": "40px",                                  // 控件高度中档：与 WeUI 按钮三档一致
    "--mptk-control-h-lg": "48px",                                  // 控件高度大档：与 WeUI 按钮三档一致
    "--mptk-font-xs": "12px",                                       // 字号最小档：与 line-xs 成对
    "--mptk-font-sm": "14px",                                       // 字号小档：与 line-sm 成对
    "--mptk-font-md": "15px",                                       // 字号中档：与 line-md 成对
    "--mptk-font-lg": "17px",                                       // 字号大档：与 line-lg 成对
    "--mptk-font-xl": "22px",                                       // 字号特大档：与 line-xl 成对
    "--mptk-font-nav": "17px",                                      // 字号导航档：与 line-nav 成对
    "--mptk-line-xs": "17px",                                       // 行高最小档：与 font-xs 成对
    "--mptk-line-sm": "20px",                                       // 行高小档：与 font-sm 成对
    "--mptk-line-md": "22px",                                       // 行高中档：与 font-md 成对
    "--mptk-line-lg": "24px",                                       // 行高大档：与 font-lg 成对
    "--mptk-line-xl": "30px",                                       // 行高特大档：与 font-xl 成对
    "--mptk-line-nav": "24px",                                      // 行高导航档：与 font-nav 成对
    "--mptk-font-display": "96px",                                  // 展示字号：大数字 / 空态主标题
    "--mptk-line-display": "1",                                     // 展示行高：无单位倍数，随字号等比
    "--mptk-line-tight": "1",                                       // 紧凑行高：无单位倍数，单行标题使用
    "--mptk-opacity-busy": ".6",                                    // 等待态不透明度：转圈时压低内容
    "--mptk-dur": ".2s",                                            // 默认过渡时长：颜色 / 位移等常规动画
    "--mptk-dur-fast": ".12s",                                      // 快速过渡时长：按压反馈等即时反馈
    "--mptk-dur-run": "500ms",                                      // 运行动画时长：进度 / 加载类循环的一个周期
    "--mptk-dur-breathe": "1120ms",                                 // 呼吸动效周期：等待态有内容位时替代转圈
    "--mptk-ease": "cubic-bezier(.4, 0, .2, 1)",                    // 默认缓动曲线：与微信官方 motion 对齐
  },

  surface: {                                                        // 页面底色声明：仅编译期三选一出口 include，运行时出口不 include
    "background-color": "var(--mptk-surface-base)",                 // 页面底色：引用 surface-base，运行时出口不 include 以便后代覆盖
  },

  light: {                                                          // 明色语义色与颜色 token（键须与 dark 同名同数）
    "--mptk-fg": "@ink-1",                                          // 一级文字色：正文与标题
    "--mptk-fg-2": "@ink-2",                                        // 二级文字色：说明与副标题
    "--mptk-fg-3": "@gray-7",                                       // 三级文字色：辅助信息
    "--mptk-fg-4": "@ink-3",                                        // 四级文字色：占位符与禁用文案
    "--mptk-surface-1": "@white",                                   // 一级面：卡片 / 弹层底色
    "--mptk-surface-2": "@gray-1",                                  // 二级面：分组背景
    "--mptk-surface-3": "@gray-3",                                  // 三级面：内嵌区块
    "--mptk-surface-base": "@gray-2",                               // 页面底色：与 window.bgColor 同源，避免首帧白闪
    "--mptk-border-faint": "rgba(0, 0, 0, .04)",                    // 极浅描边：几乎不可见的分界
    "--mptk-border": "rgba(0, 0, 0, .10)",                          // 常规描边：卡片外框 / 输入边框
    "--mptk-border-strong": "rgba(0, 0, 0, .12)",                   // 强调描边：悬停 / 聚焦
    "--mptk-cell-divider": "rgba(0, 0, 0, .06)",                    // Cell 分隔线：默认比外框浅，宿主可覆盖成同色
    "--mptk-card-bg": "var(--mptk-surface-1)",                      // 卡片底色：引用 surface-1
    "--mptk-card-border": "var(--mptk-border)",                     // 卡片描边：引用 border
    "--mptk-gray-1": "@gray-1",                                     // 语义灰 1 级：组件可直接引用的中性色
    "--mptk-gray-2": "@gray-2",                                     // 语义灰 2 级：组件可直接引用的中性色
    "--mptk-gray-3": "@gray-3",                                     // 语义灰 3 级：组件可直接引用的中性色
    "--mptk-gray-4": "@gray-4",                                     // 语义灰 4 级：组件可直接引用的中性色
    "--mptk-gray-5": "@gray-5",                                     // 语义灰 5 级：组件可直接引用的中性色
    "--mptk-gray-6": "@gray-6",                                     // 语义灰 6 级：组件可直接引用的中性色
    "--mptk-gray-7": "@gray-7",                                     // 语义灰 7 级：组件可直接引用的中性色
    "--mptk-gray-8": "@gray-8",                                     // 语义灰 8 级：组件可直接引用的中性色
    "--mptk-blue": "@blue",                                         // 蓝·主色：色板派生出的语义色档
    "--mptk-blue-hover": "#324cc0",                                 // 蓝·悬停态：色板派生出的语义色档
    "--mptk-blue-active": "#2a3fa3",                                // 蓝·按下态：色板派生出的语义色档
    "--mptk-blue-soft": "rgba(59, 91, 219, .08)",                   // 蓝·浅色底：色板派生出的语义色档
    "--mptk-green": "@green",                                       // 绿·主色：色板派生出的语义色档
    "--mptk-green-hover": "#1da84f",                                // 绿·悬停态：色板派生出的语义色档
    "--mptk-green-active": "#178b42",                               // 绿·按下态：色板派生出的语义色档
    "--mptk-green-soft": "rgba(34, 197, 94, .08)",                  // 绿·浅色底：色板派生出的语义色档
    "--mptk-orange": "@orange",                                     // 橙·主色：色板派生出的语义色档
    "--mptk-orange-hover": "#d08409",                               // 橙·悬停态：色板派生出的语义色档
    "--mptk-orange-active": "#ad6d08",                              // 橙·按下态：色板派生出的语义色档
    "--mptk-orange-soft": "rgba(245, 158, 11, .08)",                // 橙·浅色底：色板派生出的语义色档
    "--mptk-red": "@red",                                           // 红·主色：色板派生出的语义色档
    "--mptk-red-hover": "#c91010",                                  // 红·悬停态：色板派生出的语义色档
    "--mptk-red-active": "#a70d0d",                                 // 红·按下态：色板派生出的语义色档
    "--mptk-red-soft": "rgba(236, 19, 19, .08)",                    // 红·浅色底：色板派生出的语义色档
    "--mptk-purple": "@purple",                                     // 紫·主色：色板派生出的语义色档
    "--mptk-purple-hover": "#7d2bc7",                               // 紫·悬停态：色板派生出的语义色档
    "--mptk-purple-active": "#6824a5",                              // 紫·按下态：色板派生出的语义色档
    "--mptk-purple-soft": "rgba(147, 51, 234, .08)",                // 紫·浅色底：色板派生出的语义色档
    "--mptk-cyan": "@cyan",                                         // 青·主色：色板派生出的语义色档
    "--mptk-cyan-hover": "#0c627a",                                 // 青·悬停态：色板派生出的语义色档
    "--mptk-cyan-active": "#0a5266",                                // 青·按下态：色板派生出的语义色档
    "--mptk-cyan-soft": "rgba(14, 116, 144, .08)",                  // 青·浅色底：色板派生出的语义色档
    "--mptk-pink": "@pink",                                         // 粉·主色：色板派生出的语义色档
    "--mptk-pink-hover": "#ba2165",                                 // 粉·悬停态：色板派生出的语义色档
    "--mptk-pink-active": "#9b1c54",                                // 粉·按下态：色板派生出的语义色档
    "--mptk-pink-soft": "rgba(219, 39, 119, .08)",                  // 粉·浅色底：色板派生出的语义色档
    "--mptk-teal": "@teal",                                         // 蓝绿·主色：色板派生出的语义色档
    "--mptk-teal-hover": "#0d645d",                                 // 蓝绿·悬停态：色板派生出的语义色档
    "--mptk-teal-active": "#0b534e",                                // 蓝绿·按下态：色板派生出的语义色档
    "--mptk-teal-soft": "rgba(15, 118, 110, .08)",                  // 蓝绿·浅色底：色板派生出的语义色档
    "--mptk-business": "@blue",                                     // 业务主色：跟随基础蓝
    "--mptk-success": "@green",                                     // 成功语义色
    "--mptk-warning": "@orange",                                    // 警告语义色
    "--mptk-danger": "@red",                                        // 危险语义色
    "--mptk-control-blue": "@blue",                                 // 控件色·蓝：color 属性可选值
    "--mptk-control-green": "@green",                               // 控件色·绿：color 属性可选值
    "--mptk-control-orange": "@orange",                             // 控件色·橙：color 属性可选值
    "--mptk-control-red": "@red",                                   // 控件色·红：color 属性可选值
    "--mptk-control-active": "var(--mptk-control-blue)",            // 控件激活色：默认跟随 control-blue
    "--mptk-control-track": "@gray-3",                              // Switch / Segmented 轨道底色
    "--mptk-control-thumb": "#fff",                                 // Switch 滑块底色
    "--mptk-control-thumb-dim": "@gray-5",                          // Switch 滑块禁用态底色
    "--mptk-control-on": "#fff",                                    // 开关开启态前景色
    "--mptk-control-thumb-fg": "#1f2328",                           // 滑块内图标 / 勾选色
    "--mptk-spinner-active": "@blue",                               // Spinner 活动段颜色
  },
  dark: {                                                           // 暗色语义色与颜色 token（键须与 light 同名同数）
    "--mptk-fg": "@ink-1",                                          // 一级文字色：正文与标题
    "--mptk-fg-2": "@ink-2",                                        // 二级文字色：说明与副标题
    "--mptk-fg-3": "@gray-7",                                       // 三级文字色：辅助信息
    "--mptk-fg-4": "@ink-3",                                        // 四级文字色：占位符与禁用文案
    "--mptk-surface-1": "@gray-2",                                  // 一级面：卡片 / 弹层底色
    "--mptk-surface-2": "@gray-3",                                  // 二级面：分组背景
    "--mptk-surface-3": "@gray-4",                                  // 三级面：内嵌区块
    "--mptk-surface-base": "@gray-1",                               // 页面底色：与 window.bgColor 同源，避免首帧白闪
    "--mptk-border-faint": "rgba(255, 255, 255, .04)",              // 极浅描边：几乎不可见的分界
    "--mptk-border": "rgba(255, 255, 255, .10)",                    // 常规描边：卡片外框 / 输入边框
    "--mptk-border-strong": "rgba(255, 255, 255, .14)",             // 强调描边：悬停 / 聚焦
    "--mptk-cell-divider": "rgba(255, 255, 255, .06)",              // Cell 分隔线：默认比外框浅，宿主可覆盖成同色
    "--mptk-card-bg": "var(--mptk-surface-1)",                      // 卡片底色：引用 surface-1
    "--mptk-card-border": "var(--mptk-border)",                     // 卡片描边：引用 border
    "--mptk-gray-1": "@gray-1",                                     // 语义灰 1 级：组件可直接引用的中性色
    "--mptk-gray-2": "@gray-2",                                     // 语义灰 2 级：组件可直接引用的中性色
    "--mptk-gray-3": "@gray-3",                                     // 语义灰 3 级：组件可直接引用的中性色
    "--mptk-gray-4": "@gray-4",                                     // 语义灰 4 级：组件可直接引用的中性色
    "--mptk-gray-5": "@gray-5",                                     // 语义灰 5 级：组件可直接引用的中性色
    "--mptk-gray-6": "@gray-6",                                     // 语义灰 6 级：组件可直接引用的中性色
    "--mptk-gray-7": "@gray-7",                                     // 语义灰 7 级：组件可直接引用的中性色
    "--mptk-gray-8": "@gray-8",                                     // 语义灰 8 级：组件可直接引用的中性色
    "--mptk-blue": "@blue",                                         // 蓝·主色：色板派生出的语义色档
    "--mptk-blue-hover": "#8aa4fe",                                 // 蓝·悬停态：色板派生出的语义色档
    "--mptk-blue-active": "#a8bbff",                                // 蓝·按下态：色板派生出的语义色档
    "--mptk-blue-soft": "rgba(107, 138, 253, .12)",                 // 蓝·浅色底：色板派生出的语义色档
    "--mptk-green": "@green",                                       // 绿·主色：色板派生出的语义色档
    "--mptk-green-hover": "#5fe0b1",                                // 绿·悬停态：色板派生出的语义色档
    "--mptk-green-active": "#8aeec8",                               // 绿·按下态：色板派生出的语义色档
    "--mptk-green-soft": "rgba(52, 211, 153, .12)",                 // 绿·浅色底：色板派生出的语义色档
    "--mptk-orange": "@orange",                                     // 橙·主色：色板派生出的语义色档
    "--mptk-orange-hover": "#fccc53",                               // 橙·悬停态：色板派生出的语义色档
    "--mptk-orange-active": "#fdd982",                              // 橙·按下态：色板派生出的语义色档
    "--mptk-orange-soft": "rgba(251, 191, 36, .12)",                // 橙·浅色底：色板派生出的语义色档
    "--mptk-red": "@red",                                           // 红·主色：色板派生出的语义色档
    "--mptk-red-hover": "#ff7d7d",                                  // 红·悬停态：色板派生出的语义色档
    "--mptk-red-active": "#ff9d9d",                                 // 红·按下态：色板派生出的语义色档
    "--mptk-red-soft": "rgba(255, 92, 92, .12)",                    // 红·浅色底：色板派生出的语义色档
    "--mptk-purple": "@purple",                                     // 紫·主色：色板派生出的语义色档
    "--mptk-purple-hover": "#d0a3fd",                               // 紫·悬停态：色板派生出的语义色档
    "--mptk-purple-active": "#e0c1fe",                              // 紫·按下态：色板派生出的语义色档
    "--mptk-purple-soft": "rgba(192, 132, 252, .12)",               // 紫·浅色底：色板派生出的语义色档
    "--mptk-cyan": "@cyan",                                         // 青·主色：色板派生出的语义色档
    "--mptk-cyan-hover": "#55dff2",                                 // 青·悬停态：色板派生出的语义色档
    "--mptk-cyan-active": "#88eaf7",                                // 青·按下态：色板派生出的语义色档
    "--mptk-cyan-soft": "rgba(34, 211, 238, .12)",                  // 青·浅色底：色板派生出的语义色档
    "--mptk-pink": "@pink",                                         // 粉·主色：色板派生出的语义色档
    "--mptk-pink-hover": "#f791c6",                                 // 粉·悬停态：色板派生出的语义色档
    "--mptk-pink-active": "#faafd6",                                // 粉·按下态：色板派生出的语义色档
    "--mptk-pink-soft": "rgba(244, 114, 182, .12)",                 // 粉·浅色底：色板派生出的语义色档
    "--mptk-teal": "@teal",                                         // 蓝绿·主色：色板派生出的语义色档
    "--mptk-teal-hover": "#5adfcd",                                 // 蓝绿·悬停态：色板派生出的语义色档
    "--mptk-teal-active": "#88eadb",                                // 蓝绿·按下态：色板派生出的语义色档
    "--mptk-teal-soft": "rgba(45, 212, 191, .12)",                  // 蓝绿·浅色底：色板派生出的语义色档
    "--mptk-business": "@blue",                                     // 业务主色：跟随基础蓝
    "--mptk-success": "@green",                                     // 成功语义色
    "--mptk-warning": "@orange",                                    // 警告语义色
    "--mptk-danger": "@red",                                        // 危险语义色
    "--mptk-control-blue": "@blue",                                 // 控件色·蓝：color 属性可选值
    "--mptk-control-green": "@green",                               // 控件色·绿：color 属性可选值
    "--mptk-control-orange": "@orange",                             // 控件色·橙：color 属性可选值
    "--mptk-control-red": "@red",                                   // 控件色·红：color 属性可选值
    "--mptk-control-active": "var(--mptk-control-blue)",            // 控件激活色：默认跟随 control-blue
    "--mptk-control-track": "@gray-4",                              // Switch / Segmented 轨道底色
    "--mptk-control-thumb": "#fff",                                 // Switch 滑块底色
    "--mptk-control-thumb-dim": "@gray-8",                          // Switch 滑块禁用态底色
    "--mptk-control-on": "#fff",                                    // 开关开启态前景色
    "--mptk-control-thumb-fg": "#1f2328",                           // 滑块内图标 / 勾选色
    "--mptk-spinner-active": "@blue",                               // Spinner 活动段颜色
  },

  component: {                                                      // 组件视觉取值：组件样式只读 var()，不在此处以外写死
    "--mptk-c-mask-opacity": ".4",                                  // 遮罩不透明度
    "--mptk-c-mask-z": "910",                                       // 层级：全局遮罩
    "--mptk-c-overlay-z": "900",                                    // 层级：浮层容器
    "--mptk-c-popup-z": "920",                                      // 层级：弹出层
    "--mptk-c-overlay-host-z": "1000",                              // 层级：命令式 API 挂载点，保证总在最上
    "--mptk-c-navbar-z": "10",                                      // 层级：导航栏
    "--mptk-c-navbar-weight": "500",                                // 导航栏标题字重
    "--mptk-c-locked-opacity": ".5",                                // 锁定态（disabled / busy）不透明度
    "--mptk-c-border-w": "1px",                                     // 通用描边宽度
    "--mptk-c-thumb-shadow": "0 2px 4px rgba(0, 0, 0, .2)",         // Switch / Segmented 滑块投影
    "--mptk-c-switch-inset": "2px",                                 // Switch 滑块距轨道的内缩
    "--mptk-c-switch-sm-offset": "2px",                             // Switch sm 档滑块位移补偿
    "--mptk-c-switch-icon-ratio": ".44",                            // Switch 图标字号 / 轨道高比例
    "--mptk-c-switch-w-sm": "33px",                                 // Switch 小档宽度：三档几何尺寸
    "--mptk-c-switch-h-sm": "20px",                                 // Switch 小档高度：三档几何尺寸
    "--mptk-c-switch-w-md": "42px",                                 // Switch 中档宽度：三档几何尺寸
    "--mptk-c-switch-h-md": "26px",                                 // Switch 中档高度：三档几何尺寸
    "--mptk-c-switch-w-lg": "52px",                                 // Switch 大档宽度：三档几何尺寸
    "--mptk-c-switch-h-lg": "32px",                                 // Switch 大档高度：三档几何尺寸
    "--mptk-c-seg-inset": "3px",                                    // Segmented 选中块内缩
    "--mptk-c-seg-line-h": "2px",                                   // Segmented 下划线高度
    "--mptk-c-spinner-rotate-dur": ".8s",                           // Spinner 整圈旋转周期
    "--mptk-c-spinner-chase-dur": "2.5s",                           // Spinner 追逐动画周期
    "--mptk-c-spinner-dot-dur": "2s",                               // Spinner 圆点动画周期
    "--mptk-c-spinner-delay-1": "-1.1s",                            // Spinner 第 1 个圆点的动画负延迟
    "--mptk-c-spinner-delay-2": "-1s",                              // Spinner 第 2 个圆点的动画负延迟
    "--mptk-c-spinner-delay-3": "-.9s",                             // Spinner 第 3 个圆点的动画负延迟
    "--mptk-c-spinner-delay-4": "-.8s",                             // Spinner 第 4 个圆点的动画负延迟
    "--mptk-c-spinner-delay-5": "-.7s",                             // Spinner 第 5 个圆点的动画负延迟
    "--mptk-c-spinner-delay-6": "-.6s",                             // Spinner 第 6 个圆点的动画负延迟
    "--mptk-c-loader-blink-dur": "1.2s",                            // Loader 闪烁周期
    "--mptk-c-loader-dim": ".25",                                   // Loader 暗态不透明度
    "--mptk-c-loader-scale": "scale(.8)",                           // Loader 缩放幅度
    "--mptk-c-spinner-scale": "scale(.4)",                          // Spinner 缩放幅度
    "--mptk-c-control-breathe-dim": ".2",                           // 等待态呼吸最暗值
    "--mptk-c-spinner-mask": "url(\"data:image/svg+xml,"            // Spinner 环形遮罩：SVG data URI，环宽占直径 17%
      + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='41.5' fill='none' stroke='%23fff' stroke-width='17'/%3E%3C/svg%3E\")",
    "--mptk-c-cell-arrow-size": "6px",                              // Cell 箭头方块边长
    "--mptk-c-switch-inset-2x": "4px",                              // Switch 滑块双侧内缩合计：calc 尺寸用
    "--mptk-c-demo-swatch-size": "48px",                            // 演示站色板大色块边长
    "--mptk-c-demo-swatch-sm-size": "20px",                         // 演示站色板小色块边长
    "--mptk-c-demo-swatch-bar-h": "22px",                           // 演示站色板条高度
    "--mptk-c-demo-swatch-bar-w": "62px",                           // 演示站色板条宽度
    "--mptk-c-demo-swatch-ink-black": "#000000",                    // 演示站色板黑样字色
    "--mptk-c-demo-swatch-ink-white": "#ffffff",                    // 演示站色板白样字色
    "--mptk-c-demo-palette-cell-w": "60px",                         // 演示站调色板单元宽度
    "--mptk-c-demo-ruler-bar-w": "96px",                            // 演示站标尺条宽度
  },

  structure: {                                                      // 纯几何 / 算法结构常量：改了会影响布局，允许改但需回归渲染
    "--mptk-s-zero": "0",                                           // 零值：清零 / 无偏移
    "--mptk-s-full": "100%",                                        // 满幅：宽高铺满容器
    "--mptk-s-half": "50%",                                         // 半幅：50% 尺寸或位移
    "--mptk-s-quarter": "25%",                                      // 四分之一：25% 尺寸或位移
    "--mptk-s-center": "50%",                                       // 居中定位：top / left 各 50%
    "--mptk-s-opacity-full": "1",                                   // 完全不透明
    "--mptk-s-scale-full": "scale(1)",                              // 缩放原尺寸：transform 终态
    "--mptk-s-rotate-full": "rotate(360deg)",                       // 旋转一整圈：transform 终态
    "--mptk-s-radius-full": "100%",                                 // 正圆圆角：圆形头像 / 圆点
    "--mptk-s-line-flat": "1",                                      // 无单位行高 1：单行文本不额外占位
    "--mptk-s-z-base": "0",                                         // 层级 0：普通内容
    "--mptk-s-z-raised": "1",                                       // 层级 1：抬升元素
    "--mptk-s-z-top": "2",                                          // 层级 2：栈顶元素
    "--mptk-s-flex-grow": "1",                                      // 弹性放大系数：占满剩余空间
    "--mptk-s-flex-none": "0",                                      // 弹性不放大：保持内容宽度
    "--mptk-s-transparent-white": "rgba(255, 255, 255, 0)",         // 透明白：渐变端点 / 遮罩起点
    "--mptk-s-gradient-from": "180deg",                             // 线性渐变起始角度
    "--mptk-s-gradient-center": "50% 50%",                          // 径向 / 锥形渐变中心点
    "--mptk-s-gradient-stop-0": "0deg",                             // 锥形渐变第 0 个停靠角
    "--mptk-s-gradient-stop-1": "60deg",                            // 锥形渐变第 1 个停靠角
    "--mptk-s-gradient-stop-2": "330deg",                           // 锥形渐变第 2 个停靠角
    "--mptk-s-gradient-stop-3": "360deg",                           // 锥形渐变第 3 个停靠角
    "--mptk-s-mask-repeat": "no-repeat",                            // 遮罩不平铺
    "--mptk-s-mask-size": "100% 100%",                              // 遮罩尺寸铺满
    "--mptk-s-ease-in-out": "ease-in-out",                          // 缓动关键字：两端减速
    "--mptk-s-linear": "linear",                                    // 缓动关键字：匀速
    "--mptk-s-infinite": "infinite",                                // 动画循环次数：无限循环
    "--mptk-s-both": "both",                                        // 动画填充模式：首尾帧都保留
    "--mptk-s-flex-shrink": "1",                                    // 弹性收缩系数：允许被压缩
    "--mptk-s-flex-fill": "1 1 0",                                  // flex 简写值：占满剩余空间
    "--mptk-s-flex-auto": "0 0 auto",                               // flex 简写值：按内容宽度
    "--mptk-s-flex-grow-auto": "1 1 auto",                          // flex 简写值：按内容宽度且放大
    "--mptk-s-flex-none-value": "none",                             // flex 简写值：不参与弹性
    "--mptk-s-scale-zero": "scale(0)",                              // 缩放隐藏：transform 起始态
    "--mptk-s-transform-center": "center",                          // 变换原点：元素中心
    "--mptk-s-content-blank": "' '",                                // 伪元素占位内容：一个空格
    "--mptk-s-margin-auto": "auto",                                 // 外边距自动：水平居中
    "--mptk-s-current-color": "currentColor",                       // 继承当前文字颜色
    "--mptk-s-white-space-nowrap": "nowrap",                        // 不换行：单行文本
    "--mptk-s-transparent": "transparent",                          // 全透明：无底色
    "--mptk-s-third": "33.333%",                                    // 三分之一：三列均分
    "--mptk-s-rotate-45": "rotate(45deg)",                          // 顺时针 45°：Cell 箭头
    "--mptk-s-rotate-135": "rotate(135deg)",                        // 顺时针 135°：箭头变体
    "--mptk-s-rotate-neg-45": "rotate(-45deg)",                     // 逆时针 45°：箭头变体
    "--mptk-s-rotate-neg-135": "rotate(-135deg)",                   // 逆时针 135°：箭头变体
    "--mptk-s-kf-0": "0%",                                          // 关键帧起点百分比
    "--mptk-s-kf-40": "40%",                                        // 关键帧 40% 停靠点
    "--mptk-s-kf-50": "50%",                                        // 关键帧中点百分比
    "--mptk-s-kf-80": "80%",                                        // 关键帧 80% 停靠点
    "--mptk-s-kf-full": "100%",                                     // 关键帧终点百分比
  },

  runtime: {                                                        // 运行时行为默认值：Toast / 通知队列 / 默认档位 / core
    "toastDuration": 2000,                                          // Toast 自动消失毫秒数；0 表示常驻不自动关
    "notifyLimit": 3,                                               // 通知队列同时最多显示条数，超出顶掉最旧一条
    "controlSizeDefault": "md",                                     // 未传 size 时 Button / Switch / Segmented 的默认档
    "core": {                                                       // core 请求与存储默认值：由 configure() 读取
      "baseURL": "",                                                // core 请求基址：留空则由调用方传完整 URL
      "timeout": 10000,                                             // core 请求超时毫秒数
      "storagePrefix": "mptk:",                                     // core 本地存储键前缀：避免多项目串键
      "debug": false,                                               // core 调试日志开关
      "headers": {                                                  // core 默认请求头：整表覆盖，不是逐键合并

      },
    },
  },

  window: {                                                         // 微信官方窗口主题：theme.json 由此生成
    "light": {                                                      // 明色窗口四字段（微信官方枚举）
      "bgColor": "@light:gray-2",                                   // 窗口背景色：与 --mptk-surface-base 同源，避免首帧白闪
      "bgTxtStyle": "light",                                        // 窗口背景文字样式：微信官方枚举 light / dark
      "navBgColor": "@light:white",                                 // 导航栏背景色
      "navTxtStyle": "black",                                       // 导航栏文字样式：微信官方枚举 black / white
    },
    "dark": {                                                       // 暗色窗口四字段（微信官方枚举）
      "bgColor": "@dark:gray-1",                                    // 窗口背景色：与 --mptk-surface-base 同源，避免首帧白闪
      "bgTxtStyle": "dark",                                         // 窗口背景文字样式：微信官方枚举 light / dark
      "navBgColor": "@dark:gray-1",                                 // 导航栏背景色
      "navTxtStyle": "white",                                       // 导航栏文字样式：微信官方枚举 black / white
    },
  },
}


