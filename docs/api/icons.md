# 图标字体

图标不画在本库里：矢量与字形由 iconfont 平台托管，本库只承诺「字体在线加载 + 类名」这一层，**字体文件不进包**。图标按命名空间分库，消费方引哪个库，才把哪个库的样式打进产物；跨框架通用的 `common.*` 与本框架自有的 `mp-taro-kit.*` 对外，`mp-taro-kit.demo*` 只服务本演示站。

例外是转圈：内容位没被占住的等待态（`Loader` 的 `ring`、`Loading`、光板 `Switch`）走组件级单元 `ui/feedback/spinner` 自绘（`circular` 圆环 / `chase` 六点追逐），不占图标码位，也不受字体在线加载影响。有内容位的控件不盖转圈，改由选中滑块呼吸（`Segmented` 走 `opacity`，白滑块 `Switch` 走灰白换色），见[对外契约](exports.md)。颜色由 `--mptk-spinner-active` 给明暗两套。

## Icon 组件

消费端默认只用组件，不自己拼类名：

```tsx
import { Icon } from 'mp-taro-kit/ui/display/icon'

<Icon name="common.base:home" />
<Icon name="common.base:shanchu" size="lg" />
<Icon name="common.logo:github" size={24} />
```

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `name` | `string` | 必填 | `库名:图标名`，库名不可省，如 `common.base:home` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| number` | 继承 | 不传则继承所在文字字号；传预设名或 px 才设 |
| `className` | `string` | — | 追加类名，用于局部上色、定位 |
| `style` | `CSSProperties` | — | 内联样式；与 `size` 同时给时 `style` 优先 |

`name` 里的库名就是注册表 `id`，程序拼出来的字符串可以直接喂：

```tsx
{rows.map((row) => <Icon key={row.id} name={row.icon} />)}
```

找不到库或名字时返回 `null` 并告警一次，不跨库回落 —— 显示错图标比空白更难查。字体样式随组件出口一起进包，消费端不用再写样式 import；要精细控制样式（例如只引基础包）时，改引 `mp-taro-kit/ui/icon/<命名空间>/<库名>/style`，不要引组件出口。

组件出口带的是全部对外库（6 个），当前全量 CSS 约 9 KB 原始 / 1.6 KB gzip；按每图标约 70 B 推，1000 个图标约 66 KB 原始 / 8 KB gzip。`@font-face` 只声明不下载，元素真正用上某个库的类名时引擎才下载该库字体，所以全量引不会把 8 个字体都下下来。

## 命名空间与对外边界

| 命名空间 | 归属 | 对外 |
|---|---|---|
| `common.*` | 与 mp-taro-kit 无关的整体图标基础库，所有开源框架复用同一套，由维护方单独维护；含 `base` / `logo`，以后可加 `social` / `office` | 下游消费方可直接使用 |
| `mp-taro-kit.base*` | 本框架提供的基础图标 | 下游消费方可直接使用 |
| `mp-taro-kit.demo*` | 仅本演示站展示用，不对外展示与开源 | 不允许下游引用 |

一条注册表记录 = 一个 iconfont 项目 = 一种字体 = 一套类名。`scripts/icons.sources.mjs` 的 `SOURCES` 是唯一真源：`id` 用「命名空间.库名[.color]」，点号直接映射目录层级与 exports 路径（`common.base.color` → `src/ui/icon/common/base/color` → `mp-taro-kit/ui/icon/common/base/color`）；`visibility` 取 `public` 或 `demo`，决定落 `src/ui/icon/` 还是 `demo/src/icons/`、是否生成包出口、是否进发布内容。

`package.json` 的 `./ui/*` 与 `./ui/*/style` 通配可穿透多段，所以新增一个图标库只加一条记录，不改生成器、单测与包清单。

当前八个平台项目：

| id | 平台项目 id | Font Family | 图标数 | 性质 | 落点 |
|---|---|---|---|---|---|
| `common.base` | `5252971` | `koc-i-common-base` | 47 | 单色 | `src/ui/icon/common/base` |
| `common.base.color` | `5252972` | `koc-i-common-base-c` | 1（占位 `_`） | 彩色 | `src/ui/icon/common/base/color` |
| `common.logo` | `5252974` | `koc-i-common-logo` | 4 | 单色 | `src/ui/icon/common/logo` |
| `common.logo.color` | `5252975` | `koc-i-common-logo-c` | 1（占位 `_`） | 彩色 | `src/ui/icon/common/logo/color` |
| `mp-taro-kit.base` | `5251349` | `mptk-i-base` | 1（占位 `_`） | 单色 | `src/ui/icon/mp-taro-kit/base` |
| `mp-taro-kit.base.color` | `5252363` | `mptk-i-base-c` | 1（占位 `_`） | 彩色 | `src/ui/icon/mp-taro-kit/base/color` |
| `mp-taro-kit.demo` | `5252365` | `mptk-i-demo` | 1（占位 `_`） | 单色 | `demo/src/icons/mp-taro-kit/demo` |
| `mp-taro-kit.demo.color` | `5252364` | `mptk-i-demo-c` | 1（`logo`） | 彩色 | `demo/src/icons/mp-taro-kit/demo/color` |

通用功能图标实际承载在 `common.base`；`mp-taro-kit.base` 与三个彩色库当前除平台占位 `_` 外没有真图标。

命名规则：**单色不标后缀，彩色加 `.color` 尾段**，同一库的单色与彩色是各自独立的平台项目。平台侧字体族用 `-c` 后缀区分彩色项目（如 `koc-i-common-base` 与 `koc-i-common-base-c`），那只是平台设置，不是本库的 id。图标类前缀等于基础类加一个短横，即 `iconClass(name)` 产出「基础类 + 基础类-图标名」。

同一项目内需要深色版时，加一个 `<name>-dark` 图标（仍是同一个项目，不是新项目）。`iconNames` 只列主名，变体由 `iconPaired` 单独给出。

彩色与单色必须分成两个项目，不能合：平台的「彩色」是项目级导出选项，勾了之后连单色线稿也会被包成 COLR 字形，包内所有图标的 `color` 一并失效。这是物理约束，不是命名偏好。

demo 包只生成本站用的 `style/index.scss` 与 `names.ts`，不生成 `index.ts`，也就不产生包出口、不进 `dist/`；类名由生成物 `iconMap` 提供，演示站不再手写全类名。品牌标不进组件库，否则整个基础包会被迫做成彩色。

空项目在平台上自带一个名为 `_` 的占位图标。它按正常图标进 `iconNames` / `iconMap`，类名与真图标一样可拼（如 `iconClass('mp-taro-kit.base:_')`），样式里的类按平台原文照留。它的字形是空的，渲染出来是空白或空心方框，只用来核对「这个包接上了没有」，不当作可用图标。

`font-family` 与类名都由平台设置决定，改设置即等于改对外类名，属于破坏性变更。

### 生成期校验

`scripts/lib/icons-pack.mjs` 的纯函数把「注册表 ↔ 平台 CSS」的对应关系钉死，不符就拒绝写出：

- id 形状、唯一性、`visibility` 与链接形状；
- id 带 `.color` ⇔ 平台 CSS 含 `/* Color fonts */`；
- 图标类前缀 = 基础类加 `-`；
- `@font-face` 的 `font-family` = 基础类；
- 基础类不得带 `font-size`，剥不掉则拒绝写出。

类名、字形编码、字体地址一律从平台 CSS 读取，不二次推导。`tests/icons-registry.test.mjs` 离线守住这些判据；`scripts/check.mjs` 的发布门禁再校验每个 public 包在 `dist/` 有产物、demo 包不在 `dist/`。

### 迁移与待定

- 旧扁平路径 `mp-taro-kit/ui/icon/base` 与其 `style` 已删除，改用 `mp-taro-kit/ui/icon/common/base` 与对应 `style`。
- 根出口 `mp-taro-kit/ui/icon` 与 `mp-taro-kit/ui/icon/style` 保留兼容，只转发到 `common.base`；新代码不要再用。
- 类名随平台设置整体变化：旧 `mptk-icons-base mptk-i-*` → 新 `koc-i-common-base koc-i-common-base-*`。已接入宿主若手写过类名，按新库的 `iconClass()` 输出替换；回滚路径是把注册表对应 `source` 换回旧链接并重跑 `pnpm run icons`。
- 消费端旧写法 `iconClass('home')`（包级、无库名）不再推荐，改用 `<Icon name="common.base:home" />` 或聚合入口 `iconClass('common.base:home')`。
- 待定：`mp-taro-kit.demo` 的平台 font-family 仍是 `dshpc-i-demo`，与命名空间不一致，是否统一由维护方决定；`common.*` 是否抽成跨仓库独立包也未定，当前先以独立注册表文件作为本仓库内的真源。

## 出口

| 子路径 | 提供什么 |
|---|---|
| `mp-taro-kit/ui/display/icon` | `Icon` 组件；出口同时带全量图标样式，引这一条就够 |
| `mp-taro-kit/ui/icon/all` / `.../all/style` | 聚合入口：`库名:图标名` 解析与全量样式；组件出口用的就是它 |
| `mp-taro-kit/ui/icon/common/base` | 通用基础图标包的 `iconNames`、`iconClass`、`iconBaseClass`、`iconPrefix`、`iconMap` |
| `mp-taro-kit/ui/icon/common/base/style` | 该包 `@font-face` 与全部图标类；按需只引基础包时用 |
| `mp-taro-kit/ui/icon/<命名空间>/<库名>` / `.../style` | 每个 public 包各自的清单、拼类名与样式，用哪个引哪个 |
| `mp-taro-kit/ui/icon/<命名空间>/<库名>/color` / `.../color/style` | 彩色项目的清单与样式，用哪个引哪个 |
| `mp-taro-kit/ui/icon` / `.../icon/style` | 旧出口，只转发到 `common.base`，保留兼容；新代码不要再用 |

组件不静态依赖任何扩展包：组件需要扩展图标时由调用方用 `ReactNode` 注入，并在演示站该组件的 `imports` 里把「组件 + 对应图标包」列全。引了组件没引图标包只会图标位置空白，不会把没用的字体样式打进包。

## 高级用法：直接拼类名

不走组件、或需要自己控制标签时，用聚合入口的 `iconClass`：

```tsx
import { iconClass } from 'mp-taro-kit/ui/icon/all'

<Text className={iconClass('common.base:shanchu')} />
```

聚合入口同样只认 `库名:图标名`，输出 `koc-i-common-base koc-i-common-base-shanchu`。它不带样式，样式要自己引（例如 `mp-taro-kit/ui/icon/common/base/style`）。

包级出口 `mp-taro-kit/ui/icon/<命名空间>/<库名>` 也导出同名 `iconClass(name)`，但那个只接受图标名、不接受冒号；跨包混用时容易写错，新代码统一用聚合入口。

## 契约

| 名称 | 类型 | 说明 |
|---|---|---|
| `iconBaseClass` | `string` | 基础类名，决定 `font-family`，缺了图标就是普通文字 |
| `iconPrefix` | `string` | 图标类前缀，随平台设置变化 |
| `iconClass(name)` | `(name: string) => string` | 拼出可直接用的 className；名字不受类型约束 |
| `iconColored` | `boolean` | 整包字形是否带颜色（COLR/CPAL）；`true` 时 `color` 无效 |
| `iconPaired` | `readonly string[]` | 有 `-dark` 暗色字形的图标名；变体与主名同在一个样式文件 |

承诺稳定的只有「基础类 + 前缀 + 图标名拼成 className」这条规则。`iconNames` 与 `iconMap` 是生成物里的当前快照，**对外不承诺稳定**：平台随时会删掉不常用的图标，把它们写成字面量联合会让每次增删都变成类型破坏。

图标名的真源是平台项目里的列表；叫得出名字就能用，不需要先在本库里登记。

## 颜色与尺寸

| 图标类型 | `color` | 明暗 | 说明 |
|---|---|---|---|
| 单色 | 生效 | 跟随 | 用 `var(--mptk-fg)` 等变量时，随宿主所选的 `styles/theme-*` 模式切换 |
| 多色 | **无效** | 不跟随 | 颜色固化在字体的 COLR/CPAL 调色板里，改不了，暗色下不协调 |

多色字形要在暗色下协调，只能由平台另出暗色字形或改用单色图标；本库不做运行时换色。

### 单色还是多色：生成期判定，不靠人看图标

判定在生成器里：`scripts/icons.mjs` 读平台 CSS 时查 `/* Color fonts */` 标记，命中即整包彩色，结果写成该包的 `iconColored`（`names.ts` 生成物）；同一份标记还要与 id 的 `.color` 尾段互相印证，不一致就拒绝写出。判据只读那份 CSS，不解析字体二进制，不新增任何下载。

粒度是**整包**，不是单个图标：iconfont 的彩色/单色是项目属性，一个项目不会一半一半。要单色图标只能另建普通项目，也就自然成为另一个包。

调用方据 `iconColored` 决定要不要上色，不要逐个图标试 `color` 看生不生效。

`common.base` 是单色项目，功能图标全部跟随 `color`。此前旧基础包曾因建项目时勾了「彩色」出过事故：平台上单色线稿勾了彩色不会报错，只会把线稿包成 COLR 字形让 `color` 静默失效，事后靠解析 ttf 的 `COLR` 表才定位到。

### 包内文件划分

一个包**永远只有一个样式文件**：`style/index.scss`。变体是包内的另一个类名，不是另一个文件，也不是另一个包：

| 情况 | 文件 | 多出来的东西 |
|---|---|---|
| 无变体 | `style/index.scss` | —— |
| 有变体 | 还是那个 `style/index.scss` | 多一个 `<基础类>-<名>-dark` 类 |

### 变体：同文件两个类名，用哪个由调用处决定

```css
/* 同一个文件里两条并存，来自平台项目里的两个图标 */
.koc-i-common-logo-wechat:before { content: "\e87e"; }
.koc-i-common-logo-wechat-dark:before { content: "\e900"; }
```

生成器自动判断：只有存在 `<name>-dark` 的图标才多出第二个类；没有变体的图标只有一个类，明暗共用同一个字形。`iconMap` 含变体名（`iconClass('logo-dark')` 能取到类名），`iconNames` 只列主轴图标，`iconPaired` 单独给出哪些有暗色版。

调用处三种用法，同一个包、同一个文件，不需要换引入：

| 需求 | 写法 |
|---|---|
| 跟随系统 | `iconClass(theme === 'dark' ? 'logo-dark' : 'logo')` |
| 永远用亮色版 | `iconClass('logo')` |
| 永远用暗色版（深色区块里） | `iconClass('logo-dark')` |

**为什么不做自动覆盖**：CSS 覆盖是全页级的，一处生效处处生效，没法只让某一块深色区域里的 logo 反白。而「明亮界面里放一块深色区域」是很常见的布局，覆盖方案在这里直接失效，`prefers-color-scheme` 也给不出这种局部语义。所以「用哪个字形」必须留在调用处，由它按位置决定。

单色包不涉及这套：`currentColor` 已经让图标跟随 `--mptk-fg`，明暗自动变，不需要第二个类。

**运行时热切换下怎么选**：库不做全页级 CSS 覆盖（理由见上），用哪个字形仍由调用处决定。需要跟随当前主题时，用 `useThemeDark()` 读派生值再选类名：

```tsx
const dark = useThemeDark()
<Text className={iconClass(dark ? 'logo-dark' : 'logo')} />
```

`useThemeDark()` 从 `mp-taro-kit/ui/infra` 导出，读的是 `runtime` 层同一份跨副本单例，不新建 React Context。没有 `-dark` 变体的图标仍用主名，明暗共用同一字形。彩色图标的颜色固化在 CPAL 表，不响应 `color`，只能靠变体字形切换。

已验证 / 未验证：

| 项 | 状态 | 依据 |
|---|---|---|
| 只有主名存在的 `-dark` 才拆成变体 | 已验证 | `tests/icons.test.mjs`：孤立 `logo-dark` 按普通图标处理 |
| 变体进 `iconMap`、不进 `iconNames` | 已验证 | 同文件断言 |
| 真实暗色字形切换 | **未验证** | 当前所有包都没有 `-dark` 图标，机制只有单测覆盖 |

**图标基础类不设 `font-size`**：图标是字体，继承所在文字的字号，因此与相邻文字天然同尺寸。平台产物自带 `font-size: 16px`，生成脚本 `scripts/icons.mjs` 在写入时会剥掉它，重跑 `pnpm run icons` 不会把固定值带回来；`pnpm test` 逐个对外包守住这条契约，生成脚本发现剥不掉会直接拒绝写出。

需要图标比文字大（品牌 logo、返回箭头等）时，由宿主或组件在自己的类名上用 `--mptk-font-*` 档位或具体 `font-size` 显式设定，不要改基础类。行高建议 `1`，否则字形会被行高撑开。

## 图标清单

这里**不列具体图标名**：名单在平台上随时增删，写进文档就会立刻过期。要看当前有哪些图标，三个地方是真源：

- 平台项目里勾选的图标列表——增删以它为准；
- 对应包的 `iconNames`（生成物快照）；
- 演示站「图标」页，按命名空间分组铺出「跨框架通用 → 本框架自有」，只列对外库；本站自用包不在其中，由演示站自己引用。重跑生成后自动跟随增删。

## 字体加载与稳定性

`@font-face` 直接指向 `https://at.alicdn.com/...`，字体不进小程序包，也不进 npm 包。平台对在线链接的原话是「仅供平台体验和调试使用，平台不承诺服务的稳定性，企业客户需下载字体包自行发布使用」。

全量引用的成本只在样式文本：当前 6 个对外库合计约 9 KB 原始 / 1.6 KB gzip；按每图标约 70 B 推，1000 个图标约 66 KB 原始 / 8 KB gzip。小程序主包 2 MB 按上传压缩包计，这部分不到 1%。声明本身不触发下载，只有元素真正用上某个库的类名时，才下载该库字体。

本库的取舍：**接受这个口径，不做自建 CDN**。链接失效时的表现是图标位置空白（文字与布局不受影响），不是崩溃；需要更高可用性时，把字体文件搬到自有存储，只改 `@font-face` 的地址即可，类名与用法不变。

## 已实测

| 结论 | 依据 |
|---|---|
| 字体走在线 `@font-face` 可用 | 真机与开发者工具均正常渲染 |
| `::before` 出字形可用 | font-class 写法与真实字形写法的渲染结果一致 |
| 多色字形可用 | Skyline 渲染器下彩虹字形按调色板出七色 |
| 多色不吃 `color` | 字体内部为 COLR v0 分层字形，颜色在 CPAL 表 |

明暗变量层已落，但 `prefers-color-scheme` 在 Skyline 下未实机验证；双端验过前不宣称自动跟随可用。本轮八个新链接的字形只完成源码级与构建级验证，Skyline 与 WebView 双端实机仍待核对。

## 相关

- 出口清单：[对外契约](exports.md)
- 演示站页与能力域对应：[演示站页与能力域映射](../architecture/demo-mapping.md)
- 增删图标、新增图标库的操作步骤：[更新图标字体](../guides/icon-update.md)

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
- 2026-11-12 08:53:18：变体机制落地：生成器识别 -dark 配对、补 iconPaired 与 dark/auto 出口、标注待验边界
- 2026-11-12 08:58:12：变体覆盖改为纯 CSS 覆盖：只写有 -dark 的图标，page 前缀保证顺序无关，弃用 content var()
- 2026-11-12 09:49:11：变体定稿：一个包一个样式文件，logo 与 logo-dark 两个类并存，用哪个由调用处决定
- 2026-11-12 11:39:42：补运行时主题下用 useThemeDark 选变体字形的用法
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
- 2026-11-12 18:22:33：转圈改为自绘 8 点圆点环，绕开 Skyline 单边边框让圆角失效
- 2026-11-12 20:42:05：转圈改为 TDesign circular 圆环与 SpinKit 六点追逐两形态，默认圆环
- 2026-11-13 12:47:21：转圈适用范围改为内容位没被占住的等待态，其余控件改呼吸
- 2026-11-13 23:24:15：改为命名空间分层：注册表、八库清单、生成期校验、出口与迁移说明
- 2026-11-13 23:51:56：补 Icon 组件入口、全量样式与体积口径，用法改为组件优先
- 2026-11-14：demo 两包换新版字体（`mptk-i-demo` / `mptk-i-demo-c`）；占位 `_` 不再过滤，按正常图标进清单；图标页仍只列对外库，本站自用包由演示站自己引用
- 2026-11-14：`common.base` 换新版字体，39 → 47 个图标（新增 `fuzhi` / `shuaxin` / `gongzuoqu` / `AIdamoxing` / `chexiao` / `chazhao` / `info` / `warn`，无删除）；聚合入口的图标数断言改为「清单非空 + 每个名字都能拼出本库类名」，不再锁具体数量
