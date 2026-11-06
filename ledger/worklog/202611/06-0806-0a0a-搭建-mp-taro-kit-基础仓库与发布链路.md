# 20261106-0806-0a0a-搭建-mp-taro-kit-基础仓库与发布链路: 搭建 mp-taro-kit 基础仓库与发布链路

- **Tags**: mp-taro-kit, Taro, 组件库, npm, GitHub
- **Status**: doing · 2026-11-06 15:25:36 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-06 08:06:05 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

### 起因

用户手上与以后会有多个小程序项目，都需要同一批基础控件与基础操作方法：弹出层、遮罩、加载屏蔽、按钮 loading、导航栏、下拉/侧滑面板，以及常用的操作封装。先把这个**通用基础库**做好，以后由这些项目消费；本库与任何老项目的迁移工作无关。

参照自己做 DSH 插件（`dsh-plugin-core`）的经验：最初没抽象，各插件各写一套，后来返工重构、把控件收口进基础库。这次想避免同一段路走两遍——先把底层库抽出来由自己维护，业务项目只消费。

目标：在 `/code/open-lab/mp-taro-kit` 建一个**公开、不含具体业务内容**的、基于**最新版 Taro + React** 的小程序通用基础库（kit）——小程序版的「基础控件核心 + 基础操作方法」，相当于 `dsh-plugin-core` 在小程序形态下的对应物。之所以不叫 UI 库，是因为除基础控件外还收纳通用的操作功能封装。三个现有项目只用来**参考「有哪些功能」与「怎么抽象」**，不搬实现、不服务于任何老项目迁移；老项目只是日后的消费者之一。

### 讨论过程与结论（按问答顺序，附理由）

1. **要不要抽一套 UI 库、靠配置覆盖样式？**
   能抽，但「配一套就变成自己的风格」只成立于 token 级差异（颜色、圆角、间距、字号、动画时长）。结构级差异（异形弹窗、图片位、按钮位置）没法用配置覆盖，只能靠插槽。
   用户拍板：**业务内容不进核心库**。「异形图片」只是举例，泛指各项目自己的内容与结构；UI 组件只提供容器能力（遮罩、底部弹出、下拉、手势、安全区），内容从 `children` 传入。（此处「库只提供容器能力」是当时针对 UI 组件的口径；2026-11-06 用户已把库整体定位改为基础库 kit，见「已拍板」。）

2. **用微信小程序插件（plugin）还是 npm 包？**
   用 npm 包。理由：插件有独立样式作用域，宿主改不到插件内部样式——第 1 条的主题覆盖直接作废；插件还要独立 appid、提交审核、每个宿主项目去后台单独「添加插件」，与「自己维护、改完所有项目立刻生效」的目标冲突。

3. **能不能只做 Skyline、放弃 WebView？**
   不能。PC / Mac 微信客户端不支持 Skyline，恒走 WebView——只做 Skyline 等于放弃 PC 入口。官方 fallback 只保证「整页回落到 WebView 能渲染」，不保证 Skyline 独占能力可用。
   结论：**Skyline 是主路径，WebView 必须可用**；样式与组件能力只能用两端共有的子集。

4. **独占 API（`draggable-sheet`、手势 handler、worklet 动画）降级会怎样？**
   不是动画变差，而是该交互直接不存在（官方：仅 Skyline 支持；社区官方答复「需要在 skyline 框架下使用」）。
   用户拍板：**尽量不用**；确属核心卖点必须用时，做页面级提示（「请用手机微信打开」），接受 PC 端该功能缺失。

5. **怎么控制小程序包体积？**
   用户要求严格按需：用哪个组件只打包哪个，连带它自己的依赖。澄清后确认这是构建期 tree-shaking 能力，与「发几个 npm 包」无关；**最终单包 `mp-taro-kit`，不拆包**。

6. **包名 / scope？**
   定为 `mp-taro-kit`（无 scope，全局唯一名）。已核 npm 未被占用、GitHub `mp-taro` 组织未被占用。

### 已拍板（用户明确认可）

- 形态：npm 包，非微信插件。
- 包名：`mp-taro-kit`，单包不拆。
- 定位（2026-11-06 用户明确纠正）：**基础库（kit），不只是 UI 库**。名称不带 UI 正因能力域不止界面；UI 容器能力只是能力域之一，还会放跨项目通用的操作功能封装。能力域开放，不以当前清单为边界，判断归属去找纳入与排除的规则。
- Skyline 主路径 + WebView 必须可用；独占 API 默认不用，必须用时页面级提示。
- 具体业务内容与业务数据不进库（UI 组件内容由 `children` / 插槽注入）；跨项目通用的操作功能封装属于本库。
- 按需 `import`，靠 tree-shaking 控体积。

### 技术约束（讨论中形成，附理由）

- **对外样式值必须走 CSS 变量，库内部照用 Sass**。理由：宿主要能覆盖库样式而不改库源码。Sass 变量在编译期被替换成固定值，发布后宿主改不了（只能用 `!important` 硬压）；CSS 变量留在产物里、运行期可继承、全局生效，宿主在 `app.scss` 改一行即可换肤。分工：库内部嵌套 / mixin / 计算照用 Sass，对外的颜色、圆角、间距、字号、动画时长写成 `var(--mp-*, 兜底值)`。Skyline 与 WebView 都支持 CSS 变量（Skyline 需安卓 8.0.35 / iOS 8.0.38+，简写属性内 `var()` 不生效，须写长写属性）。
- **组件不 `import` 宿主的私有模块（router / store / constants）**。准确含义：禁止的是「库源码指向宿主项目的相对路径 import」，不是禁止使用路由 / 请求 / 权限能力。能力由宿主通过 props / 回调注入（如 `canGoBack`、`onBack`）；路由、请求、权限这类框架层操作能力属于跨项目通用的操作功能封装，2026-11-06 用户改口径：**收进 `mp-taro-kit` 单包，不再另抽独立包**，但仍须按能力域隔离、按需 `import`，避免只用 Button 的项目被拖进整个请求层。现有 `nav-bar` 是反例（`nav-bar.tsx:25-27` 依赖 router / store / constants），抽离时改成外部传入系统信息与回调。原「独立包 / 先这么定，要撤再撤」的口径就此撤掉。
- **命令式 API 自带挂载点，不依赖宿主 store**。理由同上：宿主 store 是项目私有的，库若订阅宿主 `ui` 域，就绑死在某个项目上。
- **组件必须开箱即用**：声明式组件（`<Dialog open ...>`）与命令式 API（`showToast()` / `confirm()`）都要直接可用，使用者不写遮罩、不搭 div；遮罩、面板、进出动画由库内部实现。代价是宿主需在页面基座挂一次 `<OverlayHost />`，作为命令式 API 的渲染位置。

### 已移除的约束（开发期不采用）

- **组件 props 只增不改、token 只增不改名**：2026-11-06 由用户决定拿掉。当前是开发线，写错可以直接改；等库进入成熟期（开始被多个项目稳定依赖）再评估是否启用。

## To Do

按先后顺序，一条做完再下一条（2026-11-06 用户调整顺序：先把 GitHub 与 npm 的壳建起来，再定能力清单与目录结构）：

1. ~~**建 GitHub 仓库**：公开仓库，仓库名与包名一致（`mp-taro-kit`）。~~ 已完成：所有者把 `cqguojia` 加为 Write 协作者后推送成功，远端 main = `f23cde6`。
2. ~~**建 NPM 仓库**：在 npm 占住 `mp-taro-kit`，确认发布配置（`--access public`）。~~ 已完成：registry 有 `0.0.0-stage` 与 `0.0.1`，`latest = 0.0.1`。
3. **建 Trusted Publisher（OIDC）连接**：表单已提交、用户勾选 `Allow npm publish`、OIDC 已在 `v0.0.2` 的 stage publish 中验证可用；`publish.yml` 已改为 `npm publish --access public`（提交 `921bbb0`）。**剩最后一步**：用户在设置页点 Save changes 让权限生效、处理悬着的 staged 0.0.2，再由用户明确说「发版」触发一次直接发布，完成 2 天内的首次发布验证。
4. **定能力域与文件怎么存放**：按基础库（kit）定位划能力域、定域间依赖方向，再给目录结构与源码组织（各能力域、token、构建产物、文档各放哪）。目录/包结构标准经专家组评审并由用户认可（2026-11-06，详见 Process）；**目录骨架已按用户指令落盘**（`src/` 五个能力域 + `ui/` 六个子域 + `demo/`、`scripts/`、`tests/`，空目录用 `.gitkeep` 占位；`dist/` 依评审不入库、由 CI 产出）。`package.json` 与 CI 尚未改，P0 硬伤仍在（`package.json` 空包出口、`publish.yml` 无 build/test 直接发布），待用户指令再动。
5. **定能力清单与抽象契约**（**不是搬实现**）：基于最新版 Taro，重新设计**基础控件核心（UI 基础控件）+ 基础操作方法**的清单与契约。三个项目只作参考（两个 KOC 项目看「有哪些功能」、`dsh-plugin-core` 看「成熟抽象经验」）；与老项目迁移无关。**骨架屏（Skeleton）已拍板：纳入能力清单，方案「暂定手搓」**（2026-11-06 用户原话「先暂定，手搓好吧，以后要做的时候再说」）——不引第三方组件、只借 props 契约；**实现延后**，到要做的时候再定契约与归属（`ui/feedback` 或 `ui/display`）。社区调研与约束见 Process。

## Next

当前议题是第 4、5 项：**基于最新版 Taro（已定，不再讨论基线）做小程序版「基础控件核心 + 基础操作方法」**；三个项目只作参考，不搬实现、与迁移无关。目录骨架已落盘（To Do 4），骨架屏暂定手搓但实现延后（To Do 5）。下一步具体动作待用户指令：按认可的结构补 `package.json` 的 `exports`（含 `./styles/tokens`）/ `sideEffects` CSS 白名单 / `peerDependencies` / `types`，把 `publish.yml` 补成 `npm ci` → build → test → publish，同时开始逐项定能力清单与契约。第 3 项发版按用户明确要求**推迟到最基础框架打完之后**；届时再点 Save changes、Reject staged 0.0.2、由用户说「发版」触发直接发布验证。

## Process

讨论阶段已核实的事实（供后续引用，勿重复调研）：

- Skyline 支持 CSS 变量，官方 WXSS 支持表标注安卓 8.0.35 / iOS 8.0.38 起（`developers.weixin.qq.com/.../skyline/wxss.html`，2026-11-06 检索）。
- PC / Mac 微信客户端不支持 Skyline，恒走 WebView：`koc-weapp-zuche/docs/design/external/wechat-skyline.md:86`。
- 不满足版本 / PC 端 / 低版本微信时自动 fallback 为 WebView（官方保证）：同文件 `:40`。
- 现有组件可抽性：`src/components/float-panel.tsx:27-35` 纯 props 驱动，可直接搬；`src/components/nav-bar.tsx:25-27` 依赖 router / store / constants，抽离须改成注入。
- 宿主的构建补丁（伪元素冒号、inset 展开、hex→rgba、wxs 镜像、definePageConfig 剥离）在 `koc-weapp-zuche/config/index.ts:58-133`，抽 UI 包带不走，不属本任务范围。
- 名字核查：npm `mp-taro-kit` registry 404（未占用）；GitHub `mp-taro` org 404（未占用）。
- 台账标签限制：含中文时最多 4 字（建任务时被拒一次，已改「组件库」）。
- GitHub 仓库实建在个人账号 `cq-guojia/mp-taro-kit`（public，默认分支 main，空仓），非最初猜测的 `mp-taro` 组织；`package.json` 的 repository 已按此修正。
- 本机 SSH key 认证为 `cqguojia`，但推送 `cq-guojia/mp-taro-kit` 被拒（Permission denied）；环境里两个 GitHub token 的 permissions 均为 `pull: true, push: false`。
- 根因是**两个 GitHub 个人账号**：仓库所有者 `cq-guojia`（显示名 GuoJia）与本机身份 `cqguojia`（显示名 cq-guojia-agent）不同；`api.github.com/orgs/cq-guojia` 404、`users/cq-guojia` type=User，仓库 owner.type=User。换终端/换协议无效，须给 agent 账号开写权限或改用所有者的 PAT。
- `npm login` 成功（`npm whoami` = guojia），但 `npm publish --access public` 返回 EOTP：`npm login` 拿到的 web token 发布需二次验证，需 OTP 或 automation token。
- 本地骨架已就绪：`git init -b main`、`.gitignore`（含 `.codebuddy/`）、`README.md`、占位 `package.json`（0.0.1、MIT、files 只含 README），首次提交 `d18f7b6` 已生成待推送。
- npm Trusted Publisher 官方要求（`docs.npmjs.com/trusted-publishers`，2026-11-06 检索）：npm CLI ≥ 11.5.1 / Node ≥ 22.14.0；workflow 文件必须存在于 `.github/workflows/` 且文件名与表单完全一致；`permissions: id-token: write`；`setup-node` 配 `registry-url: https://registry.npmjs.org`；`package.json` 的 `repository.url` 必须与仓库匹配；连接建好后 2 天内必须完成首次成功发布，否则过期且不可编辑，只能删掉重建；连接建立后必填字段不可改。
- 官方 staged publishing（`docs.npmjs.com/staged-publishing`）：`npm stage publish` 不需 2FA，需维护者在 npmjs.com「Staged Packages」或 `npm stage approve <stage-id>` 用 2FA 审批后才真正发版；CLI 需 ≥ 11.15.0。给不存在的包 stage publish 会生成公开的 `0.0.0-stage` 占位版本——registry 里那个版本由此而来。
- `.github/workflows/publish.yml`（提交 `f23cde6`）：`push: tags: v*` 触发、`id-token: write`、Node 24、`npm install -g npm@latest`、`npm stage publish`；暂未加 `npm ci` / build / test（当前零依赖、无源码），已用 `shortcut:` 注释标注。
- 首次验证发布：`package.json` bump 到 `0.0.2`、提交 `b4184fd`、tag `v0.0.2` 推送后，Actions run `42195655412`（`https://github.com/cq-guojia/mp-taro-kit/actions/runs/42195655412`）全部步骤 success，含 `npm stage publish`——OIDC 授信生效，且证明 `repository.url` 的 `git+https://…git` 写法被接受。
- `npm stage list mp-taro-kit` 返回 staged release `c9dfdcf6-b24f-423c-960e-a115084dfd63`（version 0.0.2、tag latest、`staged by: GitHub Actions (trusted automation)`、status staged）；registry 此时仍只有 `0.0.0-stage`/`0.0.1`，`latest = 0.0.1`。
- `npm stage approve <stage-id>` 与 `npm trust list` 在本机均返回 EOTP（需 2FA），`npm stage list` 免 OTP 可读；Actions job 日志接口需 admin 权限，现有 token 取不到（403）。
- **权限 ≠ 命令**：Trusted Publisher 的 `Allowed actions` 只决定授信允许什么，实际行为由 workflow 里执行的命令决定。用户在设置页勾了 `Allow npm publish`（未勾 `Allow npm dist-tag`），但当时 workflow 跑的是 `npm stage publish`，所以 0.0.2 仍为 Staged。已把 `publish.yml` 末行改为 `npm publish --access public`（提交 `921bbb0`）。
- 更正前记：连接的**必填字段**（provider / owner / repo / workflow filename）建后不可改，但 `Allowed actions` 可在 npm 设置页编辑后 Save changes，无需删连接重建。
- 2026-11-06 用户纠正项目定位：`mp-taro-kit` 是**基础库（kit）不是 UI 库**，还会放跨项目通用的操作功能封装，能力域开放、不以当前清单为边界；已据此改 Background 目标、已拍板、技术约束（撤掉「框架层能力另抽独立包」），并同步改 hindsight bank 模板 `/workspace/NAS-Docker/_Config/hindsight/templates/Agent::Code::open-lab.mp-taro-kit.json` 的三段 mission、`package-identity-and-boundary-rules` 模型、subsystem 标签与相关 directive。
- 2026-11-06 功能清单调研（**讨论稿，未拍板；只作参考，不搬实现**）：两个候选来源项目已通读并核实——`koc-weapp-zuche-user` 并非原生小程序，而是 Taro 3.6.36 + React 18 + Redux 的老基建（起于 2022，`src/components/` 27 个 tsx），值钱的是 `src/lib/utils.ts`（1139 行，事件总线 + 全局弹窗 Promise 化）、四层弹窗基座 `MasterModal*` + `Overlay`、`src/api/weapp.ts`（30+ wx API 薄封装）；`koc-weapp-zuche` 是 Taro 4.3.0 + Vite + RTK + alova 的新框架，`src/components/` 仅 4 个 tsx、`src/utils/` 仅 3 文件，alert/confirm/toast/遮罩原语/独立 Icon/OverlayHost 全部只在设计文档与未结案台账里（`page-master.tsx:6-8` 是待办注释）。**两项目都没有 CSS 变量、没有 token 集中定义**：新项目只有 17 个 Sass 语义色（`styles/_variables.scss`）编译期注入，老项目颜色硬编码散落；都没有独立 Button（含按钮内 loading 转圈）、NavBar（老项目 20+ 页重复内联）、分页/下拉容器、时间/字符串/数字 utils。老项目依赖 4 个私有 npm 包 `koc-common-{string,datetimex,sleep,return}`（源码不在仓库），新项目无对应实现。
- 「配错」在两个项目里精确检索 `配错 / peicuo / 错配 / adapter` 均 0 命中；最可能是「配置」即老项目远程配置中心 `APPConfig`（`api/user.ts:184-211` 拉、`lib/utils.ts:925-940` 5 分钟缓存、8+ UI 消费），次之是「商户及应用 ID 不匹配」校验（`lib/utils.ts:886-890`）——待用户确认指哪一个。「Story」检索无真实模块，最可能是 `store`（Redux/RTK）的口误。
- 2026-11-06 用户纠正工作方法（**已拍板**）：**不是搬这两个项目，也不是把原功能原封不动搬过来**；它们只用来回答「有哪些功能」，实现要用最合理、最成熟的工程经验**重新抽象**。上一轮「可直接搬 / 需改造成注入 / 留在项目侧」三档措辞已作废，To Do 5 改为「定能力清单与抽象契约」。
- 第三个参考源 `/code/dsh-plugins/dsh-plugin-core`（v0.35.2，单包 + 10 条子路径导出；运行时宿主实为 DSH 客户端插件、真实 DOM/React，不是小程序）：用户指出其中已有按钮 loading 转圈、alert、confirm 等抽象成果，表现形式不同但**要抽象的东西差不多**，且状态处理、数据记录、通知中心也值得借鉴。已通读并核实：`src/ui/actions/Button.ts:88-92,176-205` 的 `onClick` 返回 Promise 即自动 loading/禁用/防连点、reject 不吞错、转圈统一复用 `Loader`、`loadingText` 锁宽防跳；`src/ui/feedback/modal-host.ts:106-110,166-171` 的 `confirmModal/alertModal` 全 Promise、懒建常驻宿主、栈式条目、空栈回收；`src/ui/infra/toast-host.ts:1-22` / `loading-host.ts:76-103` 用 `Symbol.for` 跨副本单例 + 单槽 Loading + 句柄 id；`src/ui/infra/host-data.ts:33-67` 是 `getSnapshot/subscribe` 型 observable，`ticker.ts` 全局唯一心跳，`*-logic.ts` 纯函数状态机；`src/design/` 是零 React 的 token 层、组件只认 `var(--dshpc-*)`、换肤即覆盖同名变量；`src/utils/` 零 ui/React/DOM/宿主依赖、失败不抛给兜底、内置中英字典 + `translate` 覆盖点。**该库没有自研事件总线/通知中心**（Toast 队列交给 sonner），也没有数据持久化（仅 PanelDock 一处 localStorage）。
- 三方分工：`koc` 两项目提供「业务里真实需要哪些功能」（老项目还有 `Taro.eventCenter` + `Utils.O*` 事件 Promise 化派发、新项目有注入式 `loading-scheduler` 与 `src/router/` 全量）；`dsh-plugin-core` 提供「控件粒度与分类、Promise 化 API、异步锁定契约、token 分层、全局唯一通知/加载管理器、逻辑与渲染分离、约定写成自检」这些成熟经验。**不能照进 Taro 的**：DOM/CSS 运行时注入风格串、`body[data-ds-dark-theme]` 判据、官方 primitives 与 `__ModuleLoader__`、宿主 ctx/HTTP 路由注入、React Context/portal、具体视觉档位、`adv/session` 业务镜像；以及该项目已反转/过期的结论（L0-L4 只是规划稿、ErrorBoundary 已删、README 子路径与代码不符、旧 `Loading` 已 deprecated）。
- 2026-11-06 用户再次纠正范围（**已拍板，此前把范围带偏的说法作废**）：**一律用最新版 Taro**，不做 Taro 基线选择、不讨论老项目升级；本库是给现在和以后 N 多个项目用的**通用组件基础库**，与 `koc-weapp-zuche-user` / `koc-weapp-zuche` 的迁移工作**完全无关**，迁移是用户之后自己做的事，不在本任务范围内；三个项目**只作参考**（参考有哪些功能、参考怎么抽象），不搬实现。本轮要抽象的是「基于最新版 Taro 小程序的 **UI 基础控件核心 + 基础操作方法**」，即小程序形态下 `dsh-plugin-core` 的对应物。已据此改起因、目标、To Do 5 与 Next。
- 2026-11-06 目录/包结构社区调研（**讨论稿**）：`@vant/weapp`（`miniprogram: "lib"`、`files: ["dist","lib"]`，`packages/skeleton/` 为 `index.ts/json/less/wxml` 原生四件套）、`tdesign-miniprogram`（`main: "miniprogram_dist/index.js"`、`miniprogram: "miniprogram_dist"`）、`@nutui/nutui`（`files` 含 `dist`，有 `build:taro`、demo 与分包发布脚本）。这些是**原生/半原生小程序组件库**，`miniprogram` 字段供微信原生组件定位目录，不适用于 Taro React 库——我们发预编译 `dist`，由宿主 `import` 而非 `usingComponents` 引入。
- 2026-11-06 目录/包结构专家组评审（**用户已认可修订结论**）：初版结构树查出 P0 阻断项——① `miniprogram` 字段不适用，删；② `sideEffects: false` 会把副作用 CSS 全摇掉，须改 CSS 白名单；③ token 缺独立出口，宿主无法只引变量换肤，须补 `./styles/tokens`；④ `core` 与 `ui` 互不 import 却要共用 Promise 化、跨副本单例、overlay 栈、通知/加载槽，需加 `runtime` 层否则成环；⑤ 命令式 API 只挂一个 `<OverlayHost />`，不搞多宿主；⑥ 当前 `package.json:6-8` 只有 `files: ["README.md"]`、无 `scripts`/`exports`/`types`/`peerDependencies`，`publish.yml:22-24` 直接 `npm publish --access public` 且无 `npm ci`/build/test——现在打 tag 会发空包；⑦ `dist/` 不入库，由 CI build 产出 JS + d.ts + css（依据 `koc-weapp-zuche/config/index.ts` 的 `id.includes('node_modules') → return null`：Taro 宿主编译跳过 `node_modules` 内源码，库必须预编译，不能发 TSX/SCSS 指望宿主转）。P1：`peerDependencies` 声明 `react` / `@tarojs/components` / `@tarojs/taro`；demo 放独立 workspace 不进发布内容；构建用 Node 插件/脚本移出运行时目录；CI 补 `npm ci` + build + test + publish；不设 `./skyline` 子路径出口（Skyline/WebView 差异靠样式与运行时判断，不靠导出分流）。
- 2026-11-06 修订后的依赖方向与目录骨架（**用户认可「没问题」，待落盘**）：依赖单向 `utils / runtime / design → { core, ui } → 宿主`，`core` 与 `ui` 平级、互不 import，靠 props/回调注入与 `<OverlayHost />` 连接。目录：`src/design/`（tokens.scss、theme.ts、safe-area.scss，零 React）、`src/runtime/`（thenable、singleton、overlay-stack、notify、loading-slot）、`src/utils/`（date/string/number/path/i18n，零 ui/React/DOM/宿主）、`src/core/`（configure、request、router、storage、weapp、faces）、`src/ui/`（index、taro、`infra/overlay.ts` + `overlay-host.tsx`、actions / feedback / display / navigation / layout）、`dist/`（不入库，CI 产出）。`exports` 子路径：`.` / `./design` / `./runtime` / `./utils` / `./core` / `./ui` / `./ui/*` / `./ui/*/style` / `./styles/tokens` / `./package.json`。
- 2026-11-06 骨架屏社区调研（**讨论稿，未拍板**；用户问「别人怎么做 / 有没有现成组件可引用 / 还是手搓 / 原理是啥」）：**原理**——骨架屏是页面或区域的「空白版本」，用灰色占位块勾勒最终布局轮廓，首帧先渲染、数据返回后整体替换为真实内容；只改善等待感知、缩短白屏体感，**不加速请求**。三个技术要点：占位块尺寸镜像真实布局且固定（防 layout shift）、`loading` 切换必须覆盖失败/空数据/超时（不能一直挂着）、可选 shimmer 用单张 `linear-gradient` + `transform`/`opacity` 动画（避免触发重排）。
- 骨架屏社区三条路线：**① 微信开发者工具自动生成**（官方 `developers.weixin.qq.com/miniprogram/dev/devtools/skeleton`）：工具分析当前页面节点树提取布局，生成 `*.skeleton.wxml` + `*.skeleton.wxss`，页面 `wx:if`/`hidden` 切换、`@import` 引样式；`project.config.json` 的 `skeletonConfig` 控制灰块规则/局部显示/过滤；列表用 `data-skeleton-list` / `data-skeleton-li` 标记（后续子项克隆第一项），`data-skeleton-hide` 做分区渐进式替换（真实数据位置要和骨架一致，主模块须 absolute 定位）；限制：**只覆盖首屏可见区域**，swiper 横向超屏子元素被忽略，布局复用开发者页面。属**页面级宿主产物**，与具体页面绑定，不是通用库组件。**② 原生小程序组件库**：Vant Weapp `van-skeleton`（props `row/title/avatar/loading/animate/avatarSize/avatarShape/titleWidth/rowWidth`，`loading` 渲占位、`wx:else` 渲 `<slot/>`）、TDesign miniprogram `t-skeleton`（props `animation/delay/loading/rowCol/theme`）。但 Taro 官方文档 `docs.taro.zone/docs/vant`、`docs/hybrid/` 明确：引用原生第三方组件 ⇒ **项目不再具备多端转换能力**，且须把组件拷进宿主 `src`、在页面 config 逐个配 `usingComponents`（不能全局注册）、配 `selectorblacklist` 禁 px→rpx、配 `copy.patterns` 复制 wxs——对通用基础库是硬伤，**只宜参考 props 契约，不宜作为依赖**。**③ Taro React 现成组件**：`@nutui/nutui-react-taro`（3.0.7 的 `nutui.react.build.d.ts` 明确导出 `Skeleton`）、`taro-skeleton`（lentoo，Taro 1/2 时代 class 组件、支持微信小程序 + H5，props `row/row-width/row-height/title/avatar/loading`）、`@antmjs/vantui`（Taro 文档推荐的多端 Vant 衍生库，同时支持 Taro 与 React）。可直接引用，但会引入整套组件库的设计体系、样式前缀与构建假设，与本库「自有 `--mp-*` token / 按需 import / Skyline 主路径」冲突。
- 骨架屏落地约束与建议（**助手建议，待用户拍板**）：倾向**手搓**——本质是几个 `View` + 固定尺寸 + 背景色 + 一层动画，代码量极小，且必须吃本库 `--mp-*` token 才能换肤、必须自控双端兼容。可借现成契约：`loading`（false 渲 `children`）、`rowCol`/行列声明、`animation: none|gradient|flashed`、`delay`（防请求过快导致闪烁）、`avatar`/`title`/`row` 预设。**Skyline 硬约束**（`developers.weixin.qq.com/.../skyline/wxss.html`）：CSS Animation 自安卓 8.0.37 / iOS 8.0.39 起支持，但 `animation-fill-mode` 的 `none`/`backwards` 不支持（表现为 forwards）、`animation` 简写「支持解析但以展开属性为准」；`linear-gradient` 停止位置只支持 `%` 与固定长度（px/rpx）、`background-image` 最多 2 个值、`background-size` 不支持多组值；叠加已定的「`var()` 不能放简写属性，须写长写」——shimmer 须用长写属性 + 单张渐变 + 展开的 animation 属性，并给 WebView 留等价表现。归属建议 `ui/feedback/`（与 Loading 同为等待态，Ant Design 把 Skeleton 归「反馈」类；Vant 则归「展示」，分类本就有分歧），备选 `ui/display/`；是否纳入、放哪一层由用户拍板。
- 2026-11-06 骨架屏拍板（**已拍板**）：用户原话「先暂定，手搓好吧，以后要做的时候再说」——**纳入能力清单，方案暂定手搓**（不引第三方组件、只借 props 契约），**实现延后**，契约与归属（`ui/feedback` / `ui/display`）到要做时再定。上一条「是否纳入待拍板」就此收口；社区调研结论、props 契约与 Skyline 硬约束保留为将来实现的依据，不重复调研。
- 2026-11-06 目录骨架落盘（用户明确指令「那个文件夹就这么定了，你去把文件夹给建了」）：按 Process「修订后的依赖方向与目录骨架」建 `src/design/`、`src/runtime/`、`src/utils/`、`src/core/`、`src/ui/{infra,actions,feedback,display,navigation,layout}/`，以及评审 P1 提到的 `demo/`、`scripts/`、`tests/`；每个空目录放 `.gitkeep` 让 git 能追踪（`git status` 可见 `?? demo/ scripts/ src/ tests/`，落源码时可删占位）。`dist/` **不建**：`.gitignore:2` 已忽略，且评审定为 CI build 产出、不入库。`docs/` 未建（不在已认可的结构树内，且工作区文档槽位须先经用户确认）。本轮**未改** `package.json` 与 `publish.yml`、未创建任何源码文件——用户只授权建文件夹；P0 硬伤（空包出口、无 build/test 的 CI）仍待处理。

## Conclusion

已完成 GitHub 公开仓库 `cq-guojia/mp-taro-kit`、npm `mp-taro-kit` 占名（latest 0.0.1）、Trusted Publisher OIDC 链路（tag `v0.0.2` 触发 CI，stage publish 成功）。留的坑：用户已勾选 `Allow npm publish` 但需点 Save changes 才生效；workflow 已改直接发布却还没跑过一次（`v0.0.2` 那次跑的是旧命令，产出 staged release `c9dfdcf6-…` 仍悬着，建议 Reject）；stage publish 是否算「2 天内首次成功发布」未在官方文档中查到明确口径，用直接发布验证可绕开此不确定；能力域与能力清单（To Do 5）仍在设计；骨架屏已拍板纳入、**暂定手搓且实现延后**；目录/包结构标准（To Do 4）经专家组评审并由用户认可，**目录骨架已落盘**（`src/` 五个能力域 + `ui/` 六个子域 + `demo/`/`scripts/`/`tests/`，`.gitkeep` 占位，`dist/` 不入库），但 `package.json` 与 CI 未动，P0 硬伤仍在（空包出口、无 build/test 的 CI、CSS 副作用被摇掉、token 无出口、core/ui 成环）；发版按用户要求推迟到最基础框架完成之后。项目定位已定：基础库（kit）而非 UI 库，能力域开放，通用操作功能封装属于本库。决议固定：三条技术约束（对外样式值走 CSS 变量、宿主能力靠注入、命令式 API 自带挂载点）+ 组件开箱即用；「props 只增不改、token 只增不改名」因开发期不采用已移除，成熟期再评估。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261106-0806-0a0a-搭建-mp-taro-kit-基础仓库与发布链路 --note "...". -->
- 2026-11-06 08:06:05 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created
- 2026-11-06 08:06:34 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-06 08:06:34 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 任务建成并落前期调研需求（目录结构、抽样范围、GitHub 与 npm 仓库）；Skyline/WebView 与独占 API 口径、名字核查结果已写入背景与过程
- 2026-11-06 08:06:34 · release · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · released to pool
- 2026-11-06 08:17:41 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-06 08:17:41 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 重写背景：补讨论六问与各条结论理由，拆开「已拍板/技术约束/待确认」；props 只增不改与 token 不改名标为助手建议、尚未拍板
- 2026-11-06 08:17:41 · release · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · released to pool
- 2026-11-06 08:42:28 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-06 08:42:28 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按最终决议更新：拿掉 props/token 只增不改（开发期不采用，成熟期再评估）；补 CSS 变量与 Sass 分工、宿主能力注入口径、组件开箱即用与 OverlayHost 前提
- 2026-11-06 08:42:28 · release · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · released to pool
- 2026-11-06 08:46:31 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-06 08:47:05 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户调整顺序：GitHub 建仓与 npm 占名提前，目录结构与抽样范围后置；已改 To Do 与 Next。环境核查：本机无 gh CLI，npm 登录态 401 失效，/code/open-lab/mp-taro-kit 尚未 git init
- 2026-11-06 09:02:22 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 重新应用顺序调整（首轮正文被回滚）；查得 GitHub 仓库为 cq-guojia/mp-taro-kit（public，main，空仓），已修正 package.json 的 repository 字段；本机 SSH key 认证 cqguojia 成功，npm 登录态 guojia
- 2026-11-06 09:04:36 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 本地骨架与首次提交 d18f7b6 完成；GitHub 仓库 cq-guojia/mp-taro-kit 已建但 SSH 推送被拒（token 均只读），npm publish 撞 EOTP，待用户给写权限凭据与 OTP/automation token
- 2026-11-06 09:14:10 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 定位推送失败根因：GitHub 是两个个人账号，仓库所有者 cq-guojia，本机 SSH key/token 属于 cqguojia(cq-guojia-agent) 且只读；需所有者加 Write 协作者或提供 PAT
- 2026-11-06 09:16:02 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 所有者把 cqguojia 加为 Write 协作者后 git push -u origin main 成功，远端 main=ef85616；npm view mp-taro-kit@0.0.1 仍 404，占位发布待用户带 OTP 执行
- 2026-11-06 09:26:33 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · registry 核验 mp-taro-kit 已有 0.0.0-stage/0.0.1、latest=0.0.1，To Do 1、2 收掉；按 npm 官方文档建 .github/workflows/publish.yml（OIDC + npm stage publish）并推送 f23cde6，新增第 3 项 Trusted Publisher 连接待用户在 npmjs.com 提交且 2 天内完成首次发布验证
- 2026-11-06 09:34:07 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户提交 Trusted Publisher 表单后 bump 0.0.2 + tag v0.0.2 触发 CI：run 42195655412 全绿，npm stage publish 走 OIDC 成功；staged release c9dfdcf6-b24f-423c-960e-a115084dfd63 待用户 2FA 审批，registry 仍只有 0.0.1
- 2026-11-06 12:01:30 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 澄清权限与命令的区别：用户已勾 Allow npm publish 但 workflow 跑的是 npm stage publish 故 0.0.2 仍 Staged；已把 publish.yml 改为 npm publish --access public 并推送 921bbb0，待用户 Save changes + 明确发版后跑直接发布验证
- 2026-11-06 12:58:39 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户纠正定位：mp-taro-kit 是基础库（kit）不是 UI 库，还会放跨项目通用操作功能封装，能力域开放不以清单为边界；已改 Background 目标/已拍板/技术约束（撤掉框架层能力另抽独立包）/Process/Conclusion，并同步改 hindsight 模板三段 mission、模型①、subsystem 标签与 directive
- 2026-11-06 13:42:06 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 发版按用户要求推迟到基础框架完成后；通读 koc-weapp-zuche-user(Taro3.6) 与 koc-weapp-zuche(Taro4.3) 两项目，调研结论（讨论稿、未拍板）已记入 Process，含两项目无 CSS 变量/无 Button/NavBar/分页容器/纯 utils、配错与 Story 待用户确认
- 2026-11-06 13:57:23 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户拍板工作方法：不搬实现，只参考功能清单 + 用成熟经验重新抽象；发版推迟到基础框架完成。新增第三个参考源 dsh-plugin-core 并通读（Button Promise 自动 loading、Promise 化弹窗宿主、跨副本单例通知/加载、token 分层、零依赖 utils、logic 与渲染分离），已改 To Do 4/5 与 Next 措辞并补 Process 调研证据
- 2026-11-06 14:03:55 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户拍板收紧范围：一律最新版 Taro，与老项目迁移完全无关，三个项目只作参考不搬实现；目标是最新版 Taro 小程序版『基础控件核心 + 基础操作方法』（对应 dsh-plugin-core）。已改起因/目标/To Do 5/Next 并补已拍板记录
- 2026-11-06 15:19:09 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 目录/包结构专家组评审结论与修订骨架已入 Process（用户认可、待落盘），P0 含 package.json:6-8 空包出口与 publish.yml:22-24 无 build/test；骨架屏三条社区路线调研完成，建议手搓、是否纳入能力清单待用户拍板；已同步 To Do 4/5、Next、Conclusion
- 2026-11-06 15:25:36 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 用户拍板骨架屏暂定手搓、纳入能力清单但实现延后（原话「以后要做的时候再说」）；按已认可结构建目录骨架 src/{design,runtime,utils,core,ui 六子域} + demo/scripts/tests 并以 .gitkeep 占位，dist/ 不建（.gitignore:2）；package.json 与 publish.yml 未动；已同步 To Do 4/5、Next、Process、Conclusion
