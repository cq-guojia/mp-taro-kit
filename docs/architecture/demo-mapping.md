# 演示站页与能力域映射

`demo/` 是仓库内的 Taro 小程序宿主，用于效果展示与使用方法说明。本篇只写页面分组的设计约束与理由；运行时页面、示例与用法数据的真源是 `demo/src/catalog.ts`，出口与 import 形态见 [对外契约](../api/exports.md)，构建与自检见 [开发](../development/build-and-test.md)。

## 1. 为什么单独成篇

演示站的页面清单随控件与能力增长；[架构总览](overview.md) 只描述系统组成与不可破约束，保持稳定，不承载逐页清单。两者分开，新增演示内容不会让总览膨胀，也不会把使用说明混进结构描述。

## 2. 目录树

小程序是线性页面栈，没有网页常驻侧栏，目录必须单独成页；展示端按能力域分页，便于 Skyline 与 WebView 逐页对照。共 1 个索引页 + 9 个展示页。

以下是约定的目录结构，每个节点后的备注说明该路径的职责与对应的库侧能力域；骨架屏只在 `catalog.ts` 预留 id，树中不生成节点。

```text
demo/
├── package.json                      # 演示站清单：mp-taro-kit 用 workspace:*，并装宿主 peer 与 Taro Vite 编译链
├── app.config.ts                     # 页面路由真源：pages 共 10 项，由 src/app.config.ts 转发给 Taro
├── project.config.json               # 微信开发者工具工程配置：renderer 在 Skyline 与 WebView 之间切换
├── tsconfig.json                     # 演示站 TS 配置：jsx 用 react-jsx、target 用 es2020
├── babel.config.js                   # Taro React + Vite 的 babel 预设，编译期使用
├── config/
│   └── index.js                      # Taro 4 工程配置：sourceRoot 固定 src、framework react、compiler vite
├── types/
│   └── global.d.ts                   # 样式与图片模块声明，供 TS 解析 app.scss
└── src/
    ├── app.config.ts                 # Taro 入口配置：转发根目录 app.config.ts，满足 sourceRoot 约定
    ├── app.tsx                       # 宿主入口：configure(faces)、挂一次 <OverlayHost />、引 styles/tokens
    ├── catalog.ts                    # 单一事实源：分组 → 页 → 示例；每项含 id / path / usage / imports / renderNotes
    ├── app.scss                      # 演示站全局样式：只写 var(--mptk-*)，不硬编码颜色
    ├── components/
    │   └── DemoBlock.tsx             # 单个示例的外壳：标题 + 一句话 + 效果 + usage；另导出 DemoPage 页壳
    └── pages/
        ├── index/index.tsx           # 目录页：只读 catalog 渲染分组与跳转，不放示例
        ├── infra/index.tsx           # src/ui/infra/：OverlayHost、SafeArea、use-store
        ├── actions/index.tsx         # src/ui/actions/：Button
        ├── icon/index.tsx            # src/ui/icon/：图标清单，铺出全部 glyph 与类名
        ├── feedback/index.tsx        # src/ui/feedback/：Dialog、Loading、Toast
        ├── display/index.tsx         # src/ui/display/：Badge、Divider
        ├── navigation/index.tsx      # src/ui/navigation/：Drawer、Dropdown
        ├── layout/index.tsx          # src/ui/layout/：Mask、Overlay、Popup
        ├── foundation/index.tsx      # design + runtime + utils + core 四域合并：换肤、单例、工具、configure 注入
        └── commands/index.tsx        # ui/commands.ts + state.ts + infra/OverlayHost：命令式 API
```

每个 `ui` 子域展示页在装配时同时引入该子域的 `mp-taro-kit/ui/*/style`；样式是 import，不占树上的文件节点。

## 3. 不可破的约束

- Taro 4 按 `sourceRoot: 'src'` 定位入口，`src/app.tsx` 与 `src/app.config.ts` 必须在该目录下；根目录 `app.config.ts` 是 pages 真源，由 `src/app.config.ts` 转发。编译器用 esbuild bundle 求值配置，因此 `pages` 可由 `catalog.ts` 动态派生。
- `pnpm-workspace.yaml` 的 `publicHoistPattern` 必须提升 `@tarojs/plugin-platform-weapp`：主库 `dist` 位于工作区根，Taro 把其中的 `@tarojs/components` 重写成该插件的裸包名，不提升则跨目录解析失败。
- 库侧路径 → 展示页 → 目录数据的 `id` / `path` 三层必须一一对应；新增能力域先在本树定位，再改 `demo/src/catalog.ts` 与 `demo/app.config.ts` 的 `pages`。
- 控件的使用方法与效果展示归演示站，`docs/` 不复制正文；演示站不反向引用 `docs/`，因为消费端看不到仓库内部文档。
- 七个 `ui` 子域各有 `style/index.scss`，样式由各页装配时引入，不单独成页；`icon` 域没有组件，样式即字体声明与类名。
- 骨架屏尚未实现、归属 `feedback` / `display` 未定：目录数据预留 `skeleton` id，不生成页面。
- Skyline 是主路径、WebView 必须可用；页面不为双端分叉，每页只用两端共有子集，差异由目录数据的 `renderNotes` 逐页记录。
- `design` / `runtime` / `utils` / `core` 四域必须有展示位置，演示站不得只覆盖 `ui` 子域。

## 4. 真源分层

- 本篇：页面分组的设计约束与理由。
- `demo/src/catalog.ts`：运行时页面、示例、用法与双端记录数据。
- [对外契约](../api/exports.md)：exports 子路径与 import 形态。
- 台账 worklog：过程摘要与指向，不复制以上正文。

## 更新日志

- 2026-11-08 00:23:20：新建
- 2026-11-08 00:24:28：填实页面结构、不可破约束与真源分层
- 2026-11-08 00:38:10：页面结构表与真源分层表改为带逐节点备注的目录树
- 2026-11-08 01:32:55：按 docwriter 1.1.0 重整：补记 9 页目录树同步、Taro sourceRoot 与平台插件提升两条约束
- 2026-11-08 20:23:41：加图标展示页：目录树、页数与 ui 子域数量同步
