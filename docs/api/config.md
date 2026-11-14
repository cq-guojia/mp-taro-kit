# 统一配置

本库把「名字对应一个值」的项全部收进一份配置：颜色、字号、行高、圆角、间距、控件高度档、透明度、动效时长与缓动、层级、组件视觉值、纯几何与算法结构常量、运行时默认（Toast 时长 / 通知上限 / 默认尺寸档 / core 五项）、微信窗口主题字段。**没有「不可配」清单，没有第二期**；`component` 与 `structure` 两组改了会影响控件几何与布局，允许改但需回归双端渲染。

唯一真源是项目根 `kit.config.mjs`（库侧完整默认表）与消费方项目根同名的差异文件。库默认表里**每一项都在同一列写了行尾注释**，说明这一项定义的是什么；唯一超过对齐列的 SVG 遮罩值拆成两行字符串拼接，首行照样带注释。`src/design/_tokens.scss`、`src/design/_keyframes.scss`、`src/*/kit-config.generated.ts`、`src/<宿主>/kit-swatches.generated.scss`、`src/<宿主>/theme.json` 等全部是**生成物**，头上有「请勿手改」与输入指纹，手改会在自检里报漂移。

原因是微信小程序 WXSS 不能在运行时读 JS 配置：值必须在 Sass / TS 编译前变成 CSS 字面量与 TS 字面量。因此生成挂在**编译链第一步**，由库自己写好，消费方不需要敲任何命令。

## 接口 / 导出

| 出口 | 形态 | 说明 |
|---|---|---|
| `mp-taro-kit/config` | ESM / CJS / `.d.ts` | 运行时配置契约：`KitConfig`、`KitConfigDefaults`、`defineKitConfig()`、`setKitConfig()`、`getKitConfig()`、`DEFAULT_KIT_CONFIG`。落点是 `dist/runtime/kit-config.*`，不新建第六个能力域。 |
| `mp-taro-kit/plugin` | ESM / CJS / `.d.ts` | Taro 4 构建插件。`@tarojs/service` 用 `resolve.sync()` 加载插件，不认 `package.json#exports` 子路径，因此包根另有物理入口 `plugin/index.js` 转发到 `dist/plugin/index.cjs`；两条路是同一份实现。 |
| `mptk-gen-config` | CLI（`dist/config/cli.mjs`） | 生成器。`--lib` 只从库默认表生成库产物、绝不读宿主差异；`--host` 用默认表 ⊕ 差异生成宿主产物；`--check` 只比对不写盘。CLI、纯函数依赖 `dist/config/lib/kit-config.mjs` 与默认表 `dist/config/defaults.mjs` 一起随包发布。 |
| `mp-taro-kit/design` | ESM / CJS / `.d.ts` | `CONTROL_SIZE_DEFAULT` 与 `KIT_RUNTIME_DEFAULTS`，由生成器写成 design 层字面量；design 层不运行时 import runtime，保持五层依赖方向。 |

`--mptk-*` 变量名、四个 `styles/theme-*` 出口、exports 子路径、props 名与命令式 API 名是对外契约，本次反转一个都没改。

### 参数 / 输入

配置文件是原生 ESM（`.mjs`，不依赖 `type: module`），`export default` 一个对象。只写要改的键，其余吃库默认；不建配置文件也行。

| 分组 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `primitives.light` / `primitives.dark` | object | 明暗同名同数 | 基础色板，语义色与派生档用配置层别名引用它，值只写一次。 |
| `base` | object | 半径 / 间距 / 控件高三组档位必须严格递增且为 `px` | 布局基线、尺寸档、字号行高、动效时长与非颜色 token。 |
| `surface` | object | 只由编译期三选一出口 include | 页面底色声明；运行时热切换出口不能 include，否则 `page` 写死底色、后代 `.mptk-dark` 无从覆盖。 |
| `light` / `dark` | object | 两套键同名同数 | 语义色与颜色 token。 |
| `component` | object | 值必须是字符串 | 组件原本写死的视觉取值：遮罩与层级、描边宽、滑块投影、Switch 三档几何、Spinner / Loader 时长与幅度。 |
| `structure` | object | 值必须是字符串 | 纯几何 / 算法结构常量：`0`、`100%`、`50%`、`flex-grow`、旋转、缩放、渐变角度、关键帧百分比、缓动关键字。 |
| `runtime` | object | `toastDuration` / `notifyLimit` / `core.timeout` 必须 > 0；`controlSizeDefault` ∈ `sm\|md\|lg` | Toast 自动消失时长、通知队列上限、默认尺寸档、core 五项默认。 |
| `window` | object | 明暗各四个字段 | 微信官方窗口主题；`theme.json` 由它生成，与 `--mptk-surface-base` 同源。 |

值有三种形态，生成器区别对待：

| 形态 | 写法 | 行为 |
|---|---|---|
| 字面量 | `'12px'`、`'#3b5bdb'` | 原样写进 CSS / JSON / TS。 |
| CSS 运行时别名 | `'var(--mptk-radius-md)'` | 原样保留，运行时跟随宿主覆盖。 |
| 配置层别名 | `'@blue'`、`'@light:gray-2'` | 生成时解析到当前 / 指定色板的字面量；别名成环当场报错。 |

### 返回 / 输出

| 产物 | 由谁生成 | 用途 |
|---|---|---|
| `src/design/_tokens.scss` | `--lib` | 四个 mixin 的声明体，由哨兵注释定位替换；主题出口逐字不动。 |
| `src/design/_keyframes.scss` | `--lib` | 关键帧百分比的 Sass 变量：CSS 选择器不能写 `var()`，组件用 `#{}` 插值，值仍来自配置。 |
| `src/design/kit-config.generated.ts` | `--lib` | design 层常量字面量。 |
| `src/runtime/kit-config.generated.ts` | `--lib` | `DEFAULT_KIT_CONFIG` 与显式 `KitConfigDefaults` 接口。 |
| `src/<宿主>/app-theme.scss` | `--host` | 站点覆盖层，只写差异键；不给 `page` 加 `background-color`。 |
| `src/<宿主>/theme.json` | `--host` | 微信官方窗口主题四字段。 |
| `src/<宿主>/kit-config.generated.ts` | `--host` | `KIT_CONFIG_ROWS` / `KIT_CONFIG_BY_KEY`：全量键、中文名、英文键、单位、当前生效值、分组；另给 `KIT_SWATCH_HUES` / `KIT_SWATCH_TIERS` / `KIT_SWATCH_GRAYS` 三个展示清单，供配置页与设计基础页遍历。 |
| `src/<宿主>/kit-swatches.generated.scss` | `--host` | `@mixin demo-swatches`：`light` 组每个颜色 token 一条 `.demo-swatch--*` 规则，取值一律 `var(--mptk-*)`。宿主 `app.scss` 只 `@use` 并在原位置 `@include`，不另写色相 / 档位 / 灰阶清单。 |

`--check` 不是「重跑生成器再字符串自比」：它按哨兵从落盘文件独立抽声明、与配置独立算出的期望结构化比对，核对配置页键集合与 `theme.json`，输出输入指纹（默认表 / 宿主差异 / 生成器核心 / CLI 的 sha256），并做变异测试 —— 改一个键必须且只能 diff 目标声明。指纹写进可注释生成物的头，生成器逻辑一变而产物没刷新就会报漂移。`scripts/check.mjs` 对两种模式各跑一次，纳入 `pnpm test` 与 `pnpm run guard`。

### 示例

一次性接入（`taro init` → `pnpm add mp-taro-kit` 之后，只做这一次）：

```js
// config/index.js
export default {
  plugins: ['mp-taro-kit/plugin'],
}
```

宿主 app 入口引用生成物，让它们进模块图（已有主题接入的项目通常已经具备）：

```scss
// src/app.scss
@use './app-theme';
```

之后日常只改项目根的差异文件，保存即自动重算并重编译：

```js
// kit.config.mjs
export default {
  component: {
    '--mptk-c-spinner-rotate-dur': '.9s',
  },
}
```

`--host` 的可选参数（插件已按 Taro 项目结构自动传好，只有非标准目录才需要显式声明）：

| CLI 参数 | 默认 | 说明 |
|---|---|---|
| `--root` | `process.cwd()` | 消费方项目根。 |
| `--config` | `<root>/kit.config.mjs` | 宿主差异文件。 |
| `--out` | `demo/src` | 生成物目录，相对项目根；Taro 插件传 `src`。 |
| `--defaults` | CLI 同目录的 `defaults.mjs` | 库默认表。 |

### 错误 / 抛出

| 场景 | 行为 |
|---|---|
| 配置出现默认表里没有的键 | 当场报「不是可配项」，不静默忽略（拼写错误不能变成换肤失效）。 |
| 值类型与默认值不符 | 报出路径、期望与实际类型。 |
| 配置层别名指向不存在的色板项，或别名链成环 | 报出别名与链路。 |
| 明暗键不同名同数、档位未严格递增、运行时数值非法 | 生成前拦下，不写出半套产物。 |
| 生成物与配置漂移 | `--check` 报出期望 / 实际 hash 与修复动作；不写盘。 |
| 构建期生成失败 | 插件抛带完整子进程输出的错误，构建中止，不静默吃旧值。 |

## 生成链与消费方操作边界

| 环节 | 谁做 | 消费方要做什么 |
|---|---|---|
| 库默认表 → `_tokens.scss` → `dist/styles/theme-*.css` | 库发布前 `pnpm run build` 自动跑 `--lib` | 无感 |
| 宿主差异 → `app-theme.scss` / `theme.json` / `kit-config.generated.ts` | Taro 插件在 `onBuildStart` 首次生成；Vite `buildStart` / `addWatchFile` / `watchChange` 在 watch 期监听 `kit.config.mjs` | 保存配置文件即可 |
| CI 一次性构建 | 同一次 `taro build` 内完成 | 无需额外步骤 |

消费方**不用**：敲 `gen:config`、在 scripts 里串 `&&`、靠 pre/post 钩子、重启 watch、改构建配置。唯一一次性动作是 `config/index.js` 里那一行 `plugins`，以及宿主 app 入口对生成物的引用（演示站的 `app.scss` 与 `app.tsx` 已具备）。

Taro 4 的 `Kernel` 只读配置里列出的 `plugins` 名单并逐项 `resolve.sync`，不扫描 `node_modules`；`@tarojs/plugin-` 前缀只是命名约定，不是自动发现；pnpm 12 默认不执行依赖安装脚本，所以「装包时自动写这一行」不可靠。项目模板预置、`mptk init` 命令、`postinstall` 写配置都不采用。webpack 编译器的宿主不在本插件的 Vite watch 链路内，`onBuildStart` 仍会生成，但保存配置不会自动重算，需统一要求 `compiler: 'vite'`。

组件样式（`src/ui/**/*.scss`）与演示站 `app.scss` 的设计取值已全部改走 `var(--mptk-*)`：数值、尺寸、颜色、时长、角度、层级、函数式取值与动画关键字都来自配置；只保留 `display` / `position` 等布局枚举关键字、图标字形码与 `env(safe-area-inset-*)` 平台函数。`flex` / `margin` 等简写拆成长写，避开简写属性内 `var()` 可能静默失效的情形。演示站主题配置页、尺寸页、设计基础页与 `catalog.ts` 读 `KIT_CONFIG_ROWS` / `KIT_CONFIG_BY_KEY` 及三个 `KIT_SWATCH_*` 清单，色块类名由 `kit-swatches.generated.scss` 提供；页面与 `app.scss` 都不复制任何色值、尺寸数字或色板清单。`--check` 会独立重算这份清单：配置增删色相 / 档位 / 灰阶而生成物没刷新，当场报漂移。

## 验证边界

产物级核实只算「值真的进了 CSS / JSON / TS」：`page` 与 `.mptk-dark` 的实际层叠、窗口首帧白闪、Toast 计时、配置页运行时展示值，仍须 Skyline 与 WebView 双端实机验证，编译通过不等于双端验证通过。

### 相关

- [对外契约](exports.md)
- [本地开发与验证](../development/build-and-test.md)
- [设计基础](../architecture/design-foundation.md)

## 更新日志

- 2026-11-14 23:43:34：新建：配置真源、全量可配项、生成链与 Taro 插件一次性接入
- 2026-11-15 00:20:58：补逐项注释、关键帧生成物与组件/演示站变量化现状
- 2026-11-15 00:40:41：色板清单收进生成链：补 kit-swatches.generated.scss 与三个 KIT_SWATCH_* 常量
