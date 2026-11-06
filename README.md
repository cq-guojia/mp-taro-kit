# mp-taro-kit

基于 Taro + React 的小程序 UI 基础库：遮罩、弹出层、面板、安全区等容器能力，业务内容通过 `children` / 插槽注入。

- Skyline 为主路径，WebView 必须可用
- 对外样式值走 CSS 变量（`var(--mp-*, 兜底值)`），可整体换肤
- 按需 import，靠 tree-shaking 控体积

> 基础建设阶段，API 未定，暂不提供使用文档。
