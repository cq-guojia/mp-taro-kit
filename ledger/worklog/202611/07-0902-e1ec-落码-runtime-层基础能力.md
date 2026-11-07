# 20261107-0902-e1ec-落码-runtime-层基础能力: 落码 runtime 层基础能力

- **Tags**: runtime, 基础能力, 抽象契约, 能力清单
- **Status**: doing · 2026-11-07 09:48:02 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-07 09:02:51 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

**触发原话**（2026-11-07）：「行，这个任务做完了，就把这个任务 close 掉，然后建下个任务吧。」用户确认 `utils` 层「做完了」，按正常结案 `close` 后按评审顺序开第三层 `runtime`。

**前因（这件事从哪来）**：

1. 逐层落码进度（严格顺序 `design → utils → runtime → { core, ui } → 宿主 demo 双端验证`）：design 层 `20261107-0305-6f80-定稿-design-层-token-契约` 已结案（`--mptk-*` token 真源，代码 `93d2d83`、结案 `1d88ab4`）；utils 层 `20261107-0400-4e9f-落码-utils-层纯函数` 已结案（`result: done`，`ledger/history/202611.md:7`，五类纯函数 + i18n 注册口，代码 `d2245d7`）。两份 worklog 已封卷，正文不回改。
2. 用户更早拍板「基础构建好、发版流程跑通、不需要落码就算完成，然后一个一个开始落码」，故能力源码按层逐个落，不并行铺开。
3. **为什么第三层是 `runtime`**：评审骨架把 Promise 工具 / 单例 / overlay 栈归 `runtime`，它是 `core`（路由 / 请求 / 权限）与 `ui`（控件）的公共运行时底座；`utils`（零依赖纯函数）与 `design`（token 真源）已就位，先定 runtime 的签名与错误口径可避免上层反复改调用。依赖方向 `utils / runtime / design → { core, ui } → 宿主`，`core` 与 `ui` 平级互不 import。
4. **现状（可验证）**：`src/runtime/index.ts:1-2` 仍是「骨架占位」注释 + `export {}`；`src/index.ts:2` 已 `export * from './runtime/index.js'`；`package.json:28-32` 的 `./runtime` 出口三条件齐全、`scripts/check.mjs:11-14` 必需出口清单含它，`dist/runtime/` 只有 `index.{js,cjs,d.ts}` 空壳；`scripts/build.mjs:71-92` 两遍 emit，新增 `.ts` 自动多出 3 个产物/模块（`dist/` 现 38 个）；`package.json:59` 的 `test` 目前只跑 `tests/utils.test.mjs`——**新增 runtime 自检要扩这个脚本**；npm `0.0.3` 仍是骨架包，未 bump / 未 tag / 未发版。
5. `docs/README.md` 按用户明确要求「文档先不建」仍不存在，本任务不补；`./ui/*` 与 `./ui/*/style` 悬空出口按拍板 A 保留、留给 ui 层补实体。

**边界与约束**：

- 包管理器一律 pnpm（`AGENTS.md`）；装任何依赖前先问用户（本层纯 TS，预计不触发）。
- 抽象策略「参考不搬运」：`dsh-plugin-core` 看抽象经验，KOC 项目只作验证样本；**上万个项目用 ⇒ 按通用性预先把签名定稳**，不按任何单项目的实际使用裁剪，也不套单项目「不预先抽象」的纪律（用户 2026-11-07 明确纠正）。
- `runtime` 可依赖 `utils` / `design`，但不得 import `React` / DOM / `Taro` 全局 / 宿主项目模块 / `core` / `ui`；平台能力靠参数注入；不引第三方依赖。
- 错误口径沿用 utils：失败不抛、返回约定兜底；按需 import + tree-shaking，体积默认最小；多语言若需文案走 `utils` 的 `t` / `registerMessages`，不另建语言包。
- Skyline 主路径 + WebView 必须可用；验证状态严格区分「双端实机验证过 / 已源码级核实 / 未验证假设」。
- 骨架屏「纳入能力清单、暂定手搓、实现延后」仍不属本任务；`docs/README.md` 不建。

## To Do

1. **定 `runtime` 层能力清单与抽象契约**（先出草案给用户拍板）：评审骨架的 Promise 工具（如 `sleep` / `withTimeout` / `retry` / `deferred`）、单例（`createSingleton` / 懒加载单例）、overlay 栈（push / pop / 清空 / 层级）是否照用、每类的边界与函数粒度、命名与目录组织、错误口径（失败不抛 / 返回兜底或拒绝 Promise 的约定）、`./runtime` 出口契约与按需 import 粒度、对外兼容性口径（签名变更给迁移步骤 / 回滚路径 / 回归宿主清单）。还要回答「`runtime` 是否收纳平台定时器 / 事件总线之类能力（走注入）」。
2. **落码 `src/runtime/`**：按拍板实现，`src/runtime/index.ts` 从 `export {}` 换成具名导出；不改 `package.json` 的 exports、`scripts/*.mjs`、`src/index.ts`、其他能力域。
3. **等用户给的东西**：能力范围与模块划分、函数签名风格、异步错误口径。拍板前不改代码。
4. **补真验证**：新增 `tests/runtime.test.mjs`（Node 内置 `node:test`），并把 `package.json:59` 的 `test` 扩成能跑多个测试文件。**坑已验证**：Node v24.20.0 下 `node --test tests/` 会把目录当模块入口报 `Cannot find module .../tests`，须用文件 glob（如 `node --test tests/*.test.mjs`），别重试裸目录。
5. **落码后按 CI 顺序复验**：`pnpm install --frozen-lockfile` → `pnpm run build` → `pnpm test` → `pnpm run guard` → `pnpm pack --dry-run` 全 exit=0；`koc-codelint` L0~L5 全过；核 `dist/runtime/*` 与 `./runtime` 出口目标一致、`dist/` 产物数按新增模块数增加（不硬套 38）。
6. **不属本任务但须记的欠账**：`core` / `ui` 落码；宿主 demo 双端实机验证（`--mptk-*` 的 `page` / px、i18n 由宿主加载的路径）；bump `0.0.4`+ 发版；只过 build / test / 类型检查不算验证。

## Next

只读核对现状后产出**草案**（放对话里、不落盘、不改文件）：`src/runtime/index.ts:1-2` 骨架、`package.json:28-32` 的 `./runtime` 出口与 `scripts/check.mjs:11-14` 必需出口清单、`package.json:59` 的 test 接线、`/code/dsh-plugins/dsh-plugin-core/src/` 里 Promise / 单例 / overlay 栈的抽象经验、KOC 项目的注入器/装配点模式（作验证样本）；据此给出 `runtime` 层能力清单 + 抽象契约草案（模块划分、函数签名风格、异步错误口径），请用户拍板范围。拍板后再落码，然后按 To Do 5 的 CI 顺序复验。

## Process

- 2026-11-07 建任务并认领：用户「行，这个任务做完了，就把这个任务 close 掉，然后建下个任务吧」，用 `progress new --title "落码 runtime 层基础能力" --tags "runtime,基础能力,抽象契约,能力清单" --category "开发" --self` 一次完成（归自己名下、状态 `doing`），任务号 `20261107-0902-e1ec-落码-runtime-层基础能力`，落 `ledger/owners/58b5e0e26916.json`，过程文档 `ledger/worklog/202611/07-0902-e1ec-落码-runtime-层基础能力.md`；`list --mine --json` 复核 `mine: true`、`status: doing`。
- 承接 utils 结案：`ledger/history/202611.md:7` 记 `result: done`（17:02:42），代码提交 `d2245d7`。台账写命令按脚本默认同步签入，未用 `--no-sync`——按 `troubleshooting.md:119,121` 的默认行为只 `git add` 台账路径，不会把代码文件带进台账提交。
- 本轮**未改任何代码 / 未装依赖 / 未 bump / 未打 tag / 未发版**。

## Conclusion

新任务「落码 runtime 层基础能力」已建并认领到本机名下，状态 `doing`；前因（design / utils 结案、评审顺序第三层）、现状、边界约束、待拍板项与验证欠账均已写明。**留的坑**：`runtime` 能力范围、模块划分与函数签名待用户拍板；`package.json:59` 的 test 只跑 utils 自检，新增测试须扩脚本且不能用裸目录；双端实机验证、`0.0.4`+ 发版、`core` / `ui` 落码仍是后续欠账；`docs/README.md` 按用户要求不建。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261107-0902-e1ec-落码-runtime-层基础能力 --note "...". -->
- 2026-11-07 09:02:51 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-07 09:04:17 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建并认领后写好前五节：Background 记触发原话、design/utils 两层结案与 93d2d83/d2245d7、评审顺序为何第三层是 runtime、src/runtime/index.ts:1-2 骨架与 dist 38 产物现状、package.json:59 test 只跑 utils 自检需扩、pnpm/参考不搬运/上万个项目用/零依赖/双端约束；To Do 6 条含能力清单草案、落码、待拍板项、自检（Node 24 裸目录坑）、CI 复验、验证欠账；Next 指向只读核对后出草案；未改任何代码/未装依赖/未发版
- 2026-11-07 09:48:02 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · runtime 概念澄清后重定契约：To Do 1 的 sleep/withTimeout/retry/deferred 口径作废，正确清单为 thenable/singleton/overlay-stack/notify/loading-slot 五模块；runtime 零平台依赖、纯内存共享状态、不碰 wx.setStorage、不收定时器与事件总线；契约草案已出，按 To Do 3 拍板前不改代码
