# Button 按钮

## 接口 / 导出

`mp-taro-kit/ui/actions`：`Button`、`ButtonProps`、`ButtonType`、`ButtonVariant`、`ButtonSize`、`ButtonRadius`、`ButtonLoadingMode`
`mp-taro-kit/ui/actions`（纯函数）：`resolveButtonColor`、`ButtonColorStyle`
`mp-taro-kit/ui/actions/style`：组件级样式出口，宿主显式引一次（转圈几何已内联，不用另引 feedback）

触发一次操作。只负责外观与「点下去会发生什么」，文案与图标由调用方给。

## 设计依据

对照 Vant Weapp Button（`packages/button/README.md`）、antd-mobile Button（`src/components/button/button.tsx`）、NutUI React Button（`src/packages/button/button.tsx`）与兄弟项目 `dsh-plugin-core` 的 Button（`src/ui/actions/Button.ts`）：

| 上游 | 本库取舍 |
|---|---|
| `type` 语义色 | 取，映射到既有语义色 `business / success / warning / danger` + 中性 `default`；**默认 `primary`**，与旧版 Button 的品牌色外观一致 |
| `plain` 布尔 / `fill` 三态 | 取，升级成 `variant: solid / soft / outline / ghost` 四态：`solid` 只有背景、`soft` 中间浅且带同色描边、`outline` 白底描边、`ghost` 无底无边 |
| `size` | 取，但不另起数值：直接吃全库高度刻度 `--mptk-control-h-*`，与 Tag / Switch / Segmented 同名档必然等高 |
| `round` / `square` / `shape` | 取成 `radius` 档位轴（`xs..pill`），`square` 不设开关 —— 圆角轴已经能表达 |
| `color` 任意色 | **取**（本库与 Tag 的分歧点，见下） |
| `icon` 字符串 | 取，格式与本库 Tag 一致：`库名:图标名` |
| 独立的 `IconButton` 组件 | 不取：纯图标就是同一个 Button 没传 `children`，自动成正方形 |
| `loading-text` / `loading-size` / `loading-type` | 只取文案（`loadingText`）；尺寸与形态不开放 —— 圈径随尺寸档走，形态固定用全库自绘转圈 |
| `hairline` / `open-type` / `form-type` / 客服开放能力 | 不取：小程序原生能力请直接用原生 `button`，基础库不代理 |

**与 Tag 的一处反转**：[Tag](tag.md) 当初决定「任意色值不取，颜色只在配置里换」。Button 不同 —— 它是 to C 项目的主操作控件，每个品牌的主色都不一样，只给四档语义色等于逼宿主自己写样式。所以 Button 支持 `color`，代价是 `soft` 的浅底只能预计算（小程序没有 `color-mix`）。

本库比上游多做的一步：所有档位共用一条高度刻度与一套圆角档，`Button size="xs"` 与 `Tag size="xs"` 必然同高。

## 尺寸

| 档 | 高度 | 字号 | 左右内边距 |
|---|---|---|---|
| `xs` | 24（`--mptk-control-h-xs`） | `--mptk-font-xs`（12） | `--mptk-space-3`（12） |
| `sm`（默认） | 32（`--mptk-control-h-sm`） | `--mptk-font-sm`（14） | `--mptk-space-3`（12） |
| `md` | 40（`--mptk-control-h-md`） | `--mptk-font-sm`（14） | `--mptk-space-4`（16） |
| `lg` | 48（`--mptk-control-h-lg`） | `--mptk-font-lg`（17） | `--mptk-space-4`（16） |
| `xl` | 56（`--mptk-control-h-xl`） | `--mptk-font-lg`（17） | `--mptk-space-4`（16） |

总高逐像素等于刻度 token，靠 `height` 定，**上下没有内边距参与撑高**。`xl` 只加高不加字：字号已经最上面那档，再放大会抢主标题。

默认档是 `sm`（32 / 14，WeUI mini 口径），不传 `size` 就取它。`md`（40）的字号同样不吃 `--mptk-font-md`（15）而取 14：40 高的按钮腾讯官方（WeUI `weui-btn_medium`）就是 14px / 40px；15 的字/高比（.375）是同行里最胖的一档，视觉会「像老年机」。其余档与行业一致：`lg` 48/17 对上 WeUI 默认，`xl` 只加高。

## 底色形态

| variant | 底 | 描边 | 字 |
|---|---|---|---|
| `solid`（默认） | 语义色本身 | 同色（实心块上加同色边，有边 / 无边同高） | `--mptk-fg-on-accent`（强调底反白，明暗都是白） |
| `soft` | 语义色自带的浅色档（`--mptk-*-soft`，明 8% / 暗 12%） | 语义色本身 | 语义色本身 |
| `outline` | `--mptk-surface-1` | 语义色本身 | 语义色本身 |
| `ghost` | 透明 | 透明 | 语义色本身 |

`default` 走中性色：`solid` 底 `--mptk-surface-3`、字 `--mptk-fg`；`soft` 底 `--mptk-default-soft`、边 `--mptk-gray-5`；`outline` / `ghost` 一律 `--mptk-fg-2` 字。

## 品牌色 `color`

传了 `color` 就覆盖 `type` 的语义色，四种形态各自派生：

| variant | 派生方式 |
|---|---|
| `solid` | 底 = `color`；字按相对亮度自动选 —— 亮度 > 0.4 压 `--mptk-fg`（深字），否则压白色 |
| `soft` | 底 = `rgba(r, g, b, 0.16)`；边与字 = `color` |
| `outline` | 底 = `--mptk-surface-1`；边与字 = `color` |
| `ghost` | 只把字设成 `color` |

能完整派生的是 `#rgb` / `#rrggbb` / `rgb()` / `rgba()`。其它写法（`var(--brand)`、色名、渐变）只覆盖边与字，`soft` 的浅底退回 `--mptk-surface-2` 灰面 —— 小程序没有 `color-mix`，拿不到分量就混不出浅底，宁可给一块确定的中性面，也不猜。

浅品牌色（黄、浅绿、橙）必须压深字，否则白字看不见，所以判据取 WCAG 相对亮度而不是「有没有传颜色」。

## 图标与纯图标

| 形态 | 写法 | 规则 |
|---|---|---|
| 前置图标 | `icon="库名:图标名"` | 在文字左侧，间距 `--mptk-space-1` |
| 后置图标 | `iconAfter="库名:图标名"` | 在文字右侧，间距同上；加载期间不渲染 |
| 纯图标 | 只给 `icon`、不给 `children` | **必然是正方形**：宽 = 同档高度、左右内边距归零 |

纯图标不接宽高参数：方向就是「宽度 = 档位高度」。要更大就换 `size` 档。

字形节点的 `line-height` 压到 `--mptk-s-line-flat`（1）：按钮根规则带着 22px 行高，字体图标在那么高的行盒里会贴上半部分，纯图标钮看起来就是「图标靠上」。压平后盒子高 = 字号，靠 flex 居中。

图标是字体图标，字形走宿主引入的图标包样式；没引样式时按钮排版仍然正确，只是字形不显示。

## 加载

两条触发路径取或：外部传 `loading`，或 `onClick` 返回 Promise（自动 loading + 防连点 + 期间不触发点击）。

圈放在哪由 `loadingMode` 决定，判据只有一条 —— **按钮的宽度是不是被钉死的**：

| 场景 | 落法 |
|---|---|
| 有 `icon`（含纯图标钮） | 圈顶替图标位，按钮宽度本来就不动 |
| 没 `icon`、`loadingMode="auto"`（默认）且不定宽 | `circle`：文字 `visibility: hidden` 占位，圈绝对居中，按钮尺寸一点都不动 |
| 没 `icon`、`auto` 且 `block` 或传了 `width` / `style.width` | `inline`：圈插在文字前，宽度不变 |
| 没 `icon`、显式 `loadingMode="inline"` | `inline`：允许把按钮撑宽（宽度有富余时用） |
| 传了 `loadingText` | 文字替换成该文案并保留，走 `inline` |

`auto` 只能靠「消费方有没有把宽度钉死」判断：小程序在 CSS 层问不出「我是不是被文字撑开的」，所以不定宽一律按 `circle` 处理，绝不会因为加圈把按钮撑变形。

圈径固定 `1em` —— 字体图标就是一个 em，圈与图标必然同尺寸，换尺寸档或宿主改字号配置时自动跟上，组件里不维护第二份 px 表。颜色取按钮字色（`--mptk-btn-fg`；传了 `color` 时由组件把算出的字色内联给圈）。

圈居中**不能**用 `transform: translate(-50%, -50%)`：Spinner 自己带旋转动画，动画帧的 `transform` 会盖掉静态位移，圈会跑到按钮右下角、看着还在漂。实现是铺满按钮的定位层（`.mptk-btn__spin-layer`）+ `flex` 居中。

⚠️ 圈色**不能**用 `--mptk-spinner-active: currentColor` 中转：变量里存的是关键字而不是真色，Skyline 的 `conic-gradient` 拿它画不出弧，圈会整个消失（实测表现就是「点了没反应」）。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `type` | `ButtonType` | 否 | `'primary'` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` |
| `variant` | `ButtonVariant` | 否 | `'solid'` | `'solid' \| 'soft' \| 'outline' \| 'ghost'` |
| `size` | `ButtonSize` | 否 | `'sm'`（`CONTROL_SIZE_DEFAULT`） | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` |
| `radius` | `ButtonRadius` | 否 | 取 `--mptk-control-radius` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'pill'` |
| `color` | string | 否 | — | 任意品牌色，覆盖 `type` |
| `icon` | string | 否 | — | 前置图标，`库名:图标名` |
| `iconAfter` | string | 否 | — | 后置图标，`库名:图标名` |
| `block` | boolean | 否 | `false` | 撑满父宽 |
| `width` | number \| string | 否 | — | 固定宽，数字按 px；等同定宽按钮 |
| `disabled` | boolean | 否 | `false` | 禁用 |
| `loading` | boolean | 否 | `false` | 外部点亮加载态 |
| `loadingText` | string | 否 | — | 加载期间替换的文案 |
| `loadingMode` | `ButtonLoadingMode` | 否 | `'auto'` | `'auto' \| 'inline' \| 'circle'` |
| `children` | ReactNode | 否 | — | 按钮文字；不传且带图标即纯图标钮 |
| `className` | string | 否 | — | 追加根类名（只补布局） |
| `style` | CSSProperties | 否 | — | 追加样式（只补布局）；`style.width` 参与定宽判断 |
| `onClick` | `() => unknown` | 否 | — | 返回 Promise 自动 loading；禁用 / 加载中不触发 |
| `onFailed` | `() => void` | 否 | — | `onClick` 返回 `false` 或 `Promise<false>` 时回调 |

## 样式契约

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-control-radius` | `var(--mptk-radius-xs)` | 不传 `radius` 时的圆角 |
| `--mptk-c-border-w` | `1px` | 所有形态的描边宽（透明边也占位，保证有边 / 无边同高） |
| `--mptk-c-locked-opacity` | `.5` | `disabled` 的透明度 |
| `--mptk-c-btn-pressed-opacity` | `.86` | 按压态透明度（走 Taro `hoverClass`，小程序没有 `:hover`） |

禁用**只降透明度、不把品牌色涂灰** —— 涂灰会让自定义 `color` 的按钮在禁用时变成另一种颜色，与品牌不一致。

## 更新日志

- 2026-11-15：重做 Button：`type / variant / size / radius / color / icon / iconAfter / block / width / loading / loadingText / loadingMode` 全套；纯图标同一组件成正方形；加载分 `auto / inline / circle` 三档；禁用态改透明度
- 2026-11-15：修两处实机问题 —— 圈色不再经 `currentColor` 中转（Skyline 下圈整个消失），图标节点 `line-height` 压到 1（纯图标钮字形靠上）
- 2026-11-15：圈径改成 `1em`（与图标同尺寸，不再比图标大）；circle 居中改用定位层，不再与旋转动画抢 `transform`
- 2026-11-15：`md` 档字号 15 → 14（对齐 WeUI medium 的 40/14）
- 2026-11-15：新增 `--mptk-c-btn-pressed-opacity` 配置项
- 2026-11-15 16:45:00：控件默认档 md → sm（32 / 14，对齐 WeUI mini）
- 2026-11-15 17:05:00：实心语义块的字色统一走新增的 `--mptk-fg-on-accent`（明暗都是白），不再借用 `--mptk-surface-1`
