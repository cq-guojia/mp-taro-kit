# 20261107-0902-e1ec-落码-runtime-层基础能力: 落码 runtime 层基础能力

- **Tags**: runtime, 基础能力, 抽象契约, 能力清单
- **Status**: doing · 2026-11-07 10:25:06 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
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

1. ~~**定 `runtime` 层能力清单与抽象契约**~~ 已定稿（用户「行，我明白了，继续实施吧」澄清概念后，「你先做」= 拍板授权）。**定稿清单覆盖本节初版错误口径**：`thenable`（isThenable / isSuccess）、`singleton`（createSingleton）、`overlay-stack`（createOverlayStack）、`notify`（createNotifyCenter）、`loading-slot`（createLoadingSlot）五模块。原写的 `sleep` / `withTimeout` / `retry` / `deferred` 全部作废：`sleep` 不记事属 utils（当前定稿未含，不擅自加）、`withTimeout`/`retry` 归 core/request、`deferred` 是实现细节；平台定时器 / 事件总线不收、走注入；本地存储不碰。契约：零平台依赖、纯内存共享状态、失败不抛返回兜底、runtime 不渲染（只暴露 getSnapshot / subscribe）、栈不内置 resolve。
2. ~~**落码 `src/runtime/`**~~ 已落码：五模块 + `index.ts` 具名导出；未改 `package.json` 的 exports、`scripts/*.mjs`、`src/index.ts`、其他能力域。
3. ~~**等用户给的东西**~~ 用户「你先做」= 授权按草案建议口径落码，三项待拍板按建议实现：栈交还 payload 由 ui 自己 resolve、notify 默认 `limit = 3`、单例键前缀 `mptk/` 且不暴露 reset。
4. ~~**补真验证**~~ 已落 `tests/runtime.test.mjs` 9 组断言；`package.json:59` 的 `test` 扩成 `node --test tests/*.test.mjs`（文件 glob，裸目录坑已避开）。
5. ~~**落码后按 CI 顺序复验**~~ 已全过：`pnpm install --frozen-lockfile` → build（dist 38→53）→ test（16/16）→ guard → `pnpm pack --dry-run` 全 exit=0；ESM `dist/runtime/index.js` 与 CJS `dist/runtime/index.cjs` 双端加载通过；`koc-codelint` 8 文件 L0~L5 全过；无 `__pycache__` / `*.pyc`；`dist/runtime/` 18 个产物与 `./runtime` 出口目标一致。
6. ~~**待用户验收**~~ 已验收通过（2026-11-07 用户「这个做完了是吧，那就提交 close 掉，建下一个任务」= 验收通过并指令结案）。提交前按 CI 顺序复验全过，8 个代码文件已于 `ebe918c` 提交并 push 到 main。
7. **不属本任务但须记的欠账**：`core` / `ui` 落码；宿主 demo 双端实机验证（`--mptk-*` 的 `page` / px、i18n 由宿主加载路径、跨副本是否真出现两份模块实例）；bump `0.0.4`+ 发版；只过 build / test / 类型检查不算验证。

## Next

本任务已结案，正文封卷只读。下一具体动作由按评审顺序 `runtime → { core, ui }` 新建的 `core` 层任务承接：先只读核对 `src/core/index.ts` 骨架与 `package.json:38-42` 的 `./core` 出口，再定 `core` 层能力清单与抽象契约草案。

## Process

- 2026-11-07 建任务并认领：用户「行，这个任务做完了，就把这个任务 close 掉，然后建下个任务吧」，用 `progress new --title "落码 runtime 层基础能力" --tags "runtime,基础能力,抽象契约,能力清单" --category "开发" --self` 一次完成（归自己名下、状态 `doing`），任务号 `20261107-0902-e1ec-落码-runtime-层基础能力`，落 `ledger/owners/58b5e0e26916.json`，过程文档 `ledger/worklog/202611/07-0902-e1ec-落码-runtime-层基础能力.md`；`list --mine --json` 复核 `mine: true`、`status: doing`。
- 承接 utils 结案：`ledger/history/202611.md:7` 记 `result: done`（17:02:42），代码提交 `d2245d7`。台账写命令按脚本默认同步签入，未用 `--no-sync`——按 `troubleshooting.md:119,121` 的默认行为只 `git add` 台账路径，不会把代码文件带进台账提交。
- 2026-11-07 建任务当轮**未改任何代码 / 未装依赖 / 未 bump / 未打 tag / 未发版**。
- 2026-11-07 概念澄清（只读，多轮）：用户连续质疑「`sleep` 为何在 runtime」「runtime 与 core 有何区别」「runtime 的状态是否需本地存储」，重查 `06-0806...md:112-113`、本文件 `:28` 与 `dsh-plugin-core` 的 `modal-host.ts:19-54,106-164` / `loading-host.ts:3-23` / `thenable.ts:1-14`，确认 runtime = 零平台依赖的共享内存状态层（为 core ↔ ui 消环），不持久化、不渲染、不收定时器。分层判据定为「渲不渲染」「记不记事且要不要共享」「能否碰 Taro / wx」。初版 To Do 1 的 Promise 工具口径就此作废。
- 2026-11-07 落码与复验（用户「你先做」授权）：五模块 + 出口、9 组自检、test 脚本扩 glob。`koc-codelint` 首轮 L1 biome 报 `tests/runtime.test.mjs:15-16` 的 `noThenProperty`（对象字面量定义 `then`），未加豁免、未删断言，改用 `Object.defineProperty` 运行时挂载后 L0~L5 全过；CI 顺序全 exit=0、dist 38→53、ESM+CJS 双端加载通过。
- 2026-11-07 分包口径（用户确认「微信小程序分包肯定有」）：分包存在是既成事实，但「有分包 ⇒ 同一模块被打成两份实例」仍属**未验证假设**；`Symbol.for` + `globalThis` 只跨同一 JS 运行时内的多份模块，`singleton` 定性为防御性保险而非刚需。宿主 demo 阶段可用 `grep -ro "function createNotifyCenter" <产物目录> | wc -l` 判定，不用改库代码。

## Conclusion

`runtime` 层已按定稿契约落码、验收通过并结案。产出：`src/runtime/` 五模块 + `index.ts` 具名导出、`tests/runtime.test.mjs` 9 组断言、`package.json:59` 的 test 入口扩成文件 glob；`dist/runtime/` 18 个产物、`dist` 共 53 个；CI 顺序全 exit=0、`pnpm test` 16/16、ESM+CJS 双端加载通过、`koc-codelint` 8 文件 L0~L5 全过、无缓存残留。契约：零平台依赖、纯内存共享状态、失败不抛返回兜底、不渲染不持久化、栈不内置 resolve。代码提交 `ebe918c`（8 文件、375 行增）已 push 到 main，未 bump / 未 tag / 未发版，普通 push 不触发 `publish.yml`（只认 `tags: v*`）。**留的坑**：① 宿主 demo 双端实机验证（`--mptk-*` 的 `page` / px、i18n 由宿主加载路径、跨副本是否真出现两份实例）未做，不能宣称能力可用；② `core` / `ui` 落码与 `0.0.4`+ 发版仍是后续欠账；③ `docs/README.md` 按用户要求不建。2026-11-07 用户「这个做完了是吧，那就提交 close 掉，建下一个任务」= 验收通过并指令结案，正文封卷只读。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261107-0902-e1ec-落码-runtime-层基础能力 --note "...". -->
- 2026-11-07 09:02:51 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created and claimed
- 2026-11-07 09:04:17 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 建并认领后写好前五节：Background 记触发原话、design/utils 两层结案与 93d2d83/d2245d7、评审顺序为何第三层是 runtime、src/runtime/index.ts:1-2 骨架与 dist 38 产物现状、package.json:59 test 只跑 utils 自检需扩、pnpm/参考不搬运/上万个项目用/零依赖/双端约束；To Do 6 条含能力清单草案、落码、待拍板项、自检（Node 24 裸目录坑）、CI 复验、验证欠账；Next 指向只读核对后出草案；未改任何代码/未装依赖/未发版
- 2026-11-07 09:48:02 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · runtime 概念澄清后重定契约：To Do 1 的 sleep/withTimeout/retry/deferred 口径作废，正确清单为 thenable/singleton/overlay-stack/notify/loading-slot 五模块；runtime 零平台依赖、纯内存共享状态、不碰 wx.setStorage、不收定时器与事件总线；契约草案已出，按 To Do 3 拍板前不改代码
- 2026-11-07 09:53:06 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · runtime 层落码完成：src/runtime/ 五模块 thenable/singleton/overlay-stack/notify/loading-slot + index.ts 具名导出；tests/runtime.test.mjs 9 组断言、package.json:59 test 扩成 tests/*.test.mjs；dist 38→53 产物（runtime 18）、CI 顺序 install/build/test/guard/pack 全 exit=0、pnpm test 16/16、ESM+CJS 双端加载通过、koc-codelint 8 文件 L0~L5 全过（biome noThenProperty 改为运行时挂载 then 修复）；未 bump/未 tag/未发版/未提交
- 2026-11-07 10:18:02 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 同步正文前五节至交付待验收：修正 To Do 1 的 sleep/withTimeout/retry/deferred 错误口径为五模块定稿清单、划掉 To Do 1~5、补过程证据（概念澄清、biome noThenProperty 修复、分包口径）与 Conclusion；Next 列为 close / 提交 / 建 core 任务三条待用户定向；本轮只改 worklog 正文，未改代码、未提交、未建任务
- 2026-11-07 10:25:06 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 验收通过并同步正文：用户确认做完后，提交前 CI 顺序复验全过、koc-codelint 8 文件 L0~L5 全过；8 个代码文件由 ebe918c 提交并 push main；To Do 6 待验收划掉、Conclusion 补结案结论与提交号、Next 改为 core 层新任务承接
