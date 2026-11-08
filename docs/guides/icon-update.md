# 更新图标字体

## 适用场景

iconfont 平台上增删了图标、或调整了项目设置之后，把新字体链接与类名同步进本库。做完得到：`src/ui/icon/style/index.scss` 与 `src/ui/icon/names.ts` 两个生成物与平台一致，调用方不需要改代码。

## 前置条件

- iconfont 项目 `5251349` 的可编辑权限。
- 本机已 `pnpm install`，能跑 `pnpm run icons`。

## 步骤

1. 平台里增删图标 → 点生成 → 复制新的在线链接（`.css` 地址）。
2. 替换 `scripts/icons.mjs` 里的 `SOURCE` 常量，指向新链接。
3. 跑 `pnpm run icons`：脚本按新链接重写 `src/ui/icon/style/index.scss` 与 `src/ui/icon/names.ts`，成功时无输出、两文件 mtime 更新。
4. 跑 `pnpm run build`，确认 `dist/ui/icon/style/index.css` 里的 `@font-face` 地址已换新。
5. 提交这两个生成物与 `scripts/icons.mjs`。

## 验证

- `git diff --stat` 只出现 `scripts/icons.mjs`、`src/ui/icon/style/index.scss`、`src/ui/icon/names.ts` 三个文件。
- `pnpm --filter mp-taro-kit-demo build:weapp` 后，演示站「图标」页按新清单铺出图标，字形可见。

## 常见失败

| 现象 | 原因 | 处理 |
|---|---|---|
| 图标位置空白、其余文字正常 | 新链接的字体里没有该码点，或 `SOURCE` 还是旧链接 | 核对平台导出的链接与 `@font-face` 里的地址是否一致 |
| 两个生成物被手改后又被覆盖 | 生成物由脚本维护 | 只改平台与 `SOURCE`，不手改生成物 |
| 演示站图标页清单没变 | demo 侧构建缓存 | 删 `demo/.swc` 后重建 |

## 相关

- 契约与命名规则：[图标字体](../api/icons.md)
- 平台行为的坑：[Skyline 渲染引擎](../dependencies/skyline-rendering.md)

## 更新日志

- 2026-11-08 22:53:31：新建：从 api/icons 拆出的图标更新步骤
