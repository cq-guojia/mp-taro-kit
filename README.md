# mp-taro-kit

基于 Taro + React 的小程序基础库（kit）。叫 kit 不叫 UI，是因为能力域不止界面：既有遮罩、弹出层、面板、安全区等 UI 容器能力，也会收纳跨项目通用的操作功能封装；具体业务内容通过 `children` / 插槽或宿主提供。

- Skyline 为主路径，WebView 必须可用
- 对外样式值走 CSS 变量（`var(--mptk-*)`），真源只有 `src/design/_tokens.scss`；宿主从 `styles/theme-light` / `theme-dark` / `theme-auto` 三选一引入决定明暗，覆盖同名变量即可换肤
- 按需 import，靠 tree-shaking 控体积

> 能力源码与文档已落码，发版由 `v*` tag 触发 CI 现场构建 `dist/` 并发布；`dist/` 不入库。
>
> 文档索引见 [`docs/README.md`](docs/README.md)；控件的使用方法与效果展示在 [`demo/`](demo/) 演示站。
