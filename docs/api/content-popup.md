# ContentPopup 内容弹窗

`ContentPopup` 是站在 `Popup` 底座上的配置式内容弹窗，与 [ImagePopup](popup.md#imagepopup) 同级：图片弹窗只管图片，它管「头部 + 内容 + 按钮」的通用组合。一个 `variant` 旋钮切换头部形态，调用方只给数据就能出弹窗；要完全自己画就走底座的 `surface='none'`。遮罩、层级与安全区仍归 [遮罩与浮层底座](overlay.md)。

## 接口 / 导出

`mp-taro-kit/ui/layout/content-popup` 导出 `ContentPopup` 及 `ContentPopupProps` / `ContentPopupVariant` / `ContentPopupPosition` / `ContentPopupBackground` / `ContentPopupBackgroundDirection` / `ContentPopupActionsLayout` / `ContentPopupActionsAlign` / `ContentPopupBadgeAlign` / `ContentPopupBadgeRadius` / `ContentPopupImage` / `ContentPopupAction`；`mp-taro-kit/ui/layout/content-popup/style` 是组件级样式出口，宿主显式引一次。`mp-taro-kit/ui/layout` 也转发这些出口作兼容。

```tsx
import { ContentPopup } from 'mp-taro-kit/ui/layout/content-popup'
import 'mp-taro-kit/ui/layout/content-popup/style'
```

## 设计依据

成熟库（Vant Weapp `Dialog`、NutUI `Dialog`、TDesign 小程序 `Dialog`、antd-mobile `Dialog` / `Popup`）把这层叫对话框：头部 / 内容 / 底部三段，配置与槽位双通道，按钮横纵排布是独立轴；图片头是对话框的一种形态，不另立品类。本库延续这条路线，但只做 `center` / `bottom` 两档——上浮与左右抽屉由基础 `Popup` 承担，本组件不做。

与 `ImagePopup` 的边界：`ImagePopup` 是「一张图配一组按钮」的营销弹窗，多图自动 Swiper；`ContentPopup` 是「头部 + 内容 + 按钮」的通用弹窗，图片头只有一张、可以透明、可以接下方面板。两者都基于 `Popup` 裸壳能力，互不 import 实现（只复用 `ImagePopupAction` 类型）。

## 参数

### 形态与底座

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `open` | `boolean` | 必填 | 显隐；关闭后按 Popup 的退场时长卸载 |
| `position` | `'center' \| 'bottom'` | `'center'` | 只做这两档；越界值回落 `'center'` |
| `variant` | `'title' \| 'image' \| 'badge'` | `'title'` | 头部形态旋钮，见下 |
| `onClose` | `() => void` | — | 关闭回调；不传则不渲染关闭叉 |
| `closeable` | `boolean` | `true` | 显示关闭叉（与底层 Popup 默认不同） |
| `closePosition` / `closeShape` / `closeBorder` / `closeBackground` | 同 Popup | 同 Popup | 关闭按钮四轴，完全沿用 |
| `overlay` / `overlayTone` / `overlayOpacity` / `closable` / `lockScroll` / `duration` | 同 Popup | 同 Popup | 遮罩、点遮罩关闭与进出场 |
| `surface` | `'panel' \| 'none'` | `'panel'` | `'none'` 是完全自绘的裸壳 |
| `round` / `roundSize` / `contentPadding` / `panelStyle` / `className` | 同 Popup | 同 Popup | 面板几何；`image` / `badge` 未给内边距时默认 0，让头图贴边 |

### 头部通用

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `header` | `ReactNode` | — | 头部整体槽位，传了就覆盖 `variant` 配置出来的头部 |
| `headerBackground` | `BackgroundValue` | 透明 | 头部区底色或渐变；图片头默认无背景，要背景才传 |
| `headerDivider` | `boolean` | `title` 档开，其余关 | 头部与内容之间的分割线，线色取 `--mptk-border` |
| `panelBackground` | `BackgroundValue` | — | 整个面板底色或渐变，铺满内容区；`panelStyle` 可再覆盖 |

`BackgroundValue = string | { from: string; to: string; direction?: 'to-bottom' | 'to-right' | 'to-bottom-right' | 'to-bottom-left' }`。字符串传纯色（可写 `var(--mptk-*)`），对象传两段渐变；走内联 style，组件不写死色值。

### `title` 档：文字头

小图标 + 标题 + 副标题是**一体**的标题区，小图标只是标题前的附属，没有背景、不能设形状（那是 `badge` 的职责）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `icon` | `string` | 图标名，格式 `库名:图标名` |
| `glyph` | `ReactNode` | 自绘图标，与 `icon` 互斥、优先 |
| `title` | `string` | 标题 |
| `subtitle` | `string` | 标题下方的小字说明 |

```tsx
<ContentPopup open variant="title" icon="common.base:info"
  title="相册备份已开启" subtitle="将自动备份新增照片"
  actions={[{ text: '知道了', onClick: close }]} onClose={close} />
```

### `image` 档：图片头

| 参数 | 类型 | 说明 |
|---|---|---|
| `image` | `ContentPopupImage` | `{ src } & ImageSizeInput & { onClick? }`，尺寸走同一套 `resolveImageSize` |
| `headerBackground` | `BackgroundValue` | 默认透明；异形透明图靠面板底色接上，明暗主题各走各的 token |

```tsx
<ContentPopup open position="bottom" variant="image"
  image={{ src: kv, width: 320 }} headerBackground="#fff"
  actions={[{ text: '查看详情', onClick: openDetail }]} onClose={close} />
```

### `badge` 档：外伸徽标头

**外伸的是容器本身**，不是里面的图标浮出去。容器里放图标，容器可设背景与描边，下面可带标题、也可没有。

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `badgeIcon` / `badgeGlyph` | `string` / `ReactNode` | — | 容器里的图标，`glyph` 优先；都没传则不渲染头部 |
| `badgeRadius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'circle' \| number \| string` | `'circle'` | 圆角：`circle` 是 50% 正圆，档位取全库半径，数字为 px，字符串如 `'24%'` 按容器自身 |
| `badgeSize` | `number` | token 72px | 容器尺寸：圆直径 / 方边长 |
| `badgeAlign` | `'center' \| 'left' \| 'right'` | `'center'` | 水平锚点 |
| `badgeOffset` | `number \| string` | `0` | 相对锚点偏移；数字为 px，`'20%'` 为面板宽百分比 |
| `badgeOverlap` | `number \| string` | `'50%'` | 向上浮出量；数字为 px，`'40%'` 为容器自身高度的 40% |
| `badgeBackground` | `BackgroundValue` | 中性浅底 token | 容器背景，纯色或渐变 |
| `badgeBorderWidth` | `number` | token 2px | 描边宽度，传 0 关闭 |
| `badgeBorderColor` | `string` | 面板 surface token | 描边色，纯色或 `var(--mptk-*)` |
| `title` | `string` | — | 容器下方标题，可选 |

```tsx
<ContentPopup open variant="badge" badgeGlyph={<MyIcon />}
  badgeRadius="circle" badgeSize={72} badgeAlign="left" badgeOffset={20}
  badgeOverlap="40%"
  badgeBackground={{ from: '#FFB74D', to: '#F57C00', direction: 'to-bottom' }}
  badgeBorderWidth={2} title="是否开启相册备份" onClose={close} />
```

### 内容与底部

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `children` | `ReactNode` | — | 内容区 |
| `footer` | `ReactNode` | — | 底部整体槽位，传了就覆盖按钮配置 |
| `actions` | `ContentPopupAction[]` | — | 复用 ImagePopup 的文字按钮 `{text} + ButtonProps` 与图片按钮 `{src}` |
| `actionsLayout` | `'row' \| 'column'` | `'row'` | 左右排 / 上下排 |
| `actionsAlign` | `'center' \| 'left' \| 'right'` | `'center'` | 只作用于横排，纵排忽略 |

优先级统一为 **槽位 > 配置 > 默认**。要完全自绘就不传头部/按钮配置，只传 `children` + `surface='none'`；不需要新造「透明模式」。

## 行为契约

- **位置**：只支持中部与底部；不支持上浮与左右。越界值运行时回落 `'center'`，不抛错。
- **高度**：沿用 Popup「高度由内容撑开、不写 `max-height`」；要滚由调用方在 `children` 里包 `scroll-view` 并给确定高。
- **徽标避让**：`badge` 形态下若 `closePosition` 落在面板内 `top-*` / `edge-top-*`，自动回落到 `above-right`，避免与外伸容器叠在一起。
- **空态**：`badge` 没给图标也没给标题时不渲染头部，不出现空容器。
- **进出场与关闭路径**：同 Popup——挂载即渲染、播完时长再卸载；关闭叉走 `onClose`，点遮罩走 `closable`，两者正交。
- **浮出实现**：`position: absolute` + `transform` 位移，不用负 margin / `gap`（Skyline 不支持）；面板对徽标放开 `overflow`，外伸部分不被裁。

## 不做什么

- 不做上浮、左右抽屉，也不做命令式 API / 浮层栈 / portal。
- 不做多图轮播（归 `ImagePopup`）、不做表单输入、不做曝光回调、不做页面回退自动关闭。
- 不在组件里写死颜色与尺寸；新增视觉取值走 `kit.config.mjs`，组件只读 `var(--mptk-*)`。
- 不给「完全自定义」另立模式，复用 Popup 的 `surface='none'`。

## 更新日志

- 2026-11-21：新建。三档 `variant`、位置限 center/bottom、背景三作用域、分割线轴、按钮两轴、徽标形状/位置/浮出/描边参数。
