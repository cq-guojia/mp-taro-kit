# 20261126-1134-e20d-重构-toast-整个功能与-demo: 重构 toast 整个功能与 demo

- **Tags**: Toast, 演示站, 浮层反馈
- **Status**: doing · 2026-11-26 13:32:34 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-26 11:34:24 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

用户 2026-11-26 看完「浮层与弹出」九项清单后拍板：移除 Popover / Notify / ShareSheet 三个菜单占位（Popover 在 Vant Weapp 不存在；Notify 与 Toast 能力重合，Weapp 版只能顶部展示，Toast 自带 top/middle/bottom；ShareSheet 是分享渠道业务，不进基础库）。同轮要求重构 Toast 整个功能与 demo：现状 Toast 与 Loading 挤在同一个反馈页、命令式 showToast/showLoading 共用 `createNotifyCenter` 队列，职责混乱；用户要求按「一个组件一页」先建 Toast 空页，再调研成熟移动端 Toast 效果与开源实现后定契约。

## To Do

- **已拍板（2026-11-26）：抄 sonner-native 的显示与交互**，不抄它的 RN 实现。两种形态照搬：① 默认平铺，顶部往下长 / 底部往上长，各自计时、各自消失；② `enableStacking` 折叠成一摞，点任意一条整叠展开为全宽竖排列表，点外部或再点收起，最多显示 `visibleToasts`（参考实现默认 3）。不做 hover。内容槽暂定：标题（string）、内容/描述（string）、icon（可传，可有按 tone 的默认值）、关闭小叉（参考实现默认关，demo 要开）、定制 action/cancel 按钮；任意内容另走 custom/jsx 槽。
- **已拍板（2026-11-26）：全量重构，不保留旧 Toast 兼容**。先把现有 Toast 程序全部删除，再在统一底座上重建，禁止在旧实现上做局部修补。触发/后端采用**与 Dialog 同一套全局命令宿主协议**：模块级全局 store + 每条 id + `token/scope` 认领 + 当前页唯一渲染；Dialog 在此上加 Promise 结算与锁定，Toast 在此上加绝对到期时间 `expiresAt` 与堆叠/展开交互。外部只调命令函数，业务页面不写 `<Toast>`；`createKitApp({ hosts })` 一次配置。Vant Weapp / TDesign / Titian 的「页面预置组件 + 函数式 API」证明触发方式要统一，但它们是当前页级，不满足本库全局续显要求，只作机制参考。用户明确不要参考 dsh-plugin-core。
- 定 Toast 契约：声明式与命令式边界、位置/类型/时长/队列、与 Loading 的分离、`NoticeTone` 语义是否保留。
- 落码：`src/ui/feedback/Toast.tsx`、`src/ui/commands.ts` 的 showToast/hideToast、`src/runtime/notify.ts` 队列、`src/ui/infra/ToastHost.tsx` 与样式。
- 填 `demo/src/pages/toast/index.tsx` 空页，按一页一组件铺示例；更新 `docs/api/` 对应契约与出口登记。
- 补/改测试，跑 build → test → guard → demo build:weapp → 产物核对；Skyline / WebView 双端实机验证前不得宣称可用。

## Next

先删除全部旧 Toast 实现（源码专属文件、共享文件中的 Toast 分支、样式、配置、导出、demo、测试、文档、生成物），使仓库没有 Toast 残留；再在统一命令宿主协议上重写 Toast 契约与实现，最后写 `docs/api/toast.md` 并补 demo/tests。本轮只做「补录决定 + 删除旧实现」，不写新 Toast。

## Process

- 2026-11-26 会话纠正：Vant Weapp 无 Popover（GitHub `youzan/vant-weapp` 的 `packages/` 无该目录），H5 版才有 `reference` 插槽气泡菜单；此前把 H5 示例当 Weapp 口径是错的。
- 2026-11-26 会话纠正：Vant Weapp Notify 原文仅「在页面顶部展示消息提示」，API 只有 `top` 距离与 `safeAreaInsetTop`，无 `position=top|bottom`；该能力是 H5 版口径。
- 本轮产物：`demo/src/catalog.ts` 删三项菜单占位，Toast 改指 `pages/toast/index`；反馈页移除 Toast 示例；新增 `demo/src/pages/toast/index.tsx` 空页与 `index.config.ts`；`docs/architecture/demo-mapping.md` 同步分组与分页口径。
- 2026-11-26 二次调研（已被用户纠正）：上一轮给的 Sonner / react-hot-toast / toastify-js / notyf 都是 Web DOM 库，不是移动端，作废为代码参照；其中 Sonner 的堆叠/action/promise/位置感知手势仍可作为交互语法参考。真正的移动端候选：sonner-native（gunnartorfis/sonner-native-toasts，1.4k，https://sonner-native.netlify.app/，RN 版 Sonner：promise/action/swipe/暗色）、react-native-toast-message（calintamas，约 2.1k，键盘感知、自定义布局）、AlertToast（SwiftUI，2.4k，https://elai950.github.io/AlertToast/，Apple 风格多形态）。小程序独立 Toast 库：wepy-com-toast（105 star，2017 后未更新）、mp-toast-component（3 star），不足以当标准。移动端视觉参考：Mobbin Toast/Snackbar 真实 App 截图、UISDC《4个方法帮你快速做出吸睛的 Toast 设计》（破形/异形/背板/冷暖对比/颜色呼应）。这些都不是 Taro/小程序代码，落地仍需按本库约定重写；Skyline 下手势与异形需另验。

- 2026-11-26 Sonner Native 交互核实（看用户截图后查源码，含一次纠正）：移动端没有 hover，`src/types.ts` 把 `expand?: boolean` 注释掉并写明 `hover not supported on mobile`。**纠正**：此前说「收起只露标题、展开才露 description/action」是 Web Sonner 的行为；sonner-native 的 `src/toast.tsx` 里 `isExpanded` 只参与位置和动画计算，不字段级控制 title/description/action/icon/closeButton 的显示。多条时：`enableStacking` 为真才按 `visibleToasts` 限制（positioner 回退值 3），超出的**整条隐藏**，不是露边；`toast.tsx` 按 `distanceFromFront` 判定，top-center 前端是 index 0，其余是最大 index；堆叠顺序由 `getOrderedToastIds(..., enableStacking)` 决定，top-center 先反转数组。`src/toaster.tsx` 用实测 `toastHeights` / `toastHeightsVersion` 与 `isExpanded` 驱动下层位移/层级/动画。点击 toast 由 `src/gestures.tsx` 的 Tap 交给上层 `toggleExpand(channel)`，切换整叠展开/收起；`src/positioner.tsx` 的堆叠外点击区域只在展开时计算并用于收起，`center` 位置禁用展开/收起。关闭走 `closeButton` 或 swipe：left 阈值屏宽 25%、up 阈值 16px 且底部实际下滑，反向拖有弹性阻力。动画靠 Reanimated 3 + Gesture Handler，小程序只能借交互语法。

- 2026-11-26 在线示例核实：https://sonner-native.netlify.app/ 是 Docusaurus 文档站，手机打开只有文档和代码块，不能实际点/滑 Toast；官方 README 提供 Expo Snack 入口 https://snack.expo.dev/@gunnartorfis/sonner-native （作者账号 @gunnartorfis，手机装 Expo Go 后扫码可在真机运行），另有录屏 https://github.com/user-attachments/assets/ccc428ca-37c3-4589-9e8c-f414c40d764c （重定向后 content-type=video/quicktime）可直接看动效。

- 2026-11-26 用户拍板：**抄 sonner-native 的显示与交互，不抄 RN 实现**。默认平铺 + 可选折叠牌堆点开成列表；内容槽暂定标题、内容/描述、icon、关闭叉、定制 action/cancel 按钮。sonner-native `src/types.ts` 证实这些槽都有：`title`/`description` 是 string，`icon`/`action`/`cancel`/`close`/`jsx`/`backgroundComponent` 是 ReactNode 槽，`closeButton` 是 boolean，参考实现默认 false。
- 2026-11-26 Vant Weapp 触发机制核实（用户点名看该站点，且明确不要参考 dsh-plugin-core）：`packages/toast/toast.ts` 的 `getContext()` 取 `getCurrentPages()` 栈顶页，再 `context.selectComponent('#van-toast')` + `toast.setData(options)`；`packages/notify/notify.ts` 同构。`Toast.loading/success/fail` 由 `createMethod(type)` 生成。模块级只有 `currentOptions` 默认配置与 `queue`，**没有全局单例宿主**；页面必须自己放 `<van-toast id="van-toast" />`，找不到节点就只告警。结论：Vant Weapp 是页面级触发，不满足用户「全局唯一」硬约束，只作反面证据。
- 2026-11-26 当前实现症状定位：本库 `src/app/KitPage.tsx:137,152` 把 hosts 渲染在**每个页面树**里；`src/runtime/notify.ts:22` 的队列是模块级、`src/ui/commands.ts:51-64` 的自动消失定时器也在模块级 state。于是页面销毁时宿主一起消失（视觉上 Toast 被页面带走），定时器仍会跑完但没人渲染。这正是用户观察到的「退出页面 Toast 立刻没了」。后端逻辑如何改成全局唯一，留下一轮拍板。

- 2026-11-26 用户拍板全量重构：现有 Toast 实现全部删除，不留兼容；新 Toast 与 Dialog 共用一套全局命令宿主协议（模块级 store + id + token/scope 认领 + 当前页唯一渲染 + `expiresAt`）。差异只在内容形态：Dialog 有 Promise 结算/锁定，Toast 有计时与堆叠展开。显示交互继续抄 sonner-native 的两种形态。

## Conclusion

已建任务并完成前置整理：三个菜单占位移除、前因后果登记；显示交互拍板抄 sonner-native，后端拍板与 Dialog 共用统一全局命令宿主协议。旧 Toast 实现待删除，新实现未写，未跑构建与自检，双端实机未验证。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261126-1134-e20d-重构-toast-整个功能与-demo --note "...". -->
- 2026-11-26 11:34:24 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-26 11:35:57 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建任务并写前因后果；移除 ShareSheet/Popover/Notify 菜单占位，Toast 改指独立空页 demo/src/pages/toast/index.tsx
- 2026-11-26 11:43:51 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 交付前门禁卡住：pnpm run build && demo build:weapp 命令无返回结果，未见 pnpm/vite/taro 进程；产物未核对，构建状态记为未验证
- 2026-11-26 11:48:16 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 构建卡点已解：终止旧进程后重定向日志重跑，pnpm run build 与 demo build:weapp 均成功；产物核对 demo/dist/pages/toast/{index.js,json,wxml} 存在，app.json 路由含 pages/toast/index，dist 无三个已移除组件字样
- 2026-11-26 11:58:32 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按用户新口径改找独立 Toast 控件候选：Sonner / react-hot-toast / toastify-js / notyf，另有 Mobbin / Dribbble / UISDC 视觉参考；已写入工作日志，等用户选定抄谁
- 2026-11-26 12:30:18 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户纠正上一轮候选不是移动端；改给 sonner-native / react-native-toast-message / AlertToast 与 Mobbin / UISDC 移动端视觉参考，工作日志已同步
- 2026-11-26 12:35:50 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 查 sonner-native 源码确认移动端无 hover：tap 切换展开/收起，swipe 关闭阈值 left=屏宽25%、up=16px且底部方向反转；已记入工作日志
- 2026-11-26 12:41:15 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 核实 sonner-native 在线演示：官网仅文档不可交互，官方 Expo Snack 可在手机 Expo Go 真机运行，README 另有 .mov 录屏链接
- 2026-11-26 12:47:57 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 纠正上一轮对 sonner-native 的描述：isExpanded 不控制 description/action 字段显示，只改堆叠位置与动画；多条时 visibleToasts 超限整条隐藏，默认回退 3；已改工作日志
- 2026-11-26 13:17:19 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户拍板抄 sonner-native 显示与交互（平铺/折叠点开成列表），内容槽暂定标题/内容/icon/关闭叉/定制按钮；触发必须全局唯一，下轮讨论；Vant Weapp 函数式 API 为页面级 getCurrentPages+selectComponent，不满足全局；当前 KitPage 每页挂 host 导致退出页面 toast 视觉消失，已记入工作日志
- 2026-11-26 13:32:34 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 补录全量重构决定：旧 Toast 全部删除不留兼容；新 Toast 与 Dialog 共用全局命令宿主协议（模块级 store + token/scope 认领 + 当前页唯一渲染 + expiresAt），显示交互抄 sonner-native
