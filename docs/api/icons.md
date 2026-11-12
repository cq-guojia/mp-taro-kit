# 图标字体

图标不画在本库里：矢量与字形由 iconfont 平台托管，本库只承诺「字体在线加载 + 类名」这一层，**字体文件不进包**。基础包必引，扩展包按需引；引了哪个包，才把哪个包的样式打进产物。

## 平台归属与命名

一个 iconfont 项目 = 一个图标包 = 一种字体 = 一套类名。`scripts/icons.mjs` 的 `SOURCES` 是包清单：

| 包 id | 平台项目 id | Font Family | 类前缀 | 性质 | 位置 | 说明 |
|---|---|---|---|---|---|---|
| `base` | `5251349` | `mptk-icons-base` | `mptk-i-` | 单色 | `src/ui/icon/base` | 通用功能图标，**宿主 app 入口引一次，必需** |
| `base-color` | `5252363` | `mptk-icons-base-color` | `mptk-i-base-color-` | 多色 | `src/ui/icon/base-color` | 通用多色图标，用哪个引哪个；当前只有占位 |
| `demo` | `5252365` | `mptk-icons-demo` | `mptk-i-demo-` | 单色 | `demo/src/icons/demo` | 演示站自有，**只生成样式**，当前只有占位 |
| `demo-color` | `5252364` | `mptk-icons-demo-color` | `mptk-i-demo-color-` | 多色 | `demo/src/icons/demo-color` | 演示站品牌标，**只生成样式**，只有 `logo` |

命名规则：**单色不标后缀，多色加 `-color`**，域相同则前缀相同。以后加域照抄，例如 `social` / `social-color`、`mptk-icons-social` / `mptk-i-social-`。

彩色与单色必须分成两个项目，不能合：平台的「彩色」是项目级导出选项，勾了之后连单色线稿也会被包成 COLR 字形，包内所有图标的 `color` 一并失效。这是物理约束，不是命名偏好。

demo 自有图标生成到 `demo/src/icons`，由 `SOURCES` 里的 `dest` 指定；组件库只装通用图标，品牌标不进库，否则整个 base 包会被迫做成彩色。

demo 的两个包带 `styleOnly`：只产出 `style/index.scss`，不生成 `names.ts` / `index.ts`，不承担对外契约。它们只服务演示站，用到的类名在 demo 里直接写（`className="mptk-icons-demo-color mptk-i-demo-color-logo"`），不经过 `iconClass()`。

空项目用一个下划线图标占位：图标名以 `_` 开头的不进 `iconNames` / `iconMap`，样式里的类按平台原文照留（无害）。

`font-family` 与类名都由平台设置决定，改设置即等于改对外类名，属于破坏性变更。

## 出口

| 子路径 | 提供什么 |
|---|---|
| `mp-taro-kit/ui/icon/base` | 基础包的 `iconNames`、`iconClass`、`iconBaseClass`、`iconPrefix`、`iconMap` |
| `mp-taro-kit/ui/icon/base/style` | 基础包 `@font-face` 与全部图标类，**宿主在 app 入口引一次，必需** |
| `mp-taro-kit/ui/icon/<id>` / `.../<id>/style` | 扩展包各自的清单、拼类名与样式，用哪个引哪个 |
| `mp-taro-kit/ui/icon` / `.../icon/style` | 旧出口，只转发到基础包，保留兼容；新代码不要再用 |

组件不静态依赖任何扩展包：组件需要扩展图标时由调用方用 `ReactNode` 注入，并在演示站该组件的 `imports` 里把「组件 + 对应图标包」列全。引了组件没引图标包只会图标位置空白，不会把没用的字体样式打进包。

## 用法

```tsx
import 'mp-taro-kit/ui/icon/base/style'
import { iconClass } from 'mp-taro-kit/ui/icon/base'

<Text className={iconClass('shanchu')} />
```

`iconClass(name)` 等价于手写 `mptk-icons-base mptk-i-shanchu`，两种写法产出同一个 className，选一种统一即可。每个包有自己的 `iconClass`，不跨包 import。

## 契约

| 名称 | 类型 | 说明 |
|---|---|---|
| `iconBaseClass` | `string` | 基础类名，决定 `font-family`，缺了图标就是普通文字 |
| `iconPrefix` | `string` | 图标类前缀，随平台设置变化 |
| `iconClass(name)` | `(name: string) => string` | 拼出可直接用的 className；名字不受类型约束 |
| `iconColored` | `boolean` | 整包字形是否带颜色（COLR/CPAL）；`true` 时 `color` 无效 |

承诺稳定的只有「基础类 + 前缀 + 图标名拼成 className」这条规则。`iconNames` 与 `iconMap` 是生成物里的当前快照，**对外不承诺稳定**：平台随时会删掉不常用的图标，把它们写成字面量联合会让每次增删都变成类型破坏。

图标名的真源是平台项目里的列表；叫得出名字就能用，不需要先在本库里登记。

## 颜色与尺寸

| 图标类型 | `color` | 明暗 | 说明 |
|---|---|---|---|
| 单色 | 生效 | 跟随 | 用 `var(--mptk-fg)` 等变量时，随宿主所选的 `styles/theme-*` 模式切换 |
| 多色 | **无效** | 不跟随 | 颜色固化在字体的 COLR/CPAL 调色板里，改不了，暗色下不协调 |

多色字形要在暗色下协调，只能由平台另出暗色字形或改用单色图标；本库不做运行时换色。

### 单色还是多色：生成期判定，不靠人看图标

`tests` 里没有这条，判定在生成器里：`scripts/icons.mjs` 读平台 CSS 时查 `/* Color fonts */` 标记，命中即整包彩色，结果写成该包的 `iconColored`（`names.ts` 生成物）。判据只读那份 CSS，不解析字体二进制，不新增任何下载。

粒度是**整包**，不是单个图标：iconfont 的彩色/单色是项目属性，一个项目不会一半一半。要单色图标只能另建普通项目，也就自然成为另一个包。

调用方据 `iconColored` 决定要不要上色，不要逐个图标试 `color` 看生不生效。

`base` 在 2026-11-12 换成了单色项目（`5251349` 重新以「不勾彩色」导出）：远程解析其 ttf 已无 `COLR` 表，`iconColored = false`，9 个功能图标全部跟随 `color`。换源前它曾是彩色包（`COLR v0` 11 个彩色字形 / 18 层，与当时 11 个图标数相等，`color` 全部无效）——那次事故的成因是建项目时勾了「彩色」，而平台上单色线稿勾了彩色不会报错，只会静默失效。

### 包内文件划分

一个包目录下的样式文件数由该包性质决定，深浅变体是包**内**的图标后缀，不是独立的包（独立成包会让字体文件翻倍）：

| 包性质 | 样式文件 | 说明 |
|---|---|---|
| 单色 | `style/index.scss` 一个 | 吃 `currentColor`，明暗自动跟随，不需要第二套字形 |
| 彩色、无深浅变体 | `style/index.scss` 一个 | 与现状相同 |
| 彩色、有深浅变体 | `style/index.scss` + `style/dark.scss` + `style/auto.scss` | 变体以 `content` 覆盖实现，见下 |

变体机制：基础样式里对有变体的图标写 `content: var(--mptk-i-<name>, "<默认码位>")`，`dark.scss` 只定义 `--mptk-i-<name>: "<暗色码位>"`，`auto.scss` 把同一组定义包进 `prefers-color-scheme: dark`。变量有定义就换字形、没定义就回默认，覆盖关系由 CSS 层叠给出，不需要运行时查找，也不需要 JS 判断当前主题。

> 待验：Skyline 下 `content` 吃 CSS 变量、以及 `prefers-color-scheme` 是否生效，均未实机验证。演示站「图标 → 换字形能力验证」是为此留的对照组，验证前不要把变体机制写进对外承诺。

**基础类 `.mptk-icons-base` 不设 `font-size`**：图标是字体，继承所在文字的字号，因此与相邻文字天然同尺寸。平台产物自带 `font-size: 16px`，生成脚本 `scripts/icons.mjs` 在写入时会剥掉它，重跑 `pnpm run icons` 不会把固定值带回来；`pnpm test` 有断言守住这条契约，生成脚本发现剥不掉会直接拒绝写出。

需要图标比文字大（品牌 logo、返回箭头等）时，由宿主或组件在自己的类名上用 `--mptk-font-*` 档位或具体 `font-size` 显式设定，不要改基础类。行高建议 `1`，否则字形会被行高撑开。

## 图标清单

这里**不列具体图标名**：名单在平台上随时增删，写进文档就会立刻过期。要看当前有哪些图标，两个地方是真源：

- 平台项目里勾选的图标列表——增删以它为准；
- 对应包的 `iconNames`（生成物快照）与演示站「图标」页（按它自动铺出，重跑生成后自动跟随增删）。

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

明暗变量层已落，但 `prefers-color-scheme` 在 Skyline 下未实机验证；双端验过前不宣称自动跟随可用。

## 相关

- 出口清单：[对外契约](exports.md)
- 演示站页与能力域对应：[演示站页与能力域映射](../architecture/demo-mapping.md)
- 增删图标的操作步骤：[更新图标字体](../guides/icon-update.md)

## 更新日志

- 2026-11-08 20:23:41：新建：平台归属与命名规则、出口、用法、多色行为、图标清单与更新流程
- 2026-11-08 20:30:55：图标清单改为不写死：清单以平台为准，仅承诺拼类名规则
- 2026-11-08 22:53:30：更新流程按槽位拆到 guides/icon-update，本篇只留契约与指向
- 2026-11-10 12:26:50：补图标尺寸契约：基础类不设 font-size，图标继承所在文字字号
- 2026-11-11：改为分包：基础包必引、扩展包按需，生成器按 `SOURCES` 多源产出，根出口降级兼容；补明暗跟随与多色不跟随
- 2026-11-11 17:58:24：图标明暗跟随改为依赖所选 theme 出口
- 2026-11-11 23:31:07：补生成期彩色判定与包内文件划分：iconColored 契约、变体机制与待验项
- 2026-11-12 08:43:52：按域分包落地：base 换单色项目、base-color 与 demo 两包入库，补占位图标过滤
- 2026-11-12 08:51:05：demo 图标改为仅生成样式，类名直接写，不建包出口
