# 20261126-1134-e20d-重构-toast-整个功能与-demo: 重构 toast 整个功能与 demo

- **Tags**: Toast, 演示站, 浮层反馈
- **Status**: doing · 2026-11-26 14:52:26 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-26 11:34:24 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

用户 2026-11-26 看完「浮层与弹出」九项清单后拍板：移除 Popover / Notify / ShareSheet 三个菜单占位（Popover 在 Vant Weapp 不存在；Notify 与 Toast 能力重合，Weapp 版只能顶部展示，Toast 自带 top/middle/bottom；ShareSheet 是分享渠道业务，不进基础库）。同轮要求重构 Toast 整个功能与 demo：现状 Toast 与 Loading 挤在同一个反馈页、命令式 showToast/showLoading 共用 `createNotifyCenter` 队列，职责混乱；用户要求按「一个组件一页」先建 Toast 空页，再调研成熟移动端 Toast 效果与开源实现后定契约。

## To Do

- **最终方案（架构 + 前端复核后）**：与 Dialog 共用全局命令宿主底座，但**独立一份 Toast lifecycle/store**，不把 Toast 塞进 `overlays: OverlayStack<DialogPayload>`。底座复用 `id + seq`、`open → close(exiting) → finish`、`claim/owns/release`、`useOverlayLifecycle` 订阅、`pageKey` 实例身份、action descriptor→Host 事件映射、全屏 fixed host + 逐类 pointer-events；不复用 Dialog 的 Promise 结算、busy 闸门、ContentPopup、遮罩锁，也不复用「宿主卸载即 clear 全局」。
- **跨页语义（相对成熟库的刻意差异）**：Vant Weapp / TDesign / Titian 是页面级，离开页面即收口；本库按用户硬约束做 **scope 交接**：`navigateTo` 后仍在有效期内的 Toast 把 `scope` 改挂到新栈顶页，由新页宿主认领续显剩余时间；`redirectTo/navigateBack` 旧页销毁时只清理该页 owner 的条目，禁止全局 clear；无新页承接（app 退出）才清。`expiresAt` 是唯一时间真值，timer 只做及时触发；emit/expire 一律在 store/effect 里做，render 期不改 store。
- **载荷只可序列化**：`title` / `description` / `icon`（图标名或 tone）/ `closeButton` / `action` 均为 descriptor；**禁止 ReactNode、`onClick`、resolve 进 store**。业务回调只作为 `showToast(options.onAction)` 的命令层字段，Host 按 `phase === 'open' && mountedRef.current && isCurrent(id, seq)` 守卫后调用。`ensureMounted('toast', currentScope)` 必须确认当前页有宿主，不能只看全局计数。
- **显示交互（抄 sonner-native，按小程序降级）**：默认平铺，顶部往下长 / 底部往上长，各自计时；`enableStacking` 折叠成一摞，点任意一条整叠展开为全宽竖排列表，点外部或再点收起，`visibleToasts` 默认 3，超限整条隐藏。不做 hover。用固定档高 + CSS `transition` 的离散位移/缩放，不实测 `toastHeights`；安全区从 `safeAreaState()` 注入；关闭叉复用 `CloseGlyph`；swipe 用 `onTouchStart/Move/End` 离散阈值（位置感知），真机未验前不宣称等价 Reanimated。
- **交付清单**：`src/ui/state.ts` 新增 ToastPayload / ToastLifecycle / `hosts.toast`；`src/ui/infra/overlay-lifecycle.ts` 暴露 `scopeOf` 与 TTL 幂等；`src/ui/infra/ToastHost.tsx`；`src/ui/commands/toast/index.ts`；`src/ui/feedback/toast/{index.ts,style/index.scss}`；`src/ui/{index.ts,commands.ts,infra/index.ts}` 与 `src/app/index.ts` 出口；`src/ui/infra/style/index.scss`；`src/runtime/page-route.ts` 可订阅当前页；`src/app/{KitPage,create-kit-app}.tsx` scoped host 注册；`kit.config.mjs` 生成物；`demo/src/pages/toast/*`、`demo/src/catalog.ts`、`demo/src/app.tsx`；`docs/api/toast.md` 与相关出口/架构文档；测试 `overlay-lifecycle` / `ui` / `app` / `tree-shaking` / `render` / `card` 相应补断言。
- **不做**：声明式 `<Toast>`（因此 `markCardEdgeOutOfFlow` 不用加）；ReactNode / `onClick` 进载荷；全局 clear 兜底；照搬 Dialog 的 Promise / 遮罩 / 闸门；在 render 期改 store。
- **门禁**：`kit.config.mjs` 改完跑 `pnpm gen:config`；按 `build → test → guard → demo build:weapp → 产物核对` 顺序；`codelint` 全过；双端真机验证前不宣称可用。

## Next

像素级复刻已按 sonner-native 真实源码重建并通过门禁。用户验收看三处：演示站 Toast 页的卡片观感（白/深底、16 圆角、16 padding、屏幕宽−32、阴影）、折叠成一摞只露 8px 边且点开铺成列表、进场（top −20 / bottom 50 淡入 300ms easeOutQuart）与退场（±150 淡出 easeInOutCubic）；`navigateTo` 后 Toast 由新页续显。Skyline/WebView 双端真机手感与动画未验前不宣称与 Reanimated 等价。若要结案，用户明确说「结束/关闭任务」后走 `close`。

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

- 2026-11-26 架构 + 前端双重复核（只读，两个独立 agent）：① 现有 Dialog 的 owner 是「发起页唯一」，不是「当前页唯一」——`navigateTo` 后弹窗留在旧页、Promise 悬挂；照搬会让 Toast 在隐藏页渲染或过期才出现。修正为 scope 交接 + 当前页唯一渲染。② `ensureMounted` 只看全局计数，不证明当前页有宿主；修正为按 scope 校验。③ ReactNode / `onClick` 进全局 store 会把旧页闭包留在 `Symbol.for` 单例里、跨页点击打到错误页面；修正为 descriptor 载荷 + 命令层回调 + `isCurrent` 守卫。④ `expiresAt` 不能在 render 期改 store；timer 幂等 + effect 兜底。⑤ 宿主卸载禁止全局 clear，只按 owner 清。⑥ `createKitApp` 的 hosts 不在 fingerprint 内，重复配置会覆盖注册表，接入时避免隐式全局单写。前端侧：⑦ 不实测 `toastHeights`，用固定档高 + CSS transition；⑧ 安全区用 `safeAreaState()` 注入，`env()`仅兜底；⑨ 展开态透明层显式 `catchMove={false}` + 逐类 pointer-events；⑩ 不提供声明式 Toast，故不加 `markCardEdgeOutOfFlow`；⑪ demo 页不打 `section`（`tests/ui.test.mjs:773-775` 会红）；⑫ 避免 `var()` fallback / `inset` / 简写等 Skyline 会静默丢弃的写法。
- 2026-11-26 实施期踩坑：`demo/src/pages/toast/index.tsx` 与 `index.config.ts` 上一轮只建了空文件占位（0 字节），Node test 只读 catalog 声明、不编译页面所以没暴露；`pnpm --filter mp-taro-kit-demo build:weapp` 以 Rollup `MISSING_EXPORT: "default" is not exported by src/pages/toast/index.tsx` 抓出。按 dialog 页结构补齐三例（基础四 tone + 关闭叉 / 推四条堆叠 / action+onAction 撤销）后 demo build=0。教训：新增演示页的编译只有 demo build 能验，`build+test+guard` 全绿不等于演示站能看。
- 2026-11-26 用户退回首版观感（"白的一串、没折叠没动效、不信这么丑有人用"），要求像素级复刻不偷工减料。按 sonner-native 真实源码重建：`use-default-styles.ts`（padding 16 / radius 16 / marginHorizontal 16 / content gap 16 / title 600·20 / desc 14·20 / action 胶囊 999·1·6·14）、`toast.tsx`（shadow 0 4 12 rgba(0,0,0,.106)）、`use-colors.ts`（明 #fff/#232020/#4f4a4a/#e6e3e3/#f7f7f7，暗 #181313/#fff/#C0BEBE/#302B2B/#232020 + 四档 tone 图标色）、`constants.ts`（gap 14 / stackGap 8 / ESTIMATED_TOAST_HEIGHT 70 / duration 4000）、`animations.ts`+`animation-utils.ts`（进场 top −20 / bottom 50 淡入 300ms easeOutQuart；退场 ±150 淡出 easeInOutCubic）、`position-utils.ts`（折叠下层只露 stackGap、zIndex 递减）。色值/时长/间距/缓动全部进 `kit.config.mjs` 生成链（明暗同名同数），keyframes 内只写字面量（WXSS 固化表）；ToastView 自绘 tone 图标（CSS mask data URI，沿用 CloseGlyph 模式）；折叠层叠靠 `margin-top: -(70-8)` + scaleX 0.04 递减 + 内联 zIndex 递减（前面盖下层），展开按 stackGap 铺开。先提交 e0b053c（首版实现）再本轮复刻；全门禁 build/test263/guard/codelint/demo build 全绿，产物核对明暗 token (#fff/#181313 等)、阴影、四组进/退场 keyframes 位移真实落盘。Skyline/WebView 双端 box-shadow / mask 图标 / transform 动画仍需真机确认，未验前不宣称等价。

## Conclusion

首版（e0b053c）已提交推送；用户退回首版观感后，本轮按 sonner-native 真实源码做像素级复刻：卡片尺寸/色值/阴影/图标/进度条与折叠几何、进出场动画全部重建，色值等全部进配置生成链（非硬编码），产物核对真实落盘。Skyline/WebView 双端真机手感未验前不宣称与 Reanimated 等价。

最终方案已复核并落入工作日志，且已按清单实施完成：新 Toast 走独立 `toastLifecycle`（复用 `createOverlayLifecycle` 底座），可序列化 descriptor 载荷、命令层 `onAction` 回调、`expiresAt` 唯一时间真值、scope 交接 + 当前页唯一渲染；命令 `showToast` / `hideToast` / `closeToast` / `clearToasts` / `retargetToasts` / `sweepExpiredToasts`，宿主 `ToastHost`，精确子入口 `ui/commands/toast`，演示站独立 Toast 页三例，文档 `api/toast.md` 及出口/架构/映射同步。全量门禁：build=0（dist 418 产物）、test=263/263、guard=0、codelint=52 文件全过、demo build:weapp=0；产物核对 `demo/dist/pages/toast/{index.js,json,wxml,wxss}` 齐全、`app.json` 路由含 `pages/toast/index`、页内 4 处 `showToast` 与 `enableStacking` 证实非空壳。Skyline / WebView 双端手势与动画真机验证前不宣称与 Reanimated 等价。独立性限制：命令式宿主由 `KitPage` 在每页页面树渲染，靠模块级单例 + scope 交接实现「全局唯一、当前页唯一渲染」，不是 App 根节点常驻一棵宿主树。

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
- 2026-11-26 14:04:56 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 旧 Toast 实现已全量删除：组件/宿主/命令/队列/配置键/样式/导出/demo/测试/文档/生成物均清理；build=0、test=261/261、guard=0、demo build=0、codelint=0。仓库仅剩工作日志中的 Toast 字样
- 2026-11-26 14:11:56 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 架构+前端复核完成，修正跨页 scope 交接、descriptor 载荷、TTL 执行点、scoped ensureMounted、宿主交接清理等漏洞；最终方案已写入工作日志，开始实施
- 2026-11-26 14:38:28 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 实施完成：新 Toast 独立 lifecycle + 可序列化载荷 + scope 交接落地，demo 空页补齐（MISSING_EXPORT 根因）；全量门禁 build/test263/guard/codelint/demo build 全绿，产物核对 pages/toast 四件套齐全，worklog 正文已同步
- 2026-11-26 14:52:26 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按用户退回首版观感要求做像素级复刻：抓 sonner-native 真实源码（default-styles/colors/constants/animations/position-utils）重建尺寸色值阴影图标折叠几何与进出场动画，色值进 kit.config 生成链；全门禁 build/test263/guard/codelint/demo build 全绿，产物核对明暗 token/阴影/四组 keyframes 真实落盘
