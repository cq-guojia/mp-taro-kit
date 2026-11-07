# 20261107-0305-6f80-定稿-design-层-token-契约: 定稿 design 层 token 契约

- **Tags**: 设计, token, 样式契约, 能力清单
- **Status**: doing · 2026-11-07 04:00:22 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-07 03:05:44 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

**触发原话**（2026-11-07）：「行，那就先来做第一个事情。你把第一个事情建一个新的任务，把前因后果给说明白，然后把这个任务接了。」承接上一轮给出的四步清单，第 1 步是「定能力清单与抽象契约，先把 `src/design/tokens.css` 从占位定稿」。

**前因（这件事从哪来）**：

1. 上一个任务 `20261106-0806-0a0a-搭建-mp-taro-kit-基础仓库与发布链路` 已于 2026-11-07 由用户确认 npm `0.0.3` 上线后 `close` 结案。三项判据全部达成：基础构建好（目录骨架 / 包清单 / CI / TS+SCSS 编译链 / guard / token 实体）、新的发版流程跑通（`v0.0.3` tag 触发 `publish.yml`，registry `latest=0.0.3`、OIDC `attestations=true`、tarball 含 20 个 `dist` 产物）、不落码。
2. 用户更早拍板（原话）：「我认为把基础构建好，把新的发版流程跑通了，不需要落码，这一个任务就算完成了。然后我就准备开始下一个，一个一个开始落码了。」据此，上一任务原 To Do 5「定能力清单与抽象契约」及**全部能力源码**一律移出、归入下一个任务，一个一个落；已落的 6 个 `index.ts` 骨架与 `tokens.css` 占位只定性为编译链验证物，不算落码。
3. 所以「下一个」= 逐层落码；「第一件事」= 依赖图最底层、评审顺序第一层的 `design`。理由：评审确立的严格顺序是 `design`（`--mp-*` token 真源）→ `utils`（零依赖纯函数）→ `runtime`（Promise / 单例 / overlay 栈）→ `{ core, ui }`（平级互不 import）→ 宿主 demo 双端验证；且 `--mp-*` 前缀与兜底值是对外隐形契约，改名等于让所有已接入宿主的换肤同时失效，代价最大，先定才能避免组件契约返工。
4. **现状（可验证）**：`src/design/tokens.css` 是占位，覆盖颜色 / 圆角 / 间距 / 字号 / 动画时长五类，取值待定稿；`./styles/tokens` 出口已挂且实体存在（`scripts/build.mjs` 把 `src/design/tokens.css` 映射为 `dist/styles/tokens.css`）；`dist/` 20 个产物全是 `export {}` 骨架 + 占位 CSS，`guard` 只校验结构完整、不校验内容，`0.0.3` 实质是空壳骨架包。

**一处待拍板的分歧（如实记录，不擅自回改已 close 的文档）**：上一任务结案时其 worklog Next 里写的是 `runtime → utils → design → core → ui`（助手顺手排的、未经用户拍板）；Hindsight 记忆里专家组评审的顺序是 `design → utils → runtime → { core, ui } → 宿主 demo 双端验证`。用户回「行，那就先来做第一个事情」= 采纳按评审顺序、`design` 先。本任务据此执行；上一任务已 close，其正文不回改。

**边界与约束**：包管理器一律 pnpm（`AGENTS.md`）；抽象策略是「参考不搬运」，`dsh-plugin-core` 优先看抽象经验、两个 KOC 项目只看「有哪些功能」，严禁搬实现；骨架屏已纳入能力清单但拍板「暂定手搓、实现延后」，不属本任务；`./ui/*` 与 `./ui/*/style` 两个悬空出口按用户拍板 A 保留、到 ui 层补实体；落 `.tsx` 前须先定 `@types/react` / Taro 类型怎么进 devDependencies（装依赖前先问用户）——本层是纯 CSS，不触发该前置。

**定稿口径（2026-11-07 用户拍板，覆盖上文所有草案描述）**：用户否掉 `--mp-`（原话「容易冲突，太短了」），拍板 `--mptk-`；并要求「参考 `dsh-plugin-core` 的命名，通用用品差不多保持一致」「不是你要告诉我 DH 合不合理好吗？它合理就按照这个对齐呀」⇒ 判断其通用层命名合理后直接对齐，不再逐项请用户拍板。最终契约见 Conclusion。Background 第 3 条与 Process 早期记录里的 `--mp-*` 均为当时草案口径，**不是最终值**。

## To Do

1. ~~**定 design 层能力清单与抽象契约**~~ 已定稿（见 Conclusion）。
2. ~~**把 `src/design/tokens.css` 从占位定稿**~~ 已落码（`src/design/tokens.css:5-60`，`page` + `--mptk-*` 全条目）。
3. ~~**等用户给的东西**~~ 用户已拍板前缀与「按 DSH 对齐」原则；其余（数值、单位、挂载选择器、兜底语义、design 层范围）由助手按该原则直接判定，不再挂起。
4. ~~**落码后按 CI 顺序复验**~~ 已全过，实测输出见 Process。
5. ~~**待用户验收**~~ 用户 2026-11-07 原话「行，这个任务做完了就把它 close 掉吧」= 验收通过并指令结案。
6. **不属本任务但须记的验证欠账**（移交宿主 demo 阶段）：`--mptk-*` CSS 变量在 Skyline / WebView 双端的可用性（`page` 挂载与 px 单位）要宿主 demo 实机验证；只过 build / test / 类型检查不算验证（验证状态严格区分「双端实机验证过 / 已源码级核实 / 未验证假设」）。

## Next

本任务已结案，正文封卷只读。下一层 `utils` 由新任务承接（评审顺序 `design → utils → runtime → { core, ui } → 宿主 demo 双端验证`）；双端实机验证欠账与 `0.0.4`+ 发版一并留在后续任务，不在本任务补。

## Process

- 2026-11-07 建任务：首次 `progress new --title "定稿 design 层 token 契约" --tags "design 层,CSS 变量,token 契约,能力清单" --category "设计"` 被拒，报「标签 "design 层" 太长：含中文时最多 4 个字」；改用 `设计,token,样式契约,能力清单`（含中文标签 ≤4 字）后成功。任务号 `20261107-0305-6f80-定稿-design-层-token-契约`，落 `ledger/pool.json`，过程文档 `ledger/worklog/202611/07-0305-6f80-定稿-design-层-token-契约.md`。
- 2026-11-07 认领：`progress claim --id 20261107-0305-6f80-定稿-design-层-token-契约` 成功，`open → doing`，归属 `ledger/owners/58b5e0e26916.json`；`list --mine --json` 复核 `mine: true`、`started 2026-11-07 11:06:41`。
- 同步在 Hindsight 记忆侧登记 initiative 页 `kp-bbdf6dd23b60438fbf3eaaade4e37dc4`（记忆存储，非仓库文件）。
- 建任务当轮**未改任何代码 / 未装依赖 / 未 bump / 未打 tag / 未发版**。
- 2026-11-07 前缀与命名调研（只读）：核 `/code/dsh-plugins/dsh-plugin-core/src/design/style-kit.ts:7`（`CSS_PREFIX='dshpc'`）、`:95`（`cssVar` 拼接）、`src/design/tokens.css:110`（禁止业务文件自造）；通用层 `radius-xs..xl`（:197-204）、`space-1..4`（:207-210）、`font/line-xs..xl` 成对（:219-228）、`dur/dur-fast/ease`（:260-265）、`fg` / `surface` / `border` / 语义色分层（:4-9、:13-15、:60-63、:69-73）。成熟库对照（2026-11-07 检索）：Vant Weapp 靠 Shadow DOM 用无前缀组件内变量（`vant-ui.github.io/vant-weapp/#/theme`）、Vant(Vue) `--van-*`、TDesign `--td-*`、Element Plus `--el-*`、Bootstrap `--bs-*`。结论：形状无出入；主流短前缀靠隔离或生态位兜底，本库样式进宿主全局且无 Shadow DOM ⇒ 须换长前缀。用户拍板 `--mptk-`，并要求助手直接判断 DSH 命名是否合理（不是给选项）⇒ 判定通用层合理、按它对齐。
- 2026-11-07 落码（用户原话「你去吧，做吧，落马了」= 授权落码）：`src/design/tokens.css` 由 5 条占位改为 `page` + `--mptk-*` 全条目（文字 / 面 / 描边 / 语义色 / 圆角 / 间距 / 字号+行高 / 时长 八组）；`README.md:6` 同步前缀与「默认值集中在 `mp-taro-kit/styles/tokens`、组件不自带兜底值」口径。**未动** `package.json`、`scripts/build.mjs`、`scripts/check.mjs`、各 `index.ts`。实现取舍：边框色沿用 DSH 的 4% / 10% / 12% 档但写 `rgba()` 字面量而非 8 位 hex，避开小程序端 hex→rgba 兼容问题；不搬 DSH 的业务派生项（`--dshpc-sev-*` / `table-*` / `open-bg`）、宿主 alias 两层嵌套与 `createStyleKit` 运行时注入。
- 2026-11-07 复验实测：`pnpm install --frozen-lockfile`（pnpm 12.3.4、lockfile 未变）→ `pnpm run build`（`[build] dist/ 产物 20 个`）→ `pnpm test` / `pnpm run guard`（`[check] 包清单自洽性通过，dist 产物 20 个`）→ `pnpm pack --dry-run`（tarball 含 `dist/design/tokens.css` 与 `dist/styles/tokens.css` 等 20 个 `dist` 产物）全 exit=0；`cmp` 核源 / `dist/design` / `dist/styles` 三份 CSS 一致；`koc-codelint` 检查 2 个改动文件，L0~L5 全过；`git status --short` 仅 `M README.md` 与 `M src/design/tokens.css`。**未提交 / 未 bump / 未打 tag / 未发版**。

## Conclusion

`design` 层 token 契约已定稿并落码：前缀 `--mptk-`（弃 `--mp-`），变量名 `--mptk-<类别>-<档位>`；唯一真源 `src/design/tokens.css`，组件只写 `var(--mptk-x)`、不自带兜底值，宿主 `import 'mp-taro-kit/styles/tokens'` 后覆盖同名变量换肤；通用层命名按 `dsh-plugin-core` 对齐（`fg` / `surface` / `border` / 语义色分层、`radius-*`、`space-1..4`、`font-*` + `line-*` 成对、`dur*`），数值取其通用标尺；挂载 `page`；design 层只做 token 真源，不收 `theme.ts` / `safe-area`，阴影与 `z-*` 留到 UI 层需要时再加。CI 顺序复验与 `koc-codelint` 全过，`dist/` 仍 20 个产物、`./styles/tokens` 目标与源码一致。**留的坑**：① `page` 挂载与 px 单位在 Skyline / WebView 双端的表现仍是未验证假设，须宿主 demo 实机验证，不能宣称能力可用；② `0.0.3` 仍是空壳骨架包，能力落码后须 bump `0.0.4`+ 才发得出去；③ Hindsight 记忆页与上一任务已 close 的 worklog 里仍是 `--mp-*` 旧口径，属历史记录不回改；④ 上一任务已 close 的 worklog 顺序口径与评审顺序不一致，同样只记录不回改。代码与文档已于 `93d2d83` 提交并推送 main（普通 push 不触发发版，`.github/workflows/publish.yml:3-6` 只认 `push: tags: v*`），未 bump / 未 tag / 未发版。2026-11-07 用户确认「这个任务做完了就把它 close 掉吧」，按正常结案 `close`，不留 `doing`。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261107-0305-6f80-定稿-design-层-token-契约 --note "...". -->
- 2026-11-07 03:05:44 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created
- 2026-11-07 03:06:41 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-07 03:08:00 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建任务并认领：new --tags 设计,token,样式契约,能力清单 --category 设计（首次标签超 4 字被拒）；claim 后 doing/mine=true；前五节写明前因后果（上一任务 0.0.3 结案、评审顺序 design 先、--mp-* 隐形契约、0.0.3 为空壳包）与顺序分歧；未改任何代码、未装依赖、未发版
- 2026-11-07 03:47:57 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按拍板落码并交付待验收：src/design/tokens.css:5-60 改 page + --mptk-* 全条目（对齐 dsh-plugin-core 通用层）、README.md:6 同步 var(--mptk-*) 与 styles/tokens 口径；CI 链 install/build/test/guard/pack 全 exit=0、dist 20 产物、源与两份 tokens.css 一致、koc-codelint 2 文件 L0~L5 全过；未提交/未 bump/未 tag；To Do/Next/Process/Conclusion 已同步
- 2026-11-07 04:00:22 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户验收通过并指令结案：To Do 5 划掉、Next 改为结案后由 utils 新任务承接、Conclusion 补 93d2d83 提交推送与未发版口径；代码自复验后未再改动；准备 close
