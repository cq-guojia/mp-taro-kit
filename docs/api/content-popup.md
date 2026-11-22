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
| `headerBackground` | `BackgroundValue` | 透明 | 头部区底色或渐变；铺满整块头部（含左右留白）；图片头默认无背景，要背景才传 |
| `headerTone` | `'normal' \| 'on-light' \| 'on-dark'` | `'normal'` | 头部底色的明暗：浅底传 `on-light` 配深字、深底传 `on-dark` 配浅字；`normal` 跟随主题 |
| `headerDivider` | `boolean` | `title` 档开，其余关 | 头部与内容之间的分割线，要不要由它决定 |
| `headerDividerColor` | `string` | 随 `headerTone` | 分割线颜色，可写 `var(--mptk-*)`；不传时 `normal` 走 `--mptk-border`、`on-light` 走深线、`on-dark` 走浅线 |
| `panelBackground` | `BackgroundValue` | — | 整个面板底色或渐变，铺满内容区；`panelStyle` 可再覆盖 |

`BackgroundValue = string | { from: string; to?: string; direction?: 'to-bottom' | 'to-right' | 'to-bottom-right' | 'to-bottom-left' | number; fadeFrom?: number; fadeTo?: number }`。字符串传纯色（可写 `var(--mptk-*)`）；对象传渐变：

- `from` 必填；`to` 缺省即从 `from` 淡出到面板底色 `var(--mptk-surface-elevated)`（明/暗各一支，真正融进环境），显式给 `transparent` 则淡出到透明；显式给色值则淡出到该色。
- `direction` 可给四档方位枚举或任意度数，缺省 **165deg**（从偏左上起色、向下收，比 180deg 正下略斜一点）。不要用到 135deg 那种对角：在 320px 宽的面板上色带会沿宽边横铺，到分割线时仍带颜色；165deg 只轻微偏斜，颜色集中在顶部一小段、到线时已回到底色。要别的角度显式传 `direction`（含度数）。
- `fadeFrom`（0-100，只在 `to` 缺省时生效）：起始色保持到百分之几才开始过渡，不给则从 0% 立刻过渡。
- `fadeTo`（0-100，只在 `to` 缺省时生效）：淡出到底色在百分之几**结束**，不给则到 100%（区域末端）才结束；`fadeTo` 之后 CSS 自动保持底色到末端。

两者配合可以把颜色限制在顶部一段、到某处收干净。例如整体渐隐 `{ from: 'rgba(59, 91, 219, .10)', fadeFrom: 0, fadeTo: 45 }`：自面板顶部即开始平缓淡出，45% 处已完全回到底色，之后整段保持底色——不会出现颜色一直拖到中下部才消失。注意百分比是相对**渐变所作用的那一层**的高度：`headerBackground` 相对头部高度，`panelBackground` 相对整个面板高度——整体渐变（含头部与内容）用 `panelBackground`，只想在头部收干净才用 `headerBackground`。双色渐变忽略这两个参数。

走内联 style，组件不写死色值。

头部只有一层：`headerBackground` 与左右留白同在这一层，盒模型让渐变铺满 padding 区；不再有外层容器套住内层导致渐变缺边。

头部字色是控件的**对外能力**，不是消费方的活。`headerTone` 表达的是**头部底色明暗**，库据此反色：

- `normal`（默认）：头部无自定义底色，主/副字色走 `--mptk-c-content-popup-head-ink` / `-ink-2`（跟随 `fg` / `fg-3`）；
- `on-light`：头部是浅色背景（如演示站「头部浅」），字色/线色固定明档深色——浅背景在暗档主题下仍是浅底，跟随主题翻成浅字就看不见；
- `on-dark`：头部是深色背景（如演示站「头部深」），字色/线色固定浅色。

库内部按 tone 生成 `mptk-content-popup__header--on-light` / `--on-dark` 修饰类切 token，消费方只传一个 tone，不需要知道内部类名或写 CSS 覆盖。

**渐变与主题的搭配责任在消费方**：控件只负责把传入的色值和 tone 正确渲染，不替你判断底色深浅。渐变的起止色建议写成明/暗各一支的 `var(--mptk-*)` token，用 `useThemeSnapshot()` 读当前明暗后选色；头部背景是固定色时，`headerTone` 要按**底色深浅**给（浅底 `on-light` 深字、深底 `on-dark` 浅字），否则字会看不见。演示站里头部底色固定、按底色给 tone，整体渐变则随主题切明/暗两支深蓝系示例色——只为展示 API 形态，具体配色由接入项目自己定制。演示按钮分两组 Cell：`头部渐变`（浅/深）与 `整体渐变`（渐隐/渐变）。

### `title` 档：文字头

小图标 + 标题 + 副标题是**一体**的标题区，小图标只是标题前的附属，没有背景、不能设形状（那是 `badge` 的职责）。

排布固定为：图标独占左侧一列、上下贯通右侧两行；右列上方主标题（`--mptk-font-lg` / `--mptk-fg`），下方副标题（`--mptk-font-xs` / `--mptk-fg-3`，更小更淡、与主标题零行间距），图标尺寸走组件 token `--mptk-c-content-popup-title-icon-size`，图标与文字的左右间距为 `--mptk-space-4`。长文案在标题与副标题上都会自动换行，不给单行溢出。

默认关闭位：中部弹窗为外下中（`below-center`），底部弹窗为外右上（`above-right`）。要改就显式传 `closePosition`。

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
- **分割线标准**：头部与内容之间的线是**头部的下边框**（不是独立节点），线及以上都归 header——`headerBackground` 的渐变铺到线为止；线通栏（左右顶到面板边）。线以下的间距是**内容区的上间距**（`--mptk-space-4`，16px），由 `.mptk-content-popup__content--top-gap` 恒给，不随分割线显隐消失；线本身上方由 header 的 `padding-bottom` 留同档间距。线色走 `headerDividerColor`，默认 `--mptk-border`。以后本弹窗里新增任何分割线都按这条标准走。
- **圆角裁切**：面板为徽标外伸开了 `overflow: visible`，不再替头部裁圆角；头部按面板档位自裁上两角（居中档恒圆、底部档仅 `round` 开启才圆，取 `--mptk-c-popup-radius`），渐变不会溢出圆角。
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
- 2026-11-21：文字头图标跨两行并放大；主副标题按 lg/sm 分档；分割线改为通栏且与上下内容等距；文字头默认关闭叉改为面板内右上。
- 2026-11-21：中部弹窗默认关闭叉改外下中；副标题改 xs/fg-3 且零行间距；图标尺寸独立 token 并加大左右间距；修长标题不换行溢出。
- 2026-11-21：底部弹窗默认关闭叉改外右上；演示内容容器占满宽度，修调用方 view 内长文案不换行。
- 2026-11-22：头部由内外两层合并为一层，背景与留白同层，渐变铺满 padding 区；背景 `to` 改为可选（缺省淡出到面板底色）、角度支持度数且默认 165deg（偏左上起色、顶部浅色到线即回底色）、新增 `fadeFrom` 起始色保持百分比与 `fadeTo` 淡出结束位置；头字色抽成 `--mptk-c-content-popup-head-ink*` token 并随明暗在 light/dark 组各自声明；分割线归 header 下边框且颜色可由 `headerDividerColor` 覆盖；线下间距恒由内容区上间距给；演示按钮拆成「头部渐变」与「整体渐变」两组 Cell。
- 2026-11-22：`headerTone` 由 `normal`/`inverse` 改为按底色明暗的 `normal`/`on-light`/`on-dark`——浅底头固定深字（修暗档主题下浅蓝头配浅字看不见），深底头固定浅字；演示站渐隐从 `headerBackground` 改走 `panelBackground` 铺满整面板（含头部），整体渐变恢复随主题切明/暗两支深蓝系示例色。
