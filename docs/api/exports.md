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
| `mp-taro-kit/styles/tokens` | 无 | 无 | 无 | 旧出口，等价于固定明；新代码从上面三选一 |
| `mp-taro-kit/package.json` | 无 | 无 | 无 | 指向包清单自身 |

**引用单元是组件或图标包，不是子域**：小程序包体积受限，消费端用哪个就引哪个的 JS 与 `style` 出口。子域聚合出口仍在，但只作兼容过渡；`scripts/check.mjs` 会逐个对照 `src/ui` 下的 `index.ts` 与 `style/index.scss`，确保通配展开后的产物真实存在，避免解析成功却文件缺失的坏包。

组件样式不随 JS 自动生效：宿主需显式引入对应单元的 `style` 出口。`sideEffects` 白名单为 `**/*.css`，保证 CSS 副作用导入不被摇掉。CJS 路径下 `require()` 不做摇树，必须用组件级细路径，不要 `require` 子域 barrel。

## 运行时约定

### 平台能力注入

宿主在 app 入口调用一次 `configure(faces, options?)`，注入 13 个平台方法。缺字段或非对象当场抛；未配置时 `getFaces()` 与 `getConfig()` 每次抛带修复指引的 Error。配置槽是跨副本单例。

### 挂载点

宿主在页面基座挂一次 `<OverlayHost />`。`showToast` / `showLoading` / `alert` / `confirm` 同步检查挂载状态；未挂载每次抛带修复指引的 Error。`hideToast` / `hideLoading` / `clearToasts` 不检查。`confirm` 以 Promise 解析出布尔值，`alert` 解析即关闭。

### 错误口径

| 类别 | 行为 |
|---|---|
| 开发者契约违例 | 每次抛带修复动作的 Error，不静默降级 |
| 运行时数据坏、平台异常、网络失败 | 按约定返回兜底值或结果对象，不抛给页面、不静默吞掉错误 |

### 样式基线（必需）

本库的通用样式**只有一处落点**：`src/design/_tokens.scss` 里的 `base` / `light` / `dark` 三个 mixin（页面基线、明色值、暗色值各写一次）。`dist/styles/theme-*.css` 与 `dist/styles/tokens.css` 都是它的编译产物，勿手改。`ui/*/style` 只放控件自身样式，不放页面级规则；页面基线也不为它另开出口。

它同时承载三样东西：

| 内容 | 作用 |
|---|---|
| `page { height: 100% }` | 页面满屏底框，接入方页面不必再写高度 |
| `page { background-color: var(--mptk-surface-base) }` | 页面底色兜底：内容或图片铺不满时不露白；改这个变量即换整页底色 |
| `page { padding-bottom: env(safe-area-inset-bottom) }` | 底部安全区，纯 CSS，无需挂 `<SafeArea>` |
| `--mptk-*` 变量 | 组件样式取值来源，默认值唯一真源 |

宿主在 app 入口**从三个明暗模式里引一个**即全站所有页面生效，页面不需要逐个引：

```js
import 'mp-taro-kit/styles/theme-light' // 固定明
// import 'mp-taro-kit/styles/theme-dark'  // 固定暗
// import 'mp-taro-kit/styles/theme-auto'  // 跟随系统
```

**必须引一个，不是可选**：组件样式只写 `var(--mptk-*)`、不自带兜底值，不引则配色、字号、间距、圆角全部取不到值（属性回退继承 / 初始值），页面结构还在但完全没样式。三个文件都自带页面基线与明色值，差别只在暗色值怎么处理；切换模式只改这一行 import，不需要覆盖任何变量。

不需要这条基线的页面（自定义高度、贴底的全屏页），在宿主样式里覆盖同名属性即可，不要改本库文件。变量名、前缀与兜底值构成对外契约，改名需同步迁移步骤。

#### 明暗开关

明暗是**一个 import 的三选一**，不是让宿主去覆盖一堆变量：

| 模式 | 引哪个 | 行为 |
|---|---|---|
| 固定明 | `mp-taro-kit/styles/theme-light` | 只有明色值；宿主定制的配色全是明色，不存在暗色变体 |
| 固定暗 | `mp-taro-kit/styles/theme-dark` | 只写基线与暗色值，不铺明色、不做覆盖，与手机系统设置无关 |
| 跟随系统 | `mp-taro-kit/styles/theme-auto` | 同一份暗色值包在 `@media (prefers-color-scheme: dark)` 里，系统切暗时生效 |

三个文件都由 `src/design/_tokens.scss` 的 mixin 编译而来：`theme-dark` 只写基线与暗色值，不铺明色、不做覆盖；`theme-auto` 是基线 + 明色默认值 + 媒体查询里的暗色值。每套值只写一次，组件仍只写 `var(--mptk-*)`，一行不改，不需要 JS、`faces` 注入或根容器标记。

落点是全局 `page`，不是逐页配置：页面底色、页面内容与 App 层的 `<OverlayHost />` 在同一棵变量树里，暗色一起生效。不想要明暗就引 `theme-light`，不需要覆盖任何变量；要定制配色再在自己样式里覆盖 `--mptk-*`（后引入者胜）。

已在演示站编译产物里核实：明色值与暗色值各一份、`@media (prefers-color-scheme: dark)` 一个、基础图标包的 `@font-face` 也在，说明三选一主题与图标包都真实进了小程序包。但产物里有值不等于渲染生效：`prefers-color-scheme` 在 Skyline 下的实时重算尚未实机验证；引擎不支持时 `theme-auto` 表现为固定明，此时改用 `theme-dark`。多色图标的颜色固化在字体调色板里，不跟随明暗，见[图标字体](icons.md)。

#### 整屏背景图

`padding-bottom` 只挤压内容、不裁剪背景，所以「图铺到屏底」和「内容避开 home indicator」可以同时成立。按图的放法选：

| 放法 | 写法 | 说明 |
|---|---|---|
| `page` 背景图（推荐） | `background-image` + `background-size: cover` + **`background-origin: border-box`** | `cover` 的尺寸按 `background-origin` 算，默认 `padding-box` 会让底部安全区露出底色；改 `border-box` 才铺到屏底 |
| `<Image>` 子节点 | `position: fixed` + 四条边 0 | fixed 相对视口，不吃 `page` 的 padding，图铺满屏、内容仍在安全区内 |
| 图贴底且不要安全区 | 覆盖 `page { padding-bottom: 0 }` | 图铺到底，但内容也贴着 home indicator，慎用 |

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
