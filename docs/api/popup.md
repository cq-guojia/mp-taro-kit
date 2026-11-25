# Popup 弹出层

`Popup` 是浮层里的通用面板容器；`ImagePopup` 站在它的 `surface="none"` 档上，传图片和按钮即成一张弹窗；[ContentPopup](content-popup.md) 同样基于本底座，做「头部 + 内容 + 按钮」的通用内容弹窗（只支持中部与底部）。遮罩本体、层级链与平台安全区注入归 [遮罩与浮层底座](overlay.md)，本文只写 Popup 与 ImagePopup 对外的契约。

## 接口 / 导出

`mp-taro-kit/ui/layout` 导出 `Popup`、`ImagePopup` 及各自的类型（`PopupProps` / `PopupPosition` / `PopupCloseShape` / `PopupClosePosition` / `PopupInsetTop` / `PopupRoundSize` / `PopupSurface` / `PopupContentPadding`、`ImagePopupProps` / `ImagePopupSlide` / `ImagePopupAction` / `ImagePopupActionsAlign`、尺寸模型 `ImageSizeInput` / `ImageWidthSpec` / `ImageHeightSpec` / `ImageFitMode` / `ImageSizeToken` / `ImageNaturalSize` / `ResolvedImageSize`）；完整子路径清单见 [遮罩与浮层底座](overlay.md)。样式从 `mp-taro-kit/ui/layout/style` 显式引一次。

不传 `size` / 圆角等尺寸档时走库 token；宿主改 token 即换全库默认值，组件不写死数值。

## Popup

### 形态与定位

`position` 取五档：`'top' | 'center' | 'bottom' | 'left' | 'right'`（默认 `bottom`）。上 / 下档通栏；左 / 右档是全高抽屉（宽度取 `--mptk-c-drawer-w`，240px，375 屏约 64%，不受面板限高影响）；居中档有默认宽 `--mptk-c-popup-center-w`（320px，375 屏两边各留 27.5px）且最大不超屏，不是通栏。Skyline 不支持 Vant 用的 `fit-content`，故居中档用 token 默认宽，消费方可覆盖。原独立 `Drawer` 已取消，左右滑入由 `left` / `right` 档承担。

**高度由内容撑开，不写死、不限高。** 面板高度完全由 children 决定：内容三行就三行高，不强行撑满一截，也不写 `max-height`。这是因为 Skyline 下 `max-height` 会参与 `fixed` 面板的高度计算，把内容撑高型面板顶成上限高，表现为底部一大块空白、外置关闭按钮参照错乱——所以面板不设上限，高度纯由 children 决定；内容确实超高时由调用方在 children 里包 `scroll-view` 并给确定高来滚（Skyline 下 scroll-view 要确定高才滚）。`--mptk-c-popup-min-h` 为 0，body 一律 `View` 直出（不套 `scroll-view`），`surface` 只管底色 / 内边距 / 圆角，两档模型统一。这一点对贴顶 / 贴底尤其重要——每个 sheet 内容不同，统一 35vh 必然留空。演示站里内容偏少的例子，在示例内容上给高度即可，不要反过来在核心控件钉高度。

圆角按档默认：居中档四角全圆，贴边档默认平角；贴边档传 `round` 只圆内侧两角。尺寸读 `--mptk-c-popup-radius`（`--mptk-radius-md` = 12px），单次换档传 `roundSize`（`'none' | 'sm' | 'md' | 'lg'`，派生 `.mptk-popup--radius-*` 类名切同一变量）。

### 关闭按钮

`closeable` 默认 `false`；开启后复用核心 `Button`，不在浮层里另造按钮皮肤。默认位置统一走中线：bottom 落在面板外上中（`above-center`），top / center 落在面板外下中（`below-center`）。top 档贴顶、上方外置档不可用；居中档两侧都可放，中线最稳不左右飘。组件把关闭按钮排在内容容器之后，避免被内容盖住。

样式拆成三个正交轴，由 `resolveCloseStyle()`（`src/ui/layout/close-style.ts`）算出 Button 的 `variant` / `radius`：

| 轴 | 参数 | 默认 | 取值 |
|---|---|---|---|
| 形状 | `closeShape` | `'circle'` | `'circle'`（正圆 → `radius="pill"`）/ `'rounded'`（小方角 → `radius="sm"` 8px） |
| 描边 | `closeBorder` | `true` | 有 / 无描边 |
| 背景 | `closeBackground` | `false` | 透明底（默认）/ 实底；叉色不随这轴变 |

外框走 `--mptk-c-popup-close-size`（26px），叉是自绘 `CloseGlyph`（边长固定 12.8px），两轴互不联动。有边 → `soft`，无边 → `solid`；背景轴只换底色，不改叉色——**默认透明底**（`closeBackground={false}`，底色 `--mptk-c-popup-close-bg-translucent` 明暗同为 `transparent`：遮罩已按主题加深，不再靠按钮底色补偿），传 `true` 才是实底。非实底类 `.mptk-popup__close--translucent` 是三类名，压过 Button 自己的 `.mptk-btn--default.mptk-btn--soft` 双类名，默认档不会吃回实底。`soft` 档再用三类名让描边跟随 `--mptk-btn-fg`（与库内 tone 档 soft 同色约定一致）。叉色按按钮落点分两套：面板内档（`top-*` / `edge-top-*`）取组件私有 token `--mptk-c-popup-close-fg`，明色 `gray-8`（白面板上的深叉）、暗色 `--mptk-fg`（深面板上的亮叉，解析为色板 `ink-1`），与面板底色对称；面板上方 / 下方的全外置档由 `isOnOverlayClosePosition()` 加挂 `.mptk-popup__close--on-overlay`，四类名取 `--mptk-c-popup-close-fg-on-overlay`（白 82%，亮而不纯白、明暗同值，因为遮罩在两套主题下都是黑）。跨半档一半压着面板，不算全在遮罩上。**有背景档（`closeBackground={true}`）同样按落点分两套底色**：面板内档沿用 Button default 的主题实底（明色近白、暗色深灰），配上面的主题叉色；全外置档改取 `--mptk-c-popup-close-bg-solid-on-overlay`（`#262b32`，明暗同值）配亮灰叉——底色必须跟着容器走，若沿用明色主题的近白实底，亮灰叉叠上去只有 1.29:1、等于消失。`solid-bg` 与 `translucent` 两类互斥，四类名压过 Button 的双类名。这样白面板上不会出现看不见的亮叉，黑遮罩上也不会仍是深色看不清。关闭按钮尺寸不随这个改，外框与叉仍是 26 / 12.8px。演示站自己的「背景」开关是应用态，不影响库默认值。

叉不用字体图标：字形墨迹相对行盒偏上，且 iOS / Android 基线度量不同，固定位移无法跨端根治。自绘叉把两笔 SVG path 画在 viewBox 正中（`--mptk-c-close-mask`），几何中心即容器中心；颜色取 `currentColor`，经 Button 的 `glyph` 槽位由 `--mptk-btn-fg` 注入。

`closePosition` 只能用当前形态支持的值，不支持则回落到该形态默认值；`left` / `right` 档不渲染关闭按钮：

| 形态 | 面板内 | 跨上边一半 | 面板上方 | 面板下方 | 默认 |
|---|---|---|---|---|---|
| `bottom` | `top-left`、`top-right` | `edge-top-left`、`edge-top-right` | `above-right`、`above-center` | — | `above-center` |
| `center` | `top-right` | `edge-top-right` | `above-right` | `below-center`、`below-right` | `below-center` |
| `top` | — | — | — | `below-center`、`below-right` | `below-center` |
| `left` / `right` | 不支持 | 不支持 | 不支持 | 不支持 | 无关闭按钮 |

几何口径：`top-left` / `top-right` 离上边与左右边各 `--mptk-space-3`（12px），四边等距；`edge-top-*` 只**垂直**跨自身高度一半，左右留 `--mptk-space-4`（16px），不整体横向出界；`above-*` / `below-*` 与面板上下留 12px，靠右档右侧同样 12px，居中档水平居中。外置档锚在面板边缘内侧（`top` / `bottom: 0`），再用 `transform` 按**按钮自身高度**移出面板：`above-*` 用 `--mptk-s-full-neg`（-100%）上移、`below-*` 用 `--mptk-s-full`（100%）下移——百分比参照按钮自身，是确定量，不参照面板高度，面板高度变化也不影响按钮位置。

`closeOffset` 是在 `closePosition` 档位基础上的**增量微调**（类型 `EdgeOffset`，与 `ContentPopup` 的 `image.offset` 共用）：四个字段 `top` / `right` / `bottom` / `left` 表示对应边 inset 的增量——正=该边向内收、负=向外伸；数字按 px、字符串按 CSS 长度。例如 `below-center` 档给 `{ top: 20 }`，按钮相对默认「外中下」位置下移 20px；给 `{ bottom: 20 }` 则上移 20px。同一轴同时给两边时按差值生效（`top - bottom`、`left - right`）。

**定位全程归 CSS**：档位几何基线写在 `--mptk-popup-close-base-*`，四向偏移由组件原样写成行内 CSS 变量 `--mptk-popup-close-shift-*`（未给的轴在公共类里默认 `0px`），档位类自己用 `calc(基线 + 正向 - 反向)` 算出最终 `top/right/bottom/left`。JS 不判断哪条边生效、不拼 `calc`、不碰 `transform`。八个档位各自只在它锚定的两条边上定位，四向变量都会被该档的 calc 消费，任意方向的配置都生效。

不写 `var(--x, fallback)`（WXSS 会整条丢弃定位声明）；零基线必须写 `0px`（`--mptk-s-zero` 是无单位 `0`，`calc(0 + 10px)` 是无效 CSS，整条声明会被丢弃）。**不碰 `transform`**——外置档靠 transform 按按钮自身高度移出面板，覆盖会让按钮飞走。未给偏移时四个变量都是 `0px`，原档位位置一字不变。`tests/layout.test.mjs` 逐档校验定位声明、零基线与偏移变量的消费。

```tsx
<Popup open position="bottom" closePosition="top-right"
  closeOffset={{ top: -10, right: 12 }} onClose={close} />
// 在 top-right 档基础上上移 10px 避开图片头，再往里收 12px
```

**绝对定位的前提**：关闭按钮复用核心 `Button`，而 `.mptk-btn` 带 `position:relative`。所以 `position:absolute` 与 `z-index` 必须写在**双类** `.mptk-btn.mptk-popup__close`（权重 0,2,0）上压过它；若写在单类 `.mptk-popup__close`（0,1,0），会被后加载的同权重 `.mptk-btn` 覆盖，absolute 失效、按钮退回文档流、`right` 丢失、各档位置全部错乱（实测 × 落到左侧中部）。这与主流库（Vant 等）关闭图标直接 `position:absolute` 是同一诉求，只是本库复用 Button 需要额外提权。跨边 / 外置档会临时放开面板 `overflow`，否则按钮被裁。点关闭按钮走 `onClose`，与点遮罩关闭（`closable`）是两条独立路径。

### 面板表面 surface

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `surface` | `'panel' \| 'none'` | `'panel'` | `panel` 是有底色 / 内边距 / 圆角的常规面板；`none` 是裸壳——不画底色、内边距、圆角，只留遮罩 / 进场 / 关闭按钮 / 定位 |

`busy` / `locked` / `lockExceptions` 是底座的整框交互锁，语义、例外键与双端落法集中在 [ContentPopup 的整框交互锁](content-popup.md#整框交互锁)，两处共用同一套上下文；普通文字弹窗不走 ContentPopup 也能用。

两档的**高度模型完全相同**：body 都是 `View` 直出，面板高度由 children 撑开；surface 只管底色 / 内边距 / 圆角，不再有「panel 写死高、裸壳撑高」的分裂。裸壳用于「自己画内容」：children 塞什么就显示什么，遮罩、`overlayTone` / `overlayOpacity`、关闭按钮及其位置全保留。样式上 `.mptk-popup--surface-none .mptk-popup__panel` 放样式表末尾、双类名覆盖各档位（含 `--round`），不依赖样式表顺序。主流库多是值型背景开关，这里连 padding、圆角一起关，故取 `surface` 做档位。

**完全自定义的形式**：直接用底座 `Popup` 传 `surface="none"`，整块内容塞进 children，不要再套 `ImagePopup` / `ContentPopup`——那两个是「配好头部 / 图片 / 按钮」的配置式封装，自己画时不需要它们。裸壳撤掉的是面板自身的底色、16px 内距、圆角、`overflow:hidden` 与 `min-height`；其余浮层能力原样保留：

```tsx
<Popup
  open={campaignOpen}
  position="bottom"
  surface="none"
  overlayTone="dark"
  overlayOpacity="default"
  closable
  closeable
  closePosition="above-center"
  closeOffset={{ top: -8 }}
  onClose={() => setCampaignOpen(false)}
>
  <View className="campaign-sheet">…整个背景、圆角、内容都自己写…</View>
</Popup>
```

- `closable`（点遮罩关闭，默认开）与 `closeable`（显示关闭叉，默认关、必须显式给）是两个正交开关；不传 `onClose` 则不渲染叉。
- `closePosition` 全档与 `closeOffset` 四向偏移在裸壳下照常生效。外置档（`above-*` / `below-*`）叉色取遮罩上的亮灰；面板内档（`top-*`）叉色随主题取深色，自定义背景偏深时建议改用外置档。
- `insetTop` 只对 `top` / `left` / `right` 生效，`center` / `bottom` 强制 `none`。**裸壳下让位依赖宿主注入真值**：裸壳 CSS 把面板 padding 归零会压掉 `env()` 兜底，宿主未用 `createKitApp` 注入安全区真值时顶部不会让位；贴底横条同理。
- 面板高度由 children 撑开、不设上限；内容要滚就自己包 `scroll-view` 并给确定高。

内容容器两档一致，滚动统一交给调用方：

| 档位 | 内容容器 | 高度 | 调用方设置 |
|---|---|---|---|
| `panel`（默认） | `View` 直出（不套 scroll-view） | min 0、不限高，完全由 children 撑开 | 要滚则自己包 `scroll-view` 并给高 |
| `none` | `View` 直出（不套 scroll-view） | 同上，`min-height` / `max-height` / `overflow` 全撤 | 同上 |

需要滚动的场景（长列表 / 长图）由调用方在 children 里包 `scroll-view` 并给确定高（Skyline 下 scroll-view 要确定高才滚），`ImagePopup` 长图档就是这么做的。两路都保留让位注入；关闭按钮排在内容容器之后。`ImagePopup` 走 `none` 档，单图直接 `Image`、多图直接 `Swiper`。

### 让位与内边距

`insetTop` 取 `'none'` / `'status-bar'` / `'nav-bar'`，**只对 `top` / `left` / `right` 生效**：这三档不传默认 `nav-bar`、传了按传入档；`bottom` / `center` 传什么都强制 `none`，不产生顶部空白。让位与顶部内距写在同一层（面板 `padding-top`），状态栏区域仍是面板底色。

`contentPadding` 取 `number`（四边统一）或 `{ top?, right?, bottom?, left? }`（按边给，单位 px，未给的边走默认 16px）。它替换面板预留的 16px；**顶部让位与顶部内距取较大者，不累加**——两者目的相同（内容离屏幕顶多远），内距已经让够就不再叠加，让位更多就让位直接包含内距。以内距 16px 为例：让位 5 / 8 / 15px 时都用 16px；让位 20px 时直接用 20px，不是 36px。`resolveTopInset()` 内部先对呼吸 16px 取 max，再与 `contentPadding.top` 取 max。

真值必须由 runtime 注入，不能只靠 CSS `env()`：`navigationStyle: 'custom'` 时微信不预留状态栏空间，`env(safe-area-inset-top)` 最多给出状态栏高度、给不出胶囊下沿。宿主在 app 入口调一次：

```ts
import Taro from '@tarojs/taro'
import { configureSafeArea } from 'mp-taro-kit/runtime'

const windowInfo = Taro.getWindowInfo()
const menuButton = Taro.getMenuButtonBoundingClientRect()
const safeArea = windowInfo.safeArea
configureSafeArea({
  statusBarHeight: windowInfo.statusBarHeight ?? 0,
  menuButton: { top: menuButton.top, height: menuButton.height },
  bottomInset: safeArea && typeof windowInfo.screenHeight === 'number'
    ? Math.max(windowInfo.screenHeight - safeArea.bottom, 0)
    : 0,
})
```

`createKitApp` 已在入口注入这两组真值，走它就不必手写上面这段。

导航栏让位高度 = `statusBarHeight + 胶囊高 + max(menuButton.top - statusBarHeight, 0) × 2`，与 `NavBar.tsx` 同口径；不能写成 `(top - statusBar + height) * 2`（胶囊高乘两遍）。面板贴边定位不动，让位只加在内容 padding 上：遮罩、贴顶面板、抽屉面板一律 `top: 0`，不写负 `top`（Skyline 下会把整块顶出可视区）。未注入真值时走 CSS 兜底 `env(safe-area-inset-top)` / `calc(env(safe-area-inset-top) + var(--mptk-c-navbar-h))`，兜底同样落在面板层、不与内距相加；`resolveTopInset()`（`src/ui/layout/safe-inset.ts`）是唯一算法，Popup 与 Drawer 共用。

**顶部与底部都取最大，不累加。** 贴底形态（`bottom` / `left` / `right`）的底部内边距 = `max(呼吸 16px, 横条高度)`：呼吸与横条是同一目的（内容离屏幕底边多远），横条已经盖过呼吸就不再相加，否则全面屏上会白留一截。横条 0 的非全面屏用呼吸 16px。横条真值同样注入（Skyline 下 `env(safe-area-inset-bottom)` 不可靠），CSS 贴底档只留一个呼吸档 `--mptk-space-4`，JS 注入真值后写行内覆盖；`resolveBottomInset()`（`src/ui/layout/safe-inset.ts`）是唯一算法，Popup、Drawer 与贴底 [FloatingAction](floating-action.md) 共用。未注入时不猜、保持呼吸，由真机走 `createKitApp` 注入。`contentPadding.bottom` / `panelStyle` 可再次覆盖。

**留白落点看容器是否自身滚动。** 贴底面板是 `fixed` 定高容器、自身不滚，留白写在面板 `padding-bottom`（Popup 的 `bottom` / `left` / `right` 档）；全高抽屉是滚动容器，留白写在滚动内容末尾的尾距 View（`.mptk-drawer__tail`）上，随内容滚上去、横条区域可见，面板 `padding-bottom` 恒为 0——写在面板上会把滚动可视区截短、永远滚不到底。demo 站同理：`.demo-shell` 保持满高，安全区加在滚动内容 `.demo-page` 的末尾。

### 样式契约

默认值在 `kit.config.mjs` 的 `component` 段，组件样式只读 `var()`：

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-c-popup-center-w` | `320px` | 居中档默认宽，最大不超屏 |
| `--mptk-c-popup-min-h` | `0` | 面板最小高度，0 = 完全由内容撑开、不留空 |
| `--mptk-c-popup-center-rise` | `48px` | 居中档进场起始偏移：从目标位置下方 48px 上浮渐显 |
| `--mptk-c-popup-radius` | `var(--mptk-radius-md)` | 圆角尺寸，改一处换全库 |
| `--mptk-c-popup-close-size` | `26px` | 关闭按钮外框；叉固定 12.8px |
| `--mptk-c-close-mask` | SVG data URI | 自绘关闭叉遮罩，几何居中 |
| `--mptk-c-popup-close-bg-translucent` | `transparent` | 关闭按钮非实底档底色，明暗同值；叉色不动 |
| `--mptk-c-popup-close-fg` | 明 `var(--mptk-gray-8)` / 暗 `var(--mptk-fg)` | 面板内档与跨半档叉/描边色，按主题与面板底色取对称档 |
| `--mptk-c-popup-close-fg-on-overlay` | `rgba(255, 255, 255, .82)` | 全外置档叉与描边色，明暗同值（遮罩同为黑） |
| `--mptk-c-popup-close-bg-solid-on-overlay` | `#262b32` | 全外置档「有背景」实底色，明暗同值；配亮灰叉约 10:1 |
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
| `closePosition` | `PopupClosePosition` | — | 关闭按钮位置，沿用 Popup 档；不传按形态取底座默认（top / center 外下中，bottom 外上中） |
| `showIndicators` | boolean | `true` | 多图是否显示原生红点（`indicator-dots`） |
| `closeable` | boolean | `true` | 显示关闭叉（**默认与 Popup 的 `false` 不同**）；底部弹出的徽标头默认 `false`，显式传 `true` 可覆盖 |
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
- **面板底色**：`panel` 档取抬升面 `--mptk-surface-elevated`，暗档比页面底与卡片面更亮（按 iOS base/elevated 分层），避免深色页面加暗遮罩后弹窗糊成一片；`none` 档仍透明。
- **关闭路径**：关闭叉走 `onClose`，点遮罩走 `closable`，两者正交；遮罩本体行为也见上文。

## 更新日志

- 2026-11-19：从 `docs/api/overlay.md` 拆出 Popup / ImagePopup 契约独立成篇；遮罩本体、层级链与安全区注入留在 overlay.md，历史条目也留在原文，不重复搬运。
- 2026-11-20 21:57:03：修裸壳档错位：撤掉贴顶/贴底固定 height，高度真由内容决定
- 2026-11-20 22:16:12：核心改造：高度由内容撑开不再写死35vh，body统一View，关闭按钮默认右上，删sheet-h token
- 2026-11-23：默认关闭位统一走中线——bottom 外上中 above-center、top / center 外下中 below-center；ImagePopup 不传时按形态取底座默认。ContentPopup badge 形态显式内部档的避让也回落到中线。
- 2026-11-20 22:26:58：关闭按钮默认改外右上 above-right（bottom/center）
- 2026-11-20：规范修复关闭按钮跑屏幕左上/离面板远：面板撤掉 max-height（Skyline 下参与 fixed 面板高度计算，把内容撑高型面板顶成上限高、留底部空白），面板高度恒等于内容高，外置关闭按钮沿用 transform 按自身高度移出面板
- 2026-11-21：修关闭按钮各档位置全错乱的根因——单类 `.mptk-popup__close{position:absolute}` 被后加载的同权重 `.mptk-btn{position:relative}` 覆盖，absolute 失效、按钮退回文档流、right 丢失；absolute 与 z-index 移入双类 `.mptk-btn.mptk-popup__close`（0,2,0）压过 Button，定位方案保持 transform 不变
- 2026-11-20 23:25:59：底部留白改取最大不累加：贴底/抽屉 padding = max(呼吸 16, 横条)，横条真值随 configureSafeArea 注入（screenHeight - safeArea.bottom），CSS 撤掉 calc(16 + env)；修全面屏上底部白留一截
- 2026-11-20 23:32:48：底部留白口径补注：FAB 贴底与 Popup/Drawer 共用 resolveBottomInset 取最大
- 2026-11-21 00:31:40：补留白落点口径：滚动容器写内容尾距，定高面板才写面板 padding
- 2026-11-21 00:49:16：关闭按钮描边与叉改走 gray-6 次级图标档，暗色不再过亮；尺寸保持 26/12.8px 不变
- 2026-11-21 01:03:45：关闭按钮默认改半透明底：closeBackground 默认 false，ImagePopup 同步，三类名压过 Button 实底；演示站开关不动
- 2026-11-21 17:18:45：关闭按钮半透明底按主题取色：明色改白 rgba(255,255,255,.55)，暗色仍黑，修白面板上黑按钮
- 2026-11-21 17:24:32：关闭按钮明色微调：叉与描边用私有 token 取 gray-7 深一档，半透明底 alpha 55→35；暗色不变
- 2026-11-21 17:29:04：关闭按钮明色叉与描边 gray-7 改 gray-8：浅底对比度 1.6→3.8，与暗色档一致，不再模糊
- 2026-11-21 17:51:14：遮罩按主题加深，关闭按钮改透明底与落点分色：面板内按主题取色，全外置档在遮罩上统一亮灰非纯白
- 2026-11-21 18:05:37：有背景档按落点分底色：面板内沿用主题实底，全外置档改深底 #262b32 配亮灰叉，修明色近白实底吃掉亮灰叉
- 2026-11-21 18:13:45：暗色面板内与跨半档关闭按钮叉/描边由 gray-6 改主文字亮档（--mptk-fg，解析为色板 ink-1），与浅色主题白面板上的深叉对称；demo 位置文案外上改外中上
- 2026-11-21：补 ContentPopup 边界互链：同为 Popup 底座上的兄弟组件，本组件只管 Popup 与 ImagePopup
- 2026-11-21：面板底色改走抬升面 token `--mptk-surface-elevated`，暗档按 iOS base/elevated 分层提亮

- 2026-11-24：关闭叉错位根因修复——档位几何收进 WXSS `--mptk-popup-close-base-*` 基线变量、定位读裸 `var()`，去掉带 fallback 的 `var()`（WXSS 会整条丢弃定位声明）。修「叉偏移」无效果：`closeOffset` 现按 `CLOSE_ANCHOR` 换算到档位实际锚定的边，四向字段在任意档位都生效；删未用的 `resolveEdgeShift`、去重复 `cssLength`，并修贴底安全区被 `contentPadding.bottom` 覆盖。
- 2026-11-24 11:22:04：关闭偏移改由 CSS 变量驱动：档位 calc 算最终定位，零基线写 0px 修无效 calc
- 2026-11-24 23:20:36：补完全自定义的形式说明：直接用 Popup 传 surface='none' 并自行写 children；列清保留的遮罩/关闭叉全档与偏移、让位仅限 top/left/right 且依赖宿主注入真值、高度由内容撑开
- 2026-11-25 11:56:19：登记底座整框交互锁并指向 ContentPopup 的唯一说明
