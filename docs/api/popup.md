# Popup 弹出层

`Popup` 是浮层里的通用面板容器；`ImagePopup` 站在它的 `surface="none"` 档上，传图片和按钮即成一张弹窗。遮罩本体、层级链与平台安全区注入归 [遮罩与浮层底座](overlay.md)，本文只写这两个组件对外的契约。

## 接口 / 导出

`mp-taro-kit/ui/layout` 导出 `Popup`、`ImagePopup` 及各自的类型（`PopupProps` / `PopupPosition` / `PopupCloseShape` / `PopupClosePosition` / `PopupInsetTop` / `PopupRoundSize` / `PopupSurface` / `PopupContentPadding`、`ImagePopupProps` / `ImagePopupSlide` / `ImagePopupAction` / `ImagePopupActionsAlign`、尺寸模型 `ImageSizeInput` / `ImageWidthSpec` / `ImageHeightSpec` / `ImageFitMode` / `ImageSizeToken` / `ImageNaturalSize` / `ResolvedImageSize`）；完整子路径清单见 [遮罩与浮层底座](overlay.md)。样式从 `mp-taro-kit/ui/layout/style` 显式引一次。

不传 `size` / 圆角等尺寸档时走库 token；宿主改 token 即换全库默认值，组件不写死数值。

## Popup

### 形态与定位

`position` 取五档：`'top' | 'center' | 'bottom' | 'left' | 'right'`（默认 `bottom`）。上 / 下档通栏；左 / 右档是全高抽屉（宽度取 `--mptk-c-drawer-w`，240px，375 屏约 64%，不受面板限高影响）；居中档有默认宽 `--mptk-c-popup-center-w`（320px，375 屏两边各留 27.5px）且最大不超屏，不是通栏。Skyline 不支持 Vant 用的 `fit-content`，故居中档用 token 默认宽，消费方可覆盖。原独立 `Drawer` 已取消，左右滑入由 `left` / `right` 档承担。面板最小高 `--mptk-c-popup-min-h`（200px）。

贴顶 / 贴底档必须有确定高度：Skyline 下 `scroll-view` 拿到确定高才会滚，只给 `max-height` 会被内容撑满屏、真机上滚不动。这两档高度取 `--mptk-c-popup-sheet-h`（35vh），`--mptk-c-popup-max-h` 只作上限。

圆角按档默认：居中档四角全圆，贴边档默认平角；贴边档传 `round` 只圆内侧两角。尺寸读 `--mptk-c-popup-radius`（`--mptk-radius-md` = 12px），单次换档传 `roundSize`（`'none' | 'sm' | 'md' | 'lg'`，派生 `.mptk-popup--radius-*` 类名切同一变量）。

### 关闭按钮

`closeable` 默认 `false`；开启后复用核心 `Button`，不在浮层里另造按钮皮肤。组件已把关闭按钮排在内容容器之后：Skyline 下 `scroll-view` 是原生视图、绘制在后，放前面会被盖住而点不着。

样式拆成三个正交轴，由 `resolveCloseStyle()`（`src/ui/layout/close-style.ts`）算出 Button 的 `variant` / `radius`：

| 轴 | 参数 | 默认 | 取值 |
|---|---|---|---|
| 形状 | `closeShape` | `'circle'` | `'circle'`（正圆 → `radius="pill"`）/ `'rounded'`（小方角 → `radius="sm"` 8px） |
| 描边 | `closeBorder` | `true` | 有 / 无描边 |
| 背景 | `closeBackground` | `true` | 有底 / 半透明底（叉色不变） |

外框走 `--mptk-c-popup-close-size`（26px），叉是自绘 `CloseGlyph`（边长固定 12.8px），两轴互不联动。有边 → `soft`，无边 → `solid`；背景轴只换底色 `--mptk-c-popup-close-bg-translucent`（`rgba(0, 0, 0, 0.55)`），不改叉色。`soft` 档再用三类名让描边跟随 `--mptk-btn-fg`（与库内 tone 档 soft 同色约定一致），`default` 档字色盖成 `--mptk-fg-3`，明 / 暗两端都收敛到中灰。

叉不用字体图标：字形墨迹相对行盒偏上，且 iOS / Android 基线度量不同，固定位移无法跨端根治。自绘叉把两笔 SVG path 画在 viewBox 正中（`--mptk-c-close-mask`），几何中心即容器中心；颜色取 `currentColor`，经 Button 的 `glyph` 槽位由 `--mptk-btn-fg` 注入。

`closePosition` 只能用当前形态支持的值，不支持则回落到该形态默认值；`left` / `right` 档不渲染关闭按钮：

| 形态 | 面板内 | 跨上边一半 | 面板上方 | 面板下方 | 默认 |
|---|---|---|---|---|---|
| `bottom` | `top-left`、`top-right` | `edge-top-left`、`edge-top-right` | `above-right`、`above-center` | — | `top-left` |
| `center` | `top-right` | `edge-top-right` | `above-right` | `below-center`、`below-right` | `top-right` |
| `top` | — | — | — | `below-center`、`below-right` | `below-center` |
| `left` / `right` | 不支持 | 不支持 | 不支持 | 不支持 | 无关闭按钮 |

几何口径：`top-left` / `top-right` 离上边与左右边各 `--mptk-space-3`（12px），四边等距；`edge-top-*` 只**垂直**跨自身高度一半，左右留 `--mptk-space-4`（16px），不整体横向出界；`above-*` / `below-*` 与面板上下留 12px，靠右档右侧同样 12px，居中档水平居中。跨边 / 外置档会临时放开面板 `overflow`，否则按钮被裁。点关闭按钮走 `onClose`，与点遮罩关闭（`closable`）是两条独立路径。

### 面板表面 surface

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `surface` | `'panel' \| 'none'` | `'panel'` | `panel` 是有底色 / 内边距 / 圆角的常规面板；`none` 是裸壳——不画底色、内边距、圆角，`min-height` 归零，只留遮罩 / 进场 / 关闭按钮 / 定位 |

裸壳用于「自己画内容」：children 塞什么就显示什么，位置由内容决定；遮罩、`overlayTone` / `overlayOpacity`、关闭按钮及其位置全保留。样式上 `.mptk-popup--surface-none .mptk-popup__panel` 放样式表末尾、双类名覆盖各档位（含 `--round`），不依赖样式表顺序。主流库多是值型背景开关，这里连 padding 和圆角一起关，故取 `surface` 做档位。

内容容器随档位走，不另设滚动开关：

| 档位 | 内容容器 | 高度 | 调用方设置 |
|---|---|---|---|
| `panel`（默认） | `ScrollView scrollY`（内容超高自己滚） | min 200px / max 80vh，面板定 | 零 |
| `none` | `View` 直出（不套 scroll-view） | `min-height` / `max-height` / `overflow` 全撤，由 children 决定 | 零 |

裸壳下要滚由调用方自己在 children 里包 `scroll-view` 并给明确高度。两路都保留让位注入；关闭按钮排在内容容器之后。`ImagePopup` 走 `none` 档，单图直接 `Image`、多图直接 `Swiper`，不会被 scroll-view 的 0 高度裁掉。

### 让位与内边距

`insetTop` 取 `'none'` / `'status-bar'` / `'nav-bar'`，**只对 `top` / `left` / `right` 生效**：这三档不传默认 `nav-bar`、传了按传入档；`bottom` / `center` 传什么都强制 `none`，不产生顶部空白。让位只加在内容区 `padding-top`，状态栏区域仍是面板底色。

`contentPadding` 取 `number`（四边统一）或 `{ top?, right?, bottom?, left? }`（按边给，单位 px，未给的边走默认 16px）。它**替换面板预留的 16px**，不替换让位——让位独立加在内容区，两者相加：让位 420px + `contentPadding.top = 50`，顶部总留白 470px。

真值必须由 runtime 注入，不能只靠 CSS `env()`：`navigationStyle: 'custom'` 时微信不预留状态栏空间，`env(safe-area-inset-top)` 最多给出状态栏高度、给不出胶囊下沿。宿主在 app 入口调一次：

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

导航栏让位高度 = `statusBarHeight + 胶囊高 + max(menuButton.top - statusBarHeight, 0) × 2`，与 `NavBar.tsx` 同口径；不能写成 `(top - statusBar + height) * 2`（胶囊高乘两遍）。面板贴边定位不动，让位只加在内容上：遮罩、贴顶面板、抽屉面板一律 `top: 0`，不写负 `top`（Skyline 下会把整块顶出可视区）。未注入真值时走 CSS 兜底 `env(safe-area-inset-top)` / `calc(env(safe-area-inset-top) + var(--mptk-c-navbar-h))`；`resolveTopInset()`（`src/ui/layout/safe-inset.ts`）是唯一算法，Popup 与 Drawer 共用。

### 样式契约

默认值在 `kit.config.mjs` 的 `component` 段，组件样式只读 `var()`：

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-c-popup-max-h` | `80vh` | 面板限高上限 |
| `--mptk-c-popup-sheet-h` | `35vh` | 贴顶 / 贴底档确定高度，Skyline 下 scroll-view 要确定高才能滚 |
| `--mptk-c-popup-center-w` | `320px` | 居中档默认宽，最大不超屏 |
| `--mptk-c-popup-min-h` | `200px` | 面板最小高度 |
| `--mptk-c-popup-center-rise` | `48px` | 居中档进场起始偏移：从目标位置下方 48px 上浮渐显 |
| `--mptk-c-popup-radius` | `var(--mptk-radius-md)` | 圆角尺寸，改一处换全库 |
| `--mptk-c-popup-close-size` | `26px` | 关闭按钮外框；叉固定 12.8px |
| `--mptk-c-close-mask` | SVG data URI | 自绘关闭叉遮罩，几何居中 |
| `--mptk-c-popup-close-bg-translucent` | `rgba(0, 0, 0, 0.55)` | 关闭按钮半透明底；叉色不动 |
| `--mptk-c-drawer-w` | `240px` | 抽屉宽度；滑入滑出按自身宽度算 |

## ImagePopup

一张图配一组按钮，**不是全屏看图器**——它是浮层里的一个配置式弹窗，图片只是表现形式。单图直出、多图自动 Swiper 翻页 + 原生红点，按钮跟着当前图变。底层就是 `surface="none"` 的居中 `Popup`，遮罩 / 浮起 / 关闭按钮全沿用。

```tsx
import { ImagePopup } from 'mp-taro-kit/ui/layout'
import 'mp-taro-kit/ui/layout/style'

// 运营图：定宽自适应 + 文字按钮 + 图片按钮混排
<ImagePopup
  open={open}
  slides={[{
    src: 'https://cdn.example.com/kv.png',
    width: 320,
    onClick: () => navigateTo({ url: '/pages/detail/index' }),
    actions: [
      { text: '查看详情', type: 'primary', variant: 'solid', onClick: openDetail },
      { src: 'https://cdn.example.com/btn.png', height: 36, onClick: onImageBtn },
    ],
  }]}
  closeable
  closePosition="below-center"
  onClose={close}
/>

// 长图：面板贴合图片、滚动区域贴图片右缘；视口限高 320px，只走 Y 轴滚动
<ImagePopup open={longOpen} slides={[{ src: longUrl, width: 320, maxHeight: 320, fit: 'scroll' }]} closePosition="below-center" onClose={close} />

// 多图翻页：Swiper 横划翻页 + 原生红点
<ImagePopup open={multiOpen} slides={[
  { src: normalA },
  { src: normalB },
]} onClose={close} />
```

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `open` | boolean | 必填 | 是否显示；关闭后按 Popup 的退场时长卸载 |
| `slides` | `ImagePopupSlide[]` | 必填 | 一屏一项：一张 `src` + 自己的尺寸字段 / `actions` / `actionsAlign` / `onClick`；一组即单图无翻页，多组出 Swiper + 红点；空数组不渲染任何东西 |
| `onClose` | `() => void` | — | 关闭回调（关闭叉 / 点遮罩都走它）；不传则不渲染关闭叉 |
| `closePosition` | `PopupClosePosition` | `'below-center'` | 关闭按钮位置，沿用 Popup 档；默认落在图片 + 按钮下方 |
| `showIndicators` | boolean | `true` | 多图是否显示原生红点（`indicator-dots`） |
| `closeable` | boolean | `true` | 显示关闭叉（**默认与 Popup 的 `false` 不同**） |
| `closeShape` / `closeBorder` / `closeBackground` / `overlayTone` / `overlayOpacity` / `closable` | 同 Popup | — | 透传给底层 Popup；`closeable` 显示叉、`closable` 点遮罩关闭，两者正交 |

`actions` 支持两类、可混排，共用默认间距（token `--mptk-image-popup-action-gap`，默认 `--mptk-space-2`，站点可覆盖）：

- **文字按钮**：`{ text }` + 现成 `ButtonProps`（`type` / `variant` / `color` / `size` / `radius` / `onClick` …），样式全交给 Button；判别式：有 `text`。
- **图片按钮**：`{ src, width?, height?, alt?, onClick? }`，复用同一套尺寸模型（宽 / 高 / 比例 / 原宽高 / 上界，另一边按原图比例自适应），`fit` 不适用（按钮图没有滚动视口）。未给宽时按原图尺寸（`'auto'`，不放大、不超按钮容器宽 200px），与文字按钮混排不会独占整行。判别式：有 `src`。
- `actionsAlign`（`'center' | 'left' | 'right'`，默认 `center`）落到一排的 `justify-content`。

### 图片尺寸模型

比例口径统一为「宽 / 高」，对齐 CSS `aspect-ratio`；单图、多图每屏、图片按钮共用同一套解析。

| 字段 | 类型 | 默认 | 语义 |
|---|---|---|---|
| `width` | `number \| '100%' \| 'auto'` | 容器内容宽（单图 320px） | 目标宽：px / 显式铺满内容区 / 按原图尺寸（不放大）。不给就是内容区可用宽的**确定像素宽**（单图 320px，面板据此贴合），不是 `'100%'` |
| `height` | `number \| 'auto'` | `'auto'` | 目标高：px / 按比例自适应；给了 height 就走 `heightFix` 定高、宽按原图比例 |
| `ratio` | number | — | 宽 / 高，优先级高于 `natural*` |
| `naturalWidth` / `naturalHeight` | number | — | 原图尺寸，作为比例来源；没有比例时首帧交 `widthFix`，`onLoad` 回灌真实尺寸后重算 |
| `maxWidth` / `maxHeight` | `number \| string` | —（`fit:'scroll'` 未给时滚动视口用 `80vh` 兜底） | 上界（px 或 vh/%），图比它小就原样显示、绝不放大。定宽档折算进宽度（`maxWidth` 与比例无关、恒生效；`maxHeight` 有比例时反推宽度上限）；定高档折算进高度（`maxHeight` 压高、有比例时 `maxWidth` 反推最大高）；scroll 档 `maxWidth` 约束视口宽、`maxHeight` 是滚动视口高。**注意**：JS 折不了 `vh` / `%`，contain 档只认数字与 `px`；`vh` / `%` 仅在 `fit:'scroll'` 的视口高上按 CSS 生效 |
| `fit` | `'contain' \| 'scroll'` | `'contain'` | contain 等比缩进上界（压小宽度，仍 `widthFix` 不拉伸）；scroll 锁固定宽 + 固定视口高，长图在视口里 Y 滚动；同时给 `height` 时 `height` 不生效 |

**铁律：Image 只锁一个维度**，由原生按比例撑另一边——定宽 `widthFix`、定高 `heightFix`、其余 `widthFix`。解析结果给出 `widthPx`（确定像素宽，供面板贴合；`'100%'` 档、以及定高且比例未知时为 `null`，后者首帧隐藏等 `onLoad` 回灌后就有值）与 `displayHeight`（宽/比例，供 Swiper / 视口定高）。绝不把固定 `height` 与 `maxHeight` 同时写到 Image 上——旧版 `aspectFit` 盒子加 `maxHeight` 会把长图压成细条、滚动失效，已废弃。不变量：**不拉伸**（全程不用 `scaleToFill`）、**零 X 滚动**（滚动视口只 `scroll-y`、`scroll-x={false}`）。

`width: '100%'` 是显式档（不再是默认）：宽度交给容器、`widthFix` 按真实比例撑高，`widthPx` 为 `null`；宽度不依赖比例，首帧就显示。比例已知时 `displayHeight` 按内容区宽折算，多图 Swiper 因此能定高；未知时多图先用兜底高度，`onLoad` 回灌后修正（有高度过渡）。滚动长图建议给确定宽（如 `width:320`）：视口宽 = 图片宽 = 面板宽，滚动区域贴图片右缘（微信默认不显示滚动条）。`width: 'auto'` 按原图宽显示，但不放大也不超内容区。

`contain` 档**不内置**整体高度天花板：定宽长图会按真实比例很高，需要限高就自己给 `maxHeight`（或改用 `fit:'scroll'`）；`80vh` 只是 scroll 档未给 `maxHeight` 时的视口兜底。

### 多图几何

- **Swiper 高度跟随当前页**：JS 取当前页视口高度内联注入（`style.height`），切高图框变高、关闭叉随之下移，切矮图变矮。普通屏取 `displayHeight`（定宽 = 宽/比例，定高 = 定高值，`'100%'` 档按内容区宽折算）；scroll 屏取滚动视口高——`maxHeight` 原样交给 CSS（px / vh 都能用），未给时 `80vh`。不取所有页最大值，矮图才不会留白；原生 `swiper` 默认高度固定，不注入就把高图裁一半。
- **切页高度动画**：`.mptk-image-popup__swiper` 对 `height` 做 CSS 过渡（时长 `--mptk-dur`、缓动 `--mptk-ease`，设 `0s` 可关），JS 只在 `onChange` 改内联高度。
- **每屏容器居中**：`.mptk-image-popup__slide`（`height:100%`、flex 双轴居中）；图片与滚动视口均 `flex:none`，不被压扁。
- **面板宽度贴合图片**：`panelStyle` 用 `widthPx` 内联成同款宽（`max-width:100vw` 兜底）。定高图贴「按高算出的显示宽」而非原图像素宽，按钮才不会跑到图外。不能用 `typeof size.width === 'number'` 判断（`width` 已是 CSS 字符串，恒假）。
- **左右档关闭叉贴图片边缘**：`.mptk-image-popup__panel` 作用域内把 `top-*` / `edge-top-*` / `above-right` / `below-right` 的 `left` / `right` 归零，与图片左右缘齐平；基础 Popup 各档间距与其它形态不动。

红点用原生 `indicator-dots`；不传自定义 `indicator-color` 的 `var()`——小程序原生属性不解析 CSS 变量，会导致红点不显示。

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-image-popup-action-gap` | `var(--mptk-space-2)` | 图片弹窗按钮之间（含换行后的行间距）的间距兜底；站点可覆盖 |

## 行为契约

- **进出场**：组件挂载即渲染，关闭时先置收起态、播完 `duration` 再卸载；`duration: 0` 立即卸载（低端机 / 减少动效）。贴底 / 贴顶面板上下位移进出，左右档横向位移进出，居中面板从目标位置下方 `--mptk-c-popup-center-rise`（48px）上浮并渐显，退场反向。
- **面板层级**：面板自带 `z-index: var(--mptk-c-layer-panel)`，与遮罩同在 `.mptk-popup` 的层叠上下文内时也必须高于遮罩；缺了它面板会被遮罩盖住，表现为「点了没反应」。层级链的唯一真源见 [遮罩与浮层底座](overlay.md)。
- **关闭路径**：关闭叉走 `onClose`，点遮罩走 `closable`，两者正交；遮罩本体行为也见上文。

## 更新日志

- 2026-11-19：从 `docs/api/overlay.md` 拆出 Popup / ImagePopup 契约独立成篇；遮罩本体、层级链与安全区注入留在 overlay.md，历史条目也留在原文，不重复搬运。
