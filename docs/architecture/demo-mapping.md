# 演示站页与能力域映射

`demo/` 是仓库内的 Taro 小程序宿主，用于效果展示与使用方法说明。本篇只写页面分组的设计约束与理由；运行时页面、示例、菜单分组与用法数据的真源是 `demo/src/catalog.ts`，出口与 import 形态见 [对外契约](../api/exports.md)，构建与自检见 [开发](../development/build-and-test.md)。

## 1. 为什么单独成篇

演示站的页面清单随控件与能力增长；[架构总览](overview.md) 只描述系统组成与不可破约束，保持稳定，不承载逐页清单。两者分开，新增演示内容不会让总览膨胀，也不会把使用说明混进结构描述。

## 2. 目录树

小程序是线性页面栈，没有网页常驻侧栏，目录必须单独成页；展示端按能力域分页，便于 Skyline 与 WebView 逐页对照。共 1 个索引页 + 9 个展示页。

以下是约定的目录结构，每个节点后的备注说明该路径的职责与对应的库侧能力域；骨架屏只在 `catalog.ts` 预留 id，树中不生成节点。

```text
demo/                                               # 仓库内的 Taro 小程序宿主
├── package.json                                    # 演示站清单：mp-taro-kit 用 workspace:*，并装宿主 peer 与 Taro Vite 编译链
├── app.config.ts                                   # 页面路由真源：pages 共 10 项，由 src/app.config.ts 转发给 Taro
├── project.config.json                             # 微信开发者工具工程配置：renderer 在 Skyline 与 WebView 之间切换
├── tsconfig.json                                   # 演示站 TS 配置：jsx 用 react-jsx、target 用 es2020
├── babel.config.js                                 # Taro React + Vite 的 babel 预设，编译期使用
├── config/                                         # Taro 4 工程配置文件所在目录
│   └── index.js                                    # Taro 4 工程配置：sourceRoot 固定 src、framework react、compiler vite
├── types/                                          # 全局类型声明目录
│   └── global.d.ts                                 # 样式与图片模块声明，供 TS 解析 app.scss
└── src/                                            # 演示站源码根：入口、目录数据、样式与页面
    ├── app.config.ts                               # Taro 入口配置：转发根目录 app.config.ts，满足 sourceRoot 约定
    ├── theme.json                                  # 官方 DarkMode 变量配置：明暗两档窗口/导航底色，编译后自动进产物根
    ├── app.tsx                                     # 宿主入口：configure(faces)、setThemeMode、挂一次 <OverlayHost />、引 theme-runtime
    ├── catalog.ts                                  # 单一事实源：9 个展示页 + 8 组菜单；页含 id / path / summary / examples，菜单条目含 label / status / pageId
    ├── app.scss                                    # 演示站全局样式：只写 var(--mptk-*)，不硬编码颜色
    ├── components/                                 # 演示站共用组件：页面外壳、示例块与统一头部
    │   ├── DemoBlock.tsx                           # 单个示例外壳；另导出 DemoPage 页壳，按 catalog 铺块并把正文交给 DemoShell
    │   ├── DemoNav.tsx                             # 统一头部：标题前 logo；栈内有上一页则返回箭头，直达的子页则为小房子回首页；入口页用 home 声明，两者都不出
    │   └── DemoShell.tsx                           # 页面外壳：固定视口高度的 View + scroll-view；导航栏在滚动区外
    └── pages/                                      # 演示站页面：1 个索引页 + 9 个展示页
        ├── index/index.tsx                         # 目录页：用 CellGroup 铺 menu 固定分组；ready 可点跳展示页，planned 置灰不可点
        ├── infra/index.tsx                         # src/ui/infra/：OverlayHost、SafeArea、use-store
        ├── actions/index.tsx                       # src/ui/actions/：Button
        ├── icon/index.tsx                          # src/ui/icon/：图标清单，铺出全部 glyph 与类名
        ├── feedback/index.tsx                      # src/ui/feedback/：Dialog、Loader、Loading、Toast
        ├── display/index.tsx                       # src/ui/display/：Badge、Divider、Cell、CellGroup（Cell 走组件级细路径）
        ├── navigation/index.tsx                    # src/ui/navigation/：NavBar、Drawer、Dropdown
        ├── layout/index.tsx                        # src/ui/layout/：Mask、Overlay、Popup
        ├── foundation/index.tsx                    # design + runtime + utils + core 四域合并：换肤、单例、工具、configure 注入
        └── commands/index.tsx                      # ui/commands.ts + state.ts + infra/OverlayHost：命令式 API
```

每个 `ui` 子域展示页引入用到的组件样式：历史组件走子域 `mp-taro-kit/ui/*/style`，新组件走组件级 `mp-taro-kit/ui/*/<组件>/style`；样式是 import，不占树上的文件节点。

## 3. 不可破的约束

- Taro 4 按 `sourceRoot: 'src'` 定位入口，`demo/src/app.tsx` 与 `demo/src/app.config.ts` 必须在该目录下；根目录 `demo/app.config.ts` 是 pages 真源，由 `demo/src/app.config.ts` 转发。编译器用 esbuild bundle 求值配置，因此 `pages` 可由 `demo/src/catalog.ts` 动态派生。
- `pnpm-workspace.yaml` 的 `publicHoistPattern` 必须提升 `@tarojs/plugin-platform-weapp`：主库 `dist` 位于工作区根，Taro 把其中的 `@tarojs/components` 重写成该插件的裸包名，不提升则跨目录解析失败。
- 展示页与库侧路径仍一一对应：一页承载一个子域（`foundation` / `commands` 各承载一组能力域），路由由 `pages` 派生；新增能力域先在本树定位，再改 `demo/src/catalog.ts` 与 `demo/app.config.ts` 的 `pages`。
- 菜单与展示页是多对一：`menu` 的 `ready` 条目必须带 `pageId` 且指向真实展示页，`planned` 条目不带 `pageId`、不绑跳转；`tests/ui.test.mjs` 断言这两条。
- 菜单分组固定为 Vant Weapp 六类（基础 / 表单 / 反馈 / 展示 / 导航 / 业务）加「基础能力」「命令式 API」两组，顺序固定；新增组件只把 `planned` 改为 `ready`，不插队、不重排。`planned` 只是占位，不是待办清单。
- 分组判据按「使用者找组件时的场景」，不按 `src/ui/` 的目录：`Toast` 排基础组件、`Dialog` 排反馈组件、`Popup` 排基础而 `Overlay` 排反馈，但库侧路径仍是 `ui/feedback` / `ui/layout`，目录不反向约束 exports。
- 每个页面必须走 `DemoShell`：外壳 `height: 100vh` + `scroll-view type="custom"`，页面 json 配 `disableScroll: true`。Skyline 不支持页面全局滚动，绕开外壳写普通容器会让超屏内容滚不到；平台依据见 [Skyline 渲染引擎](../dependencies/skyline-rendering.md)。
- 控件的效果展示归演示站；props、组内行为与用法代码归 `docs/api/<组件>.md`（如 [Cell 单元格](../api/cell.md)），演示站不展示代码。演示站不反向引用 `docs/`，因为消费端看不到仓库内部文档。
- 七个 ui 子域各有自己的 style 出口，样式由各页装配时引入，不单独成页；icon 域没有组件，样式即字体声明与类名。
- 骨架屏尚未实现、归属 `feedback` / `display` 未定：目录数据预留 `skeleton` id，不生成页面。
- Skyline 是主路径、WebView 必须可用；页面不为双端分叉，每页只用两端共有子集，差异由目录数据的 `renderNotes` 逐页记录。
- `design` / `runtime` / `utils` / `core` 四域必须有展示位置，演示站不得只覆盖 `ui` 子域。

## 4. 真源分层

- 本篇：页面分组与菜单分类的设计约束与理由。
- `demo/src/catalog.ts`：运行时页面、示例、菜单分组、用法与双端记录数据。
- [对外契约](../api/exports.md)：exports 子路径与 import 形态。
- 台账 worklog：过程摘要与指向，不复制以上正文。

## 更新日志

- 2026-11-08 00:23:20：新建
- 2026-11-08 00:24:28：填实页面结构、不可破约束与真源分层
- 2026-11-08 00:38:10：页面结构表与真源分层表改为带逐节点备注的目录树
- 2026-11-08 01:32:55：按 docwriter 1.1.0 重整：补记 9 页目录树同步、Taro sourceRoot 与平台插件提升两条约束
- 2026-11-08 20:23:41：加图标展示页：目录树、页数与 ui 子域数量同步
- 2026-11-08 20:44:50：目录树补 DemoNav：标题 logo 与返回/回首页
- 2026-11-08 20:55:46：返回键改为页面显式声明入口页：home 页不出返回键与房子
- 2026-11-08 22:53:30：目录树补 DemoShell、示例页补 Loader，约束补页面外壳必须走 scroll-view
- 2026-11-08 22:57:27：目录树备注分隔符由 # 统一为 —，对齐 skill 的「树 + 每行 — 备注」
- 2026-11-10 16:14:41：菜单改为 Vant 六类 + 基础能力 + 命令式 API 的固定八组，条目分 ready / planned；补多对一映射与占位约束，navigation 页补 NavBar
- 2026-11-10 16:29:25：按 1.2.0 树格式重排：说明改用 # 并对齐第 53 列，补文件夹行说明，正文相对路径改为可从仓库根解析
- 2026-11-11 19:58:19：演示站入口改为 theme-auto
- 2026-11-11 22:16:11：补 Cell 组件级细路径与首页 CellGroup 装配
- 2026-11-11 22:30:25：演示站不再展示代码，用法与代码示例归 docs/api/cell.md
- 2026-11-12 11:39:43：入口说明改为 theme-runtime 与 setThemeMode
- 2026-11-12 12:32:02：补 theme.json 官方主题变量配置
