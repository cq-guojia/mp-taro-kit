# mp-taro-kit

基于 Taro + React 的小程序基础库（kit）。叫 kit 不叫 UI，是因为能力域不止界面：既有遮罩、弹出层、面板、安全区等 UI 容器能力，也会收纳跨项目通用的操作功能封装；具体业务内容通过 `children` / 插槽或宿主提供。

- Skyline 为主路径，WebView 必须可用
- 全量默认值只在项目根 `kit.config.mjs`，`src/design/_tokens.scss` 等是构建期生成物；宿主在 `config/index.js` 一次性加 `plugins: ['mp-taro-kit/plugin']`，之后只改自己的差异文件（契约见 `docs/api/config.md`）
- 对外样式值走 CSS 变量（`var(--mptk-*)`）；宿主在 `styles/theme-light` / `theme-dark` / `theme-auto` 三选一决定编译期明暗，或引 `styles/theme-runtime` 获得运行时热切换（契约见 `docs/api/exports.md`）
- 按需 import，靠 tree-shaking 控体积

> 能力源码与文档已落码，发版由 `v*` tag 触发 CI 现场构建 `dist/` 并发布；`dist/` 不入库。
>
> 文档索引见 [`docs/README.md`](docs/README.md)；控件的使用方法与效果展示在 [`demo/`](demo/) 演示站。
