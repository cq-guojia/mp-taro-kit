# 20261120-1619-e1fb-修-popup-关闭按钮定位与安全区留白: 修 Popup 关闭按钮定位与安全区留白

- **Tags**: Popup, 安全区, 关闭按钮, Skyline, 缺陷修复
- **Status**: doing · 2026-11-20 16:20:40 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-20 16:19:51 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

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
- ~~补测试防回归~~：done，见 Process 五。
- ~~文档同步~~：done，见 Process 六。
- 真机验收：用户侧在 Skyline 下确认 × 在各档位回到正确位置、底部留白合理（Agent 无真机能力，不代判）。

## Next

用户开发者工具真机验收：打开 demo 站设置面板与各 popup 演示档位，确认 × 位置；若仍不对，按新截图继续定位，不靠字符串断言下结论。

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

### 七、验证

`pnpm test` 196/196、`pnpm run build`、`pnpm run guard`、`pnpm pack --dry-run`、demo `build:weapp`、docwriter check（22 篇全过）、codelint（16 文件 L0–L5 全过）。产物核对：demo WXSS 里 `.mptk-btn.mptk-popup__close{position:absolute}`（双类生效）、`above-right` 为 transform 方案、`calc(...+env(safe-area-inset-bottom))` 叠加残留为 0。

## Conclusion

治根因修掉关闭按钮 absolute 被 Button relative 覆盖的问题（双类提权），定位方案保持 transform 不动；底部留白由相加改取最大（注入真值 + JS 计算）。静态与产物层面全绿；真机验收留用户侧，Agent 不代判。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261120-1619-e1fb-修-popup-关闭按钮定位与安全区留白 --note "...". -->
- 2026-11-20 16:19:51 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-20 16:20:40 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 根因定位：单类 .mptk-popup__close 的 absolute 被后加载 .mptk-btn 的 relative 覆盖，双类提权修复；transform 方案保持；底部留白改 max(呼吸,横条) 注入真值；test196/build/guard/demo/doclint 全绿，待用户真机验收
