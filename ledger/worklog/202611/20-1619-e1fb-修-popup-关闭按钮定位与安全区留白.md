# 20261120-1619-e1fb-修-popup-关闭按钮定位与安全区留白: 修 Popup 关闭按钮定位与安全区留白

- **Tags**: Popup, 安全区, 关闭按钮, Skyline, 缺陷修复
- **Status**: done · 2026-11-20 17:25:09 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-20 16:19:51 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Sealed**: 2026-11-20 17:25:09 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

用户 2026-11-20 连续反馈 demo 站设置面板（`DemoSettings`，底部 `Popup`）两个问题：① 关闭按钮 × 从外右上跑到面板内/左侧中部，多个截图（版本号 `261120-233327-362`、`261120-234024-814`）显示「没有一个档位是对的」；② 底部留白偏宽，用户指出「呼吸 16px + 横条」两笔留白同目的、应取最大不应相加。

用户明确要求：不要打补丁、不要靠"位置对了就改回去"式救火，先定位根因、讨论哪种方案合理再改；并以 Skyline 真机截图为验收依据（Agent 无真机，静态字符串断言不算验证）。

## To Do

- ~~定位 × 跑偏根因~~：done，见 Process 三。
- ~~底部留白相加改取最大~~：done，见 Process 四。
- ~~安全区不截短滚动可视区（外壳/drawer 尾距）~~：done，见 Process 八。
- ~~关闭按钮视觉：描边与叉压暗、分段滑块回默认档~~：done，见 Process 九。
- ~~关闭按钮背景默认半透明~~：done，见 Process 十。
- ~~补测试防回归~~：done，见 Process 五、八、九、十。
- ~~文档同步~~：done，见 Process 六、八、九、十。
- ~~提交并推送~~：done，见 Process 十一。
- ~~验收~~：用户 2026-11-20 确认「这是对了，下面那个间距应该也对了」；后续三轮改动用户未再报异常，结案。

## Next

无（已结案）。若真机再发现新现象，按新截图另建任务定位，不复用本单。

## Process

### 一、起点版本（用户确认"全对"的基线）

`b784174`：关闭按钮 `above-right` = `top:0; right:12px; transform: translateY(calc(var(--mptk-s-full-neg) - var(--mptk-space-3)))`（transform 方案），`--mptk-s-full-neg:-100%` 同批提交；面板底部 `padding-bottom: calc(var(--mptk-space-4) + env(safe-area-inset-bottom))`。

### 二、走过的弯路（避免重蹈）

- 误判 transform 在 Skyline 失效，改成 `bottom: calc(100% + gap)`——把本来对的方案换掉，倒退。
- 误信"产物里有这段 CSS"的字符串断言等于真机验证，两次宣称"确定修好"均被真机截图推翻。
- 一直盯着关闭按钮 CSS 本身改，没查 Button 复用带来的样式覆盖——方向错。

### 三、× 跑偏的真正根因（多专家视角定位）

`src/ui/layout/style/index.scss`：`.mptk-popup__close`（单类，0,1,0）写 `position:absolute`，但关闭按钮复用了核心 `Button`，`.mptk-btn`（单类，0,1,0）带 `position:relative` 且在后面加载——同权重后者胜，`absolute` 被覆盖成 `relative`，按钮退回文档流、`right` 丢失、各档位置全乱。

这是核心控件长期存在的 bug（b784174 也有），与"安全距离"改动无关——两种定位方案都以 absolute 为前提，前提不成立时换哪种方案都错。主流库（Vant Weapp `packages/popup/index.less` 的 `&__close-icon{position:absolute}`）用独立元素不复用 Button，故无此坑。

**修法**：把 `position:absolute` 与 `z-index` 移入双类 `.mptk-btn.mptk-popup__close`（0,2,0），压过 `.mptk-btn`；定位方案恢复 b784174 的 transform 原样不动。这样任何档位、任何方案基准位置都对，符合用户"用哪种方案位置都应该对"。

### 四、底部留白相加 → 取最大

原 `calc(var(--mptk-space-4) + env(safe-area-inset-bottom))` = 呼吸 16 + 横条 34 = 50px，两笔同一目的（内容离底边多远）不该累加。改为注入横条真值 + `resolveBottomInset()` 算 `max(呼吸16, 横条)`：`createKitApp` 经 `configureSafeArea` 注入 `bottomInset = screenHeight - safeArea.bottom`（Skyline 下 env 不可靠），CSS 贴底档只留呼吸档、JS 写行内覆盖；Popup/抽屉/FAB 共用同一算法。未注入时不猜、保持呼吸。

### 五、测试防回归

- `tests/layout.test.mjs`：锁住 absolute 必须写在双类上、外置档 transform 定位、取最大算法（34→34、0→16、8→16、未注入→0）、呼吸常量与 `--mptk-space-4` 同值。
- `tests/demo-settings.test.mjs`、`tests/ui.test.mjs`、`tests/app.test.mjs`：同步新口径，加 bottomInset 注入断言、FAB 贴底不叠加断言。
- 曾写 `doesNotMatch(css, /\.mptk-popup__close\s*\{[^}]*position:absolute/)` 误命中 CSS 注释里的同级文字，已删——断言要匹配真实规则块，不匹配注释措辞。

### 六、文档

`docs/api/popup.md` 几何口径改写为 transform 方案 + absolute 双类根因说明；`docs/api/floating-action.md` 安全区改取最大；`docs/api/app.md` 注入补 bottomInset；各篇更新日志用 docwriter 脚本追加。`docs/architecture/demo-mapping.md` 描述仍准确，未改。

### 七、验证（首轮）

`pnpm test` 196/196、`pnpm run build`、`pnpm run guard`、`pnpm pack --dry-run`、demo `build:weapp`、docwriter check（22 篇全过）、codelint（16 文件 L0–L5 全过）。产物核对：demo WXSS 里 `.mptk-btn.mptk-popup__close{position:absolute}`（双类生效）、`above-right` 为 transform 方案、`calc(...+env(safe-area-inset-bottom))` 叠加残留为 0。

### 八、安全区不该截短可视区（用户 UX 判断）

用户提出：为安全区把整页上提等于滚动区被削掉一截，滚不到底；应全高滚动、滚到底时内容末尾留尾距把横条区域滑上去。排查全仓后只两处是同类逻辑：

- `demo/src/app.scss`：`.demo-shell` 去掉 `padding-bottom: env(safe-area-inset-bottom)`，外壳满高；尾距移到滚动内容 `.demo-page` 末尾。
- `src/ui/navigation/Drawer.tsx` + `style/index.scss`：`paddingBottom` 从 `.mptk-drawer__panel` 移到 `ScrollView` 内的 `.mptk-drawer__tail`；面板 `padding-bottom: var(--mptk-s-zero)`。

**不改**的同类排查结论：Popup 贴底/左右档是 fixed 定高面板、自身不滚，留白仍在面板；FAB 贴底是定位不是滚动容器；`.mptk-safe-area--bottom` 本就是内容占位块；Card/Cell/Feedback 的 padding 与安全区无关。

编译产物实测：`.demo-shell` 无 bottom padding、`.demo-page` 有 `env(safe-area-inset-bottom)`、`.mptk-drawer__tail{padding-bottom:var(--mptk-space-4)}`；编译 JS 确认注入值落在 `mptk-drawer__tail` 的 style 上、且在 `ScrollView` 内。

### 九、关闭按钮视觉与滑块档位

用户反馈暗色下关闭按钮描边与小叉太亮、太显眼；设置面板分段滑块偏小。

- 描边与小叉：`src/ui/layout/style/index.scss` 的 `--mptk-btn-fg` 从 `var(--mptk-fg-3)` 改走 `var(--mptk-gray-6)`（色板注释即「次级图标」档）。`soft` 描边继续跟随 fg，外圈与叉一起淡。软底对比度暗色 4.25→2.60、明色 3.91→2.75，两端各降一档；尺寸不动（外框 26 / 叉 12.8px）。
- 分段滑块：`demo/src/components/DemoSettings.tsx` 两处 `Segmented` 去掉 `size="xs"`，回默认 `sm`（24→32px）。**只改库默认与调色，未改应用态**。

### 十、背景半透明默认值

用户反馈「半透明一点效果都没有」。根因：库默认 `closeBackground = true` → `resolveCloseStyle` 算出 `translucent: false`，半透明类从不渲染，走 Button 实底。半透明 CSS 本身是好的（`rgba(0,0,0,.55)`）。

改 `src/ui/layout/Popup.tsx` 与 `src/ui/layout/ImagePopup.tsx`（文档写「同 Popup」）的默认值均为 `false`；演示站自己的「背景」开关是应用态，未改。真实级联计算验证：默认类序列匹配编译 WXSS 后按权重排序，胜出规则为三类名 `.mptk-btn.mptk-popup__close.mptk-popup__close--translucent`（0,3,0），压过 Button 实底双类名（0,2,0），最终解析到 `rgba(0, 0, 0, .55)`。

### 十一、提交

- `8c6d9c7`：安全区尾距 + 关闭按钮描边/叉压暗 + 滑块回默认档。
- `f1537e3`：关闭按钮背景默认半透明（含 ImagePopup 同步）。

两笔均已 commit + push。测试 196/196、build/guard/demo build:weapp/docwriter check/codelint 全过。

## Conclusion

治根因修掉关闭按钮 absolute 被 Button relative 覆盖的问题（双类提权），定位方案保持 transform 不动；底部留白由相加改取最大；安全区从截短可视区改作滚动内容尾距；关闭按钮视觉压暗并默认半透明、尺寸不动，分段滑块回默认档。静态、产物与级联层面全绿，两笔提交已推送。用户已确认「这是对了，下面那个间距应该也对了」；Agent 无真机，未代判真机效果。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261120-1619-e1fb-修-popup-关闭按钮定位与安全区留白 --note "...". -->
- 2026-11-20 16:19:51 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-20 16:20:40 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 根因定位：单类 .mptk-popup__close 的 absolute 被后加载 .mptk-btn 的 relative 覆盖，双类提权修复；transform 方案保持；底部留白改 max(呼吸,横条) 注入真值；test196/build/guard/demo/doclint 全绿，待用户真机验收
- 2026-11-20 17:24:59 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 收尾补全过程：安全区改滚动内容尾距（demo 外壳/Drawer tail，面板 padding 归零）；关闭按钮描边与叉改 gray-6、尺寸不动；分段滑块回默认 sm；closeBackground 默认 false（Popup/ImagePopup），级联实测 rgba(0,0,0,.55)；两笔提交 8c6d9c7、f1537e3 已推送，196/196 全绿
- 2026-11-20 17:25:09 · close · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · sealed: 关闭按钮定位根因（absolute 被 Button relative 覆盖）已修、transform 方案保持；底部留白改取最大；安全区改滚动内容尾距不截短可视区；描边叉色压暗、分段滑块回默认 sm、背景默认半透明。文档/WORKLOG/测试同步，两笔提交已推送，门禁全绿。
