# 遮罩与浮层底座

## 接口 / 导出

`mp-taro-kit/ui/layout`：`Overlay`、`OverlayProps`、`OverlayTone`、`OverlayOpacity`、`Popup`、`PopupProps`、`PopupPosition`、`PopupCloseShape`、`PopupClosePosition`、`PopupInsetTop`、`PopupRoundSize`、`PopupContentPadding`、`MOTION_DURATION`
`mp-taro-kit/ui/navigation`：`Drawer`、`Dropdown`（遮罩引用 layout 那一份）
`mp-taro-kit/ui/infra`：`OverlayHost`（命令式 Dialog 也挂同一份遮罩）
`mp-taro-kit/ui/layout/style`、`mp-taro-kit/ui/navigation/style`、`mp-taro-kit/ui/infra/style`：各自组件样式出口，宿主显式引一次

**全库只有一份遮罩实现**（`.mptk-overlay`），浮层只声明「要不要遮罩、点遮罩关不关」。谁的样式里再写 `position: fixed` 的全屏蒙层，就是又造了第二份，测试会拦。

## 命名依据

遮罩只叫 `Overlay`，没有第二个名字：

- `mask` 一词在本库已被 Spinner 的原生 `mask-image` / `mask-size` 占用，那是浏览器属性，改不了名；遮罩再叫 `Mask`，同一个词就有两种含义。
- 四家成熟实现里三家（Vant Weapp、NutUI、TDesign）遮罩都叫 `overlay`；本库文档本就归在 `docs/api/overlay.md`，命令式栈叫 `overlay-stack`，挂载点叫 `OverlayHost`，遮罩归到同一个词上，全库只有一套语汇。
- 原先另有一个纯定位容器也叫 `Overlay`（`.mptk-overlay`，只做全屏定位 + 层级，无任何使用方）。它与遮罩重名，已删除；遮罩独占这个名字。

## 设计依据

对照四家成熟实现（Vant Weapp `overlay` + `popup`、antd-mobile 的遮罩组件 + `Popup`、NutUI `Overlay`、TDesign 小程序 `Overlay` + `Popup`）：四家都是「遮罩独立成组件、弹层引用它」，本库跟同一条路。取舍如下。

| 能力 | 成熟库的叫法 | 本库取舍 |
|---|---|---|
| 遮罩独立组件 | 四家都有 | 取，`Overlay` |
| 底色 | antd 的 `color`（black / white / 自定义） | 取，`tone`（`dark` / `light`）+ `color` 任取色值 |
| 浓度 | antd 的 `opacity`（thin .35 / default .55 / thick .75 / 数字） | 取，三档 + 数字 |
| 点击关闭 | Vant `closeOnClickOverlay`、TDesign `closeOnOverlayClick` | 取，`closable` |
| 点击回调 | Vant `click-overlay` 事件、antd `onMaskClick` | 取，`onClick`，与 `closable` 各管各的 |
| 滚动穿透 | Vant / NutUI `lockScroll`、TDesign `preventScrollThrough` | 取，`lockScroll`，走 `catchMove` |
| 进场 / 退场时长 | Vant `duration`(300)、TDesign `duration` | 取，`duration`，`0` = 不动画 |
| 动画结束回调 | antd `afterShow` / `afterClose` | 不取：小程序的卸载时机由 presence 内部管，回调没有消费方 |
| 挂载点 / portal | Vant `rootPortal`、TDesign `attach`、antd `getContainer` | 不取：浮层是 `position: fixed`，挂页面根即可，多一层抽象没有收益 |
| 自定义 `z-index` | TDesign 暴露 11000 / 11500，Vant 100 | 不取：暴露 z 等于把层级链作废，本库只给一条链 |
| 镂空 / 聚光灯遮罩 | 四家都没有 | 不取，等真需求 |

## 参数

### Overlay

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `visible` | boolean | `true` | 显隐；关闭时播完动画再卸载 |
| `tone` | `'dark' \| 'light'` | `'dark'` | 底色档，取 `--mptk-c-overlay-color` / `--mptk-c-overlay-color-light` |
| `color` | string | — | 任取色值，优先级高于 `tone`；直接写内联 `background-color` |
| `opacity` | `'thin' \| 'default' \| 'thick' \| number` | `'default'` | 浓度；数字档走 CSS 变量 `--mptk-overlay-alpha` |
| `closable` | boolean | `true` | 点遮罩回调 `onClose`；与 `onClick` 互不影响 |
| `onClose` | () => void | — | `closable` 为真时被调用 |
| `onClick` | () => void | — | 任何点击都回调，不管关不关 |
| `lockScroll` | boolean | `true` | 吞掉背后页面的滚动（`catchMove`） |
| `duration` | number | `MOTION_DURATION`（300） | 进出场时长，`0` = 立即卸载 |
| `className` | string | — | 追加根类名 |

### Popup / Drawer / Dropdown

三个组件共用同一组遮罩相关参数，默认值一致：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `overlay` | boolean | `true` | 是否渲染遮罩 |
| `closable` | boolean | `true` | 点遮罩是否关闭 |
| `lockScroll` | boolean | `true` | 是否阻止滚动穿透 |
| `duration` | number | `MOTION_DURATION` | 进出场时长 |

`Popup` 另外把内部遮罩的两轴与面板圆角尺寸暴露出来（Drawer / Dropdown 不暴露），三个参数都透传给同一份遮罩 / 同一条圆角变量，不在演示层另写样式：

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `overlayTone` | `'dark' \| 'light'` | —（走 Overlay 默认 `dark`） | 遮罩底色档，透传给内部 `Overlay` 的 `tone` |
| `overlayOpacity` | `'thin' \| 'default' \| 'thick'` | —（走 Overlay 默认 `default`） | 遮罩浓度档，透传给内部 `Overlay` 的 `opacity`；三档映射见下表 |
| `roundSize` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 面板圆角尺寸档，派生 `.mptk-popup--radius-*` 类名切 `--mptk-c-popup-radius`；`none` 平角、`md` 12px |

遮罩三档在演示站里的映射：浅 = `dark` + `thin`，深 = `dark` + `default`，泛白 = `light` + `default`。`roundSize` 只在圆角已开启的面板上生效——居中档恒圆，贴边档需同时传 `round`；`none` 给平角。

其余参数（`open`、`position` / `side`、`children`、`onClose`、`className`）保持原样。

`Popup` 的 `position` 取五档：`'top' | 'center' | 'bottom' | 'left' | 'right'`（默认 `bottom`）。形态对齐 Vant 4：上 / 下档通栏，左 / 右档是全高抽屉（宽度取 `--mptk-c-drawer-w`，240px，375 屏约 64%；不受面板限高影响，底下不留空），居中档有默认宽 `--mptk-c-popup-center-w`（280px，参考 Vant Dialog 320px / antd-mobile RN Modal 286px，375 屏约 75%）且最大不超屏——不是通栏。Skyline 不支持 Vant 用的 `fit-content`，所以居中档改用 token 默认宽，消费方可覆盖。原独立 `Drawer` 已取消，左右滑入由 Popup 的 `left` / `right` 档承担。面板有最小高 `--mptk-c-popup-min-h`（200px），内容少时不塌成一小溜。

**贴顶 / 贴底档必须有确定高度**：Skyline 下 `scroll-view` 拿到确定高才会滚，只给 `max-height` 会被内容撑满屏、真机上滚不动（WebView 模拟器看不出这个问题）。这两档的高度取 `--mptk-c-popup-sheet-h`（35vh），`--mptk-c-popup-max-h` 只作上限。

圆角按档默认，不必统一开关：**居中档默认四角全圆，贴边档默认平角**。贴边档要圆角时传 `round`，只圆内侧两角。尺寸默认读 `--mptk-c-popup-radius`（`--mptk-radius-md` = 12px），改 token 一处即可换全库圆角尺寸；单次调用要换档传 `roundSize`（见上表），它由类名切同一个变量，宿主不必自己写圆角样式。

关闭按钮同样可选，且**按弹窗形态分档**——不是每个形态都能用全部位置。`closeable` 默认 `false`；开启后复用核心 `Button`（`icon="common.base:guanbi"`，`size="xs"` 即 24px），按压变色走 Button 自带的 `mptk-btn--pressed`，不在浮层里另写一套按钮皮肤。按钮排在内容 `scroll-view` 之后才点得着（见下）。

样式拆成三个正交轴，组合由 `resolveCloseStyle()`（`src/ui/layout/close-style.ts`）算出 Button 的 `variant` / `radius`：

| 轴 | 参数 | 默认 | 取值 |
|---|---|---|---|
| 形状 | `closeShape` | `'circle'` | `'circle'`（正圆 → `radius="pill"`）/ `'rounded'`（小方角 → `radius="sm"` 8px） |
| 描边 | `closeBorder` | `true` | 有 / 无描边 |
| 背景 | `closeBackground` | `true` | 有底 / 半透明底（叉色不变） |

关闭按钮外框走 `--mptk-c-popup-close-size`（26px，比 Button `xs` 档的 24px 略大）；叉是自绘的 `CloseGlyph`（边长固定 12.8px）——外框与叉两轴分开，互不联动。左右离边：内部档与外置靠右档为 12px（`--mptk-space-3`），内部档的上下左右四边等距（都 12px）；**跨半档**再往内收一档到 16px（`--mptk-space-4`），更远离面板圆角。

描边单独定 Button 的 `variant`：有边 → `soft`，无边 → `solid`。背景轴与描边正交：切到「半透明」只把底色换成 `--mptk-c-popup-close-bg-translucent`（`rgba(0, 0, 0, 0.55)`，约 55%），**不改 `--mptk-btn-fg`**（叉的颜色由 `variant` 决定，不随背景轴变）。

`soft` 档的**描边与叉同色**：核心 Button 的 `default` soft 原本描边取 `--mptk-gray-5`、叉取 `--mptk-fg-2`，两者不同色；关闭按钮用三类名把 `--mptk-btn-border` 改成 `var(--mptk-btn-fg)`，让描边跟随叉色。这与库内 tone 档 soft 的 `fg` / `border` 同色约定一致，只作用于 popup 关闭按钮。

两者的**颜色调到中灰**：`default` 档字色原本取 `--mptk-fg-2`（明色偏深、暗色偏白），关闭按钮再用三类名把 `--mptk-btn-fg` 盖成 `--mptk-fg-3`（明色 `#767d87`、暗色 `#858d98`），两端都往灰收敛。因为 soft 档描边跟随 `--mptk-btn-fg`，一处改叉与边框一起变灰；solid 档的叉也一起变。半透明背景轴仍只换 `--mptk-btn-bg`，不碰这层字色。

**叉用自绘 `CloseGlyph`，不是字体图标**：字体叉的字形墨迹相对行盒偏上，且 iOS / Android 的字体基线算法不同，固定位移无法跨端根治。自绘叉把两笔 SVG path 画在 viewBox 正中（`--mptk-c-close-mask`），几何中心就是容器中心，跨端绝对居中；颜色取 `currentColor`，放进 Button 图标位时由 `--mptk-btn-fg` 注入，深浅底自动跟随。`CloseGlyph` 是 feedback 域的公共资产（`mp-taro-kit/ui/feedback/close`），通过 Button 的 `glyph` 槽位嵌入——以后任何按钮要放自绘图标都能复用，不局限于关闭叉。

演示站顶部「配置」区用 CellGroup + Segmented 统一配置这三轴，以及圆角尺寸 / 遮罩 / 点遮罩 / 让位；位置档是两个 Cell 行——「垂直」（顶部 / 中部 / 底部）与「侧面」（左侧 / 右侧），按钮放 value 位居右、走 xs 档；关闭按钮位置一块按形态分档，点按钮开面板即可看到配置生效。

`closePosition` 只能用本形态支持的值；传了不支持的值回落到该形态默认值，`top` / `left` / `right` 三档直接不渲染（传什么都不生效）：

| 形态 | 面板内 | 跨上边一半 | 面板上方 | 面板下方 | 默认 |
|---|---|---|---|---|---|
| `bottom` | `top-left` | `edge-top-left` | `above-right`、`above-center` | — | `top-left` |
| `center` | `top-right` | `edge-top-right` | `above-right` | `below-center`、`below-right` | `top-right` |
| `top` / `left` / `right` | 不支持 | 不支持 | 不支持 | 不支持 | 无关闭按钮 |

几何口径：`top-left` / `top-right` 离上边与离左右边各一个 `--mptk-space-3`（12px），四边等距；`edge-top-*` 只**垂直**跨自身高度一半，左右留 `--mptk-space-4`（16px，比其它档再往内收 4px），不整体横向出界；`above-*` / `below-*` 与面板上下留一个 `--mptk-space-3`（12px），靠右档右侧同样留 `--mptk-space-3`，居中档水平居中。跨边 / 外置档会让面板临时放开 `overflow`，否则按钮被裁掉。点击关闭按钮走 `onClose`，与点遮罩关闭（`closable`）是两条独立路径，均可分别关掉。

居中档进场不是纯渐显：从目标位置下方 `--mptk-c-popup-center-rise`（48px）往上浮入，同时渐显；退场反向。改距离只改配置一处。

**关闭按钮必须排在内容 `scroll-view` 之后**：Skyline 下 `scroll-view` 是原生视图、绘制在后，关闭按钮放前面会被它盖住，表现为点了没反应。组件已按此顺序渲染，改结构时别调回去。

顶部让位三档：`insetTop` 取 `'none'`（不让）/ `'status-bar'`（只让状态栏）/ `'nav-bar'`（状态栏 + 导航栏，避开胶囊）。**只对 `top` / `left` / `right` 生效**：这三档不传时默认 `'nav-bar'`、传了按传入档；`bottom` / `center` 传什么都强制 `'none'`，不产生顶部空白。让位只加在内容区 `padding-top`，状态栏区域仍是面板底色。

内容内边距 `contentPadding`：`number`（四边统一）或 `{ top?, right?, bottom?, left? }`（按边给，单位 px，未给的边走面板默认 16px）。它**替换面板预留的 16px**，不替换让位——让位独立加在内容区 `padding-top`，两者相加：例如让位算出 420px、`contentPadding.top = 50`，则顶部总留白 470px；下边距就是 `contentPadding.bottom`（默认 16px）。

**真值必须由 runtime 注入，不能只靠 CSS `env()`**：页面 `navigationStyle: 'custom'` 时微信不预留状态栏空间、`fixed` 从 `y=0` 起。官方文档里 Skyline 支持 `env(safe-area-inset-top)` 等四个值，但它最多只给出状态栏高度，**给不出胶囊下沿**；`nav-bar` 档要避开右上胶囊，只能取平台真值。真值来自 `getWindowInfo().statusBarHeight` + `getMenuButtonBoundingClientRect()`：

```ts
import Taro from '@tarojs/taro'
import { configureSafeArea } from 'mp-taro-kit/runtime'

const windowInfo = Taro.getWindowInfo()
const menuButton = Taro.getMenuButtonBoundingClientRect()
configureSafeArea({
  statusBarHeight: windowInfo.statusBarHeight ?? 0,
  menuButton: { top: menuButton.top, height: menuButton.height },
})
```

导航栏让位高度 = `statusBarHeight + 导航栏内容高`，内容高 = 胶囊高 + 上下对称留白（`menuButton.height + max(menuButton.top - statusBarHeight, 0) * 2`），与 `NavBar.tsx` 完全同口径——**不要**写成 `(top - statusBar + height) * 2`，那会把胶囊高也乘进去、真机让位偏多。

**面板贴边定位，让位只加在内容上**：这是微信官方的浮层适配口径——安全区偏移单独算在内容 `padding` 里，不要混进浮层的定位量。遮罩、贴顶面板、抽屉面板一律 `top: 0`；曾试过用 `top: calc(0px - env(safe-area-inset-top))` 把底色探到屏顶，WebView 下会多让一个状态栏高度，Skyline 下整块被页面容器裁掉、顶出可视区（状态栏和胶囊直接压在正文上）。内容 `padding-top` = 目标位置（以屏幕顶为 0）：`status-bar` 档 = 状态栏底，`nav-bar` 档 = 胶囊下沿。

目标位置由 `resolveTopInset()`（`src/ui/layout/safe-inset.ts`）算出，`Popup` 与 `Drawer` 共用同一份；未注入真值时不在 JS 里猜，走 CSS 兜底 `env(safe-area-inset-top)` / `calc(env(safe-area-inset-top) + var(--mptk-c-navbar-h))`。官方文档里 Skyline 支持 `env()` 与四个 `safe-area-inset-*` 变量，但它只表示系统安全区、**不含胶囊几何**，所以 `nav-bar` 档必须靠 API 真值。

## 层级链

一条链从下往上，组件只读不传。样式里出现写死的 `z-index` 数字即为违约，测试会拦。

| token | 默认 | 谁在上面 |
|---|---|---|
| `--mptk-c-navbar-h` | 44px | 导航栏内容区高度（导航栏组件用；浮层让位不读它） |
| `--mptk-c-layer-navbar` | 10 | 导航栏 |
| `--mptk-c-layer-overlay` | 900 | 遮罩 |
| `--mptk-c-layer-panel` | 910 | 面板 / Dialog 面板 |
| `--mptk-c-layer-popover` | 920 | 下拉面板、锚定浮窗 |
| `--mptk-c-layer-host` | 1000 | `OverlayHost`（Toast / Loading / Dialog 挂载点） |

同一档出现多个实例时，按挂载顺序后进在上（DOM 顺序天然满足）；跨档一律以上表为准。

## 样式契约

默认值全部在 `kit.config.mjs` 的 `component` 段，组件样式只读 `var()`，不在别处写死。

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-c-overlay-color` | `#000` | 遮罩底色（深色档）。**不取 `--mptk-fg`**：那是字色，暗色下是浅灰，会把遮罩变成白蒙版 |
| `--mptk-c-overlay-color-light` | `#fff` | 遮罩底色（浅色档） |
| `--mptk-c-overlay-opacity-thin` | `.35` | 浓度：薄 |
| `--mptk-c-overlay-opacity` | `.55` | 浓度：默认（对齐 Vant / antd 的 .55~.6） |
| `--mptk-c-overlay-opacity-thick` | `.75` | 浓度：厚 |
| `--mptk-c-motion-duration` | `300ms` | 浮层进出场时长，必须带 CSS 单位（裸数字会被丢弃、动画失效）；数值与 JS 的 `MOTION_DURATION`（300，毫秒）一致，测试断言 |
| `--mptk-c-popup-max-h` | `80vh` | 面板限高上限 |
| `--mptk-c-popup-sheet-h` | `35vh` | 贴顶 / 贴底档确定高度，Skyline 下 scroll-view 要确定高才能滚 |
| `--mptk-c-popup-center-w` | `280px` | 居中档默认宽，最大不超屏；参考 Vant Dialog 320px / antd-mobile RN Modal 286px |
| `--mptk-c-popup-min-h` | `200px` | 面板最小高度，内容少时不塌成一小溜 |
| `--mptk-c-popup-center-rise` | `48px` | 居中档进场起始偏移：从目标位置下方 48px 上浮渐显 |
| `--mptk-c-popup-radius` | `var(--mptk-radius-md)` | 圆角尺寸，居中档默认带、贴边档 `round` 开启才带；改这一处换全库尺寸 |
| `--mptk-c-popup-close-size` | `26px` | 关闭按钮外框；叉是自绘 CloseGlyph（边长固定 12.8px），外框与叉两轴分开 |
| `--mptk-c-close-mask` | SVG data URI | 自绘关闭叉的遮罩：两笔 path 画在 viewBox 正中、几何居中，跨端不依赖字体基线 |
| `--mptk-c-popup-close-bg-translucent` | `rgba(0, 0, 0, 0.55)` | 关闭按钮背景「半透明」档底色；只换底色，叉色 `--mptk-btn-fg` 不动 |
| `--mptk-c-drawer-w` | `240px` | 抽屉宽度；滑入滑出按自身宽度算 |

## 行为契约

- **进出场**：组件挂载即渲染，关闭时先置收起态、播完 `duration` 再卸载；`duration: 0` 立即卸载（低端机 / 减少动效）。遮罩淡入淡出；贴底 / 贴顶面板上下位移进出，左右档横向位移进出，居中面板从目标位置下方 `--mptk-c-popup-center-rise`（48px）上浮并渐显，退场反向。
- **面板层级**：面板自带 `z-index: var(--mptk-c-layer-panel)`，与遮罩同在 `.mptk-popup` 的层叠上下文内时也必须高于遮罩；缺了它面板会被遮罩盖住，表现为「点了没反应」。
- **安全区**：顶部让位按 `insetTop` 三档，只对 `top` / `left` / `right` 生效（`bottom` / `center` 强制 none），加在**内容区** `.mptk-popup__body` 的 `padding-top`——注入生效时是内联 px（目标位置），未注入回落 `env(safe-area-inset-top)`（`nav-bar` 档再加 `--mptk-c-navbar-h`）。面板四边的内边距由 `contentPadding` 决定（默认 16px），与让位各占一层、两者相加；旧「让位档面板 padding-top 归零」已撤。面板不写负 `top`：负 top 在 Skyline 下会把整块顶出可视区。底部与横条仍必须让：贴底面板与左右抽屉的 `padding-bottom` 各加一段 `env(safe-area-inset-bottom)`，没有横条的设备算 0。遮罩、贴顶面板、抽屉面板的 `top` 统一为 0，贴边定位与安全区让位分开处理。
- **内滚**：Popup 面板 `max-height: var(--mptk-c-popup-max-h)`，内容区是 `scroll-view`（`flex: 1 1 auto; min-height: 0`），长内容在面板内部滚，不顶出屏幕。
- **滚动穿透**：遮罩挂 `catchMove`。**边界**：Skyline 下页面滚动由消费方自己的 `scroll-view` 承担，遮罩拦不住那个容器的原生滚动 —— 需要完全锁死时，消费方要在浮层打开期间把 `scroll-y` 关掉。这条写在这里，不做假的承诺。
- **命令式 Dialog**：自带遮罩，`closable={false}`，点空白不关，关闭只走按钮。

## 不做什么

- 不做 `rootPortal` / `getContainer`：浮层固定定位，挂页面根即可；需要时由消费方把组件放进页面根节点。
- 不做镂空 / 聚光灯遮罩、不做背景模糊：没有验证过的渲染支持，不做没底的承诺。
- 不暴露 `zIndex`：层级只有一条链。
- 不把声明式浮层塞进 `overlay-stack`：栈是命令式 API 的诉求，声明式自己有 `open` 状态；先只做层级递增。

## 更新日志

- 2026-11-16：新建。遮罩收成一份（原先 layout / navigation / 命令式三处各写一份，且底色取 `--mptk-fg`，暗色下变白蒙版）；五处散装 z 收成一条层级链；补进出场动画、底部安全区、面板限高内滚；`closable` 与 `onClick` 分离；浓度与底色全部进配置
- 2026-11-16：遮罩命名收成一个。组件 `Mask` → `Overlay`，token `--mptk-c-mask-*` → `--mptk-c-overlay-*`，类名 `.mptk-mask*` → `.mptk-overlay*`，层级 `--mptk-c-layer-mask` → `--mptk-c-layer-overlay`，浮层的遮罩开关 `mask` → `overlay`；删掉与遮罩重名、且无使用方的纯定位容器 `Overlay`（`.mptk-overlay`）；演示页 `pages/mask` → `pages/overlay`
- 2026-11-16 14:16:36：三个贴顶层的 top 向上让出状态栏安全区，修 Skyline 下 fixed 0 起算露白
- 2026-11-16：加 `--mptk-c-navbar-h`（44px，对齐微信）；遮罩 / 弹出层演示页改用 CellGroup 列表点整行，不再堆一排按钮
- 2026-11-17：顶部让位定为三档（none / status-bar / nav-bar），真值由 runtime `configureSafeArea()` 注入（custom 导航栏下 fixed 从 y=0 起、Skyline 下 env() 不可靠）；nav-bar 高度公式对齐 NavBar（胶囊高 + 上下对称留白），修掉真机让位偏多
- 2026-11-17：浮层顶部让位按微信官方做法重构：面板贴边 `top: 0`，让位只加在内容 `padding-top`（真值由 runtime 注入，未注入用 `env()` 兜底）。撤掉「负 `top` 把底色探到屏顶」的方案——它在 WebView 下多让一个状态栏高度、Skyline 下整块被裁切顶出屏幕。`Drawer` 补顶部让位，与 Popup 左右档同口径
- 2026-11-17：让位档面板的顶部内边距归零：让位值已含状态栏 + 导航栏，面板再叠 16px 会把正文多往下推一截；`Drawer` 同步归零
- 2026-11-17：`closePosition` 改为按形态分档——左右 / 上档不支持关闭按钮（设置无效）；底部四档（内部左上、跨半左上、外部右上、外部上方中间），中部五档（内部右上、跨半右上、外部右上、外部下方、外部右下方）。跨半只垂直跨、左右留距，外置档留 12px（`--mptk-space-3`）。居中档进场改为从目标位置下方 48px 上浮渐显（token `--mptk-c-popup-center-rise`）；演示站按形态 + 内外分四组展示，位置 / 底形 / 显隐 / 点遮罩开关均可切
- 2026-11-17：关闭按钮复用核心 Button（xs 档 24px），按压变色走 `mptk-btn--pressed`；底形改用 Button 的 ghost / soft + radius 档，不再在浮层里另写一套按钮皮肤
- 2026-11-17：关闭按钮样式拆成形状 / 描边 / 背景三个正交轴（`closeShape` / `closeBorder` / `closeBackground`），由 `resolveCloseStyle()` 映射 Button 的四形态；演示站上方 Card + Cell + Segmented 实时配置，下方只演示位置
- 2026-11-17：`Popup` 暴露 `overlayTone` / `overlayOpacity` / `roundSize` 三个参数，把内部遮罩两轴与面板圆角尺寸提到组件层（原来只能改 token 或在 demo 里 hack）；圆角尺寸派生 `.mptk-popup--radius-*` 类名切 `--mptk-c-popup-radius`。演示站重排成顶部统一配置 + 位置档 + 关闭按钮位置三块，撤掉单独的平角 / 圆角、顶部让位、叠加顺序、长内滚四块
- 2026-11-18：关闭按钮外框走 `--mptk-c-popup-close-size`（26px）、叉字号仍 xs 12px；`rounded` 档改半径 4px（`radius-xs`，原来 md=12px 在 24px 方块上看着还是正圆，两档分不出）；半跨左右距 ×1.5 落到 `--mptk-space-3`（12px）避开圆角。让位只对 top/left/right 生效，bottom/center 传了也强制 none。新增 `contentPadding`（数字四边统一 / 对象按边给），替换面板预留 16px、不替换让位，两者相加；撤销旧「让位档面板 padding-top 归零」。
- 2026-11-18：关闭按钮外框 26 → 30px（叉仍 xs 12px 不放大）；所有位置的左右离边距离统一到 12px（`--mptk-space-3`，原 8px 的 1.5 倍，覆盖内部 / 跨半 / 外置靠右档）；背景「否」重定义为半透明档（`--mptk-c-popup-close-bg-translucent` = `rgba(0,0,0,.55)`），由 `.mptk-popup__close--translucent` 只换 `--mptk-btn-bg`、不碰叉色 `--mptk-btn-fg`，`resolveCloseStyle` 的 variant 只由描边轴定。
- 2026-11-18：`soft` 档描边改为跟随叉色（`.mptk-btn.mptk-popup__close.mptk-btn--soft` 把 `--mptk-btn-border` 指向 `--mptk-btn-fg`）——`default` soft 原本描边 gray-5、叉 fg-2 两色不一致，细笔画的叉看着更淡；归一同色，与库内 tone 档 soft 约定一致。
- 2026-11-18：叉从字体图标换成自绘 `CloseGlyph`，根治跨端偏上。实测字体字形墨迹中心偏离 hhea 内容区、iOS/Android 基线度量不同，固定位移无法通吃；自绘叉把两笔 path 画在 viewBox 正中，几何中心 = 容器中心，跨端绝对居中。资产落 feedback 域公共组件（`mp-taro-kit/ui/feedback/close`），形状走 `--mptk-c-close-mask` token、色走 currentColor（由 Button 的 `--mptk-btn-fg` 注入）；Button 新增通用 `glyph` 槽位（与 `icon` 互斥、优先），自绘图标不必再走字体通道。圈、描边、背景三轴 CSS 全保留。
- 2026-11-18：叉边长 1em → 1.4em（按钮外框 30px 不变，叉从 12px 放大到约 16.8px）；跨半档左右离边 12 → 16px（`space-3` → `space-4`，往内收一档避开圆角）；内部档上边距 8 → 12px，使离上边与离左右边相等（四边等距）。其它位置档不变。
- 2026-11-18：按钮外框与叉各缩 4px——外框 30 → 26px、叉 16.8 → 12.8px（改固定值，不吃字号档）；`rounded` 圆角档 xs → sm（4 → 8px，统一圆角档大一号）；default 档字色（叉与描边）从 fg-2 盖到中灰 fg-3，明色变浅、暗色变暗，两端收敛到灰。
