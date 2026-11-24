# ContentPopup 内容弹窗

`ContentPopup` 是站在 `Popup` 底座上的配置式内容弹窗，与 [ImagePopup](popup.md#imagepopup) 同级：图片弹窗只管图片，它管「头部 + 内容 + 按钮」的通用组合。一个 `variant` 旋钮切换头部形态，调用方只给数据就能出弹窗；要完全自己画就走底座的 `surface='none'`。遮罩、层级与安全区仍归 [遮罩与浮层底座](overlay.md)。

## 接口 / 导出

`mp-taro-kit/ui/layout/content-popup` 导出 `ContentPopup` 及 `ContentPopupProps` / `ContentPopupVariant` / `ContentPopupPosition` / `ContentPopupBackground` / `ContentPopupBackgroundDirection` / `ContentPopupHeaderIcon` / `ContentPopupHeaderImage` / `ContentPopupActionsLayout` / `ContentPopupActionsAlign` / `ContentPopupFooterLayout` / `ContentPopupFooterSeparation` / `ContentPopupFooterConfig` / `ContentPopupBadgeAlign` / `ContentPopupBadgeRadius` / `ContentPopupBadgeTone` / `ContentPopupBadge` / `ContentPopupBadgeContent` / `ContentPopupImage` / `ContentPopupAction`；`mp-taro-kit/ui/layout/content-popup/style` 是组件级样式出口，宿主显式引一次。`mp-taro-kit/ui/layout` 也转发这些出口作兼容。

```tsx
import { ContentPopup } from 'mp-taro-kit/ui/layout/content-popup'
import 'mp-taro-kit/ui/layout/content-popup/style'
```

## 设计依据

成熟库（Vant Weapp `Dialog`、NutUI `Dialog`、TDesign 小程序 `Dialog`、antd-mobile `Dialog` / `Popup`）把这层叫对话框：头部 / 内容 / 底部三段，配置与槽位双通道，按钮横纵排布是独立轴；图片头是对话框的一种形态，不另立品类。本库延续这条路线，做 `top` / `center` / `bottom` 三档——左右抽屉不属于正常弹窗（无关闭叉、footer、handler），由基础 `Popup` 的 `surface='none'` 裸壳让调用方完全自定义。

与 `ImagePopup` 的边界：`ImagePopup` 是「一张图配一组按钮」的营销弹窗，多图自动 Swiper；`ContentPopup` 是「头部 + 内容 + 按钮」的通用弹窗，图片头只有一张、可以透明、可以接下方面板。两者都基于 `Popup` 裸壳能力，互不 import 实现（只复用 `ImagePopupAction` 类型）。

## 参数

### 形态与底座

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `open` | `boolean` | 必填 | 显隐；关闭后按 Popup 的退场时长卸载 |
| `position` | `'top' \| 'center' \| 'bottom'` | `'center'` | 只做上中下三档；左右抽屉不支持，越界值回落 `'center'` |
| `variant` | `'title' \| 'image' \| 'badge'` | `'title'` | 头部形态旋钮，见下 |
| `onClose` | `() => void` | — | 关闭回调；不传则不渲染关闭叉 |
| `closeable` | `boolean` | `true` | 显示关闭叉（与底层 Popup 默认不同） |
| `closePosition` / `closeShape` / `closeBorder` / `closeBackground` | 同 Popup | 同 Popup | 关闭按钮四轴，完全沿用 |
| `closeOffset` | `EdgeOffset` | `{}` | 关闭按钮四向微调，叠加在 `closePosition` 档位之上；正=向内收、负=向外伸，与 `image.offset` 同一类型。实现走 WXSS 档位基线变量 + 内联标准定位属性，口径详见 [Popup](popup.md#参数) |
| `overlay` / `overlayTone` / `overlayOpacity` / `closable` / `lockScroll` / `duration` | 同 Popup | 同 Popup | 遮罩、点遮罩关闭与进出场 |
| `surface` | `'panel' \| 'none'` | `'panel'` | `'none'` 是完全自绘的裸壳 |
| `round` / `roundSize` / `contentPadding` / `panelStyle` / `className` | 同 Popup | 同 Popup | 面板几何；`image` / `badge` 未给内边距时默认 0，让头图贴边 |

### 头部通用

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `header` | `ReactNode` | — | 头部整体槽位，传了就覆盖 `variant` 配置出来的头部 |
| `headerBackground` | `BackgroundValue` | 透明 | 头部区底色或渐变；铺满整块头部（含左右留白）；图片头默认无背景，要背景才传 |
| `headerImage` | `{ src: string; mode?: 'cover' \| 'contain'; position?: string; repeat?: boolean }` | — | 头部图片背景，走 CSS `background-image`；与 `headerBackground` 同给时图片盖在色/渐变之上。不裁切外伸图标；字色仍按 `headerTone` 给 |
| `headerTone` | `'normal' \| 'on-light' \| 'on-dark'` | `'normal'` | 头部底色的明暗：浅底传 `on-light` 配深字、深底传 `on-dark` 配浅字；`normal` 跟随主题 |
| `headerDivider` | `boolean` | `title` 开，`image` / `badge` 关 | 头部与内容之间**横向**的分割线；显式传值最高优先。与徽标容器外圈那道 `badge.border` 是两回事。有线的上下留白由 header 给，无线时这段留白随之消失（内容区上间距恒在） |
| `iconColor` | `string` | 走 `headerTone` 的字色 | 图标颜色，仅单色字体图标生效（COLR/CPAL 彩色字形吃不到 `color`）；显式传入优先于 tone 的默认字色 |
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

小图标 + 标题 + 副标题是**一体**的标题区。与 `badge` 档共用同一份「图标 + 文案」渲染：图标四形态、标题 `--mptk-font-lg`、副标题 `--mptk-font-xs` 在两档完全一致，差异只在图标是**内嵌在左**（本档）还是**外伸在上**（badge 档）。

排布固定为：图标独占左侧一列、上下贯通右侧两行；图标尺寸走组件 token `--mptk-c-content-popup-title-icon-size`，图标与文字的左右间距为 `--mptk-space-4`。长文案在标题与副标题上都会自动换行，不给单行溢出。

默认关闭位统一走中线：顶部 / 中部弹窗为外下中（`below-center`，贴顶没有上方外置位），底部弹窗为外上中（`above-center`）。要改就显式传 `closePosition`；顶部档只接受 `below-center` / `below-right`，其余档位无效回落。

| 参数 | 类型 | 说明 |
|---|---|---|
| `headerIcon` | `ContentPopupHeaderIcon` | 四形态图标（见 badge 档的同名类型），优先级最高 |
| `icon` | `string` | 旧字段：内置图标名 `库名:图标名`，等价于 `{ kind:'icon', name }` |
| `glyph` | `ReactNode` | 旧字段：自绘图标节点，等价于 `{ kind:'glyph', node }` |
| `iconColor` | `string` | 图标颜色，优先级 `content.color` > `iconColor` > 字色 token |
| `title` | `string` | 主标题（`font-lg`，与 badge 档同号） |
| `subtitle` | `string` | 标题下方的小字说明 |

优先级：`headerIcon > glyph > icon`。旧字段保留可用，新接入优先用 `headerIcon` 拿四形态能力。

```tsx
<ContentPopup open variant="title"
  headerIcon={{ kind: 'icon', name: 'common.base:AIdamoxing', color: 'var(--mptk-business)' }}
  title="相册备份已开启" subtitle="将自动备份新增照片"
  actions={[{ text: '知道了', onClick: close }]} onClose={close} />
```

### `image` 档：图片头

| 参数 | 类型 | 说明 |
|---|---|---|
| `image` | `ContentPopupImage` | `{ src } & ImageSizeInput & { onClick?, align?, offset? }`，尺寸走同一套 `resolveImageSize` |
| `headerBackground` | `BackgroundValue` | 默认透明；异形透明图靠面板底色接上，明暗主题各走各的 token |

`ContentPopupImage` 的几何字段：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `width` | `number \| '100%' \| 'auto'` | `'100%'` | 默认铺满头部内容区、高度由原生按图片比例撑开；数字为定宽（px），超出头部时按 `align` 居中溢出不被裁；`'auto'` 按原图宽不放大 |
| `align` | `'center' \| 'left' \| 'right'` | `'center'` | 自定义宽度时图片在头部内的水平对齐；超宽也按此对齐，弹窗 300 / 图 400 时两边各伸 50 |
| `offset` | `EdgeOffset` | `{}` | 四向有符号偏移，见下 |

`EdgeOffset` 是图片头与关闭按钮共用的类型：

| 字段 | 类型 | 说明 |
|---|---|---|
| `top` / `right` / `bottom` / `left` | `number \| string` | **正=向内收、负=向外伸**；数字按 px，字符串按 CSS 长度（`'10%'`、`'2vh'` 等）。关闭按钮同一轴取 `top` / `left`；图片头纵向例外（`bottom` 只进高度计算，见下） |

图片头用 `position:relative` + 定位属性承载偏移，不占 `transform`；面板已放开 `overflow`，负向外伸不会被裁。横向偏移（`left`/`right`）只改视觉位置，靠 flex 居中 + `max-width:none` 自然溢出，不需要测量。

**上下同时外伸**：`top` 与 `bottom` 同为负值时，组件用 Taro 官方 API `Taro.createSelectorQuery().select(id).boundingClientRect()` 量图片**真实渲染宽**（不是猜的容器宽），结合 `onLoad` 回灌的比例算出显示高 H，把 header 收窄到 `H + top + bottom`，从而实现上下同时伸出（例：H=100、top=-50、bottom=-20 → header 高 30，上伸 50、下伸 20）。此时 `bottom` 只参与高度计算、不写进 CSS 位移（relative 同时写 top/bottom 会被 CSS 丢弃）。

这套测量**仅当垂直偏移（top/bottom）为 px 数字时启用**；只给横向偏移、或垂直偏移是 `%`/`vh`/`var()` 字符串时，都不测量、不收窄，图片按原样撑高。量宽有限重试（30 次 × 32ms），耗尽或加载失败则放弃收窄、退回图片自然高（不外伸），绝不永久隐藏。

```tsx
// 默认铺满弹窗宽，高度按比例
<ContentPopup open variant="image" image={{ src: kv }} onClose={close} />

// 超宽仍居中溢出：弹窗 300、图 400 → 两边各伸 50，无需手算负偏移
<ContentPopup open variant="image" image={{ src: kv, width: 400, align: 'center' }} onClose={close} />

// 异形图上部伸出 40px，下部自然露出白色头部底色
<ContentPopup open variant="image" headerBackground="#fff"
  image={{ src: kv, offset: { top: -40 } }} onClose={close} />

// 上下同时外伸：上部出弹窗 50，下部进 body 20，header 自动收窄到 H-70
<ContentPopup open variant="image"
  image={{ src: kv, offset: { top: -50, bottom: -20 } }} onClose={close} />

// 非对称图左侧伸出 12px
<ContentPopup open variant="image" image={{ src: kv, offset: { left: -12 } }} onClose={close} />
```

### `badge` 档：外伸徽标头

**外伸的是容器本身**，不是里面的图标浮出去。徽标的全部配置收进一个 `badge` 对象（内容、容器、描边、定位四组正交），下面可带 `title`、也可没有；**没有 `badge.content` 就不渲染头部**，只传标题不会出现空容器。

`badge` 对象：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `content` | `ContentPopupHeaderIcon`（见下） | 必填 | 四形态图标，与 `title` 档的 `headerIcon` 同一类型、同一渲染 |
| `tone` | `'blue' \| 'green' \| 'red' \| 'yellow'` | `'blue'` | 预设色：整条渐变随主题反色（明档深、暗档浅）；显式 `background` 盖过它 |
| `size` | `number \| string` | token 72px | 容器尺寸：圆直径 / 方边长；数字为 px，字符串按 CSS 长度 |
| `radius` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'circle' \| number \| string` | `'circle'` | 圆角，`circle` 是 50% 正圆；数字为 px，字符串如 `'24%'` |
| `background` | `ContentPopupBackground` | tone 渐变 | 容器背景，纯色或渐变；传纯色时自动盖掉 tone 预设渐变 |
| `border` | `false \| { width?: number \| string; color?: string }` | 开，宽/色走 token | 徽标**外圈**这道描边默认就有，默认色跟随面板底色；`false` 关闭，传对象可覆盖宽/色。与 header 横向分割线无关 |
| `overlap` | `number \| string` | `'50%'` | 向上浮出量，参照容器自身高度；走 transform，不接负值 |
| `offset` | `{ x?: number \| string; y?: number \| string; anchor?: 'center' \| 'left' \| 'right' }` | `{ anchor: 'center' }` | 有符号微调：x 参照面板宽、y 走 `top`（负值向上），`center` 档 x 以 `calc(50% ± x)` 生效 |

`ContentPopupHeaderIcon` 四形态（判别联合，title 档 `headerIcon` 与 badge 档 `content` 共用）：

| `kind` | 字段 | 渲染方式 |
|---|---|---|
| `'icon'` | `name: string`、`size?: IconSize \| number`、`color?: string` | 库内置图标，`name` 必须是 `库名:图标名`；尺寸缺省由槽位 CSS 决定（inline 走 title-icon token，raised 走 xl 档） |
| `'iconClass'` | `className: string`、`size?: number \| string`、`color?: string` | 第三方/字体图标，类名可含多个（如 `'fa fa-star'`），样式由接入方图标库自带；**不走 `Icon` 的 name 解析** |
| `'image'` | `src: string`、`width?` / `height?`、`onClick?` | 图片，`mode="aspectFill"` 铺满容器、由外伸盒圆角 + `overflow:hidden` 裁圆 |
| `'glyph'` | `node: ReactNode` | 自绘节点（SVG-mask 组件等），尺寸由调用方在节点里自定 |

`color` 仅对单色字体图标生效；COLR/CPAL 彩色字形（如演示站的 `tool-kit`）吃不到 `color`，要换色只能换素材。显式 `color` 优先于 `iconColor` 与 `headerTone` 的默认字色，深/浅底上的对比度由调用方自行保证。

**两档是同一个 header**：图标四形态、主标题（lg）、字色 token、分割线共用一份实现与类族；`badge` 只多一层「带背景/圆角/外伸位移的盒子」和标题上方间距，不是另一套标题组件。差异：副标题只在 `title` 档显示；`badge` 只有 `anchor='center'` 出标题，靠左/靠右只有图标；`badge` 外圈描边默认开，但 header 横向分割线默认关。

另：顶层 `title` 只在徽标居中时作为下方主标题，靠左/靠右不出；badge 档默认有分割线（与 title 档一致）。`headerTone` 控制的是 header 区字色，徽标标题落在透明 header 上，跟随面板主题即可，不必按徽标底色传。

```tsx
// 图片徽标（截图形态）：圆形容器 + 面板同色描边 + 图片裁圆，靠上偏移
<ContentPopup open variant="badge" title="是否开启相册备份"
  badge={{
    content: { kind: 'image', src: avatarUrl },
    size: 72, radius: 'circle',
    border: { width: 2 },
    overlap: '40%',
    offset: { y: -8 },
  }}
  onClose={close} />

// 第三方图标：两个类名原样透传
<ContentPopup open variant="badge"
  badge={{
    content: { kind: 'iconClass', className: 'fa fa-user', size: 36 },
    border: false,
  }}
  onClose={close} />
```

### 内容与底部

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `children` | `ReactNode` | — | 内容区 |
| `footer` | `ReactNode` | — | 底部整体槽位，传了就覆盖按钮配置与 `footerConfig` |
| `actions` | `ContentPopupAction[]` | — | 复用 ImagePopup 的文字按钮 `{text} + ButtonProps` 与图片按钮 `{src}`；`color` / `icon` 直接走 ButtonProps |
| `actionsLayout` | `'row' \| 'column'` | `'row'` | 旧简写：左右排 / 上下排，等价于 `footerConfig.layout` 的 `row` / `stack` |
| `actionsAlign` | `'center' \| 'left' \| 'right'` | `'center'` | 旧简写：只在 `spaced` + `row` 档生效，其它档忽略 |
| `footerConfig` | `ContentPopupFooterConfig` | — | 底栏排布、分隔与上边线配置，优先于上面两个简写，见下 |

**`footerConfig` 四档形态**（`layout` × `separation` 两轴正交）：

| 形态 | 配置 | 效果 |
|---|---|---|
| 单按钮拉通 | `{ layout: 'stack' }` + 一项 | 一项独占一行、撑满底栏 |
| 多按钮竖排拉通 | `{ layout: 'stack' }` + 多项 | 每项一行撑满，配几项就几行 |
| 横排等分 / 按比例 | `{ layout: 'row', ratios: [1, 2] }` | 无 `ratios` 时按内容宽 + `actionsAlign` 对齐；给 `ratios` 时按权重分配宽度 |
| 竖线分隔（joined） | `{ layout: 'row', separation: 'joined' }` | 无间距，格子间用竖线分隔；`stack` 档的 joined 用横线分隔 |

```ts
interface ContentPopupFooterConfig {
  layout?: 'stack' | 'row'          // 默认随 actionsLayout（row → row、column → stack）
  separation?: 'spaced' | 'joined'  // 默认 spaced：间距分隔、无 border
  divider?: boolean                 // footer 与 body 之间的上边线；joined 默认开、spaced 默认关
  dividerColor?: string             // 覆盖上边线与中间分隔线颜色，缺省 --mptk-border
  ratios?: number[]                 // 仅 row 档生效，与 actions 一一对应的 flex 权重
}
```

- `spaced` 档文字/图片按钮之间走 token 间距、**默认没有 border**；只有 `joined` 档默认带上边线与中间分隔线，也可显式 `divider: false` 关掉。
- `joined` 档是**与面板融为一体的文字按钮栏**：底栏通栏贴底、四边无留白（无左/右/下 padding，靠 foot 节点真的挂 `mptk-content-popup__foot--joined` 让 `padding:0` 生效），按钮默认走 `ghost` 皮肤（透明底、无描边，调用方显式传 `variant` 时尊重），文字色/icon 走 `ButtonProps` 的 `color` / `icon`。分隔线落在格子的 `border` 上（横排左边框、竖排上边框），**格子圆角归零（`--mptk-radius-none`），分隔线贯通整格上下**；格子内 Button 的左右内距归零（`--mptk-btn-px`），让文字 / 图标在均分格子里真正居中。按钮文字区高度由 `actions` 的 `size` 决定（演示站统一 `md` = 40 / 14）；分隔线的高度另走 joined 格子的 `height`（`--mptk-control-h-lg` = 48px），比按钮略高，两轴解耦——改按钮大小不会顺带改线高。不再有 `--mptk-c-content-popup-footer-h` 这类专属 token。居中/上浮档底栏自裁底两角，底部档贴屏不裁。不用伪类、不用负 margin。
- 优先级统一为 **槽位 > `footerConfig` > 旧简写 > 默认**。要完全自绘就不传头部/按钮配置，只传 `children` + `surface='none'`；不需要新造「透明模式」。

## 行为契约

- **位置**：只支持顶部 / 中部 / 底部；左右抽屉不支持，越界值运行时回落 `'center'`，不抛错。顶部档徽标不外伸，降级为内联图标头；关闭叉固定面板下方右（`below-right`）。
- **高度**：沿用 Popup「高度由内容撑开、不写 `max-height`」；要滚由调用方在 `children` 里包 `scroll-view` 并给确定高。
- **分割线标准**：头部与内容之间的线是**头部的下边框**（不是独立节点），线及以上都归 header——`headerBackground` 的渐变铺到线为止；线通栏（左右顶到面板边）。线以下的间距是**内容区的上间距**（`--mptk-space-4`，16px），由 `.mptk-content-popup__content--top-gap` 恒给，不随分割线显隐消失；线本身上方由 header 的 `padding-bottom` 留同档间距。线色走 `headerDividerColor`，默认 `--mptk-border`。以后本弹窗里新增任何分割线都按这条标准走。
- **圆角裁切**：面板为徽标外伸开了 `overflow: visible`，不再替头部裁圆角；头部按面板档位自裁上两角（居中档恒圆、底部档仅 `round` 开启才圆，取 `--mptk-c-popup-radius`），渐变不会溢出圆角。
- **徽标避让**：`badge` 形态下若 `closePosition` 落在面板内 `top-*` / `edge-top-*`，自动回落到中线外置档（底部 `above-center`、其余 `below-center`），避免与外伸容器叠在一起。
- **空态**：`badge` 档没给 `badge.content` 时不渲染头部，只传标题也不会出现空容器。
- **进出场与关闭路径**：同 Popup——挂载即渲染、播完时长再卸载；关闭叉走 `onClose`，点遮罩走 `closable`，两者正交。
- **浮出实现**：`position: absolute` + `transform` 位移，不用负 margin / `gap`（Skyline 不支持）；面板对徽标放开 `overflow`，外伸部分不被裁。

## 不做什么

- 不做左右抽屉（含 handler / footer / 关闭叉，全部交给基础 `Popup` 裸壳自定义），也不做命令式 API / 浮层栈 / portal。
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
- 2026-11-22：外伸徽标 10 个平铺字段收进单一 `badge` 对象；内容扩为四形态判别联合（内置 icon / 第三方类名 / 图片 / 自绘节点，新增图片与第三方通道）；描边支持 `false` 关闭，默认色由 `surface-1` 改 `surface-elevated` 使暗档与面板同色；浮出量与有符号 x/y 微调分离（y 走 top 避免 `translateY(--n)`）；修 `badgeReserve` 对 `'20px'` 的解析与「只传标题也画空徽标」两处 bug。
- 2026-11-22：`title` 与 `badge` 两档收敛为同一份 header 渲染——图标四形态统一 `__lead-*` 类族、文案块统一 `__title-text`，raised 档只多一层外伸盒与标题上间距修饰；主标题两档同为 `--mptk-font-lg`。新增 `headerImage` 独立图片背景入口（与纯色/渐变同层叠加，不裁切外伸图标）、`headerIcon` 与 `iconColor`（优先级 `content.color > iconColor > tone 字色`，COLR/CPAL 彩色字形不吃 `color`）。分割线默认值当时改为 title/badge 开、image 关（同日下一条再纠正为 title 开、image/badge 关）；补渲染自检覆盖以上入口。
- 2026-11-22：外伸徽标配色收敛进库 token——新增 `badge.tone`（blue / green / red / yellow），每档整条渐变随主题反色（明档深、暗档浅）、图标色与底色配套；demo 不再写死纯色与 headerTone，正圆给 blue、圆角方给 green，不单列配色切换。外伸形态只保留一个标题：`badge.subtitle` 移除、副标题只在 title 档显示、靠左/靠右不出标题。
- 2026-11-22：纠正两处「border」混淆——徽标**外圈**描边恢复默认开（色随面板底色），header 下方**横向**分割线改为仅 title 档默认开、image/badge 默认关，要分隔由调用方显式 `headerDivider` 打开；徽标图标 token 由 36px 收到 32px。
- 2026-11-22：`position` 扩到 `top` / `center` / `bottom` 三档（左右抽屉仍排除），顶部档徽标降级为内联头、关闭叉固定 `below-right`。底栏新增 `footerConfig`（`layout: stack | row` × `separation: spaced | joined`，加 `divider` / `dividerColor` / `ratios`），支持单按钮拉通、竖排拉通、横排等分或按比例、竖线/横线分隔四形态；`actionsLayout` / `actionsAlign` 降级为兼容简写。分隔线走格子 border、joined 才默认带上边线，spaced 默认无 border。
- 2026-11-23：修正 joined 底栏视觉——从「浅色实心圆角块 + 四周留白」改为与面板融为一体的通栏文字按钮栏（透明底、无左右下间距、上横线 + 中竖线、文字色/icon 可配）；新增 `--mptk-c-content-popup-footer-h` token。演示站改为弹窗内容第一行放 Segmented 配置控件，切档时 footer 实时响应，撤掉页面四个入口按钮。
- 2026-11-23："底部按钮"配置从弹窗内容移回外层 Cell（排在分组首位，与"形状"同一处切换），去掉"打开配置"按钮与弹窗内滑块，点开即所选形态。底栏高度从 96rpx（48px）改走 `--mptk-control-h-md`（40px）。
- 2026-11-23：修 joined 竖线上下留白与文字不居中。真正的根因是 foot 节点从未挂 `mptk-content-popup__foot--joined`，SCSS 的四边 `padding:0` 规则空转、默认上下 16px 内距一直生效——补挂类名后才真正贯通；另把 joined 格子内 Button 的左右内距归零，文字 / 图标在均分格子里居中。圆角归零同时保留，避免边框两端被圆弧吃掉。
- 2026-11-23：撤销底栏专属高度 token `--mptk-c-content-popup-footer-h`。按钮文字区由 `size` 决定（演示站统一 md = 40 / 14）；joined 格子另设 48px（`--mptk-control-h-lg`）让分隔线比按钮略高，两轴解耦。
- 2026-11-23：默认关闭位统一走中线（top / center 外下中、bottom 外上中），徽标内部档避让也回落到中线；演示站竖排最后一个「取消」改 ghost 纯文字无底色，与上面两个实心主操作拉开层级。
- 2026-11-24：修所有关闭叉错位——档位几何收进 WXSS `--mptk-popup-close-base-*` 基线变量，定位属性用裸 `var()`；`closeOffset` 改由组件内联标准定位属性叠加，去掉 WXSS 里带 fallback 的 `var()`（该项在 Skyline 下会让整条定位声明失效）。

- 2026-11-24：`closeOffset` 改按档位锚点换算生效边，修演示站「叉偏移」看不到位移；`CLOSE_ANCHOR` 与 CSS 基线逐档做一致性校验。
