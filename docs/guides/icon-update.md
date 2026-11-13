# 更新图标字体

## 适用场景

iconfont 平台上增删了图标、调整了项目设置，或要新增一个图标库之后，把新字体链接与类名同步进本库。做完得到：注册表里每一条记录对应的生成物与平台一致，调用方不需要改代码。

## 前置条件

- 对应 iconfont 项目的可编辑权限。
- 本机已 `pnpm install`，能跑 `pnpm run icons`；生成时要联网拉取平台 CSS。

## 注册表

唯一真源是 `scripts/icons.sources.mjs` 的 `SOURCES`。一条记录 = 一个平台项目：

| 字段 | 含义 |
|---|---|
| `id` | `命名空间.库名[.color]`，点号直接映射目录层级与 exports 路径 |
| `source` | 平台导出的在线 `.css` 链接 |
| `visibility` | `public` 进组件库并对外发布；`demo` 只进演示站，不进 npm 包 |

`common.*` 是跨开源框架共用的基础图标库，`mp-taro-kit.*` 是本框架自有，`mp-taro-kit.demo*` 不对外。彩色项目必须单独建库，id 以 `.color` 结尾。

## 步骤

1. 平台里增删图标 → 点生成 → 复制新的在线链接（`.css` 地址）。
2. 替换注册表对应记录的 `source`；新增图标库则加一条记录，定好 `id` 与 `visibility`，不改生成器与 `package.json`。
3. 跑 `pnpm run icons`：脚本逐条拉取 CSS、做生成期校验，再按 id 的点号写出目录，成功时输出包 id 与图标数量。生成时还会剥掉平台产物里基础类的固定 `font-size`；校验不通过或剥不掉都会报错并拒绝写出。
4. 跑 `pnpm run build`，确认 `dist/ui/icon/<命名空间>/<库名>/style/index.css` 里的 `@font-face` 地址已换新、基础类不含 `font-size`，以及 `dist/ui/display/icon/index.js` 仍带 `../../icon/all/style/index.css`（组件出口随全量样式）。
5. 跑 `pnpm test`（含注册表纯函数、聚合入口冒号协议、组件出口与基础类字号断言）、`pnpm run guard`（发布门禁校验每个 public 包有产物、demo 包不进 `dist/`），再跑 `pnpm --filter mp-taro-kit-demo build:weapp` 看演示站图标。
6. 提交注册表、各包生成物，以及删库时一并删掉的旧目录。

## 验证

- `git diff --stat` 只出现 `scripts/icons.sources.mjs` 与各 id 对应目录下的生成物。
- `pnpm test` 与 `pnpm run guard` 通过：基础类不含 `font-size`，public 包产物齐全，demo 包不出现在 `dist/`。
- `mp-taro-kit/ui/icon/all` 的 `iconClass('common.base:home')` 输出 `koc-i-common-base koc-i-common-base-home`；只写 `home` 返回空串并告警。
- `<Icon name="common.base:home" />` 渲染出 `<text class="koc-i-common-base koc-i-common-base-home">`，`size` 不传时继承所在文字字号。
- `pnpm --filter mp-taro-kit-demo build:weapp` 后，演示站「图标」页按命名空间分组铺出新清单，字形可见。
- 根出口 `mp-taro-kit/ui/icon` 与 `mp-taro-kit/ui/icon/style` 仍可解析，它们只转发到 `common.base`。

## 常见失败

| 现象 | 原因 | 处理 |
|---|---|---|
| 图标位置空白、其余文字正常 | 新链接的字体里没有该码点，或注册表还是旧链接 | 核对平台导出的链接与 `@font-face` 里的地址是否一致 |
| 图标位空白且控制台出现 `[mp-taro-kit:icon]` | `name` 少了库名或库名写错 | 写成 `库名:图标名`，库名取注册表 `id` |
| 生成器报「彩色标记不符」 | id 的 `.color` 尾段与平台项目类型不一致 | 彩色项目必须单独建库并带 `.color`，单色库不要带 |
| 生成器报「图标类前缀」或「font-family」不一致 | 平台把 font-family / 类前缀设置改了 | 统一平台设置，或改注册表的 `id` 归属；不要手改生成物绕开校验 |
| 生成物被手改后又被覆盖 | 生成物由脚本维护 | 只改平台与注册表，不手改生成物 |
| 图标尺寸盖住宿主设置 | 平台产物里的基础类又被写回固定字号 | 生成脚本会拒绝写出；核对剥离逻辑，别手改生成物 |
| 演示站图标页清单没变 | demo 侧构建缓存 | 删 `demo/.swc` 后重建 |
| 新增库出口解析不到 | 忘记跑 `pnpm run build`，或 `id` 与引用路径不一致 | 按 `src/ui/icon/` 下 id 点号对应的目录核对后重建 |

## 相关

- 契约、命名空间与生成期校验：[图标字体](../api/icons.md)
- 平台行为的坑：[Skyline 渲染引擎](../dependencies/skyline-rendering.md)

## 更新日志

- 2026-11-08 22:53:31：新建：从 api/icons 拆出的图标更新步骤
- 2026-11-10 12:26:50：更新流程补生成器剥离固定字号与回归断言
- 2026-11-11：改为按包更新：`SOURCE` 变 `SOURCES`，生成物落到 `src/ui/icon/<id>/`，根出口降级为兼容转发
- 2026-11-13 23:24:15：更新流程改为注册表驱动，补新增库、生成期校验与发布门禁步骤
- 2026-11-13 23:51:56：更新步骤与验证补组件出口、聚合入口与冒号协议
