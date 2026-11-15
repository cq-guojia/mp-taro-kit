# mp-taro-kit 项目约定

## 阶段性工作必须编译演示站

完成一个阶段性工作（改完一批代码、准备交付或提交）时，主动编译 `demo/`，不等用户提醒：能看到的只有小程序产物，库侧 build / test 全绿不等于演示站能看。

- 顺序固定：先 `pnpm run build` 刷新 `dist/`，再 `pnpm --filter mp-taro-kit-demo build:weapp`；演示站消费同一个 `dist/`，顺序反了会看到旧样式。
- 编译完核对 `demo/dist/` 里改动的实际值，不要只报「已编译」。
- 只改文档或规则、产物不可能变化时可以不编译；其余一律编译。
- 完整命令链与门禁顺序以 [`docs/development/build-and-test.md`](docs/development/build-and-test.md) 为准。
