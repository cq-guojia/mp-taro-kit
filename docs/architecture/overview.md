# 架构总览

`mp-taro-kit` 是面向 Taro + React 小程序的基础库（kit），以单个 npm 包分发。它提供 UI 容器能力与跨项目通用的操作功能封装，业务内容与数据由宿主注入。

## 1. 系统上下文

| 外部系统 | 方向 | 协议 | 用途 |
|---|---|---|---|
| 宿主小程序 | 入站 | npm 子路径 import、CSS 变量 | 引入能力，注入平台函数与组件内容 |
| 微信客户端渲染引擎（Skyline / WebView） | 出站 | 组件渲染、CSS | 承载控件的实际渲染与换肤 |
| npm registry | 出站 | `pnpm publish` | 分发 `dist/` 编译产物 |

## 2. 模块与依赖

| 模块 | 职责 | 依赖 | 不能依赖 |
|---|---|---|---|
| `src/design` | `--mptk-*` 样式变量的编译期落点（`_tokens.scss` 由配置生成）；`index.ts` 导出配置常量 | 取值真源在项目根 `kit.config.mjs` | React、Taro、其他能力域 |
| `src/utils` | 零依赖纯函数：日期、字符串、数值、路径、i18n 注册表 | 无 | 其他能力域、DOM、宿主模块 |
| `src/runtime` | Promise 判定、跨副本单例、覆盖层栈、通知队列、loading 句柄 | 无（与 `utils`、`design` 同层） | `core`、`ui`、宿主模块 |
| `src/core` | 路由、请求、存储、小程序能力的注入式封装 | `utils`、`runtime` | `ui`、宿主 router / store / constants、`@tarojs/taro` 类型 |
| `src/ui` | 控件与命令式 API；按控件语义分子域，当前含 `infra`、`actions`、`feedback`、`display`、`navigation`、`layout`、`form`、`icon`、`card` | `runtime`、`design` 的 CSS 变量契约 | `core`、宿主业务模块 |
| `demo/` | 仓库内的 Taro 小程序宿主目录，使用方法与效果展示的真源 | 本库全部能力域 | 无 |

依赖方向固定为 `utils / runtime / design → { core, ui } → 宿主`，禁止反向；`core` 与 `ui` 平级互不 import，两者靠 `runtime` 的单例与 `<OverlayHost />` 连接。`src/index.ts` 只做具名 re-export，组件一律走 `./ui/*` 子路径按需引入，主出口不静态 import React 或 Taro。

## 3. 关键链路

### 3.1 构建与分发

1. `pnpm run build` 清空并重建 `dist/`。
2. 第一轮 TypeScript emit 产出 ESM `.js` 与 `.d.ts`；第二轮产出 CJS，并把相对 `require('*.js')` 重写为 `.cjs`。
3. 先跑 `gen:config --lib`，把 `kit.config.mjs` 写成 `_tokens.scss` / `_keyframes.scss` / `*.generated.ts`；再复制源码 `.css`、把每个 `.scss` 编译成同名 `.css`；`src/design/_tokens.scss` 的 mixin 编译出 `dist/styles/theme-{light,dark,auto}.css`，固定明那份再复制为 `dist/styles/tokens.css` 作兼容出口。同一次构建把生成器 CLI、默认表与 Taro 插件复制进 `dist/config`、`dist/plugin`。
4. `pnpm test` 跑包清单自检与四组 Node 断言；`pnpm run guard` 校验 `dist/` 非空且根入口三件套齐全，否则拒绝发版；`pnpm pack --dry-run` 预览包内容。
5. 推送 `v*` tag 触发 CI，按安装、构建、测试、guard、预览、发布顺序执行 `pnpm publish`。
6. 任一轮 TypeScript 报错即中止构建；`dist/` 不入库，只在 CI 现场生成并随包分发。

### 3.2 平台能力注入

1. 宿主在 app 入口调一次 `configure(faces, options?)`，注入 13 个平台方法。
2. 配置槽走跨副本单例，`core` 内部调用点通过 `getFaces()` 与 `getConfig()` 取用。
3. 缺字段或非对象当场抛；未配置时每次调用抛带修复指引的 Error。
4. 平台异常与脏数据按约定返回兜底值，不抛给页面。

### 3.3 命令式弹窗

1. 宿主在页面基座挂一次 `<OverlayHost />`；渲染期即置挂载标记，早于 `useEffect`，避免宿主 `onLoad` 阶段误抛。
2. `showToast` / `showLoading` / `alert` / `confirm` 先同步检查挂载状态，再向 `runtime` 的栈或队列推入载荷。
3. `<OverlayHost />` 订阅全局状态并渲染反馈组件；`confirm` 由操作 resolve 出布尔值，`alert` 解析即关闭。
4. 未挂载时每次调用抛带修复指引的 Error；`hideToast` / `hideLoading` 不检查挂载状态。

## 4. 部署

| 组件 | 形态 | 副本 | 端口 |
|---|---|---|---|
| `mp-taro-kit` | npm 单包，`files` 只含 `dist` 与 README | 每模块 ESM `.js`、CJS `.cjs`、`.d.ts`、`.css` 各一份 | 不适用 |
| `dist/` | git 排除，CI 现场构建 | 每次构建重建 | 不适用 |
| `demo/` | 仓库内 Taro 小程序宿主 | 单份 | 不适用 |

## 5. 不可破的约束

- 禁止把 `react`、`@tarojs/taro`、`@tarojs/components` 打进产物：它们是 `peerDependencies`，由宿主提供，否则同页会出现两份运行时实例。
- `devDependencies` 里的类型包必须只服务编译期；`files` 只能是 `dist` 与 README，否则发布包会混入开发依赖。
- 组件样式必须只写 `var(--mptk-*)` 且不自带兜底值；默认值唯一真源是项目根 `kit.config.mjs`（见[统一配置](../api/config.md)），`_tokens.scss` 的 `base` / `surface` / `light` / `dark` 四个 mixin 是构建期生成物；关键帧百分比是 CSS 选择器，由生成器写成 `_keyframes.scss` 的 Sass 变量再插值。改前缀会让所有已接入宿主的换肤同时失效。
- 禁止组件 import 宿主的 router / store / constants；内容一律走 `children`、props 与回调注入。
- `core` 与 `ui` 必须平级互不 import，依赖方向不得反向。
- 样式必须用长写属性、不得依赖 Skyline 独占手势 API：Skyline 是主路径，WebView 必须可用，简写属性内的 `var()` 不生效。
- 所有 exports 目标必须在 `dist/` 下，CSS 以外出口必须同时给出 `types` / `import` / `require` 三个条件；禁止 `miniprogram` 字段与 `./skyline` 出口。
- 宿主页面基座必须挂一次 `<OverlayHost />`；否则命令式 API 不可用。
- 包管理器必须只用 pnpm，锁文件只保留 `pnpm-lock.yaml`。

## 6. 术语

| 术语 | 含义 | 别称 |
|---|---|---|
| kit | UI 容器能力 + 通用操作功能封装，能力域开放 | 基础库；不写成 UI 基础库 |
| 宿主 | import 本库的 Taro 小程序 | 接入方、消费端 |
| 能力域 | `src/` 下的五个顶层目录 | 层 |
| token | `--mptk-*` 样式变量 | 样式变量 |
| 命令式 API | `showToast` / `alert` / `confirm` 等无需 JSX 的调用 | 无 |

## 更新日志

- 2026-11-07 22:38:05：新建
- 2026-11-07 22:40:05：填实能力域依赖、关键链路与不可破约束
- 2026-11-08 20:23:41：ui 子域加入 icon
- 2026-11-11 19:58:19：构建与真源说明同步到 _tokens.scss
- 2026-11-11 20:06:19：补全真源源码路径
- 2026-11-13 15:13:41：ui 子域清单按源码列全并补 card，不再写死数量
- 2026-11-15 00:20:59：架构表、构建步骤与样式约定改写真源反转
