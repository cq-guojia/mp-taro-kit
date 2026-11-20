# 常驻浮动按钮

## 接口 / 导出

`mp-taro-kit/ui/layout`：`FloatingAction`、`FloatingActionGroup`、`FloatingActionProps`、`FloatingActionGroupProps`、`FloatingActionPosition`
`mp-taro-kit/ui/layout/floating-action`：同上，组件级细路径
`mp-taro-kit/ui/layout/style`、`mp-taro-kit/ui/layout/floating-action/style`：样式出口，宿主显式引一次

一个常驻入口由两层组成：`FloatingActionGroup` 是页面根上一个 `position: fixed` 的列容器，负责位置档、安全区、多实例竖排与层级；`FloatingAction` 是列里的按钮本体，内容轴与四轴外观全部复用核心 `Button`，只额外加受控显隐与进出场。

## 设计依据

用户要在页面右侧常驻一批入口（自动回底、设置按钮、浮窗触发），由本库提供壳、消费方自己配置内容。拆成两层是硬约束，不是装饰：

- **单个按钮自己做 fixed 会重叠**：N 个实例各自钉在右下角必然叠成一摞。定位、竖排、安全区、层级只有收在一个列容器里才能统一；按钮本体若也写 `position: fixed`，相对的是视口而非列，竖排直接失效。
- **按钮皮肤只有一份**：内容轴（图标 / 文字 / 自绘 glyph）、四轴外观（语义色 / 底色形态 / 尺寸 / 圆角）、纯图标正方形口径全部走核心 `Button`，不在本组件复制第二套。给图标不给文字即正方形；默认 `radius="md"`（中圆角），要正圆传 `radius="pill"`。
- **滚动联动不进壳**：Skyline 下没有页面全局滚动，滚动由消费方的 `scroll-view` 承担。「滚到阈值才飘出来」是自动回底那单的职责——它按阈值喂 `visible`，本组件只消费显隐、不监听滚动、不接管容器。
- **层级不另取 z**：常驻按钮属于页面常驻 UI，取浮层链最低一档 navbar(10)，低于遮罩(900)——弹窗打开时按钮该被压暗盖住。锚在按钮旁的浮窗用 popover(920)，天然盖在按钮之上。写死数字即违约。

## 参数

### FloatingActionGroup

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `position` | `'bottom-right' \| 'right-middle' \| 'bottom-left' \| 'left-middle'` | `'bottom-right'` | 左右 × 贴底 / 居中四档；安全区只对两个贴底档生效 |
| `children` | ReactNode | — | N 个 `FloatingAction`，按挂载顺序自上而下竖排 |
| `className` | string | — | 追加列容器类名 |
| `style` | CSSProperties | — | 列容器内联样式 |

### FloatingAction

继承全部 `ButtonProps`（`type` / `variant` / `size` / `radius` / `color` / `icon` / `glyph` / `iconAfter` / `children` / `disabled` / `loading` / `onClick` 等），另外：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `visible` | boolean | `true` | 受控显隐；关闭时播完退场再卸载 |
| `duration` | number | `MOTION_DURATION`（300） | 进出场时长（ms），`0` 立即卸载；过渡曲线走 `--mptk-c-motion-duration` |
| `type` | ButtonType | `'default'` | 默认中性灰（不抢眼）；覆盖 Button 的 `primary` 默认，避免一个次要入口用亮品牌色 |
| `translucent` | boolean | `true` | 半透明底（覆盖实心档与描边档的底色变量，描边变量不动）；关掉走 Button 原生底色。传 `color` 时让位给自定义色 |
| `variant` | ButtonVariant | `'outline'` | 默认带描边；`'solid'` 为不带。描边色由 Button 的 `color` 或档位色派生 |
| `size` | ButtonSize | `'sm'` | 与核心 Button 默认同档（32px），不另立尺寸 |
| `radius` | ButtonRadius | `'md'` | 默认中圆角；`'pill'` 纯圆 / `'xl'` 大 / `'md'` 中 / `'sm'` 小 |

## 样式契约

默认值全部在 `kit.config.mjs`，组件样式只读 `var()`。

| 变量 | 来源 | 作用 |
|---|---|---|
| `--mptk-c-layer-navbar` | 浮层链 | 列容器层级，低于遮罩档 |
| `--mptk-c-fab-bg` | 明 / 暗各一份 | 按钮底，跟随 `--mptk-default-soft`（中性灰浅底，明暗自适应，不抢眼）；只换实心档与描边档的底色变量，描边色与字色不动。传 `color` 时由 Button 行内样式盖过 |
| `--mptk-c-motion-duration` | 浮层链 | 进出场过渡时长，带单位 |
| `--mptk-ease` | 动效 | 过渡曲线 |
| `env(safe-area-inset-bottom)` | 平台 | 贴底档的安全区让位 |
| `--mptk-space-4` / `--mptk-space-3` | 间距刻度 | 离边距离 / 多实例竖排间距 |
| `--mptk-control-h-*` | 高度刻度 | 按钮高度（经 Button） |

## 行为契约

- **进出场**：`visible` 由真变假后节点保持挂载、播完淡出 + 位移再卸载（`usePresence`）；退场期 `pointer-events: none`，透明按钮不吃点击。
- **多实例竖排**：列容器 flex column，相邻实例用 `margin-top` 给间距，不用 `gap`（老 WebView 内核不支持，双端会不一致）。同档多实例层级按 DOM 顺序后进在上。
- **必须挂在滚动区外**：演示站把浮层插在 `scroll-view` 之后；放进滚动内容里会随滚动走或被裁。消费方同理——把 `FloatingActionGroup` 放页面根节点，别塞进内容容器。
- **安全区**：贴底两档（右下 / 左下）在 `bottom` 叠加 `env(safe-area-inset-bottom)`；居中两档不贴底，不加。顶部状态栏 / 胶囊让位不由本组件承担（它不在顶部）。
- **外观默认**：中性灰（`default`，次要入口不抢眼）、描边带（`outline`）、圆角中号（`md`）、尺寸 `sm`、半透明底（`translucent`）。五样都是 Button 原生轴，组件只给默认值、不另造。圆角四档：纯圆 `pill` / 大 `xl` / 中 `md` / 小 `sm`。
- **颜色怎么传**：这是个纯图标按钮，底色与描边色都走 Button 的 `color` 一个口子——它派生底 / 描边 / 字三段（实心底用该色、描边档用它做边色）。可传库配置色（`var(--mptk-business)` 等 token）或直接传色值（`#rgb` / `#rrggbb` / `rgb()`）；传了就盖过半透明与语义色档。不传则用默认（中性灰描边 + 灰底）。
- **底色语义色**：`type` 的「品牌 / 成功 / 警告 / 危险」是 Button 的语义色档，本组件不把它当可选的「底色类型」暴露——默认给 `default`（灰）而非 Button 的 `primary`（亮蓝），要换色传 `color`。

## 条件触发怎么写（消费方负责）

壳只消费结果、不算条件。三类常见需求都用现有契约实现，库无需新增 API：

- **滚动阈值才出现**（回顶 / 某区间才出 icon）：消费方从自己的 `scroll-view` 拿滚动位置，用原生比较算布尔值喂 `visible`——`visible={top > 300}` 或 `visible={top > 100 && top < 200}`。区间判断就一行比较，不另立工具函数；条件在消费方算，壳不监听滚动、不接管容器。
- **点击后变色 / 换图标表示状态**（带小动画）：消费方存一个 state，改透传的 ButtonProps——`icon={open ? 'guanbi' : 'shezhi'}`、`type={open ? 'primary' : 'default'}`。小动画挂 `className`，只动 `opacity` / `transform`（Skyline 安全属性），时长走 `--mptk-dur` + `--mptk-ease`；不要在字形节点写 `color` / `animation`，不要用含 `var()` 的 `@keyframes`。
- **特定条件才出现某按钮**：条件算成布尔传 `visible`，或在 `FloatingActionGroup` 里按条件渲染 children。显隐走 `usePresence`，别直接卸载——直接卸载会让 fixed 列后续按钮跳一个间距档。

这套分工与成熟库一致（Ant Design `FloatButton` 壳 + `FloatButton.BackTop` 用 `visibilityHeight` 算阈值、TDesign `Fab` 用 `button-props` 透传）：壳保持受控，条件在业务层。

## 不做什么

- 不监听滚动、不做阈值判断、不自己造滚动容器（归自动回底组件）。
- 不做浮窗定位、边缘避让、点外部关闭（归锚定浮窗组件）。
- 不暴露 `zIndex`、不另立按钮皮肤、不做非受控显隐（全库无此惯例）。
- 不做贴底面板形态（归 Popup）。

## 更新日志

- 2026-11-19：新建。两层拆分——Group 管定位 / 竖排 / 安全区 / 层级，Button 本体复用核心 Button 内容轴与四轴外观；受控 `visible` + `usePresence` 进出场；层级取 navbar(10) 低于遮罩。
- 2026-11-19：位置扩成左右 × 贴底 / 居中四档；演示站按 popup 配置式重做（CellGroup + Segmented），示例用 icon 的设置 / 回顶 / 修改三个真实图标，修掉点按钮即全体隐藏的 demo 逻辑错误。
- 2026-11-19：默认外观回归 Button 原生——尺寸用 `sm`，描边 / 底色类型 / 尺寸 / 圆角全走 Button 的 `variant` / `type` / `size` / `radius` 轴；半透明底改为独立开关 `translucent`（默认开）。演示页加描边 / 大小 / 圆角 / 背景开关，去掉分组标题与底部说明。
- 2026-11-19：默认值定为描边带（`outline`）、圆角中号（`md`）；圆角演示加小档（`sm`）；去掉「底色」语义色选择（用 Button 默认，换色传 `color`）；半透明覆盖描边档与实心档的底色变量、描边变量不动，让「带描边 + 半透明底」能同时成立。
- 2026-11-19：默认色从亮品牌蓝改为中性灰——`type` 默认 `default`（盖过 Button 的 `primary`），`--mptk-c-fab-bg` 改为引用 `--mptk-default-soft`（明暗自适应浅灰）。次要入口不抢眼。
- 2026-11-20：补「条件触发怎么写」——三类需求（阈值显隐 / 状态切换 / 条件出现）全部用现有 `visible` + ButtonProps + className 实现，库零新增；修正旧口径「默认 pill 正圆」为「默认 md 中圆角」。
