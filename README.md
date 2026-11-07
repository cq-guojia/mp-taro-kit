# mp-taro-kit

基于 Taro + React 的小程序基础库（kit）。叫 kit 不叫 UI，是因为能力域不止界面：既有遮罩、弹出层、面板、安全区等 UI 容器能力，也会收纳跨项目通用的操作功能封装；具体业务内容通过 `children` / 插槽或宿主提供。

- Skyline 为主路径，WebView 必须可用
- 对外样式值走 CSS 变量（`var(--mptk-*)`），默认值集中在 `mp-taro-kit/styles/tokens`；宿主覆盖同名变量即可整体换肤
- 按需 import，靠 tree-shaking 控体积

> 基础建设阶段，API 未定，暂不提供使用文档。
