# 对外契约

本库对外的静态契约由 `package.json#exports` 与 `dist/**/*.d.ts` 承载：参数、返回值与组件类型以 `.d.ts` 为真源。本文只写类型声明表达不了的出口形态、运行时约定与版本下限。控件的使用方法与效果展示见 `demo/` 小程序演示站。

## 出口清单

| 子路径 | 类型条件 | ESM | CJS | 说明 |
|---|---|---|---|---|
| `mp-taro-kit` | `dist/index.d.ts` | `dist/index.js` | `dist/index.cjs` | 五个能力域的具名汇总出口 |
| `mp-taro-kit/design` | `dist/design/index.d.ts` | `dist/design/index.js` | `dist/design/index.cjs` | 当前为空导出 |
| `mp-taro-kit/runtime` | `dist/runtime/index.d.ts` | `dist/runtime/index.js` | `dist/runtime/index.cjs` | 单例、覆盖层栈、通知队列、loading 句柄 |
| `mp-taro-kit/utils` | `dist/utils/index.d.ts` | `dist/utils/index.js` | `dist/utils/index.cjs` | 纯函数与 i18n 注册口 |
| `mp-taro-kit/core` | `dist/core/index.d.ts` | `dist/core/index.js` | `dist/core/index.cjs` | `configure` 与注入式平台操作 |
| `mp-taro-kit/ui` | `dist/ui/index.d.ts` | `dist/ui/index.js` | `dist/ui/index.cjs` | 纯逻辑、命令式 API 与类型，不 re-export 组件 |
| `mp-taro-kit/ui/*` | `dist/ui/*/index.d.ts` | `dist/ui/*/index.js` | `dist/ui/*/index.cjs` | 子域出口；`*` 可穿透多段，组件级与图标包级细路径同走这条 |
| `mp-taro-kit/ui/*/style` | 无 | 无 | 无 | 字符串出口，`*` 可穿透多段，指向对应单元的 `style/index.css` |
| `mp-taro-kit/ui/icon/base` / `.../base/style` | 有 / 无 | 有 / 无 | 有 / 无 | 基础图标包的清单与样式，**宿主 app 入口引一次，必需** |
| `mp-taro-kit/ui/icon/<id>` / `.../<id>/style` | 有 / 无 | 有 / 无 | 有 / 无 | 扩展图标包，用哪个引哪个 |
| `mp-taro-kit/ui/icon` / `.../icon/style` | 有 / 无 | 有 / 无 | 有 / 无 | 旧出口，只转发到基础包，保留兼容 |
| `mp-taro-kit/styles/theme-light` | 无 | 无 | 无 | **固定明**：只有明色值；宿主定制配色覆盖的都是明色，没有暗色变体 |
| `mp-taro-kit/styles/theme-dark` | 无 | 无 | 无 | **固定暗**：只写基线与暗色值，不铺明色、不做覆盖，不随系统变化 |
| `mp-taro-kit/styles/theme-auto` | 无 | 无 | 无 | **跟随系统**：暗色值包在 `prefers-color-scheme: dark` 媒体查询里 |
| `mp-taro-kit/styles/theme-runtime` | 无 | 无 | 无 | **运行时热切换**：明色为默认，`.mptk-dark` 只覆盖颜色键，由 `setThemeMode` 随时切 |
| `mp-taro-kit/styles/tokens` | 无 | 无 | 无 | 旧出口，等价于固定明；新代码从上面几项里选一 |
| `mp-taro-kit/package.json` | 无 | 无 | 无 | 指向包清单自身 |

**引用单元是组件或图标包，不是子域**：小程序包体积受限，消费端用哪个就引哪个的 JS 与 `style` 出口。子域聚合出口仍在，但只作兼容过渡；`scripts/check.mjs` 会逐个对照 `src/ui` 下的 `index.ts` 与 `style/index.scss`，确保通配展开后的产物真实存在，避免解析成功却文件缺失的坏包。

第一个按此落地的组件单元是 `mp-taro-kit/ui/display/cell`（`Cell` + `CellGroup`）与 `mp-taro-kit/ui/display/cell/style`；`mp-taro-kit/ui/display` 只转发它们，不再作为推荐引用口。

`Switch` 与 `Segmented` 同为组件级单元：`mp-taro-kit/ui/form/switch` + `/style`、`mp-taro-kit/ui/form/segmented` + `/style`；`mp-taro-kit/ui/form` 只作兼容 barrel。两个组件互不 import，共用 `src/ui/form/useAsyncChange.ts` 与 `change-state.ts`；引其中一个不会把另一个组件的代码与样式打进产物。

组件样式不随 JS 自动生效：宿主需显式引入对应单元的 `style` 出口。`sideEffects` 白名单为 `**/*.css`，保证 CSS 副作用导入不被摇掉。CJS 路径下 `require()` 不做摇树，必须用组件级细路径，不要 `require` 子域 barrel。

`styles/theme-*` 的字号档位固定为 12 / 14 / 15 / 17 / 22（另 `font-nav` 17），与《微信小程序设计指南》5.1 的常用字号一一对应；行高与字号成对。宿主不应整体覆盖档位，演示站自身也不覆盖。

控件高度档位固定为 32 / 40 / 48（`--mptk-control-h-sm` / `-md` / `-lg`，默认 48），与 WeUI 的按钮高度三档一致；承载文字的控件用 `size="sm|md|lg"` 选档，调用点不自定义高度。真源同为 `src/design/_tokens.scss` 的 `base` mixin，`tests/controls.test.mjs` 断言 Switch 与 Segmented 三档总高逐档等于该值。

控件选中态主色默认蓝（`--mptk-control-active` 指向 `--mptk-control-blue`），内置蓝 / 绿 / 橙 / 红四色；滑轨、滑块、选中文字各有独立颜色键。这组变量写在 `light` / `dark` mixin，与 `--mptk-business` 等语义色解耦：宿主定制业务色不会改变控件默认外观，明色下滑轨与滑块也不会双双为白。组件的 `color` 可传内置色名（走类名切变量）或任意 CSS 色值（走显式内联上色，不依赖 WXML 行内自定义属性）；`tests/controls.test.mjs` 核对四份主题产物都带全这组键，并断言组件不引用业务色。

## 运行时约定

### 平台能力注入

宿主在 app 入口调用一次 `configure(faces, options?)`，注入 13 个平台方法。缺字段或非对象当场抛；未配置时 `getFaces()` 与 `getConfig()` 每次抛带修复指引的 Error。配置槽是跨副本单例。

### 挂载点

宿主在页面基座挂一次 `<OverlayHost />`。`showToast` / `showLoading` / `alert` / `confirm` 同步检查挂载状态；未挂载每次抛带修复指引的 Error。`hideToast` / `hideLoading` / `clearToasts` 不检查。`confirm` 以 Promise 解析出布尔值，`alert` 解析即关闭。

### Cell / CellGroup 的组内行为

props 表、九种用法与代码示例见 [Cell 单元格](cell.md)。`.d.ts` 只表达 props 类型，以下几条由运行时保证：

- `CellGroup` 默认通栏（`flush`），`inset` 为圆角内收卡片；卡片形态不画上下外框，`border` 只作用于通栏。
- 组内最后一格的下分隔线由 `CellGroup` 按位置关掉，不用结构伪类；独立使用的 `Cell` 由自身 `border` 决定。
- 点击态由 `onClick` 派生（不暴露 `clickable`），`isLink` 只渲染箭头，`disabled` 短路回调与按压反馈。
- `value` 优先于 `children`，`rightIcon` 优先于 `isLink` 箭头；内容位均为 `ReactNode`。
- 本库不接路由：Vant 的 `url` / `link-type` 不做，跳转由宿主经 `onClick` 注入。

### Switch / Segmented 的异步切换

props 表与用法见 [Switch 开关](switch.md)、[Segmented 分段选择](segmented.md)。`.d.ts` 只表达 props 类型，以下几条由运行时保证：

- 两者共用 `src/ui/form/change-state.ts` 的状态机：回调返回 thenable 时界面先拨到新值并转圈、锁点击；成功保持，失败回弹并调用 `onFailed`，显式 `false` 与 rejected Promise 都算失败。
- 宿主给回的 `checked` / `value` 始终是唯一真值；等待期间的临时显示值在成功、失败或宿主改值时按状态机收敛。失败后若宿主已提前改值，须在 `onFailed` 里自行回滚。
- 禁用态包含整控件、段级 `disabled`、外部 `loading` 与等待中四种，任一成立都短路回调。
- 转圈用组件自带 CSS 绘制，不依赖 `ui/feedback/Loader` 与图标字体包；等待失败的错误输出到控制台，不向页面抛出。

### 错误口径

| 类别 | 行为 |
|---|---|
| 开发者契约违例 | 每次抛带修复动作的 Error，不静默降级 |
| 运行时数据坏、平台异常、网络失败 | 按约定返回兜底值或结果对象，不抛给页面、不静默吞掉错误 |

### 样式基线（必需）

本库的通用样式**只有一处落点**：`src/design/_tokens.scss` 里的 `base` / `surface` / `light` / `dark` 四个 mixin（页面基线、页面底色声明、明色值、暗色值各写一次）。`dist/styles/theme-*.css` 与 `dist/styles/tokens.css` 都是它的编译产物，勿手改。`ui/*/style` 只放控件自身样式，不放页面级规则；页面基线也不为它另开出口。

`base` 只承载布局基线与非颜色变量，**不含任何主题相关声明**：

| 内容 | 作用 |
|---|---|
| `page { height: 100% }` | 页面满屏底框，接入方页面不必再写高度 |
| `--mptk-*` 变量 | 组件样式取值来源，默认值唯一真源 |
| `surface` mixin | `page { background-color: var(--mptk-surface-base) }`，是否由 WXSS 画页面底色的出口策略 |

**页面底色是出口策略，不是基线**：编译期三选一都 include `surface`，变量值与声明落在同一个 `page` 选择器上（或由媒体查询覆盖），底色自然跟着明暗走。运行时热切换出口**不** include `surface`——它的暗色值挂在后代 `.mptk-dark` 上，若把底色写死在 `page`，祖先就恒取明色值，后代无从覆盖，转场首帧露白。此时页面底色交给微信官方窗口主题配置（`app.json` 的 `darkmode` + `themeLocation` + `window.backgroundColor` 的 `@变量`），由框架在页面创建前解析。

底部安全区**不在 `page` 上让位**：Skyline 下 `page` 的 padding 区域不绘制背景，会露出窗口底色。改由页面根容器自己 `padding-bottom: env(safe-area-inset-bottom)` 并铺 `--mptk-surface-base`（或挂 `<SafeArea bottom />`），安全区背景才会跟随主题；这是内容区底色，不是首帧解法。Android 的系统手势条区域只认窗口背景色，宿主在 app 入口用 `Taro.setBackgroundColor` 按当前 mode 同步。

宿主在 app 入口**从下面几种模式里引一个**即全站所有页面生效，页面不需要逐个引：

```js
import 'mp-taro-kit/styles/theme-light' // 固定明
// import 'mp-taro-kit/styles/theme-dark'     // 固定暗
// import 'mp-taro-kit/styles/theme-auto'     // 跟随系统（纯 CSS）
// import 'mp-taro-kit/styles/theme-runtime'  // 运行时热切换（需一次配置，见下）
```

**必须引一个，不是可选**：组件样式只写 `var(--mptk-*)`、不自带兜底值，不引则配色、字号、间距、圆角全部取不到值（属性回退继承 / 初始值），页面结构还在但完全没样式。每份都自带页面基线与明色值，差别只在暗色值怎么处理；编译期三选一切换模式只改这一行 import，不需要覆盖任何变量。

不需要这条基线的页面（自定义高度、贴底的全屏页），在宿主样式里覆盖同名属性即可，不要改本库文件。变量名、前缀与兜底值构成对外契约，改名需同步迁移步骤。

#### 明暗开关：编译期三选一 与 运行时热切换并存

明暗有两条互不影响的路，按项目是否要在运行期切换来选：

| 路径 | 引哪个 | 行为 | 要不要 JS |
|---|---|---|---|
| 固定明 | `mp-taro-kit/styles/theme-light` | 只有明色值，宿主定制配色全是明色 | 不要 |
| 固定暗 | `mp-taro-kit/styles/theme-dark` | 只写基线与暗色值，不铺明色、不做覆盖，与系统设置无关 | 不要 |
| 跟随系统 | `mp-taro-kit/styles/theme-auto` | 暗色值包在 `@media (prefers-color-scheme: dark)` 里 | 不要 |
| 运行时热切换 | `mp-taro-kit/styles/theme-runtime` | 明色为默认，`.mptk-dark` 只覆盖颜色键，由 `setThemeMode` 随时切 | 要，见下 |

前三条是**编译期三选一**，一行 import 定死，不需要 JS、`faces` 注入或根容器标记。第四条是并存的另一种模式，**不改动前三条**：已接入宿主的一行 import 一个字不用改；`dist/styles/tokens.css` 仍是固定明的兼容副本。四份都由 `src/design/_tokens.scss` 的 mixin 编译，颜色值只写一次，组件仍只写 `var(--mptk-*)`。

编译期三选一的落点是全局 `page`，页面内容与 App 层的 `<OverlayHost />` 在同一棵变量树里，暗色一起生效；不想要明暗就引 `theme-light`，要定制配色再在自己样式里覆盖 `--mptk-*`（后引入者胜）。

##### 运行时热切换的接入

消费端只在 app 入口配置一次：平台能力全部由宿主注入，库侧 `runtime` 保持零平台依赖。

```tsx
import 'mp-taro-kit/styles/theme-runtime'
import { setThemeMode } from 'mp-taro-kit/runtime'
import themeConfig from './theme.json'

setThemeMode('auto', {
  systemDark: () => Taro.getSystemInfoSync().theme === 'dark',
  onSystemDarkChange: (notify) => {
    const onChange = ({ theme }) => notify(theme === 'dark')
    Taro.onThemeChange(onChange)
    return () => Taro.offThemeChange(onChange)
  },
  onDarkChange: (dark) => {
    const backgroundColor = dark ? themeConfig.dark.bgColor : themeConfig.light.bgColor
    void Taro.setBackgroundColor({
      backgroundColor,
      backgroundColorTop: backgroundColor,
      backgroundColorBottom: backgroundColor,
    })
  },
})
```

`themeConfig` 与 `app.json` 的 `@bgColor` 同源，色值不写第二份。开关里再调同一个 API 即全站热切换，不用刷新、不用通知任何页面：`setThemeMode('dark')`，取值 `'light' | 'dark' | 'auto'`。

**必须同时做官方窗口主题配置**，否则 `page` 没有底色、转场首帧露白。`app.json`：

```json
{
  "darkmode": true,
  "themeLocation": "theme.json",
  "window": {
    "backgroundColor": "@bgColor",
    "backgroundColorTop": "@bgColor",
    "backgroundColorBottom": "@bgColor",
    "backgroundTextStyle": "@bgTxtStyle",
    "navigationBarBackgroundColor": "@navBgColor",
    "navigationBarTextStyle": "@navTxtStyle"
  }
}
```

`theme.json`（Taro 按 `sourceRoot` 解析，放在 `src` 根，编译后自动进产物根）：

```json
{
  "light": { "bgColor": "#ffffff", "bgTxtStyle": "light", "navBgColor": "#ffffff", "navTxtStyle": "black" },
  "dark":  { "bgColor": "#15181c", "bgTxtStyle": "dark",  "navBgColor": "#15181c", "navTxtStyle": "white" }
}
```

`darkmode: true` 同时也是 `getSystemInfoSync().theme` / `onThemeChange` 有有效值的前提。`theme.json` 的 `bgColor` 两档必须与 `--mptk-surface-base` 的明暗值一致，发布守卫与回归测试会核对，不允许两处漂移。

页面**不用写主题代码**，但根容器要用库的 `<PageShell />` 替换原来的根 `<View />`（层级不增加，`PageShell` 不设 `height`，高度链仍由宿主自己的外壳类控制）：`<PageShell className="order-page">{children}</PageShell>`。`<OverlayHost />` 与页面内容是兄弟节点，它自己读同一份主题状态挂标记，Toast / Dialog / Loading 一起换色。

`.mptk-dark` 只覆盖 `dark` mixin 的颜色键，其余基线变量继续从 `page` 继承。`page` 自身不能被后代 class 反向改色，所以本出口**不在 `page` 上声明底色**：首帧底色由上述官方窗口主题配置在页面创建前决定；`PageShell` 铺 `--mptk-surface-base` 是 Skyline 安全区要求的内容区底色，不承担首帧；回弹区与 Android 手势条由 `onDarkChange` 里的 `setBackgroundColor` 同步。主题状态走 `runtime` 层的跨副本单例，不新建 React Context；状态是否持久化（storage / store）由消费端决定，库不接管。

##### 边界与验证状态

已在演示站编译产物里核实：`app.json` 的 `@变量` 与 `themeLocation` 落盘、`theme.json` 自动进产物根、运行时出口的 `page` 规则不含 `background-color`、三条编译期出口仍自带底色、明色与暗色值各一份。但产物里有值不等于渲染生效：

- `theme-auto` 的 `prefers-color-scheme` 在 Skyline 下实时重算**未实机验证**；引擎不支持时表现为固定明，可改用 `theme-runtime`。运行时模式不依赖媒体查询。
- 官方窗口主题配置只跟随**系统**主题，微信没有「页面创建前覆盖系统主题」的开关。因此「跟随系统」模式首帧由 `theme.json` 定色；用户强制明 / 暗（覆盖系统）时，首帧色仍由系统给，只能由 `setBackgroundColor` 在 JS 执行后同步，这是平台边界。
- `.mptk-dark` 挂在后代节点后 CSS 变量继承是否生效、暗色字形切换、转场首帧是否还有残留白闪，均待 Skyline 与 WebView 双端实机验证。
- 多色图标的颜色固化在字体调色板里，不跟随明暗，需要变体字形，见[图标字体](icons.md)。

#### 整屏背景图

底部安全区由页面根容器 `padding-bottom` 让出，背景图铺在 `page` 或根容器上都能盖住安全区；按图的放法选：

| 放法 | 写法 | 说明 |
|---|---|---|
| `page` 背景图（推荐） | `background-image` + `background-size: cover` | `page` 没有安全区 padding，图直接铺到屏底；内容避让仍由根容器负责 |
| `<Image>` 子节点 | `position: fixed` + 四条边 0 | fixed 相对视口，图铺满屏，内容仍在安全区内 |
| 图贴底且不要安全区 | 根容器不写 `padding-bottom` | 内容会贴着 home indicator，慎用 |

图比屏短时，把 `--mptk-surface-base` 覆盖成图的主色，露出来的就是同色而非白边——这是底色走 token 而非写死白的原因。

`background-origin` 与 `background-image` 在 Skyline 下未实测（Skyline 的 CSS 是子集），WebView 端为标准行为。消费端若跑 Skyline，优先用 fixed 定位的 `<Image>`，它只依赖 `position: fixed`，两端都稳。

## 版本下限

| peer | 下限 | 由谁提供 |
|---|---|---|
| `react` | `>=18.0.0` | 宿主 |
| `@tarojs/taro` | `>=4.0.0` | 宿主 |
| `@tarojs/components` | `>=4.0.0` | 宿主 |

`devDependencies` 中的 `@types/react` 与 `@tarojs/components` 只服务本库编译期，不进入运行时，也不进入发布包。

## 相关

- 架构：[架构总览](../architecture/overview.md)

## 更新日志

- 2026-11-07 22:38:05：新建
- 2026-11-07 22:40:05：填实出口清单、运行时约定与版本下限
- 2026-11-08 20:23:41：补 ui/icon 出口，子域数量改为七个
- 2026-11-11 16:02:03：新增样式基线一节：通用样式唯一落点 styles/tokens、必需引用与覆盖方式
- 2026-11-11 16:07:04：补整屏背景图写法：background-origin、fixed 定位 Image 与底色兜底
- 2026-11-11 17:44:05：补组件级与图标包级细路径、通配展开校验、CJS 口径与明暗契约
- 2026-11-11 17:58:24：明暗改成一个 import 三选一：固定明 / 固定暗 / 跟随系统，宿主不再需要覆盖变量
- 2026-11-11 19:58:18：真源收敛到 design/_tokens.scss 的 mixin，固定暗零覆盖
- 2026-11-11 20:06:19：修正固定暗描述：只写基线与暗色值，零覆盖
- 2026-11-11 21:26:52：补演示站编译产物核实结论：三选一主题与基础图标包均真实进包，Skyline 实时重算仍待实机验证
- 2026-11-11 22:16:11：补首个组件级细路径实例与 Cell 组内运行时约定
- 2026-11-11 22:30:25：组内行为指向 Cell 用法文档
- 2026-11-11 22:50:04：字号档位统一为 12/14/15/17/22，禁止宿主与演示站整体覆盖
- 2026-11-11 23:01:08：底部安全区改由页面根容器让位，附窗口背景设置
- 2026-11-12 11:39:42：新增运行时热切换主题出口与接入契约，编译期三选一并存
- 2026-11-12 12:32:02：页面底色改为出口策略并接入官方 DarkMode 窗口主题配置
- 2026-11-12 14:53:57：补两个组件级细路径、控件高度三档与异步切换运行时约定
- 2026-11-12 15:43:19：补控件主色轴与业务色解耦、内置四色及自定义色值口径
