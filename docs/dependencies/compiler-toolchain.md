# 编译期工具链

TypeScript 与 Sass 负责把 `src/` 编成 `dist/`；`@types/react` 与 `@tarojs/components` 给 TS 与 JSX 提供真类型。这些依赖只在本机与 CI 的编译期可见，不进入运行时与发布包。

- 用途：两遍 TypeScript emit、SCSS 编译、真类型下的组件声明生成。
- 适用版本：`typescript` 5.9.x、`sass` 1.x、`@types/react` 18.x、`@tarojs/components` 4.3.x；运行时 peer 为 `react >=18.0.0`、`@tarojs/taro >=4.0.0`、`@tarojs/components >=4.0.0`。
- 版本真源：`package.json` 的 `devDependencies` 与 `peerDependencies`、`pnpm-lock.yaml`、`.github/workflows/publish.yml` 的 `pnpm/action-setup`。
- 复核日期：2026-11-07 22:38:06

## 已核实行为

- `scripts/build.mjs` 两轮调用 `ts.createProgram().emit()`：第一轮 `ESNext` 加 `declaration` 产出 ESM `.js` 与 `.d.ts`，第二轮 `CommonJS` 产出 `.cjs` 并把相对 `require` 目标从 `.js` 重写为 `.cjs`。可用 `pnpm run build` 后比对 `dist/index.js` 与 `dist/index.cjs` 复核。
- Sass `compile()` 把每个 `.scss` 编成同名 `.css`；`_` 开头的 partial 与 `design/theme-*.scss` 不走通用映射，后者单独编译到 `dist/styles/theme-*.css`（明暗三选一），固定明那份复制为 `dist/styles/tokens.css`。可用 `pnpm run build` 后检查 `dist/ui/*/style/index.css` 复核。
- `pnpm-workspace.yaml` 的 `autoInstallPeers: false` 使宿主 peer 不进锁文件与 `node_modules`；`allowBuilds` 关掉 `@parcel/watcher` 的原生构建脚本。可用 `pnpm install --frozen-lockfile` 与 `pnpm pack --dry-run` 复核发布包内无 `node_modules` 文件。
- 组件 `.d.ts` 返回 `import("react").JSX.Element`；`tests/ui.test.mjs` 用 TypeScript compiler API 在真类型环境写 `<OverlayHost />` 并要求零诊断。可用 `pnpm test` 复核。

## 限制 / 坑

- TypeScript 7.x 是 native 版编译器，缺少 `createProgram` 等编程 API；`build.mjs` 依赖这些 API，版本必须留在 5.x。
- `@tarojs/components` 的类型 peer 期望同版本 `@tarojs/taro`；在 `autoInstallPeers: false` 下 `pnpm peers check` 会留一条缺 peer 告警，不影响编译、CI 与产物，补装需在 `devDependencies` 里显式加。
- React 18 类型下组件 `.d.ts` 的 `import("react").JSX.Element` 已由 demo 的 `tsc --noEmit` 零诊断确认可解析；这仅是类型层结论，Skyline / WebView 实机渲染仍无证据，不能据此宣称双端可用。
- React 19 不能用于 Taro 4.3.x 运行时：`taro.js` 读取 `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentBatchConfig`，该字段在 React 19 已移除，小程序启动即抛 `TypeError`。demo 已按兄弟项目把 `react` / `react-dom` / `@types/react` 改为 `^18.0.0`（实装 18.3.1 / 18.3.31），实机日志可证，核实时间见更新日志。
- `@parcel/watcher` 是 Sass 的可选依赖，只服务 `--watch`；本库构建只用 `sass.compile()`，不需要它的原生构建产物。
- `--mptk-*` 的 `page` 挂载与 px 单位在 Skyline / WebView 双端的表现无实机证据，属未验证假设，须在 `demo/` 宿主里确认。
- 上游 Taro 类型包对 React 版本的 peer 限制可能比本库 `peerDependencies` 更窄，接入高版本 React 的宿主需自行核对类型层。
- 宿主 `designWidth` 必须是 375：本库 tokens 与组件样式按逻辑像素（pt）书写，`designWidth: 750` 会让 pxtransform 按 1px→1rpx 输出，真机字号与间距全部减半（`--mptk-font-md: 15px` 只剩 7.5pt）。配 375 后 1px→2rpx，`15px` 才是 15pt，与 WeUI 的 12~17px 同口径。

## 更新日志

- 2026-11-07 22:38:06：新建
- 2026-11-07 22:40:05：填实编译期工具链的已核实行为与限制
- 2026-11-08 01:32:55：React 19 类型解析由未验证假设改为 tsc --noEmit 零诊断的结论，保留实机验证边界
- 2026-11-08 15:12:53：React 19 运行时崩溃结论落盘，类型与 demo 依赖口径统一改为 React 18
- 2026-11-08 18:05:01：确认宿主 designWidth 必须为 375，修正 demo 全站尺寸减半
- 2026-11-08 22:53:30：正文去掉实测日期，改由更新日志承载
- 2026-11-11 19:58:19：补 Sass partial 与主题入口的编译规则
- 2026-11-11 22:50:04：同步 font-md 档位为 15px
