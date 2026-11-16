# 遮罩与浮层底座

## 接口 / 导出

`mp-taro-kit/ui/layout`：`Overlay`、`OverlayProps`、`OverlayTone`、`OverlayOpacity`、`Popup`、`PopupProps`、`PopupPosition`、`MOTION_DURATION`
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

其余参数（`open`、`position` / `side`、`children`、`onClose`、`className`）保持原样。

## 层级链

一条链从下往上，组件只读不传。样式里出现写死的 `z-index` 数字即为违约，测试会拦。

| token | 默认 | 谁在上面 |
|---|---|---|
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
| `--mptk-c-popup-max-h` | `80vh` | 面板限高，超出后内容区自己滚 |
| `--mptk-c-drawer-w` | `280px` | 抽屉宽度；滑入滑出按自身宽度算 |

## 行为契约

- **进出场**：组件挂载即渲染，关闭时先置收起态、播完 `duration` 再卸载；`duration: 0` 立即卸载（低端机 / 减少动效）。遮罩淡入淡出，贴底 / 贴顶面板位移进出，居中面板只淡入。
- **安全区**：贴底面板 `padding-bottom`、贴顶面板 `padding-top`、抽屉 `padding-bottom` 各加一段 `env(safe-area-inset-*)`，没有横条的设备算 0。三个贴顶层（遮罩、Popup 的 top 档、抽屉面板）的 `top` 取 `calc(0px - env(safe-area-inset-top))`：Skyline 下 fixed 的 0 落在页面内容区起点，写 0 会让状态栏那一条露白。不给开关：底部横条必须让，否则内容被压住。
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
