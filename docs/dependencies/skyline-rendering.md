# Skyline 渲染引擎

- 用途：`demo/` 演示站的渲染引擎，也是本库控件在开发者工具与真机上的实际渲染行为来源。本库不依赖 Skyline 的任何私有接口，只受它的样式与滚动约束。
- 适用版本：微信基础库 3.x（Skyline 要求 2.30.4+ / iOS 微信 8.0.34+）。
- 版本真源：`demo/app.config.ts` 的 `renderer` / `componentFramework` / `rendererOptions`；行为依据微信官方《Skyline 渲染引擎 · 从 WebView 迁移 · 起步》。
- 复核日期：2026-11-08

## 已核实行为

1. **不支持页面全局滚动。** 官方迁移文档第 4 条：页面须配 `"disableScroll": true`，滚动交给自己放的 `scroll-view`。演示站页面外壳因此是「固定视口高度的 `View` + 唯一 `scroll-view`」（`demo/src/components/DemoShell.tsx`），演示站每个页面配置都带 `disableScroll`。
2. **`scroll-view` 的 `type` 默认 `list`，官方标为必填。** `list` 对单个直接子节点会性能退化，整页布局（一个容器包标题 + 多个块）属于 `custom` 模式的场景。
3. **`scroll-view` 需要确定高度**才产生滚动：外壳 `height: 100%`，滚动区 `flex-grow: 1` / `flex-basis: 0` / `height: 0` 吃掉剩余高度。外壳高度跟着 `page` 内容盒走——库的主题出口（`styles/theme-*`，编译期三选一或运行时热切换，均含页面基线）给 `page` 满屏高度；底部安全区由外壳自己 `padding-bottom` 让位并铺背景（`page` 的 padding 区在 Skyline 下不画背景，会露窗口白底）。写 `100vh` 会顶破安全区、底部被裁。运行时热切换出口不在 `page` 上画底色：窗口底色由 `app.json` 的 `darkmode` + `themeLocation` + `window.backgroundColor` 的 `@变量` 在页面创建前解析，转场首帧不依赖 React 挂载，也不靠后代节点遮盖。
4. **字体图标（`::before` + 私有区字形）能正常渲染**，前提是承载它的 `text` 没被改成别的盒子。演示站导航栏的 logo 一直是裸 inline 写法，稳定显示。
5. **`color: currentColor` 写在承载字形的 `text` 上会让字形整个消失**（实测，核实时间见更新日志）。同一字体文件的其余字形正常，可排除字体加载失败；改回具体色值或干脆不写 color（继承父级）即恢复。

## 限制 / 坑

- 字体图标控件的字形节点只留图标类 + 字号，不要在同一节点上写 `display` / `color` / `animation`。要旋转或定尺寸，一律套外层 `View`，字形保持裸 inline —— 这是第 4、5 条的直接推论。`Loader` 的 `ring` 已改为自绘圆环（`Spinner`），不再受这两条约束；真正承载 `::before` 字形的图标（如演示站导航 logo）仍按此办理。
- **单边 `border` 上色会让 `border-radius` 整个失效**（微信开放社区置顶帖，官方回复「单边 border + border-radius 暂时还不支持」）：`border: 2px solid gray` 配 `border-top-color: blue` 再配 `border-radius: 50%`，Skyline 下画出来是旋转的方框，圆角改百分比或超大值都救不回来。本库自绘转圈因此不给单边边框上色：`circular` 用 `conic-gradient` 画弧 + 环形遮罩挖空（`mask` 只写 `url()`，Skyline 不认渐变遮罩），`chase` 用六点追逐；`tests/spinner.test.mjs` 断言产物里不出现 `border-top-color`。
- 演示站构建存在 `.swc` 转换缓存：只改 `demo/src/components/*` 这类被多页共享的模块时，共享 chunk 可能沿用旧转换结果，现象是页面布局没变。处理方式是删 `demo/.swc` 后重建 `pnpm --filter mp-taro-kit-demo build:weapp`。
- **开发者工具里「靠内容收缩取宽」的盒子会整块变空白。** 现象：`display: inline-flex` 这类按内容定宽的盒子，内部放一个 `flex: 1 1 0` 的 `scroll-view` 时，开发者工具把宽度算成 0 —— 组件只剩一块空白占位，一个像素都不画；同页里显式 `width: 100%` 的同款组件正常，真机也正常。判断方法：同页同组件、只差宽度来源，收缩取宽的那几个空白、定宽的那些正常，即可确认。修法是让宽度由根节点给出（`display: flex; width: 100%`），把底色与圆角下移到内层 track，不再让内容反过来决定祖先宽度 —— `Segmented` 的 `fit` 模式即按此改。
- Skyline 页面不显示滚动条属正常表现，不能用「没有滚动条」判断页面是否可滚。

## 更新日志

- 2026-11-08 22:40:51：新建，记录页面滚动约束与字体图标在 skyline 下的两个实测坑
- 2026-11-08 22:53:30：正文去掉实测日期，改由更新日志承载
- 2026-11-11 16:02:03：外壳高度改为 100%，跟随页面基线让出底部安全区
- 2026-11-11 20:06:19：页面基线来源改为三选一主题出口
- 2026-11-11 23:01:08：page 不再承载安全区 padding，改由页面外壳铺背景
- 2026-11-12 11:39:43：页面基线来源补运行时热切换出口
- 2026-11-12 12:32:02：补运行时出口首帧底色由官方窗口主题配置解析
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
- 2026-11-12 17:26:23：页面数不再写死，改述为演示站每个页面都带 disableScroll
- 2026-11-12 18:22:34：转圈改为自绘 8 点圆点环，绕开 Skyline 单边边框让圆角失效
- 2026-11-12 20:42:06：转圈改为 TDesign circular 圆环与 SpinKit 六点追逐两形态，默认圆环
- 2026-11-13 09:08:43：补开发者工具下收缩取宽塌成 0 宽的坑与判据
