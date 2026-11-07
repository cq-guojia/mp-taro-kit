# 20261107-0305-6f80-定稿-design-层-token-契约: 定稿 design 层 token 契约

- **Tags**: 设计, token, 样式契约, 能力清单
- **Status**: doing · 2026-11-07 03:08:00 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
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

## To Do

1. **定 design 层能力清单与抽象契约**（本任务的设计部分，先出草案让用户拍板）：`--mp-*` 命名规则与前缀承诺、五类 token 的完整条目、每个 token 的兜底值语义、`./styles/tokens` 出口契约、对外兼容性口径（改名须给迁移步骤 / 回滚路径 / 回归宿主清单）。还要回答「design 层除 token 真源外是否收纳主题 / 换肤分层」。
2. **把 `src/design/tokens.css` 从占位定稿**：颜色 / 圆角 / 间距 / 字号 / 动画时长五类的具体取值需用户拍板后落盘；`tokens.css` 是唯一真源，不在别处复制数值。
3. **等用户给的东西**：五类取值、是否增删类别、是否需要主题 / 换肤分层、`--mp-*` 命名是否按草案。拍板前不改代码。
4. **落码后按 CI 顺序复验**：`pnpm install --frozen-lockfile` → `pnpm run build` → `pnpm test` → `pnpm run guard` → `pnpm pack --dry-run` 全 exit=0；`koc-codelint` L0~L5 全过；核 `dist/styles/tokens.css` 内容与 `./styles/tokens` 出口目标一致、`dist/` 产物数不变（20 个）。
5. **不属本任务但须记的验证欠账**：`--mp-*` CSS 变量在 Skyline / WebView 双端的可用性要宿主 demo 实机验证；只过 build / test / 类型检查不算验证（验证状态严格区分「双端实机验证过 / 已源码级核实 / 未验证假设」）。

## Next

只读核对三处现状后产出**草案**（放对话里、不落盘、不改文件）：`src/design/tokens.css` 当前占位内容、`scripts/build.mjs` 的 CSS 映射分支（`tokens.css` → `dist/styles/tokens.css`）、`scripts/check.mjs` 的必需出口清单；据此给出 design 层能力清单 + `--mp-*` 命名与兜底契约草案（含五类 token 条目），请用户拍板取值与范围。拍板后再落 `src/design/tokens.css`，然后按 To Do 4 的 CI 顺序复验。

## Process

- 2026-11-07 建任务：首次 `progress new --title "定稿 design 层 token 契约" --tags "design 层,CSS 变量,token 契约,能力清单" --category "设计"` 被拒，报「标签 "design 层" 太长：含中文时最多 4 个字」；改用 `设计,token,样式契约,能力清单`（含中文标签 ≤4 字）后成功。任务号 `20261107-0305-6f80-定稿-design-层-token-契约`，落 `ledger/pool.json`，过程文档 `ledger/worklog/202611/07-0305-6f80-定稿-design-层-token-契约.md`。
- 2026-11-07 认领：`progress claim --id 20261107-0305-6f80-定稿-design-层-token-契约` 成功，`open → doing`，归属 `ledger/owners/58b5e0e26916.json`；`list --mine --json` 复核 `mine: true`、`started 2026-11-07 11:06:41`。
- 同步在 Hindsight 记忆侧登记 initiative 页 `kp-bbdf6dd23b60438fbf3eaaade4e37dc4`（记忆存储，非仓库文件）。
- 本轮**未改任何代码 / 未装依赖 / 未 bump / 未打 tag / 未发版**。

## Conclusion

新任务「定稿 design 层 token 契约」已建并认领到我名下，状态 `doing`，前因后果、能力清单待拍板项、验证欠账与顺序分歧均已写明。**留的坑**：token 五类取值与 design 层能力范围待用户拍板；`0.0.3` 是空壳骨架包，能力落码后须 bump `0.0.4`+ 才发得出去，且 demo 双端实机验证前不能宣称能力可用；上一任务已 close 的 worklog 里的顺序口径与评审顺序不一致，只在本任务如实记录、不回改。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261107-0305-6f80-定稿-design-层-token-契约 --note "...". -->
- 2026-11-07 03:05:44 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created
- 2026-11-07 03:06:41 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-07 03:08:00 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建任务并认领：new --tags 设计,token,样式契约,能力清单 --category 设计（首次标签超 4 字被拒）；claim 后 doing/mine=true；前五节写明前因后果（上一任务 0.0.3 结案、评审顺序 design 先、--mp-* 隐形契约、0.0.3 为空壳包）与顺序分歧；未改任何代码、未装依赖、未发版
