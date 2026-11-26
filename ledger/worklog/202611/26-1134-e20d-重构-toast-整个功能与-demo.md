# 20261126-1134-e20d-重构-toast-整个功能与-demo: 重构 toast 整个功能与 demo

- **Tags**: Toast, 演示站, 浮层反馈
- **Status**: doing · 2026-11-26 11:48:16 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-26 11:34:24 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

用户 2026-11-26 看完「浮层与弹出」九项清单后拍板：移除 Popover / Notify / ShareSheet 三个菜单占位（Popover 在 Vant Weapp 不存在；Notify 与 Toast 能力重合，Weapp 版只能顶部展示，Toast 自带 top/middle/bottom；ShareSheet 是分享渠道业务，不进基础库）。同轮要求重构 Toast 整个功能与 demo：现状 Toast 与 Loading 挤在同一个反馈页、命令式 showToast/showLoading 共用 `createNotifyCenter` 队列，职责混乱；用户要求按「一个组件一页」先建 Toast 空页，再调研成熟移动端 Toast 效果与开源实现后定契约。

## To Do

- 调研移动端 Toast 效果示例与主流开源实现（需给用户链接，用户看完再定抄谁）；Vant Weapp Toast README 已是基线：`packages/toast/README.md`（type=loading/success/fail/html、position=top/middle/bottom、duration=2000、mask/forbidClick）。
- 定 Toast 契约：声明式与命令式边界、位置/类型/时长/队列、与 Loading 的分离、`NoticeTone` 语义是否保留。
- 落码：`src/ui/feedback/Toast.tsx`、`src/ui/commands.ts` 的 showToast/hideToast、`src/runtime/notify.ts` 队列、`src/ui/infra/ToastHost.tsx` 与样式。
- 填 `demo/src/pages/toast/index.tsx` 空页，按一页一组件铺示例；更新 `docs/api/` 对应契约与出口登记。
- 补/改测试，跑 build → test → guard → demo build:weapp → 产物核对；Skyline / WebView 双端实机验证前不得宣称可用。

## Next

等用户从调研链接里选定参照实现后，先写 `docs/api/toast.md` 契约，再按契约改 `src/ui/feedback/Toast.tsx:12` 与 `demo/src/pages/toast/index.tsx:4`；本轮只完成占位与空页。

## Process

- 2026-11-26 会话纠正：Vant Weapp 无 Popover（GitHub `youzan/vant-weapp` 的 `packages/` 无该目录），H5 版才有 `reference` 插槽气泡菜单；此前把 H5 示例当 Weapp 口径是错的。
- 2026-11-26 会话纠正：Vant Weapp Notify 原文仅「在页面顶部展示消息提示」，API 只有 `top` 距离与 `safeAreaInsetTop`，无 `position=top|bottom`；该能力是 H5 版口径。
- 本轮产物：`demo/src/catalog.ts` 删三项菜单占位，Toast 改指 `pages/toast/index`；反馈页移除 Toast 示例；新增 `demo/src/pages/toast/index.tsx` 空页与 `index.config.ts`；`docs/architecture/demo-mapping.md` 同步分组与分页口径。

## Conclusion

已建任务并完成前置整理：三个菜单占位移除、Toast 独立空页建好、前因后果登记。Toast 组件契约与 demo 内容尚未实现，未跑构建与自检，双端实机未验证。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261126-1134-e20d-重构-toast-整个功能与-demo --note "...". -->
- 2026-11-26 11:34:24 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-26 11:35:57 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建任务并写前因后果；移除 ShareSheet/Popover/Notify 菜单占位，Toast 改指独立空页 demo/src/pages/toast/index.tsx
- 2026-11-26 11:43:51 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 交付前门禁卡住：pnpm run build && demo build:weapp 命令无返回结果，未见 pnpm/vite/taro 进程；产物未核对，构建状态记为未验证
- 2026-11-26 11:48:16 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 构建卡点已解：终止旧进程后重定向日志重跑，pnpm run build 与 demo build:weapp 均成功；产物核对 demo/dist/pages/toast/{index.js,json,wxml} 存在，app.json 路由含 pages/toast/index，dist 无三个已移除组件字样
