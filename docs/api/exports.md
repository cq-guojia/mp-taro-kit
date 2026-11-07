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
| `mp-taro-kit/ui/*` | `dist/ui/*/index.d.ts` | `dist/ui/*/index.js` | `dist/ui/*/index.cjs` | 六个子域按需引入 |
| `mp-taro-kit/ui/*/style` | 无 | 无 | 无 | 直接指向 `dist/ui/*/style/index.css` 的字符串出口 |
| `mp-taro-kit/styles/tokens` | 无 | 无 | 无 | 直接指向 `dist/styles/tokens.css` 的字符串出口 |
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

### 样式变量

组件只写 `var(--mptk-*)`，不自带兜底值。默认值唯一真源是 `mp-taro-kit/styles/tokens`，宿主覆盖同名变量即可整体换肤；变量名、前缀与兜底值构成对外契约，改名需同步迁移步骤。

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
