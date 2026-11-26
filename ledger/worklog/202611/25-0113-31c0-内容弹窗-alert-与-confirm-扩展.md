# 20261125-0113-31c0-内容弹窗-alert-与-confirm-扩展: 内容弹窗 alert 与 confirm 扩展

- **Tags**: 弹窗, alert, confirm, 交互锁
- **Status**: doing · 2026-11-26 06:11:55 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-25 01:13:13 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

用户 2026-11-24/25 连续提出：现有命令式 `alert` / `confirm` 走 `DialogHost` 自绘简易面板，能力不足以覆盖他要的对话框形态。要基于 `ContentPopup` 重做命令式对话框，并把「转圈期间整框屏蔽 + 例外可点」做成底座能力，让普通文字弹窗也受益。附截图形态：标题 + 说明在 body、底部横排两按钮。

明确口径（用户原话）：「我不需要封装，也不需要最小闭环」——按完整方案做，不打补丁、不缩范围。

## To Do

需求（用户逐条确认，作为验收项）：
- [x] 命令式 `alert` / `confirm` 基于 `ContentPopup`，Promise 语义（alert→void，confirm→boolean）
- [x] 消费端不感知 `DialogHost`；`createKitApp` 默认挂载不变（仍由 `hosts` 决定，默认空）
- [x] 默认无关闭叉，可传参打开
- [x] 标题 + 说明默认放 body，不碰 header 框；可选「icon + 标题 + 备注 + 说明」形式
- [x] 按钮可定制颜色 / 文字；三形态：横排 spaced、竖排 stack、竖线 joined
- [x] 位置 top / center / bottom 可选
- [x] 宽度默认走 center 档 token 320，可传参定制
- [x] 保留 badge 外伸图标、header 图片、四向偏移
- [x] 默认点遮罩不关闭，可改；开启时映射为 cancel
- [x] 点确定后转圈，成功后才消失；`onConfirm` reject / 返回 false 保持打开、解锁可重试
- [x] 转圈期间整框屏蔽，可设例外让指定控件仍可点（默认放行 cancel）
- [x] 屏蔽能力做成底座能力（`Popup` / `ContentPopup`），普通文字弹窗也能用
- [x] 声明式 `Dialog` 与命令式双通道并存，收敛为 `ContentPopup` 薄适配
- [x] 多页 Host 订阅同一栈时一条载荷只归一个 Host 渲染（归属表）
- [x] `resetUIForTests` / 最后一份 Host 卸载时 settle 挂起的 Promise
- [x] 回归自检：三形态、width、badge/headerImage/offset 载荷、忙碌/锁态节点、Promise settle；`onBusyChange` true/false 成对（源码路径断言）

按需引入（用户明确追加，「引哪个用哪个」）：
- [x] 命令式 API 按能力拆子入口：`confirm` 只带 `DialogHost` + `ContentPopup`，不连带 Toast / Loading
- [x] 宿主与 API 同进口：`mp-taro-kit/ui/commands/dialog` 同时导出 `confirm` 与 `DialogHost`
- [x] `createKitApp` 的 `hosts` 默认空（现状已满足，未改）
- [x] 组件细路径 `mp-taro-kit/ui/layout/content-popup` 已可用：`./ui/*` 的 `*` 可穿透多段，原「只匹配一层」判断有误，见 Process 更正
- [x] floating-action 样式随 `KitPage` 自带，不在 `app/index.ts` 顶层引（现状已满足，原断点描述过期）
- [x] 产物级验收：`tests/tree-shaking.test.mjs` 真打包 dist，断言对话框产物无 ToastHost / LoadingHost / FloatingAction

演示站细化与菜单纠偏（用户 2026-11-25 逐条要求）：
- [x] 打开后的页面标题只认首页菜单文字：`pageTitleOf` 唯一 ready 入口取 label，多入口显示 X
- [x] 菜单 label 一律保留原文，不改成 X、不降级、不丢条目
- [x] 对话框宽度档按小程序 750rpx 总宽：640 / 560 / 720rpx
- [x] 图片头用指定 PNG，`offset.top=-30` 向上延伸
- [x] 按钮尺寸复用 Button 轴、默认 md 与 Popup 底栏同型号；横排等分铺满；确定蓝 / 取消灰
- [x] 删掉「按钮形态」独立示例块，形态由顶部配置统一控制
- [x] 点击后不展示结果文案，只保留效果
- [x] 图片头不写 width，走 ContentPopup 默认 100% 铺满
- [x] 顶部配置删关闭路径与四向偏移；头部四档互斥（普通 / 图标+备注 / 外伸icon / 图片）
- [x] 图标+备注复用 ContentPopup 文字头；外伸档统一叫 icon，不自造“徽标文字”
- [x] 产物级核对菜单原文、宽度档、图片头、头部四档与无临时日志

按钮交互与主题配置（用户 2026-11-25 追加）：
- [x] 自定义「稍后」点击后直接关闭；confirm 的取消按钮同为 Button soft 浅底档、动作一致；joined 档保持原有 ghost 不改
- [x] 竖排默认「确定」在上、「取消」在下
- [x] alert / confirm 默认文案走统一配置，不在演示页自造
- [x] 确定按钮、alert 按钮、confirm 按钮的默认样式集中在 kit.config.mjs，改一个文件统一生效
- [x] 宽度档固定 560 / 640 / 720，640 居中且为默认
- [x] 演示站去掉位置选择，只走 API 默认中部；接口 position 保留给需要的调用方
- [x] joined 档自定义按钮只认文字与颜色；顶部形态滑块改到各示例内三按钮；confirm 默认竖线、自定义默认横排
- [x] 演示页除滑块外所有按钮统一 XS
- [x] 配置页去分组标题只留两个 Cell；示例标题带英文 alert / confirm；各示例加默认按钮、竖线用小号；alert 隐藏竖排
- [x] 四组演示合并同一 Card 的实验已撤回：Card 只有一组标题，多标题需求另立任务 `20261125-0946-e087-卡片多标题成组展示`

标题覆盖四档（用户 2026-11-25 追加）：
- [x] `title` 一个字段贯穿 alert / confirm 的四种头部形态：普通、图标+备注、外伸 icon、图片
- [x] 纯标题、image / badge 的标题都走 header 下方的同一条 `__headline` 行：居中、`font-lg`、默认无下划线；badge 任意锚点都出标题
- [x] 标题行不进 header，图片头外伸收窄与徽标绝对定位都不牵连它；自定义 `header` 槽位优先
- [x] 带图标/备注的文字头保留原内联「图标 + 标题 + 备注」结构与默认分割线
- [x] 演示站四档都带 title，产物与渲染断言覆盖新旧行为；API 文档同步

固定类型图标（用户 2026-11-25 追加、同日纠正）：
- [x] `alert` / `confirm` 的 `type`：success / error / warning / info 四档，映射到 gou / guanbi / warn / info 四个库图标
- [x] 普通 icon 档只换图标、不带底色；外伸徽标档换图标 + 红黄蓝绿轻微渐变底（走 badge 既有 tone）
- [x] 显式 `icon` 只换图标名；显式 badge 的几何保持，只覆盖 content 与 tone
- [x] 演示站 alert 示例加普通与外伸两行固定类型按钮，全部 XS

待办：
- [ ] 弹窗动效：`DialogHost` 把 `open` 写死 true，绕过 `Popup` 的 `usePresence`，需按退场保留挂载的方案修（本轮未动）

## Next

待用户验收：
1. Skyline 与 WebView 真机打开命令页，确认转圈期间「取消可点、其它控件与叉/遮罩不可点」、`onConfirm` 失败后能重试、`top`/`bottom` 三形态与宽度的观感
2. 演示站切四档头部打开 alert / confirm，确认普通、外伸 icon、图片三档标题同字号居中、无下划线；图标+备注档仍是原图文结构，图片头外伸仍正常
3. 动效问题单独处理，本轮未修
4. 当前改动未提交，等用户明确指令再 commit + push

## Process

### 2026-11-25 三视角评审（系统架构师 / 前端工程师 / UX 专家）

**分层**（架构师）：`Overlay` 遮罩 + 锁滚（`Overlay.tsx:57-66`）→ `Popup` 定位 / presence / 关闭叉（`Popup.tsx:113-205`）→ `ContentPopup` body/footer、三种头部与偏移（`ContentPopup.tsx:148-219,835-889`）→ `DialogHost` 只读栈、驱动 Promise（`DialogHost.tsx:26-61`）→ `commands` 组 payload（`commands.ts:117-147`）。宿主装配在 `create-kit-app.tsx:106-115`。

**契约**（架构师）：判别联合 `{kind, content:{variant:'text'|'icon',title,description,note,icon}, actions:[{key,text,color,type,variant}], layout:'row'|'column'|'joined', position, width?, closeable=false, maskClosable=false, badge?, headerImage?, offsets?, resolve}`。alert resolve void、confirm resolve boolean。标题说明默认进 body；不放 ReactNode / 任意样式，颜色复用 Button 轴（`Button.tsx:30-69`）。`onConfirm` 成功才关闭并 resolve，失败保持打开、解锁可重试；防重入复用 `inFlight`（`Button.tsx:109-126`）。

**屏蔽技术路径**（前端）：Skyline 用面板根 `catchtouchstart` / `catchtap` / `catchMove` 拦截，例外控件所在分支不挂拦截；`pointer-events` 在 Skyline 不可靠。WebView 可 `pointer-events:none` + 例外子树 `auto`（dsh `overlay.css:17-26`、`Modal.ts:114-173`），但逻辑门保留。`Button.disabled` 只做第二道——本库 Button 是 `View`（`Button.tsx:160-166`），挡不住 `Image` 与自定义 `View`。不照搬 dsh 的 DOM `closest` 判定（`overlay.ts:72-80`），改 props / Context 开关。`Button` 加 `onBusyChange`（`inFlight` 起止上报，`Button.tsx:105-126`）；`Popup` / `ContentPopup` 加 `busy`、`locked`、`lockExceptions`；`ContentPopup` 加 `width`（透传 `panelStyle.width`）、`closeOnMask`（现只有 `closable`：`Popup.tsx:52-54,166-175`）。三按钮形态复用 `footerConfig.layout/separation`（`ContentPopup.tsx:66-72,423-480`）。

**竞态**（前端 + 架构）：三条关闭路径（叉 `Popup.tsx:186-201`、遮罩 `Overlay.tsx:62-65`、按钮）统一 `dismiss(id)`；`busy||locked` 时不注册 / return。栈 `dismiss` 只成功移除一次（`overlay-stack.ts:35-40`），Host 只 resolve 一次（`DialogHost.tsx:26-30`）。成功后在 then 内 dismiss；reject 清 busy 但保留弹窗。另修：全局栈单例（`state.ts:40-49`）被多页 Host 订阅（`use-store.ts:9-13`）重复渲染 → 只显栈顶；`resetUIForTests`（`commands.ts:149-160`）与 Host 卸载（`DialogHost.tsx:21-24`）未 settle → 补收尾。

**默认值与场景**（UX）：位置默认 center（`ContentPopup.tsx:489`）、宽默认 320 可传（`:221`）；标题 + 说明走 body、底部横排两按钮，取消左 / 确定右主色实心（`Dialog.tsx:43-48`），文案默认「确定 / 取消」（`commands.ts:127-128`）。横排 spaced 用于 2 短词标准确认；竖排 stack 用于 ≥3 项或长文案尤其 bottom；竖线 joined 等分通栏紧凑场景，joined 恒等分、`ratios` 无效（`:433`）。转圈该封：确认钮、三条关闭路径、其它改状态按钮；该放：取消钮（`lockExceptions:['cancel']`）、过程提示。定宽按钮用 `inline`/`circle` 防跳宽（`Button.tsx:23-27,135`）。须约束：`top`+badge 降级内联（`:559-561`）、`bottom`+badge 默认隐藏叉（`:822`）沿用；`closeable` + 遮罩关 + confirm 三路径语义冲突；`joined`+`ratios` 与 `stack`+spaced 属认知噪声，禁配或提示。

**不做**：不建第二 store / 样式体系；不把 JSX、业务回调或 Web DOM focus 方案照搬；仅补 `width` / `locked`，其余复用 `panelStyle` / `footerConfig`。

### 2026-11-25 按需引入讨论（架构师 + 前端）

用户追加「引哪个用哪个」：引 `confirm` 带弹窗可以接受，但不能连带全库。

**实证断点**：
- `src/ui/commands.ts` 单模块导出 toast / loading / dialog 全部 API（`:70-147`），共用 `uiState`；模块本身无顶层副作用、未用导出可摇，但入口粒度仍粗
- `src/ui/layout/index.ts:2-59` 是大 barrel，`export { Overlay, Popup, ImagePopup, ContentPopup, FloatingAction, BackToTop }` 全在一处；ESM 静态链接会求值所有 re-export 模块
- 每个组件模块底部都有 `markCardEdgeOutOfFlow(X)` 顶层调用（`ContentPopup.tsx:893`、`Popup.tsx:210`、`Overlay.tsx:71`、`ImagePopup.tsx:335`、`FloatingAction.tsx:55`），属模块级副作用，能否被摇掉取决于打包器是否信任 `sideEffects`
- `src/app/index.ts:3` 顶层 `import '../ui/layout/floating-action/style/index.css'`：引 `createKitApp` 就无条件带这份 CSS
- `create-kit-app.tsx:106` 默认 `hosts = [ToastHost, DialogHost, LoadingHost]`：三件全挂、全进产物
- `package.json` 的 `./ui/*` 只匹配一层，`./ui/layout/content-popup` 这类两层子入口根本不解析

**结论**：
1. 命令式 API 按能力拆子入口（dialog / toast / loading），宿主与 API 同进口，`confirm` 自带依赖收窄到 `DialogHost → ContentPopup`
2. `ui/layout/index.ts` 收窄：只留天然成对的（Popup + Overlay），ContentPopup / ImagePopup / FloatingAction 走各自子入口；exports 增加两层匹配
3. `app/index.ts` 的 floating-action CSS 下沉到 KitPage 或对应子入口，不在装配出口无条件引
4. `createKitApp` 的 hosts 不默认全挂；按能力的装配入口与旧默认之间做过渡
5. 验收必须做产物级断言，不能只信「理论上可摇」——Taro webpack 对 barrel 与 `markCardEdgeOutOfFlow` 的处理要实测
6. 旧入口保留别名并标废弃，避免破坏既有接入

**风险**：拆入口是破坏性变更面；小程序端 tree-shaking 依赖 ESM + `sideEffects` 精确声明，`markCardEdgeOutOfFlow` 这类顶层调用可能让整模块被保留。

### 2026-11-25 实现与纠偏

**契约与命令**：`src/ui/state.ts:13,54,78` 落判别联合载荷、按钮/文案数据与 Host 归属表；`src/ui/commands.ts:15,161,169,177` 用字面量宿主提示避免无关名字进包，`alert`/`confirm` 组默认按钮，`resetUIForTests` 清栈时 settle 所有 Promise。原 Next 里「去业务回调」细化为：载荷不接 JSX，保留 `onConfirm` / `onAction` 两个异步闸门，否则无法判定「成功后才关闭」。

**底座锁**：`src/ui/infra/popup-lock.ts` 提供唯一例外判定；`src/ui/layout/Popup.tsx:88-92,188,204` 把 `busy` / `locked` / `lockExceptions` 广播给子树，封遮罩路径、叉按钮逻辑门与面板 `catchMove`；`src/ui/layout/content-popup/ContentPopup.tsx:167,223-224,838` 接宽度与锁；`src/ui/actions/Button.tsx:72-74,118-135` 在成功/失败两条 settle 路径成对上报 `onBusyChange`，`lockKey` 决定锁期间是否可点。WebView 的 `pointer-events` 例外样式落在 `src/ui/layout/style/index.scss`；Skyline 只做到源码与编译产物级，未真机验证。

**宿主与声明式**：`src/ui/infra/DialogHost.tsx:35-37,48,65,69,112` 一条载荷只归一个 Host、最后一份宿主卸载 settle 挂起 Promise、忙碌期间挡住 dismiss/resolve；`src/ui/feedback/Dialog.tsx` 改为 ContentPopup 薄适配，旧自绘面板/按钮样式已删。`src/ui/infra/use-store.ts` 与 `use-theme.ts` 补 `getServerSnapshot`，修掉 SSR 渲染宿主时的报错。

**按需引入纠偏**：Node 的 `./ui/*` 通配 `*` 可匹配多段，`mp-taro-kit/ui/layout/content-popup` 原本就能解析，未改 `package.json`；floating-action CSS 实际在 `src/app/KitPage.tsx:1`、不在 `src/app/index.ts:3`；`createKitApp` 的 `hosts` 原本默认空。三项在评审时判断过期，已按现状核实。`src/ui/commands/dialog/index.ts` 同出口给 `confirm` 与 `DialogHost`；`ensureMounted` 提示改成调用点传字面量；`tests/tree-shaking.test.mjs` 用 esbuild 真打包 dist 断言无 Toast / Loading / FloatingAction。

**验证**：`pnpm run build`（393 产物）→ `pnpm test`（229 项全过）→ `pnpm run guard` → `pnpm pack --dry-run` → `pnpm --filter mp-taro-kit-demo build:weapp` 全过；`demo/dist/common.wxss` 实测有 `pointer-events:none` 与例外 `auto`，`demo/dist/common.js` 实测有命令对话框 body 与 joined 底栏。`koc-codelint` 通过，`docwriter check` 无 FAIL。

### 2026-11-25 演示站细化与菜单纠偏

**标题与菜单**：`demo/src/catalog.ts:1137` 的 `pageTitleOf(pageId)` 改为按 `ready` 入口数判定——唯一入口取它的 `label`，多入口或没有都用 `X`；`DemoBlock.tsx` 统一把结果传给 `DemoShell`。中途曾把重复入口的菜单 label 改成 `X` 并降 `planned`，用户明确定性为丢信息：菜单是识别入口的唯一依据，`X` 只能出现在页面标题上。已把 style / toast / loading / navbar / 基础能力 10 条 / 加载句柄共 15 条逐项还原原文与 `ready` 状态（以 `git diff` 对照 HEAD）。`tests/ui.test.mjs` 断言菜单无 `X`、每页有 `ready`、单入口标题取 label、多入口标题为 `X`。

**按钮尺寸纠偏**：`DialogAction` 本就没有 `size` 轴，显式写 `size:'md'` 既是类型错误也违背「跟 Popup 底栏用同一默认尺寸」；`src/ui/commands.ts` 与演示站自定义按钮都不指定尺寸，由 `ContentPopup` 底栏 `Button` 走默认档。`tests/ui.test.mjs` 用 `doesNotMatch` 锁住不写死尺寸。测试里 `+` 被当成正则量词导致「图标+备注」误判，改用字面量包含判断。

**其余**：宽度档按 750rpx（640 / 560 / 720）；图片头用指定 PNG 并 `offset.top=-30`；头部四档互斥且图标+备注走 `ContentPopup` 文字头；横排 `ratios` 等分铺满、确定蓝 / 取消灰；顶部配置删关闭路径与四向偏移。`docs/api/exports.md` 与 `docs/architecture/demo-mapping.md` 同步口径并补更新日志。

**自检**：build（405 产物）/ test（233 项）/ guard / pack / demo build 全过；产物按 unicode 转义核对菜单原文、宽度三档、图片头与 `top:-30`、头部四档、无关闭/偏移配置、无 `MPTK-DEBUG`；`koc-codelint` 9 文件六层全过。本轮 9 个文件改动未提交。

### 2026-11-25 演示观感纠偏

**按钮尺寸**：Popup 页 `FOOTER_BTN_SIZE = 'md'`（`demo/src/pages/popup/index.tsx:293`），Dialog 之前走 Button 默认 sm 小一号。根因是 `DialogAction` 没有 size 轴、`DialogHost` 也没透传；补 `ButtonSize` 到 `src/ui/state.ts`、Host 透传、默认按钮显式 `md`，演示站自定义按钮同步。

**图片头**：ContentPopup 图片头默认 `width: '100%'` 铺满（`ContentPopup.tsx:638-643`），Dialog 之前传 `width: '640rpx'` 导致左右留白；去掉 width 与 Popup 页一致。

**演示页精简**：删掉「按钮形态」独立示例块（顶部已有 Segmented 配置）；删掉 alert / confirm / 自定义 / 异步点击后的结果文案 state 与渲染，只保留触发按钮。产物里残留的「解析」是弹窗正文、「按钮形态」是顶部配置，均非结果文案。

**自检**：build（405 产物）/ test（233 项）/ guard / pack / demo build 全过；产物核对按钮 `md`、图片头 `top:-30` 且无写死宽度、无「已关闭」结果文案；`koc-codelint` 10 文件六层全过。

### 2026-11-25 按钮交互与主题配置

**配置集中**：`kit.config.mjs` 的 `runtime.dialog` 新增 `confirmText` / `cancelText` 与 `confirm` / `cancel` 两组 Button 样式轴（默认确定 primary + solid、取消 default + outline）。生成器 `scripts/lib/kit-config.mjs` 补字面量类型与取值校验，`setKitConfig` 补逐键深合并，`src/ui/commands.ts` 改为读 `getKitConfig().runtime.dialog`——宿主改这一个文件即可统一换文案与外观。

**交互**：竖排默认 actions 顺序改为 `[confirmAction, cancelAction]`（确定在上）；演示页去掉自造的「知道了」「继续」「取消」文案，稍后按钮改 `onAction: () => true` 直接关闭，样式与取消同为 outline。「点上去没反应」根因是 `onAction` 返回 false 让弹窗保持打开，不是缺少视觉按压态——Button 已有 `hoverClass=mptk-btn--pressed` 与 `--mptk-c-btn-pressed-opacity: .86`。宽度档固定 560 / 640 / 720，默认 640rpx。

**自检**：build（405 产物）/ test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过；产物核对生成配置含 `dialog`、确定/取消文案存在、无「知道了」「继续」、三档宽度齐全。

### 2026-11-25 取消档与 joined 纠偏

横排取消之前被我改成 `outline`（实底浅色背景），用户要求走 Button 现成的 `soft` 浅底档；`runtime.dialog.cancel.variant` 改回 `soft`，演示页「稍后」同步。更关键的是显式 `variant` 会覆盖 ContentPopup 的 joined 默认 ghost（`ContentPopup.tsx:470-472`），把原本正确的竖线按钮改坏；`commands.ts` 加 `configuredVariant`，joined 时不传 variant，其余档照配置。

**自检**：build / test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过；产物核对配置为 `soft`、`common.wxss` 有 `mptk-btn--default.mptk-btn--soft`、joined ghost 分支保留。

### 2026-11-25 演示站精简位置选择

按用户要求，演示站顶部配置删掉「位置」档，`demo/src/pages/dialog/index.tsx` 不再传 `position`，固定走 API 默认 `center`；`DialogOptions.position` 保留，供需要自己折腾的调用方使用。产物核对演示页无「位置 / 顶部 / 中部 / 底部」文案。自检全过。

### 2026-11-25 形态默认值与 joined 自定义按钮

`src/ui/commands.ts` 把默认形态按载荷区分：`confirm()` 不传 `layout` 走 `stack`（确定在上），自定义 actions 不传走 `spaced`——这是对外默认，不靠演示页滑块掩盖。joined 档的自定义按钮只保留 `key/text/color`，`type`/`variant`/`size` 一律不采信，避免覆盖 ContentPopup 底栏自带的 ghost 外观导致出错。

演示页删掉顶部「按钮形态」滑块，alert / confirm / 自定义按钮各放「横排按钮 / 竖排按钮 / 竖线」三个按钮；busy 仍固定 `stack`。`tests/ui.test.mjs` 里 confirm 默认形态断言随新口径修正，并补显式 `spaced` 顺序验证。

**自检**：build / test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过；产物无「按钮形态」文案、三形态按钮齐全。

### 2026-11-25 演示页展示规范

按用户要求统一 demo 呈现：配置页去掉 `CellGroup` 标题，宽度与头部两个 `Cell` 直接并列；alert / confirm 示例标题分别加英文 `alert` / `confirm`；每个示例的形态按钮行最前面加「默认」按钮（不传 `layout`，走 API 默认），横排 / 竖排用 `md`、竖线用 `sm` 小号；alert 只有一个按钮，横排与竖排效果相同，隐藏竖排按钮。

**自检**：build / test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过；产物核对示例标题、「默认」按钮、无「几何」分组标题。

### 2026-11-25 按钮尺寸与 confirm 默认形态再纠偏

按用户最新口径：演示页除 Segmented 滑块外所有 Button 统一 `size="xs"`（默认按钮、三形态按钮、busy 按钮），删掉上一轮给竖线加的 `sm` 与横排/竖排的 `md` 差异。`confirm()` 不传 `layout` 时默认 `joined`（竖线），不再默认 `stack`；显式传 `stack` 时仍是确定在上。命令层测试同步默认形态断言并补显式竖排验证。产物里页面按钮 `size:"xs"` 三处，`md` 仅剩弹窗内自定义按钮。

**自检**：build / test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过。

### 2026-11-25 四组合并到同一 Card

按用户要求把 alert / confirm / 自定义按钮 / 异步闸门四组演示收进同一张 Card：catalog 里四个 example 合并为单个 `actions` 块，`demo/src/pages/dialog/index.tsx` 用四个 `CellGroup` 各带标题（`提示 alert` / `确认 confirm` / `自定义按钮` / `异步闸门`），`CellGroup` 在 Card 内自动收敛外框，视觉连成一片。`Card` 本身只有一组 `title/subtitle`，多标题靠 children 分组实现。

**自检**：build / test（233 项）/ guard / pack / demo build / `koc-codelint`（20 文件六层）全过；产物四组标题齐全，目录只剩 config + actions 两块。该合并随后按用户要求撤回，四组恢复为独立 example；Card 多标题另立任务，不再在本任务内实现。

### 2026-11-25 标题覆盖四档头部

用户指出：「除了『图标加备注』是有标题的，外延图片和普通形式都是没标题的，但 alert 和 confirm 都应该是有标题的」，并明确「专门做一个放开头的、用于放标题的 view，这样它就不会和 header 去抢位置，有了标题就显示、没有就不显示」，最后授权「你来定，实现整个逻辑」。

**根因两处**：`DialogHost.tsx:129` 原先只在 `content.variant === 'icon'` 时把 `title` 传给 `ContentPopup`，其余形态被丢掉；`ContentPopup.tsx` 的 image 档压根没有标题节点，badge 档的标题塞在 `HeaderContent` 里且只在 `anchor='center'` 出。

**落点**：`ContentPopup.tsx` 加 `Headline` 组件，渲染 `mptk-content-popup__headline > Text.mptk-content-popup__title`，作为 header 与 content 之间的兄弟节点（`hasHeadline = title !== undefined && variant !== 'title' && header === undefined`）。title 档保持原「图标 + 标题 + 副标题」结构不动；image / badge 图形各自独占 header，标题走独立行。badge 去掉 `anchor` 限制，任意锚点都出；删除已无调用方的 `__title-text--raised` 样式。`DialogHost.tsx` 改为无条件透传 `title`，`note` 仍只在 icon 档当副标题。

**为什么放 header 外**：image 档上下外伸会把 header 收窄到 `H + top + bottom`（`edge-offset.ts:60-70`），标题塞进 header 会被定高挤掉或挤坏几何；放兄弟节点则实测高度、徽标 `position:absolute` 都影响不到标题。与用户「不和 header 抢位置」一致。

**回归**：`tests/render.test.mjs` 覆盖 badge 任意锚点出标题、无 title 不出、image 出标题且排在图片后、标题行位于 header 与 content 之间；`tests/layout.test.mjs` 把 CSS 契约从 `__title-text--raised` 改为 `__headline`。演示站 `headerOptions()` 四档都带 title。api 文档补 image 的 title 参数、改写 badge 标题契约并补更新日志。

**自检**：build（405 产物）/ test（233 项）/ guard / pack / demo build / `koc-codelint` 全过（门禁结果见下一轮执行记录）。

### 2026-11-25 纯标题三档归一

用户看了演示站后指出：普通标题头、图片标题头、外伸 icon 标题头应完全一样——居中、同字号、无下划线；alert/confirm 标题靠左不对。根因是纯标题仍走 `variant='title'` 的左对齐 `HeaderContent`，且 `showDivider` 默认对 title 档开。改为 `hasInlineText` 仅在带图标/备注时成立：纯标题不再占 header 内联文案块，与 image / badge 共用 `__headline`；`showDivider` 默认只在带图标/备注的文字头开，显式 `headerDivider` / `headerDividerColor` 仍是 opt-in。带图标/备注的文字头保留原结构。新增渲染断言覆盖三档标题同节点同字号、无下划线，并修正旧 `__head` 正则误匹配 `__headline` 的两处断言。

**自检**：build（405 产物）/ test（234 项）/ guard / pack / demo build / codelint（9 文件六层）/ docwriter check 全过；产物核对 `common.wxss` 的 `__headline` 居中样式与 `common.js` 的标题行节点。

### 2026-11-25 固定类型图标与语义色底

用户拍板：success = `koc-i-common-base-gou` 绿、error = `koc-i-common-base-guanbi` 红、warning = `koc-i-common-base-warn` 黄、info = `koc-i-common-base-info` 蓝；「颜色不能直接用纯色，要稍微往浅一点或往深一点做一点点渐变，眼睛看不出来但有层次」。

**根因/前置**：库里虽有 `info` / `warn` / `gou` / `guanbi` 四个候选，但没有「类型 → 图标 + 颜色」preset；`headerIcon` 的 icon 形态只有 name / size / color，没有底色槽。对外契约因此缺一环。

**落点**：`kit.config.mjs` 明暗两支各加 `--mptk-c-dialog-type-bg-{success,error,warning,info}`（165deg 同色相极浅渐变）与 `--mptk-c-dialog-type-ink`、`--mptk-c-content-popup-type-icon-size`（44px 方块）；`ContentPopupHeaderIcon.icon` 加 `tone?: ContentPopupIconTone`，inline 图标槽按 tone 挂类并渲染渐变底 + 反色字；badge 档仍走自己的 `__badge--tone-*`，两套 tone 不混。命令层 `DialogType` + `DIALOG_TYPE_ICON` 映射，`DialogContent.iconTone` 携带语义色，显式 `icon` 只覆盖图标名；不传 `type` 时载荷不出现 `iconTone` 键，保持旧 deepEqual 契约。`DialogType` 从 `ui/commands/dialog` 子出口导出，`ContentPopupIconTone` 从 content-popup 子出口导出。

**回归**：`ui.test.mjs` 断言四档映射、显式 icon 保留色底；`render.test.mjs` 断言四档 tone 类与无 tone 不出；`layout.test.mjs` 断言四档渐变 CSS 与 token 真源。演示站 alert 示例加四个类型按钮（XS）。

**自检**：build（408 产物）/ test（236 项）/ guard / pack / demo build / codelint / docwriter 全过（门禁结果见下一轮执行记录）。

### 2026-11-25 固定类型图标落点纠正

用户纠正：「改错了，得改两个地方：1. 外生 icon：主要是把外生 icon 变成这个图标，背景变成红黄蓝绿。2. 普通 icon：普通的那种也有个 icon，也可以改，但是不要有背景，直接用相应的图标就行了。」

上一轮把色底做成 inline 图标槽的 `tone`（`ContentPopupHeaderIcon.icon.tone` + `--mptk-c-dialog-type-*`），落错层。本轮撤回：删掉 `ContentPopupIconTone`、inline `__lead-slot--tone-*` CSS、`DialogContent.iconTone`、DialogHost 的 tone 透传与全部新增 token。

**正确落点**：`commands.ts` 加 `DIALOG_TYPE_TONE`（success→green / error→red / warning→yellow / info→blue）；`type` 恒把 `icon` 映射到指定图标名，**仅当 `options.badge` 存在时**把 badge.content 换成该图标并设 badge.tone，保留 badge 其余几何。普通 icon 档无 badge、无色底。徽标四档渐变 token 收窄为同色相轻微层次（明档 blue/green/red/yellow、暗档已在同一色相内，绿档同步收窄），避免纯色死板。

**回归**：`ui.test.mjs` 逐档断言普通档不造 badge、不带 iconTone，外伸档 content/tone 正确；`layout.test.mjs` 改为断言 badge 四档渐变仍在且是 linear-gradient；演示站两行按钮分别演示普通与外伸。

**门禁实测**：build 408 产物 → test 236 项全过（含「固定 type 换图标；带 badge 时换外伸图标与底色，普通 icon 不带底色」）→ guard → pack --dry-run → demo build:weapp 全过。产物核对：`demo/dist/common.js` 的 `ct={success:"common.base:gou",error:"common.base:guanbi",warning:"common.base:warn",info:"common.base:info"}` 与 `dt={success:"green",error:"red",warning:"yellow",info:"blue"}` 真值；`common.wxss` 四档 `--mptk-c-content-popup-badge-bg-*` 明/暗共 8 条 `linear-gradient(165deg, …)`，`__headline` 上/左/右均为 `var(--mptk-space-4)`。`koc-codelint` 38 文件六层全过；`docwriter check` 无 FAIL（26 条 WARN 均为历史存量，不涉及本改动）。

### 2026-11-25 副标题回归与 inline 图标上色

用户纠正：「普通的副标题流程（标题下那条小字）给我取了，样式就不对了」；并明确「普通的那个把 icon 变成我指定的颜色，就不用外伸那个图标了……正常的那个 icon 不是在左边吗，把 icon 的颜色变成我指定的颜色」。

**根因两处**：`DialogHost.tsx:130` 的 `subtitle` 只在 `content.variant === 'icon'` 时透传，纯文字档传了 `note` 也被丢；`headerIcon` 只有 `{kind,name}`，没有颜色。演示站 `openTyped` 普通档原本没传 `note`，所以小字彻底看不到。

**落点**：`DialogHost` 改为 `subtitle={payload.content.note}` 无条件透传（ContentPopup 自己按 variant 决定是否显示），`headerIcon` 带 `color: payload.content.iconColor`；`commands.ts` 加 `DIALOG_TYPE_ICON_COLOR` 映射（`var(--mptk-c-dialog-type-fg-*)`），仅传 `type` 时载荷带 `iconColor`，显式 `icon` 只覆盖名字不改色；`state.ts` 的 `DialogContent` 加 `iconColor`，无底色字段。`kit.config.mjs` 明暗两支各加 4 条 `--mptk-c-dialog-type-fg-{success,error,warning,info}`（取徽标渐变起点色，暗档用亮一档），走 `gen:config` 生成四份产物。演示站普通固定类型档补 `note`，外伸档保持 badge 渐变不变。

**回归**：`ui.test.mjs` 逐档断言 inline 图标色 + 备注进载荷；新增 render 断言锁定 `color:var(--mptk-c-dialog-type-fg-*)` 与两档（有/无图标）`__subtitle`；`layout.test.mjs` 锁 token 真源与明暗产物不同色。

**门禁实测**：gen:config → build 408 产物 → test 237 项全过 → guard → pack → demo build:weapp → codelint 38 文件六层 → docwriter 无 FAIL 全过。产物核对：`demo/dist/common.js` 有 `gt={success:"var(--mptk-c-dialog-type-fg-success)",…}` 与 `headerIcon:{kind:"icon",name:t.content.icon,color:t.content.iconColor}`、`subtitle:t.content.note`；演示页 `note:"…标题下的备注小字"` 在；四档 fg token 明暗各一条共 8 条真值。首次 build 曾撞上工作区里 Card 文件的瞬时中间态（`flushPlain` 一闪而过），复跑即恢复，与本改动无关。

### 2026-11-25 固定类型图标同色圆环（看效果）

用户要求：「默认的 icon 单独处理一下：套一个 2-4 像素左右的小圆把它框在里面，把本身的 icon 稍微缩小一点，圆的颜色也用现在图标的颜色。我看看效果。」

**落点**：`ContentPopupProps` 加 `iconFramed?: boolean`，只给固定类型开；`HeaderContent` 的 inline 槽在 framed 时挂 `__lead-slot--framed`，描边色取 `lead.color ?? color`（与图标同源的 `currentColor`），不铺底色。`DialogHost` 在 `payload.content.iconColor !== undefined`（即有 `type`）时传 `iconFramed`；通用 `iconColor` 不带框。几何 token 放主题无关组：图标 22px（原 28px 缩一档）、圆环外径 32px、描边 2px；SCSS 用 `--mptk-radius-pill` 做正圆，避免写 50%。

**回归**：render 断言圆环类 + 槽位 `style="color:var(--mptk-c-dialog-type-fg-success)"`，并锁通用 `iconColor` 不自动加框；layout 断言描边取 `currentColor`、图标字号走新 token 与三条几何 token 真源。

**门禁实测**：gen:config → build 408 → test 237 全过 → guard / pack → demo build:weapp → codelint 38 文件 → docwriter 无 FAIL。产物核对：`demo/dist/common.wxss` 有 `__lead-slot--framed{width:var(--mptk-c-dialog-type-icon-ring-size);height:…;border:var(--mptk-c-dialog-type-icon-ring-w) solid currentColor;border-radius:var(--mptk-radius-pill)}` 与缩字号规则，token 转 rpx 为 64 / 4 / 44；`common.js` 有 `iconFramed:void 0!==t.content.iconColor` 透传。中途 demo build 曾撞上工作区里 dialog 页导入语句的并发中间态（`DemoShell` 暂挂错模块），复跑即恢复；与本改动无关。

### 2026-11-25 圆环尺寸与自定义图标边界

用户定稿：「圈是原来的 icon 这么大就不变，里面 icon 小 4~6 像素、保持上下左右居中；只有固定的几个 icon 这么处理，用户自己定义 icon 或定颜色的回到原来没圈、原大小。」

**落点**：`--mptk-c-dialog-type-icon-ring-size` 32px → 28px（与常规图标同尺寸），圆环槽加 `box-sizing:border-box` 让 28px 是含 2px 描边的真实外径；内部图标仍 22px（比原 28px 小 6px，落在 4~6 区间），flex 居中不动。`commands.ts` 的 `iconColor` 条件从「有 type」收窄为「有 type 且未显式传 icon」——显式 icon 不再携带语义色，Host 的 `iconFramed` 随之关闭，回到无圈原大小；通用 `iconColor` 本来就不加框，边界保持一致。

**回归**：ui 断言显式 icon 无 `iconColor`；render 断言三条弹窗里只有固定类型那条带 `--framed`；layout 锁外径 28px 真源与 `border-box`。

**门禁实测**：gen:config → build 408 → test 237 全过 → guard / pack → demo build:weapp → codelint 38 文件 → docwriter 无 FAIL。产物核对 `common.wxss` 的 `--framed{box-sizing:border-box;width:var(--mptk-c-dialog-type-icon-ring-size);…border:var(--mptk-c-dialog-type-icon-ring-w) solid currentColor}`，token 转 rpx 为 56 / 4 / 44。未提交，等用户看效果。

### 2026-11-25 圆环尺寸口径纠正（只缩内图标）

用户纠正：「你把圈儿改小了，圈儿还是原来这么大好吗？是把里面的 icon 改小？」上一轮把「圈等于原图标 28px」理解成了要缩小圈，实为误读：圈保持最初画的 32px 不变，只缩内部图标。

**落点**：`--mptk-c-dialog-type-icon-ring-size` 28px → 32px（恢复原值），圆环槽撤掉上一轮加的 `box-sizing:border-box`，尺寸口径回到初次实现；`--mptk-c-dialog-type-icon-size` 仍 22px（比常规 28px 小 6px，落在 4~6 区间），flex 居中不动。显式 icon 不带圈、通用 `iconColor` 不加框的边界保持不变。

**回归**：layout 断言改回 32px 并锁住不引入 `border-box`。

**门禁实测**：gen:config → build 408 → test 237 全过 → guard / pack → demo build:weapp → codelint 38 文件 → docwriter 无 FAIL。产物核对 `common.wxss` 无 `box-sizing`，token 转 rpx 为 64 / 4 / 44。未提交，等用户看效果。

### 2026-11-25 固定类型图标再缩 4px

用户要求：「圆保持一样大啊，中间的 icon 再减小 4 像素。」圈仍是 32px 不动，内部图标 22px → 18px，只改 `--mptk-c-dialog-type-icon-size` 一个 token，居中与「仅固定类型加圈」的边界不变。

**门禁实测**：gen:config → build 408 → test 237 全过 → guard / pack → demo build:weapp → codelint 38 文件 → docwriter 无 FAIL。产物核对 token 为 64 / 4 / 36rpx（圈 32px、描边 2px、图标 18px）。未提交，等用户看效果。

### 2026-11-26 演示站 alert 配置区

用户要求：alert 示例下面加一个 CellGroup——第一格标题「按钮」+ 两档滑块（横排按钮 / 竖线，默认横排）；第二格标题「内置 icon」+ 四档滑块（成功 / 失败 / 警告 / 信息，默认信息）；第三格无标题，右侧三个按钮「默认样式 / icon外伸 / 信息头」。三个按钮都读上面两个滑块的选择；默认样式是标题 + 内容 + icon，底部只有一个「完成」，不区分正确与错误。

**落点**：`demo/src/pages/dialog/index.tsx` 加 `ALERT_LAYOUTS`（spaced / joined）、`alertLayout` 与 `alertType` 两个 state（默认 spaced / info）、`openAlertVariant(mode)` 共用构造，三种头部形态只差 `note` / `badge`；三个按钮都传 `type: alertType` 与 `layout: alertLayout`，`confirmText:'完成'`。原有三行按钮随后按用户要求清除，由配置区完全替代（见下一段）。

**门禁实测**：build 414 产物 → test 252 项全过 → guard / pack → demo build:weapp → codelint → docwriter 全过。产物核对 `dialog/index.js` 有 `value:"spaced"` / `value:"joined"` 两档、`value:"(success|error|warning|info)"` 四档、三个按钮文案的 unicode 转义与 `confirmText:"\u5b8c\u6210"`。未提交。

**待确认**：用户原话「下面有两个完成」「第二个滑块就是忽略 / 那两个花花的选择」口语化较重，按「一个完成按钮、三按钮都跟两个滑块走」实现，等用户看效果后确认。

### 2026-11-26 alert 旧按钮清除

用户纠正：「你把 alert 里面原来有的按钮给删除了。现在加这些就是去替代原来的。」新 CellGroup 是**替代**旧按钮，不是并存。

**落点**：删掉 alert 分支里的 `layoutRow(openAlert, ...)` 与两行 `TYPES.map`（普通固定类型 / 外伸固定类型），连同只被它们调用的 `openAlert` / `openTyped` 函数；`withLayout` / `LAYOUTS` 仍服务 confirm 与自定义按钮，保留。测试改为 `doesNotMatch(openAlert|openTyped)` 锁住不残留。

**门禁实测**：build 414 产物 → test 252 全过 → guard / pack → demo build:weapp → codelint → docwriter 全过。产物核对三条旧文案（解析即关 / 外伸固定类型 / 普通图标按类型上色）均已清除，新配置区三按钮文案仍在。未提交。

## Conclusion

命令式与声明式双通道已收敛到 `ContentPopup` 一份视觉；说明走 body，标题按头部形态排布（title 档内联图标侧、image / badge 档独立标题行），三形态、位置、宽度、头部配置与整框交互锁都按方案落码；按需引入已做产物级断言而非只看源码。演示站按用户逐条细化完成：菜单原文全部保留，多入口页标题用 `X` 标出待调整；按钮与图片头按 Popup 口径纠正，演示只展示效果不展示结果文案；默认文案与按钮样式已集中到 kit.config.mjs 一处可配。已知边界：Host 卸载释放的归属要等下一次栈变化才被其它 Host 重认；弹窗动效未修（`DialogHost` 的 `open` 写死 true）；Skyline / WebView 双端真机观感尚未验证；当前改动未提交，待用户明确指令。

## Execution Log

<!-- Maintained by the script: appended by new / claim / set / release / log / close. Do not edit.
     Backfill with: progress log --id 20261125-0113-31c0-内容弹窗-alert-与-confirm-扩展 --note "...". -->
- 2026-11-25 01:13:13 · new · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · created
- 2026-11-25 01:14:33 · claim · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · claimed → doing
- 2026-11-25 01:15:04 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 三视角（系统架构师/前端工程师/UX 专家）评审完成，16 条需求与完整方案已写入 Background/To Do/Next/Process/Conclusion；方案收敛为：判别联合 payload、底座 locked/busy/例外、Button onBusyChange、Dialog 薄适配、三路径统一 dismiss；待实现
- 2026-11-25 01:19:50 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 追加按需引入需求与讨论：commands 按能力拆子入口、ui/layout barrel 收窄、exports 支持两层子路径、app 去掉 floating-action CSS 顶层引、createKitApp hosts 不默认全挂、产物级验收；已写入 To Do 与 Process
- 2026-11-25 03:58:48 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 实现完成：命令式对话框改走 ContentPopup，底座交互锁 + 多 Host 归属 + Promise settle + 声明式薄适配；产物级 tree-shaking 断言落地；build/test(229)/guard/pack/demo 全过，双端真机待验收
- 2026-11-25 04:13:23 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示站补 Dialog 独立页：顶部配置驱动 alert/confirm，覆盖三形态、头部配置、自定义按钮与异步忙碌锁；菜单 Dialog 指向新页，ActionSheet 保留 planned 占位；build/test(230)/guard/pack/demo 全过
- 2026-11-25 06:51:03 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 修复命令式弹窗不显示根因：拆分 Toast/Dialog/Loading 宿主时漏搬 OverlayHost 的 fixed 全屏定位，补四件宿主公共定位 + 按类名恢复命中（WXSS 会丢弃 > *）；新增产物级断言，build/test(231)/guard/pack/demo 全过
- 2026-11-25 06:57:01 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 命令式弹层仍不可见，继续治根：Taro App 根节点不投影为页面可见子树，createKitApp 改为只登记宿主，KitPage 在每页页面树渲染；补回归断言，build/test(231)/guard/pack/demo 全过，待真机复验
- 2026-11-25 07:15:23 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 日志定位根因：Taro 保留上一页页面树，旧页 DialogHost 先渲染抢走全部弹窗（当前页 visible=0）；新增页面 route 单例与上下文，命令载荷记录发起页，宿主只认领同 route；232 项测试通过，demo 已带日志重编待用户复验
- 2026-11-25 07:32:56 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 清除临时日志；专家研判否定渲染写全局 route 的归属方案，改 app 层注入页面栈 provider + 页面实例 id，宿主按 id 认领并卸载收尾；删演示站重复 alert/confirm 与旧 dialog 示例；232 项测试/门禁全过，提交 db9a20c 并推送 origin/main
- 2026-11-25 08:28:35 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示站细化并纠偏菜单：pageTitleOf 唯一 ready 入口取菜单 label、多入口显示 X（catalog.ts:1137），15 条菜单原文还原；build/test(233)/guard/pack/demo 全过，产物核对通过，9 个文件未提交
- 2026-11-25 08:34:28 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示观感纠偏：按钮补 size 轴默认 md 与 Popup 底栏同型号（state.ts/DialogHost.tsx），图片头去 width 走 100% 铺满，删形态块与结果文案；build/test(233)/guard/pack/demo 全过
- 2026-11-25 08:46:03 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按钮交互与主题配置：kit.config.mjs 新增 runtime.dialog 集中文案与样式，生成器补类型/校验，commands 读配置；竖排确定在上、稍后直接关闭、取消改 outline，宽度 560/640/720；build/test(233)/guard/pack/demo 全过
- 2026-11-25 08:53:20 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 取消档纠偏：runtime.dialog.cancel.variant 由 outline 改回 Button soft 浅底档，稍后同步；joined 档不传 variant 保留 ContentPopup 原有 ghost；build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 09:00:01 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示站去掉位置选择：删 POSITIONS/position state/配置 Cell，不传 position 走 API 默认中部，DialogOptions.position 保留；产物无位置文案，build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 09:09:50 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 形态与 joined 纠偏：confirm 默认 stack、自定义默认 spaced，joined 自定义按钮只认文字颜色；演示页顶部删形态滑块、各示例放横排/竖排/竖线三按钮；build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 09:18:39 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示页展示规范：配置页去 CellGroup 标题只留两个 Cell，示例标题加 alert/confirm，各示例加默认按钮、竖线用 sm、alert 隐藏竖排；build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 09:27:53 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 按钮尺寸与 confirm 默认形态再纠偏：演示页除滑块外全部 size=xs，confirm 不传参默认 joined 竖线（显式 stack 仍确定在上）；build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 09:39:44 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 四组合并到同一 Card：catalog 四个 example 合并为 actions，页面用四个 CellGroup 各带标题；Card 只有一组 title/subtitle，多标题靠 children 分组；build/test(233)/guard/pack/demo/codelint 全过
- 2026-11-25 13:31:42 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 标题覆盖四档：ContentPopup 新增独立 __headline（header 与 body 之间），image/badge 挂在图形下方，badge 任意锚点出；DialogHost 无条件透传 title；撤 __title-text--raised；demo 四档带标题；build/test(233)/guard/pack/demo/codelint/docwriter 全过，产物含 headline 与四档标题
- 2026-11-25 13:41:06 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 纯标题三档归一：ContentPopup 让无图标/备注的 title 档与 image/badge 共用居中 __headline，默认无下划线；带图标/备注的文字头保留原内联结构；新增三档一致性断言，build/test(234)/guard/pack/demo/codelint/docwriter 全过
- 2026-11-25 14:18:00 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 标题行上方留白 space-3→space-4：标题上/左/右/下统一 16px，消除上间距比左右小的疏漏；layout 断言同步；build(408)/test(234)/guard/pack/demo/codelint/docwriter 全过，产物 wxss 四边同一档
- 2026-11-25 14:37:07 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 固定类型图标落地：type(success/error/warning/info)→gou/guanbi/warn/info + 轻微渐变语义色底，headerIcon.icon.tone 只作用 inline 槽、badge tone 不混；token 明暗两支；demo 四按钮；build(408)/test(236)/guard/pack/demo/codelint(39)/docwriter 全过，产物四档渐变齐全
- 2026-11-25 15:07:08 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 固定类型图标落点纠正完成并过全门禁：build 408 产物/test 236 项/guard/pack/demo build/codelint(38 文件)/docwriter 全绿；产物核对 type→图标映射、badge 四档明暗 8 条渐变、__headline 16px 间距生效。未提交，待用户指令。
- 2026-11-25 15:14:50 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 副标题回归与 inline 图标上色完成：note 无条件透传恢复标题下小字；type 给左侧 inline 图标上绿/红/黄/蓝语义色（token 明暗各一支，无底色）；237 项测试/产物核对/全套门禁通过。未提交，待用户指令。
- 2026-11-25 15:21:32 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 固定类型 inline 图标加同色细圆环（2px 描边 / 32px 外径 / 图标缩到 22px），只作用 type 档、通用 iconColor 不加框；237 项测试与全套门禁通过，产物核对圆环 CSS 与图标色同源。未提交，待看效果。
- 2026-11-25 15:26:53 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 圆环口径定稿：外径回到原图标 28px（border-box 含 2px 描边），内图标 22px 居中；仅固定 type 图标加圈，显式 icon/自定义颜色回到无圈原大小。237 项测试与全套门禁通过，产物核对 56/4/44rpx。未提交，等看效果。
- 2026-11-25 15:35:43 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 纠正圆环尺寸误读：圈恢复原来的 32px（撤掉 border-box），只把内部图标缩到 22px 居中；显式 icon 仍不加圈。237 项测试与全套门禁通过，产物核对 64/4/44rpx。未提交，等看效果。
- 2026-11-25 15:40:56 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 固定类型图标再缩 4px：圈仍 32px 不变，内部图标 22→18px；237 项测试与全套门禁通过，产物核对 64/4/36rpx。未提交，等看效果。
- 2026-11-26 06:07:47 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 演示站 alert 下新增配置 CellGroup：按钮滑块（横排/竖线，默认横排）+ 内置 icon 滑块（成功/失败/警告/信息，默认信息）+ 三按钮（默认样式/icon外伸/信息头），三按钮都读滑块且默认样式只有完成按钮；252 项测试与全套门禁通过，产物核对两档四档与三按钮文案。未提交，待看效果。
- 2026-11-26 06:11:55 · log · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6 · 清除 alert 旧按钮：删掉 layoutRow(openAlert) 与两行 TYPES.map，连同 openAlert / openTyped 函数；新配置 CellGroup 完全替代。252 项测试与全套门禁通过，产物核对三条旧文案已清除、新三按钮仍在。未提交，待看效果。
