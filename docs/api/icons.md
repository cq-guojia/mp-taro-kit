# 图标字体

图标不画在本库里：矢量与字形由 iconfont 平台托管，本库只承诺「字体在线加载 + 类名」这一层，**字体文件不进包**。宿主引入一次样式，页面里按名字写类名即可。

## 平台归属与命名

一个 iconfont 项目 = 一种字体 = 一套类名。当前只有一个 Base 项目：

| 项 | 值 |
|---|---|
| 平台项目 id | `5251349` |
| Font Family | `mptk-icons-base` |
| 图标类前缀 | `mptk-i-` |
| 类名形态 | `.mptk-i-<name>`，基础类 `.mptk-icons-base` |

以后按分类加库时，沿用同一套规则，避免多字体在同一页面互相顶掉：

| 库 | Font Family | 前缀 | 例 |
|---|---|---|---|
| Base | `mptk-icons-base` | `mptk-i-` | `.mptk-i-shanchu` |
| 分类库 | `mptk-icons-<域>` | `mptk-i-<域>-` | `.mptk-i-folder-open` |

`font-family` 与类名都由平台设置决定，改设置即等于改对外类名，属于破坏性变更。

## 出口

| 子路径 | 提供什么 |
|---|---|
| `mp-taro-kit/ui/icon` | `iconNames`、`iconClass`、`iconBaseClass`、`iconPrefix`、`IconName` 类型 |
| `mp-taro-kit/ui/icon/style` | `@font-face` 声明与全部图标类，**宿主必须引入一次** |

## 用法

```tsx
import 'mp-taro-kit/ui/icon/style'
import { iconClass } from 'mp-taro-kit/ui/icon'

<Text className={iconClass('shanchu')} />
```

`iconClass(name)` 等价于手写 `mptk-icons-base mptk-i-shanchu`，两种写法产出同一个 className，选一种统一即可。

## 契约

| 名称 | 类型 | 说明 |
|---|---|---|
| `iconBaseClass` | `string` | 基础类名，决定 `font-family`，缺了图标就是普通文字 |
| `iconPrefix` | `string` | 图标类前缀，随平台设置变化 |
| `iconClass(name)` | `(name: string) => string` | 拼出可直接用的 className；名字不受类型约束 |

承诺稳定的只有「基础类 + 前缀 + 图标名拼成 className」这条规则。`iconNames` 与 `iconMap` 是生成物里的当前快照，**对外不承诺稳定**：平台随时会删掉不常用的图标，把它们写成字面量联合会让每次增删都变成类型破坏。

图标名的真源是平台项目里的列表；叫得出名字就能用，不需要先在本库里登记。

## 颜色与尺寸

| 图标类型 | `color` | 说明 |
|---|---|---|
| 单色 | 生效 | 可用 `var(--mptk-fg)` 等变量，暗色主题自动跟随 |
| 多色 | **无效** | 颜色固化在字体的 COLR/CPAL 调色板里，改不了 |

尺寸一律用 `font-size` 控制，行高建议 `1`，否则字形会被行高撑开。

## 图标清单

这里**不列具体图标名**：名单在平台上随时增删，写进文档就会立刻过期。要看当前有哪些图标，两个地方是真源：

- 平台项目里勾选的图标列表——增删以它为准；
- `mp-taro-kit/ui/icon` 的 `iconNames`（生成物快照）与演示站「图标」页（按它自动铺出，重跑生成后自动跟随增删）。

## 更新流程

1. 平台增删图标 → 点生成 → 复制新的在线链接；
2. 替换 `scripts/icons.mjs` 里的 `SOURCE`；
3. 跑 `pnpm run icons`，它同时重写 `src/ui/icon/style/index.scss` 与 `src/ui/icon/names.ts`；
4. 提交这两个生成物。

调用方代码不需要改。两个文件都由脚本维护，手改会在下次生成时被覆盖。

## 字体加载与稳定性

`@font-face` 直接指向 `https://at.alicdn.com/...`，字体不进小程序包，也不进 npm 包。平台对在线链接的原话是「仅供平台体验和调试使用，平台不承诺服务的稳定性，企业客户需下载字体包自行发布使用」。

本库的取舍：**接受这个口径，不做自建 CDN**。链接失效时的表现是图标位置空白（文字与布局不受影响），不是崩溃；需要更高可用性时，把字体文件搬到自有存储，只改 `@font-face` 的地址即可，类名与用法不变。

## 已实测

| 结论 | 依据 |
|---|---|
| 字体走在线 `@font-face` 可用 | 真机与开发者工具均正常渲染 |
| `::before` 出字形可用 | font-class 写法与真实字形写法的渲染结果一致 |
| 多色字形可用 | Skyline 渲染器下彩虹字形按调色板出七色 |
| 多色不吃 `color` | 字体内部为 COLR v0 分层字形，颜色在 CPAL 表 |

## 相关

- 出口清单：[对外契约](exports.md)
- 演示站页与能力域对应：[演示站页与能力域映射](../architecture/demo-mapping.md)

## 更新日志

- 2026-11-08 20:23:41：新建：平台归属与命名规则、出口、用法、多色行为、图标清单与更新流程
- 2026-11-08 20:30:55：图标清单改为不写死：清单以平台为准，仅承诺拼类名规则
