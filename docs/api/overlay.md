# 遮罩与浮层底座

## 接口 / 导出

`mp-taro-kit/ui/layout`：`Overlay`、`OverlayProps`、`OverlayTone`、`OverlayOpacity`、`Popup`、`PopupProps`、`PopupPosition`、`PopupCloseShape`、`PopupClosePosition`、`PopupInsetTop`、`PopupRoundSize`、`PopupSurface`、`PopupContentPadding`、`ImagePopup`、`ImagePopupProps`、`ImagePopupSlide`、`ImagePopupAction`、`ImagePopupActionsAlign`、`ImageSizeInput`、`ImageWidthSpec`、`ImageHeightSpec`、`ImageFitMode`、`ImageSizeToken`、`ImageNaturalSize`、`ResolvedImageSize`、`MOTION_DURATION`
`mp-taro-kit/ui/navigation`：`Drawer`、`Dropdown`（遮罩引用 layout 那一份）
`mp-taro-kit/ui/infra`：`OverlayHost`（命令式 Dialog 也挂同一份遮罩）。
`mp-taro-kit/ui/layout/style`、`mp-taro-kit/ui/navigation/style`、`mp-taro-kit/ui/infra/style`：各自组件样式出口，宿主显式引一次

**全库只有一份遮罩实现**（`.mptk-overlay`），浮层只声明「要不要遮罩、点遮罩关不关」。谁的样式里再写 `position: fixed` 的全屏蒙层，就是又造了第二份，测试会拦。

`Popup` 面板与 `ImagePopup` 图片弹窗的对外契约见 [Popup 弹出层](popup.md)；本文只写遮罩本体、层级链与平台安全区底座。

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
| 浓度 | antd 的 `opacity`（thin .35 / default .55 / thick .75 / 数字） | 取，三档 + 数字；三档默认值按主题配（明色更深，见样式契约） |
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
| `lockScroll` | boolean | `true` | 遮罩挂 `catchMove` 吞掉背后页面的触摸冒泡 |
| `duration` | number | `MOTION_DURATION`（300） | 进出场时长，`0` = 立即卸载 |
| `className` | string | — | 追加根类名 |

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

默认值全部在 `kit.config.mjs`：底色在 `component` 段（主题无关），三档浓度在 `light` / `dark` 段（按主题取），组件样式只读 `var()`，不在别处写死。

同一张黑遮罩压在浅底上比压在深底上显淡，所以明色三档各比暗色深一档，两套主题拉出来观感才接近；暗色档保留 Vant / antd 的基线值。

| 变量 | 明色默认 | 暗色默认 | 作用 |
|---|---|---|---|
| `--mptk-c-overlay-color` | `#000` | `#000` | 遮罩底色（深色档），主题无关。**不取 `--mptk-fg`**：那是字色，暗色下是浅灰，会把遮罩变成白蒙版 |
| `--mptk-c-overlay-color-light` | `#fff` | `#fff` | 遮罩底色（浅色档），主题无关 |
| `--mptk-c-overlay-opacity-thin` | `.5` | `.35` | 浓度：薄 |
| `--mptk-c-overlay-opacity` | `.75` | `.55` | 浓度：默认（暗色对齐 Vant / antd 的 .55~.6） |
| `--mptk-c-overlay-opacity-thick` | `.85` | `.75` | 浓度：厚 |
| `--mptk-c-motion-duration` | `300ms` | `300ms` | 浮层进出场时长，主题无关；必须带 CSS 单位（裸数字会被丢弃、动画失效）；数值与 JS 的 `MOTION_DURATION`（300，毫秒）一致，测试断言 |

## 行为契约

- **滚动穿透**：遮罩挂 `catchMove` 拦事件冒泡。这是事件层的兜底，不碰滚动容器的属性（切 `scroll-y` 既拦不干净、又会在 Skyline 下触发原生 scroll-view 重建）。
- **滚动位置保持 = 节点层级隔离**：浮层开合绝不与页面滚动容器同级插拔。Taro 把 React 的 state 更新归级到 Page 的 `setData`；若浮层节点和 `ScrollView` 是同一父节点下的兄弟，浮层增删时渲染层 diff 范围扩大，原生 `scroll-view`（Skyline 的增强自建容器）被重建，它的 `scrollTop` 是实例状态、不在虚拟 DOM 里，一重建就归零——表现为关掉浮层后回顶。正确结构：滚动区待在稳定分支（带稳定 `key`），所有会增删的浮层放进一个**恒定存在**的容器（demo 里的 `demo-shell__overlays`），开合只动这个容器内部。这条是消费方的页面结构契约，库不强插容器；demo 提供可照抄的写法。**三件都不做**：不记坐标再 `scrollTo` 跳回、不切 `scroll-y`、不写受控 `scrollTop`。
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
- 2026-11-18：`closePosition` 支持表扩展——`bottom` 增右侧内部 / 跨半两档（`top-right` / `edge-top-right`）、`top` 档新增面板下方两档（`below-center` / `below-right`，默认 `below-center`）；演示站关闭按钮位置按底部 / 中部 / 顶部合并成三个 Cell 行、行内横排按钮，只演示代表位置，底层已有支持不变。
- 2026-11-19：新增 `Popup` 的 `surface: 'panel' | 'none'` 裸壳档（面板不画底色 / 内边距 / 圆角、min-height 归零，遮罩 / 浮起 / 关闭按钮全留）；新增 `ImagePopup` 图片弹窗——一张图配一组按钮，单图直出、多图 Swiper 翻页带红点，按钮复用现成 Button、`actionsAlign` 控排布，图片尺寸走四级优先级解析（`src/ui/layout/image-size.ts`）。不新建底层，`ImagePopup` 就是 `surface="none"` 的居中 Popup；演示站 popup 页加单图 / 多图示例。
- 2026-11-19：内容容器随 `surface` 走——`panel` 档保持 `ScrollView`（长内容自滚），`none` 档改 `View` 直出并撤掉面板 `max-height` / `overflow`（内容自己定高）；不新增滚动开关，与 Vant / NutUI / antd-mobile 的收敛路线一致。修掉此前「裸壳档用 ScrollView 导致面板无固定高时塌成 0、图片全空」的回归；两路都保留让位注入，关闭按钮仍排在内容容器之后。
- 2026-11-19：修 ImagePopup 一批回归——① 索引无条件钳到 `[0, slides.length-1]`，修「多图滑到末页后切单图，`slides[old]` 为 undefined 导致组件返回 null、单图再也打不开」；② 单图 / 多图共用 `renderSlideImage`，尺寸四级优先级对每一屏独立生效，多图不再统一写死兜底宽 + `aspectFit`；③ Swiper 注入各屏解析高度最大值、每屏包 `.mptk-image-popup__slide` 双轴居中，修「原生 swiper 默认高度把高图裁一半、图片不居中、panel 高度错导致关闭叉贴图片」；④ demo 三个尺寸按钮分别演示外下中 / 外下右 / 外右上，多图三图各用 fit / ratio / natural 一屏一档。
- 2026-11-19：ImagePopup 尺寸模型整体重构（breaking）——弃用 `displayWidth/displayHeight/aspectRatio`，改 `width(number|'100%'|'auto')` / `height(number|'auto')` / `ratio`(宽/高，对齐 CSS) / `maxWidth/maxHeight`(px；scroll 视口高可用 vh/%) / `fit('contain'|'scroll')`；单图 / 多图每屏 / 图片按钮共用 `resolveImageSize`，`onLoad` 回灌真实尺寸在组件内消化首帧跳变。新增「图片按钮」(`{src,width,height}`) 与文字按钮混排、默认间距走 token `--mptk-image-popup-action-gap`；scroll 档用只开 `scroll-y` 的 ScrollView（零 X 滚动）；面板宽度贴合定宽图片修「叉超出图片右缘」；红点去掉 `var()` 自定义色改回原生默认。demo 换三张真实图，图片弹窗示例收敛为三类三个 Cell：图片（单图 / 多图翻页用两张正常高度图）、带按钮（库按钮 / 图片按钮两类、图片按钮用指定 lottery-center 图）、图片尺寸（定宽 / 定高 / 长图只 Y 滚动）；长图不参与翻页、只在尺寸档演示。`closeable`(显示叉) / `closable`(点遮罩关) 正交不变。
- 2026-11-19：演示站图片弹窗按你给的三类重排为三个 Cell（图片 / 带按钮 / 图片尺寸）；单图与多图翻页改用两张正常高度图，超长图只留给「长图滚动」尺寸档；带按钮分库按钮与图片按钮两类、默认居中，图片按钮换用指定的 lottery-center 图；三个尺寸按钮分别演示外下中 / 外下右 / 外右上。
- 2026-11-19：修 ImagePopup 几何一批回归——① 面板宽度改由 `resolveImageSize().widthPx` 驱动、经 `Popup.panelStyle` 内联，修「`typeof width==='number'` 判断在 width 变 CSS 字符串后恒假 → 面板退回固定宽 → 左右留白、外下右叉比图片更靠右」；② Swiper 高度从「取所有页最大」改为「跟随当前页」，切高图框变高、关闭叉随之下移，切矮图框变矮；③ 长图档 demo 改确定宽 `width:240` + `maxHeight:320` + `fit:'scroll'`、关闭位回默认外下中，滚动区域贴图片右缘、视口不再顶满屏；④ `'100%'` 档不再按宽估值换 `aspectFit`，保持 `widthFix` 避免滚动视口高于图片。
- 2026-11-19：尺寸引擎根治图片变形——铁律改为「Image 只锁一个维度」：定宽 `widthFix`、定高 `heightFix`、废除 `aspectFit` 盒子；解析结果拆出 `widthPx`（显示的确定像素宽）/ `displayHeight`。修三处：① 定高档面板贴合「显示宽 = 高 × 比例」而非原图像素宽，按钮回到图片右下角内；② 长图 scroll 档不再把 `height`+`maxHeight` 写到 Image（旧版把它压成竖细条），改由固定宽高视口承载、`widthFix` 保持真实比例在 Y 轴滚；③ 多图每屏给确定宽、不锁高，高度按各图比例自适应（矮图矮高图高），Swiper 取当前页 `displayHeight`；图片与视口 CSS `flex:none` 防被压。contain 的 max 折算进宽度上限，不拉伸。
- 2026-11-19：居中档默认宽 `--mptk-c-popup-center-w` 280px → 320px（对齐 Vant Dialog，两边留白减半），JS 兜底内容宽 `DEFAULT_CONTAINER_WIDTH` 同步 248 → 320；demo 各档图宽统一 240 → 320（多图 / 带按钮 / 图片按钮 / 定宽 / 长图滚动），高度不变（定高仍 240、长图视口仍 320）。库按钮示例从只有边框的 `variant:'soft'`（白底太透看不清）改实心 `type:'default'`。
- 2026-11-19：多图切页加高度过渡动画——`.mptk-image-popup__swiper` 对 `height` 做 CSS transition（`--mptk-dur` / `--mptk-ease`，`0s` 可关），JS 仍只在 `onChange` 改内联高度；移植自笔记浏览页 swiper 的 160ms 过渡，消除矮图/高图切换时图片与关闭按钮的上下瞬跳。
- 2026-11-19：图片弹窗关闭按钮左右档贴边——`.mptk-image-popup__panel` 作用域内把 `top-*` / `edge-top-*` / `above-right` / `below-right` 的 `left` / `right` 归零，与图片左右缘齐平（面板已贴合图片宽，再留 12px / 16px 内侧间距看着怪）；基础 Popup 各档间距与其它形态不变。
- 2026-11-19：`width` 默认值从 `'100%'` 改为「内容区可用宽的确定像素」（单图 320px）——`'100%'` 的宽度由容器决定、`widthPx` 恒 `null`，面板拿不到像素宽无法贴合、小图还被拉满内容区；改后未给宽的图默认按面板宽显示、面板同步贴合。`'100%'` 仍可显式传。
- 2026-11-19：尺寸引擎与图片弹窗收口一批——① 上界全档生效：`maxWidth` 不再依赖比例（原来比例未知时整段跳过）、定高档折算 `maxHeight`/`maxWidth`、scroll 档 `maxWidth` 约束视口宽（contain 档只认数字与 `px`，vh/% 折不了）；② `'100%'` 档比例已知时按内容区宽折算 `displayHeight`，多图不再拿兜底 320 硬定高；③ `'auto'` 按原图宽但不超内容区，宽图不出面板；④ `onLoad` 回灌改按 `src` 索引（换图不串比例），加 `onError` 把加载失败/0×0 标为「已定论」，图片不再永久隐藏；⑤ scroll 屏 Swiper 高度改用 `maxHeight` 原值（px / vh 都能用）、未给时 `80vh`，撤掉写死的 3×320；⑥ 图片按钮默认宽从 `'100%'` 改 `'auto'`（容器宽 200 兜底、具名常量），按钮组加 `flex-wrap` 防混排挤行；⑦ `ui/layout` 出口补 `ImageSizeInput` / `ImageWidthSpec` / `ImageHeightSpec` / `ImageFitMode` / `ImageSizeToken` / `ImageNaturalSize` / `ResolvedImageSize` 类型。文档同步：删掉已废弃的 `displayWidth` 措辞、补 `open` / `onClose` 与 `closeable` 默认 `true`、说明 `contain` 档不内置高度天花板（`80vh` 只是 scroll 档视口兜底）、「滚动条」改「滚动区域」（微信默认不显示滚动条）、样式表补 `--mptk-image-popup-action-gap`。
- 2026-11-19：Popup / ImagePopup 组件契约拆到 api/popup.md；本文只保留遮罩本体、层级链与安全区底座，历史条目留在本篇可追溯。
- 2026-11-21 17:51:14：三档浓度从 component 移到 light/dark，明色各深一档，使明暗遮罩观感接近
- 2026-11-21：`lockScroll` 在 KitPage 子树内自动保存/恢复滚动偏移，关闭浮层不再把用户带回顶部
- 2026-11-21：废弃「记 scrollTop 再 scrollTo 跳回」（浮层在 KitPage 外拿不到 context、恢复从不执行）。改全局锁切 `scroll-y`——实测 Skyline 下仍回顶，一并废弃
- 2026-11-22：查实真根因（Taro 更新归级到 Page.setData，浮层与 ScrollView 同级增删令原生 scroll-view 重建、scrollTop 归零）。改为节点层级隔离：滚动区带稳定 key、浮层放进恒定存在的隔离容器；撤销全局锁 / 切 scroll-y / 记位置跳回三套无效方案
