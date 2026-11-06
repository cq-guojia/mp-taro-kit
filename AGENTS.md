# mp-taro-kit 项目约定

## 包管理器

一律使用 **pnpm**，不使用 npm。

- 装依赖用 `pnpm add` / `pnpm install`；不得使用 `npm install` / `npm ci` / `npx`。
- 锁文件只保留 `pnpm-lock.yaml`；不得提交 `package-lock.json` / `yarn.lock`。
- 脚本用 `pnpm run <script>`、`pnpm test`；打包预览用 `pnpm pack --dry-run`；发布用 `pnpm publish`。
- CI 安装用 `pnpm install --frozen-lockfile`；pnpm 版本由 `.github/workflows/publish.yml` 的 `pnpm/action-setup` 固定为 `12.3.4`，本机保持同版本。
