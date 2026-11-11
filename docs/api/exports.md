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
| `mp-taro-kit/ui/*` | `dist/ui/*/index.d.ts` | `dist/ui/*/index.js` | `dist/ui/*/index.cjs` | 七个子域按需引入 |
| `mp-taro-kit/ui/*/style` | 无 | 无 | 无 | 直接指向 `dist/ui/*/style/index.css` 的字符串出口 |
| `mp-taro-kit/ui/icon` | `dist/ui/icon/index.d.ts` | `dist/ui/icon/index.js` | `dist/ui/icon/index.cjs` | 图标清单与拼类名辅助，无组件 |
| `mp-taro-kit/styles/tokens` | 无 | 无 | 无 | 页面基线与样式变量的唯一真源，直接指向 `dist/styles/tokens.css`；宿主 app 入口引一次，必需 |
| `mp-taro-kit/package.json` | 无 | 无 | 无 | 指向包清单自身 |

组件样式不随 JS 自动生效：宿主需显式引入对应子域的 `style` 出口。`sideEffects` 白名单为 `**/*.css`，保证 CSS 副作用导入不被摇掉。

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

本库的通用样式**只有一处落点**：`mp-taro-kit/styles/tokens`（源码 `src/design/tokens.css`）。`ui/*/style` 只放控件自身样式，不放页面级规则；页面基线也不为它另开出口。

它同时承载三样东西：

| 内容 | 作用 |
|---|---|
| `page { height: 100% }` | 页面满屏底框，接入方页面不必再写高度 |
| `page { background-color: var(--mptk-surface-base) }` | 页面底色兜底：内容或图片铺不满时不露白；改这个变量即换整页底色 |
| `page { padding-bottom: env(safe-area-inset-bottom) }` | 底部安全区，纯 CSS，无需挂 `<SafeArea>` |
| `--mptk-*` 变量 | 组件样式取值来源，默认值唯一真源 |

宿主在 app 入口引一次即全站所有页面生效，页面不需要逐个引：

```js
import 'mp-taro-kit/styles/tokens'
```

**必须引，不是可选**：组件样式只写 `var(--mptk-*)`、不自带兜底值，不引则配色、字号、间距、圆角全部取不到值（属性回退继承 / 初始值），页面结构还在但完全没样式。

不需要这条基线的页面（自定义高度、贴底的全屏页），在宿主样式里覆盖同名属性即可，不要改本库文件。变量名、前缀与兜底值构成对外契约，改名需同步迁移步骤。

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
