# 20261125-0113-31c0-内容弹窗-alert-与-confirm-扩展: 内容弹窗 alert 与 confirm 扩展

- **Tags**: 弹窗, alert, confirm, 交互锁
- **Status**: doing · 2026-11-25 06:51:03 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
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

## Next

待用户验收：Skyline 与 WebView 真机打开命令页，确认转圈期间「取消可点、其它控件与叉/遮罩不可点」、`onConfirm` 失败后能重试、`top`/`bottom` 三形态与宽度的观感；这一步本轮未做。

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

## Conclusion

命令式与声明式双通道已收敛到 `ContentPopup` 一份视觉；标题/说明走 body，三形态、位置、宽度、头部配置与整框交互锁都按方案落码；按需引入已做产物级断言而非只看源码。已知边界：Host 卸载释放的归属要等下一次栈变化才被其它 Host 重认；Skyline / WebView 双端真机观感尚未验证，待用户验收。

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
