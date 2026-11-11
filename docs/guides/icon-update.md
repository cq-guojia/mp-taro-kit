# 更新图标字体

## 适用场景

iconfont 平台上增删了图标、或调整了项目设置之后，把新字体链接与类名同步进本库。做完得到：对应图标包目录下 `style/index.scss`、`names.ts`、`index.ts` 三个生成物与平台一致，调用方不需要改代码。

## 前置条件

- 对应 iconfont 项目的可编辑权限（基础包为 `5251349`）。
- 本机已 `pnpm install`，能跑 `pnpm run icons`。

## 步骤

1. 平台里增删图标 → 点生成 → 复制新的在线链接（`.css` 地址）。
2. 替换 `scripts/icons.mjs` 里 `SOURCES` 对应包的 `source`。新增扩展包则加一项 `{ id, source }`，`id` 决定目录名与出口路径。
3. 跑 `pnpm run icons`：脚本按每个包各自的链接写到 `src/ui/icon/<id>/` 下的三个生成物，成功时输出包名与图标数量。生成时还会剥掉平台产物里基础类的固定 `font-size`，让图标继承所在文字的字号；剥不掉会报错并拒绝写出。
4. 跑 `pnpm run build`，确认 `dist/ui/icon/<id>/style/index.css` 里的 `@font-face` 地址已换新，且基础类不含 `font-size`。
5. 跑 `pnpm test`（含基础类字号与分包骨架断言），再跑 `pnpm --filter mp-taro-kit-demo build:weapp` 看演示站图标。
6. 提交该包的三个生成物与 `scripts/icons.mjs`。

## 验证

- `git diff --stat` 只出现 `scripts/icons.mjs` 与 `src/ui/icon/<id>/` 下的三个生成物。
- `pnpm test` 通过：生成物与发布产物的 `.mptk-icons-base` 都不含 `font-size`。
- `pnpm --filter mp-taro-kit-demo build:weapp` 后，演示站「图标」页按新清单铺出图标，字形可见。
- 根出口 `mp-taro-kit/ui/icon` 与 `mp-taro-kit/ui/icon/style` 仍可解析，它们只转发到基础包。

## 常见失败

| 现象 | 原因 | 处理 |
|---|---|---|
| 图标位置空白、其余文字正常 | 新链接的字体里没有该码点，或 `SOURCES` 还是旧链接 | 核对平台导出的链接与 `@font-face` 里的地址是否一致 |
| 生成物被手改后又被覆盖 | 生成物由脚本维护 | 只改平台与 `SOURCES`，不手改生成物 |
| 图标尺寸盖住宿主设置 | 平台产物里的基础类又被写回固定字号 | 生成脚本会拒绝写出；核对剥离逻辑，别手改生成物 |
| 演示站图标页清单没变 | demo 侧构建缓存 | 删 `demo/.swc` 后重建 |
| 新增包出口解析不到 | 忘记跑 `pnpm run build`，或 `id` 与引用路径不一致 | 按 `src/ui/icon/<id>/` 核对路径后重建 |

## 相关

- 契约与命名规则：[图标字体](../api/icons.md)
- 平台行为的坑：[Skyline 渲染引擎](../dependencies/skyline-rendering.md)

## 更新日志

- 2026-11-08 22:53:31：新建：从 api/icons 拆出的图标更新步骤
- 2026-11-10 12:26:50：更新流程补生成器剥离固定字号与回归断言
- 2026-11-11：改为按包更新：`SOURCE` 变 `SOURCES`，生成物落到 `src/ui/icon/<id>/`，根出口降级为兼容转发
