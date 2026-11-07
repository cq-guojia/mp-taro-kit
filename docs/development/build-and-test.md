# 本地开发与验证

本库的产物由 `scripts/build.mjs` 生成，自检直接读取 `dist/`，所以任何测试前都必须先构建。

## 环境

| 组件 | 版本 | 用途 |
|---|---|---|
| Node.js | 24（CI 固定） | 运行构建脚本与 Node 内置 test runner |
| pnpm | 12.3.4（`pnpm/action-setup` 固定） | 安装依赖、执行脚本、打包预览与发布 |
| TypeScript | 5.9.x | 两遍编译产出 ESM / CJS / `.d.ts` |
| Sass | 1.x | 把 `.scss` 编译为 `.css` |
| 微信开发者工具 | 随宿主环境 | Skyline 与 WebView 双端实机验证 |

## 构建与运行

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run guard
pnpm pack --dry-run
```

`pnpm run build` 清空并重建 `dist/`；`pnpm test` 先跑 `scripts/check.mjs` 的包清单自检，再由 Node test runner 跑 `tests/*.test.mjs`；`pnpm run guard` 走 `--release`，追加校验 `dist/` 非空与根入口三件套齐全。

## 测试

| 文件 | 覆盖 |
|---|---|
| `tests/utils.test.mjs` | 日期、字符串、数值、路径、i18n 回落 |
| `tests/runtime.test.mjs` | thenable 判定、跨副本单例、覆盖层栈、通知队列、loading 句柄 |
| `tests/core.test.mjs` | 注入校验、请求、路由、存储、小程序能力兜底 |
| `tests/ui.test.mjs` | 挂载契约、命令式 API、ESM / CJS 双端、组件 `.d.ts` 真类型零诊断、样式不硬编码颜色 |

四组共 35 组断言，全部读取 `dist/` 产物，无外部服务依赖。

本仓库自检不覆盖 Skyline 与 WebView 的实机渲染：样式变量的 `page` 挂载、px 单位、简写属性内的 `var()`、跨副本是否出现两份模块实例，都必须在 `demo/` 宿主小程序里单独验证。只通过构建、类型检查与 Node 断言，不等于双端验证通过。

## 约定

- 禁止使用 npm、npx、yarn；锁文件只保留 `pnpm-lock.yaml`，CI 安装必须带 `--frozen-lockfile`。
- 禁止把 `dist/` 提交进仓库；发布包的 `files` 只包含 `dist` 与 README。
- 新增能力域出口时，必须同步 `package.json#exports`、`scripts/check.mjs` 的必需出口清单与 `dist/` 产物，并保证 CSS 以外出口具备 `types` / `import` / `require` 三条件。
- 构建遇到任一 TypeScript 错误即中止，不得绕过 `noEmitOnError`。
- 发版只由 `v*` tag 触发 CI；普通 push 不发版。
- 文档只建在 `docs/` 下，按固定槽位组织；`docs/` 只维护设计、契约与工程约定，控件的使用方法由 `demo/` 小程序演示站承载，`docs/` 只给出指向。

## 更新日志

- 2026-11-07 22:38:05：新建
- 2026-11-07 22:40:05：填实构建命令、自检覆盖与工程约定
