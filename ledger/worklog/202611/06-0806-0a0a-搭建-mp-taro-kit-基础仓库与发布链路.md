# 20261106-0806-0a0a-搭建-mp-taro-kit-基础仓库与发布链路: 搭建 mp-taro-kit 基础仓库与发布链路

- **Tags**: mp-taro-kit, Taro, 组件库, npm, GitHub
- **Status**: doing · 2026-11-06 09:04:36 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6
- **Created**: 2026-11-06 08:06:05 · @GuoJia-Agent · 8d557c6d-7c93-43ac-8c73-5d623e82e1c6

<!-- Header lines are maintained by the script, fixed order: Tags → Status → Created → Sealed.
     The `- **Tags**: …` line is inserted at the top by new --tags; omitted when there are no tags
     (category goes to the ledger and history only, never into this document).
     The `- **Sealed**: …` line is appended on close. -->

## Background

### 起因

用户手上管理多个企业定制的小程序项目（不止 `koc-weapp-zuche`），每个项目都在重复实现同一批 UI 骨架：弹出层、遮罩、加载屏蔽、按钮 loading、导航栏、下拉/侧滑面板。差别主要在配色与业务内容，交互套路本身一致。

参照自己做 DSH 插件（`dsh-plugin-core`）的经验：最初没抽象，各插件各写一套，后来返工重构、把控件收口进基础库。这次想避免同一段路走两遍——先把底层库抽出来由自己维护，业务项目只消费。

目标：在 `/code/open-lab/mp-taro-kit` 建一个**公开、不涉具体业务**的小程序 UI 基础库（Taro + React 实现）。本任务只做前期基础工作，不写业务组件。

### 讨论过程与结论（按问答顺序，附理由）

1. **要不要抽一套 UI 库、靠配置覆盖样式？**
   能抽，但「配一套就变成自己的风格」只成立于 token 级差异（颜色、圆角、间距、字号、动画时长）。结构级差异（异形弹窗、图片位、按钮位置）没法用配置覆盖，只能靠插槽。
   用户拍板：**业务内容不进核心库**。「异形图片」只是举例，泛指各项目自己的内容与结构；库只提供容器能力（遮罩、底部弹出、下拉、手势、安全区），内容从 `children` 传入。

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
- Skyline 主路径 + WebView 必须可用；独占 API 默认不用，必须用时页面级提示。
- 业务内容不进库，库只提供容器能力（`children` / 插槽注入）。
- 按需 `import`，靠 tree-shaking 控体积。

### 技术约束（讨论中形成，附理由）

- **对外样式值必须走 CSS 变量，库内部照用 Sass**。理由：宿主要能覆盖库样式而不改库源码。Sass 变量在编译期被替换成固定值，发布后宿主改不了（只能用 `!important` 硬压）；CSS 变量留在产物里、运行期可继承、全局生效，宿主在 `app.scss` 改一行即可换肤。分工：库内部嵌套 / mixin / 计算照用 Sass，对外的颜色、圆角、间距、字号、动画时长写成 `var(--mp-*, 兜底值)`。Skyline 与 WebView 都支持 CSS 变量（Skyline 需安卓 8.0.35 / iOS 8.0.38+，简写属性内 `var()` 不生效，须写长写属性）。
- **组件不 `import` 宿主的私有模块（router / store / constants）**。准确含义：禁止的是「库源码指向宿主项目的相对路径 import」，不是禁止使用路由 / 请求 / 权限能力。能力由宿主通过 props / 回调注入（如 `canGoBack`、`onBack`）；路由、请求、权限这类框架层能力可另抽独立包，不塞进 UI 包（否则只要一个 Button 的项目会被拖进整个请求层）。现有 `nav-bar` 是反例（`nav-bar.tsx:25-27` 依赖 router / store / constants），抽离时改成外部传入系统信息与回调。用户认可「先这么定，要撤再撤」。
- **命令式 API 自带挂载点，不依赖宿主 store**。理由同上：宿主 store 是项目私有的，库若订阅宿主 `ui` 域，就绑死在某个项目上。
- **组件必须开箱即用**：声明式组件（`<Dialog open ...>`）与命令式 API（`showToast()` / `confirm()`）都要直接可用，使用者不写遮罩、不搭 div；遮罩、面板、进出动画由库内部实现。代价是宿主需在页面基座挂一次 `<OverlayHost />`，作为命令式 API 的渲染位置。

### 已移除的约束（开发期不采用）

- **组件 props 只增不改、token 只增不改名**：2026-11-06 由用户决定拿掉。当前是开发线，写错可以直接改；等库进入成熟期（开始被多个项目稳定依赖）再评估是否启用。

## To Do

按先后顺序，一条做完再下一条（2026-11-06 用户调整顺序：先把 GitHub 与 npm 的壳建起来，再定目录结构与抽样范围）：

1. **建 GitHub 仓库**：公开仓库，仓库名与包名一致（`mp-taro-kit`）。
2. **建 NPM 仓库**：在 npm 占住 `mp-taro-kit`（已核未被占用），确认发布配置（`--access public`）。
3. **定文件怎么存放**：给出仓库目录结构与源码组织（组件、token、构建产物、文档各放哪）。
4. **定要抽哪些内容**：从 `koc-weapp-zuche` 现有组件里筛，分清「可直接搬」「需改造成注入」「留在项目侧」三档。

## Next

第 1、2 项收尾：GitHub 推送需用户给写权限凭据（SSH key 被 `cq-guojia` 组织拒绝，现有两个 `GITHUB_TOKEN` 都只有 pull）；npm 发布需用户给 OTP 或可跳过 2FA 的 automation token。两项通后进第 3 项目录骨架方案。

## Process

讨论阶段已核实的事实（供后续引用，勿重复调研）：

- Skyline 支持 CSS 变量，官方 WXSS 支持表标注安卓 8.0.35 / iOS 8.0.38 起（`developers.weixin.qq.com/.../skyline/wxss.html`，2026-11-06 检索）。
- PC / Mac 微信客户端不支持 Skyline，恒走 WebView：`koc-weapp-zuche/docs/design/external/wechat-skyline.md:86`。
- 不满足版本 / PC 端 / 低版本微信时自动 fallback 为 WebView（官方保证）：同文件 `:40`。
- 现有组件可抽性：`src/components/float-panel.tsx:27-35` 纯 props 驱动，可直接搬；`src/components/nav-bar.tsx:25-27` 依赖 router / store / constants，抽离须改成注入。
- 宿主的构建补丁（伪元素冒号、inset 展开、hex→rgba、wxs 镜像、definePageConfig 剥离）在 `koc-weapp-zuche/config/index.ts:58-133`，抽 UI 包带不走，不属本任务范围。
- 名字核查：npm `mp-taro-kit` registry 404（未占用）；GitHub `mp-taro` org 404（未占用）。
- 台账标签限制：含中文时最多 4 字（建任务时被拒一次，已改「组件库」）。
- GitHub 仓库实建在组织 `cq-guojia/mp-taro-kit`（public，默认分支 main，空仓），非最初猜测的 `mp-taro` 组织；`package.json` 的 repository 已按此修正。
- 本机 SSH key 认证为 `cqguojia`，但推送 `cq-guojia/mp-taro-kit` 被拒（Permission denied）；环境里两个 GitHub token 的 permissions 均为 `pull: true, push: false`。
- `npm login` 成功（`npm whoami` = guojia），但 `npm publish --access public` 返回 EOTP：`npm login` 拿到的 web token 发布需二次验证，需 OTP 或 automation token。
- 本地骨架已就绪：`git init -b main`、`.gitignore`（含 `.codebuddy/`）、`README.md`、占位 `package.json`（0.0.1、MIT、files 只含 README），首次提交 `d18f7b6` 已生成待推送。

## Conclusion

任务刚建，前期调研未开工。决议已固定：三条技术约束（对外样式值走 CSS 变量、宿主能力靠注入、命令式 API 自带挂载点）+ 组件开箱即用；「props 只增不改、token 只增不改名」因开发期不采用已移除，成熟期再评估。

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
