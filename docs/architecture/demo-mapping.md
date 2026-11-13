# 演示站页与能力域映射

`demo/` 是仓库内的 Taro 小程序宿主，用于效果展示与使用方法说明。本篇只写页面分组的设计约束与理由；运行时页面、示例、菜单分组与用法数据的真源是 `demo/src/catalog.ts`，出口与 import 形态见 [对外契约](../api/exports.md)，构建与自检见 [开发](../development/build-and-test.md)。

## 1. 为什么单独成篇

演示站的页面清单随控件与能力增长；[架构总览](overview.md) 只描述系统组成与不可破约束，保持稳定，不承载逐页清单。两者分开，新增演示内容不会让总览膨胀，也不会把使用说明混进结构描述。

## 2. 目录树

小程序是线性页面栈，没有网页常驻侧栏，目录必须单独成页；展示端按能力域分页，便于 Skyline 与 WebView 逐页对照。共 1 个索引页 + 16 个展示页；基础规范组下的设计基础与尺寸各成一页，不共用一个展示页，也不对应单个 `ui` 子域。

以下是约定的目录结构，每个节点后的备注说明该路径的职责与对应的库侧能力域；骨架屏只在 `catalog.ts` 预留 id，树中不生成节点。

```text
demo/                                               # 仓库内的 Taro 小程序宿主
├── package.json                                    # 演示站清单：mp-taro-kit 用 workspace:*，并装宿主 peer 与 Taro Vite 编译链
├── app.config.ts                                   # 页面路由真源：pages 共 17 项，由 src/app.config.ts 转发给 Taro
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
    ├── catalog.ts                                  # 单一事实源：16 个展示页 + 9 组菜单；页含 id / path / summary / examples，菜单条目含 label / status / pageId
    ├── app.scss                                    # 演示站全局样式：只写 var(--mptk-*)，不硬编码颜色
    ├── components/                                 # 演示站共用组件：页面外壳、示例块与统一头部
    │   ├── DemoBlock.tsx                           # 单个示例外壳；另导出 DemoPage 页壳，按 catalog 铺块并把正文交给 DemoShell
    │   ├── DemoNav.tsx                             # 统一头部：标题前 logo；栈内有上一页则返回箭头，直达的子页则为小房子回首页；入口页用 home 声明，两者都不出
    │   └── DemoShell.tsx                           # 页面外壳：固定视口高度的 View + scroll-view；导航栏在滚动区外
    └── pages/                                      # 演示站页面：1 个索引页 + 16 个展示页
        ├── index/index.tsx                         # 目录页：用 CellGroup 铺 menu 固定分组；主题三态由 Segmented 渲染
        ├── design-foundation/index.tsx             # 设计基础：中性灰阶、色相与明暗两套，独立成页
        ├── sizing/index.tsx                        # 尺寸：控件高度三档与其余档位，独立成页
        ├── infra/index.tsx                         # src/ui/infra/：OverlayHost、SafeArea、use-store
        ├── actions/index.tsx                       # src/ui/actions/：Button
        ├── form/index.tsx                          # src/ui/form/：Switch，一页只放一个组件
        ├── segmented/index.tsx                     # src/ui/form/：Segmented，与 Switch 各占一页
        ├── icon/index.tsx                          # src/ui/icon/：按命名空间分组铺出各图标库的 glyph 与类名
        ├── feedback/index.tsx                      # src/ui/feedback/：Dialog、Loader、Loading、Toast
        ├── display/index.tsx                       # src/ui/display/：只放 Cell / CellGroup；与 Card 的组合归本页末组（向上引用）
        ├── badge/index.tsx                         # src/ui/display/：Badge，独立成页
        ├── divider/index.tsx                       # src/ui/display/：Divider，独立成页
        ├── card/index.tsx                          # src/ui/card/：Card 通用卡片容器，只列自身能力与宿主手搓内容
        ├── navigation/index.tsx                    # src/ui/navigation/：NavBar、Drawer、Dropdown
        ├── layout/index.tsx                        # src/ui/layout/：Mask、Overlay、Popup
        ├── foundation/index.tsx                    # design + runtime + utils + core 四域合并：换肤、单例、工具、configure 注入
        └── commands/index.tsx                      # ui/commands.ts + state.ts + infra/OverlayHost：命令式 API
```

每个 `ui` 子域展示页引入用到的组件样式：历史组件走子域 `mp-taro-kit/ui/*/style`，新组件走组件级 `mp-taro-kit/ui/*/<组件>/style`；`form` 与 `segmented` 两页各引各的组件级样式，样式是 import，不占树上的文件节点。

## 3. 不可破的约束

- Taro 4 按 `sourceRoot: 'src'` 定位入口，`demo/src/app.tsx` 与 `demo/src/app.config.ts` 必须在该目录下；根目录 `demo/app.config.ts` 是 pages 真源，由 `demo/src/app.config.ts` 转发。编译器用 esbuild bundle 求值配置，因此 `pages` 可由 `demo/src/catalog.ts` 动态派生。
- `pnpm-workspace.yaml` 的 `publicHoistPattern` 必须提升 `@tarojs/plugin-platform-weapp`：主库 `dist` 位于工作区根，Taro 把其中的 `@tarojs/components` 重写成该插件的裸包名，不提升则跨目录解析失败。
- 展示页与库侧路径仍一一对应：一页承载一个子域（`foundation` / `commands` 各承载一组能力域），路由由 `pages` 派生；新增能力域先在本树定位，再改 `demo/src/catalog.ts` 与 `demo/app.config.ts` 的 `pages`。
- 同一子域里已实现的多个组件各占一页，不混排：`form` 只放 Switch，`segmented` 只放 Segmented，`display` 只放 Cell / CellGroup，Badge 与 Divider 各自成页；`card` 是独立子域、通用卡片容器单独成页，业务向商品卡片占位改名 `ProductCard` 让出通用名；菜单条目通过 `pageId` 各自指向自己的页，点进去只看到这一件内容。`tests/ui.test.mjs` 断言 `ready` 条目指向真实展示页，并断言 Cell / Badge / Divider 三条菜单各指自己、Cell 页示例不混入别的内容。多对一仍是全站其余菜单的既有结构，不在本条约束内。
- 演示内容之间必须留空隙，组件不许一个个贴在一起：横排用 `.demo-row`、纵向多段用 `.demo-stack`，其中的组件一律带 `.demo-item`（自带右、下外边距，取值 `--mptk-space-3`）。不用 `gap` —— 老 WebView 内核不支持，Skyline 与 WebView 会呈现两种结果。
- 一页内示例较多时按 `section` 分组：`CatalogExample.section` 是页内分组标题，`DemoPage` 只在分组首块前插一个标题，未标 `section` 的页行为不变。分组判据按「使用者看效果的顺序」，不按库侧目录：Cell 页固定五组「容器形态 → 组级外观设置 → 单格内容与排布 → 交互与状态 → 与 Card 组合」，由大到小、由静态到交互；同类设置集中，新增设置追加到本组末尾、不插回形态组。Card 页固定三组「容器形态 → 外观设置 → 槽位与状态」，同样由大到小、由静态到交互。`tests/ui.test.mjs` 与 `tests/card.test.mjs` 断言两页的组顺序与分组连续，其他未标 `section` 的页不受影响。
- **组合示例按引用方向归属，只向上引用、不向下引用**：通用容器不知道自己会被谁装，`Card` 页只列自身能力与宿主手搓的内容（`Text` / `View` + 自身槽位），不列举具体子组件的组合；`Cell` 与 `Card` 的组合归引用方 `Cell` 页展示，并放在该页自身能力之后。展示顺序固定为「先看默认值 → 再看可枚举档位 → 再看设置开关 → 再看槽位与内容 → 再看交互状态 → 最后看与其他组件的组合」。`tests/card.test.mjs` 断言 Card 页源码与示例 `imports` 都不出现 `ui/display/cell`；`tests/ui.test.mjs` 断言组合示例归 Cell 页末组。
- 有尺寸轴的组件，页面第一块固定是「尺寸」示例：逐档铺开（sm / md / lg 各一条）并标出档位与取值，其余示例不再兼差当尺寸表。除这一块之外，演示一律按 `size="md"` 摆：同一形态有多个实例、或一页有多个形态时，全部用同一档 `md`，不混用 `lg` / `sm` —— 尺寸混用会被读成形态差异，形态之间也就没法横向比较。`tests/ui.test.mjs` 按示例块断言这条。
- 菜单与展示页是多对一：`menu` 的 `ready` 条目必须带 `pageId` 且指向真实展示页，`planned` 条目不带 `pageId`、不绑跳转；`tests/ui.test.mjs` 断言这两条。
- 菜单分组固定为九组：首组「基础规范」（Foundations）收纳颜色、尺寸等设计依据，中间六组对齐 Vant Weapp 六类（基础 / 表单 / 反馈 / 展示 / 导航 / 业务），末两组是「基础能力」「命令式 API」。顺序固定；已有占位只把 `planned` 改为 `ready`，新条目追加到该组末尾，不插入既有条目之间、不重排。`planned` 只是占位，不是待办清单。
- 基础规范组按「使用者查规范」的场景归类，不按 `src/ui/` 目录归类；「设计基础」与「尺寸」各指向自己的展示页，一页只装一件事，不把两块内容并回同页。两页各有自己的示例块，路由由 `pages` 派生；`tests/foundations.test.mjs` 断言两页独立、内容不串页。取值依据见[设计基础](design-foundation.md)，演示站不复制正文。
- 分组判据按「使用者找组件时的场景」，不按 `src/ui/` 的目录：`Toast` 排基础组件、`Dialog` 排反馈组件、`Popup` 排基础而 `Overlay` 排反馈，但库侧路径仍是 `ui/feedback` / `ui/layout`，目录不反向约束 exports。
- 每个页面必须走 `DemoShell`：外壳 `height: 100vh` + `scroll-view type="custom"`，页面 json 配 `disableScroll: true`。Skyline 不支持页面全局滚动，绕开外壳写普通容器会让超屏内容滚不到；平台依据见 [Skyline 渲染引擎](../dependencies/skyline-rendering.md)。
- 控件的效果展示归演示站；props、组内行为与用法代码归 `docs/api/<组件>.md`（如 [Cell 单元格](../api/cell.md)、[Switch 开关](../api/switch.md)、[Segmented 分段选择](../api/segmented.md)），演示站不展示代码。演示站不反向引用 `docs/`，因为消费端看不到仓库内部文档。
- 各 ui 子域各有自己的 style 出口，样式由各页装配时引入，不单独成页；icon 域没有组件，样式即字体声明与类名。子域清单以源码为准，文档不写死数量。
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
- 2026-11-12 14:53:57：新增 form 展示页，页数与 ui 子域数同步，补组尾追加条目约束
- 2026-11-12 16:39:13：新增基础规范组与展示页，菜单改固定九组
- 2026-11-12 16:59:29：设计基础与尺寸拆成两个独立展示页，页数与菜单映射同步
- 2026-11-12 21:40:06：Switch 与 Segmented 拆成两页（form 只放 Switch），页数、路由与目录树同步，补「一页只放一个组件」约束
- 2026-11-12 21:48:05：补「演示内容之间必须留空隙」约束：横排 demo-row、纵向 demo-stack，组件带 demo-item，不用 gap
- 2026-11-13 09:25:13：补演示尺寸口径：首块逐档铺开尺寸，其余示例一律 md 档并用断言守住
- 2026-11-13 13:40:27：Cell 展示页只留 Cell，Badge / Divider 各拆一页（共 16 个展示页、16 条路由），三条菜单各指自己；卡片外框与分隔线同色同宽；约束明确不动全站多对一
- 2026-11-13 14:36:07：Cell 展示页按四组重排示例并补分组标题，不贯穿对照改通栏；补示例分组与顺序判据约束
- 2026-11-13 15:13:41：新增 Card 展示页（16 个展示页 / 17 条路由），补卡片族分组判据与 Cell 组合示例；子域数量不再写死
- 2026-11-13 16:42:48：两处 Card 组合示例改零参数，Card 页「装 Cell」示例改名 card-cell
- 2026-11-13 19:09:20：组合示例按引用方向归属：Card 页删掉装 Cell 示例，Cell 页新增末组「与 Card 组合」；补向上引用与展示顺序约束
- 2026-11-13 23:24:15：图标页说明改为按命名空间分组
