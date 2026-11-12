# Skyline 渲染引擎

- 用途：`demo/` 演示站的渲染引擎，也是本库控件在开发者工具与真机上的实际渲染行为来源。本库不依赖 Skyline 的任何私有接口，只受它的样式与滚动约束。
- 适用版本：微信基础库 3.x（Skyline 要求 2.30.4+ / iOS 微信 8.0.34+）。
- 版本真源：`demo/app.config.ts` 的 `renderer` / `componentFramework` / `rendererOptions`；行为依据微信官方《Skyline 渲染引擎 · 从 WebView 迁移 · 起步》。
- 复核日期：2026-11-08

## 已核实行为

1. **不支持页面全局滚动。** 官方迁移文档第 4 条：页面须配 `"disableScroll": true`，滚动交给自己放的 `scroll-view`。演示站页面外壳因此是「固定视口高度的 `View` + 唯一 `scroll-view`」（`demo/src/components/DemoShell.tsx`），10 个页面配置都带 `disableScroll`。
2. **`scroll-view` 的 `type` 默认 `list`，官方标为必填。** `list` 对单个直接子节点会性能退化，整页布局（一个容器包标题 + 多个块）属于 `custom` 模式的场景。
3. **`scroll-view` 需要确定高度**才产生滚动：外壳 `height: 100%`，滚动区 `flex-grow: 1` / `flex-basis: 0` / `height: 0` 吃掉剩余高度。外壳高度跟着 `page` 内容盒走——库的主题出口（`styles/theme-*`，编译期三选一或运行时热切换，均含页面基线）给 `page` 满屏高度；底部安全区由外壳自己 `padding-bottom` 让位并铺背景（`page` 的 padding 区在 Skyline 下不画背景，会露窗口白底）。写 `100vh` 会顶破安全区、底部被裁。运行时热切换出口不在 `page` 上画底色：窗口底色由 `app.json` 的 `darkmode` + `themeLocation` + `window.backgroundColor` 的 `@变量` 在页面创建前解析，转场首帧不依赖 React 挂载，也不靠后代节点遮盖。
4. **字体图标（`::before` + 私有区字形）能正常渲染**，前提是承载它的 `text` 没被改成别的盒子。演示站导航栏的 logo 一直是裸 inline 写法，稳定显示。
5. **`color: currentColor` 写在承载字形的 `text` 上会让字形整个消失**（实测，核实时间见更新日志）。同一字体文件的其余字形正常，可排除字体加载失败；改回具体色值或干脆不写 color（继承父级）即恢复。

## 限制 / 坑

- 字体图标控件（`Loader` 等）的字形节点只留图标类 + 字号，不要在同一节点上写 `display` / `color` / `animation`。要旋转或定尺寸，一律套外层 `View`，字形保持裸 inline —— 这是第 4、5 条的直接推论。
- 演示站构建存在 `.swc` 转换缓存：只改 `demo/src/components/*` 这类被多页共享的模块时，共享 chunk 可能沿用旧转换结果，现象是页面布局没变。处理方式是删 `demo/.swc` 后重建 `pnpm --filter mp-taro-kit-demo build:weapp`。
- Skyline 页面不显示滚动条属正常表现，不能用「没有滚动条」判断页面是否可滚。

## 更新日志

- 2026-11-08 22:40:51：新建，记录页面滚动约束与字体图标在 skyline 下的两个实测坑
- 2026-11-08 22:53:30：正文去掉实测日期，改由更新日志承载
- 2026-11-11 16:02:03：外壳高度改为 100%，跟随页面基线让出底部安全区
- 2026-11-11 20:06:19：页面基线来源改为三选一主题出口
- 2026-11-11 23:01:08：page 不再承载安全区 padding，改由页面外壳铺背景
- 2026-11-12 11:39:43：页面基线来源补运行时热切换出口
- 2026-11-12 12:32:02：补运行时出口首帧底色由官方窗口主题配置解析
