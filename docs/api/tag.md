# Tag 标签

## 接口 / 导出

`mp-taro-kit/ui/display`：`Tag`、`TagProps`、`TagType`、`TagSize`、`TagRadius`、`TagVariant`
`mp-taro-kit/ui/display/style`：组件级样式出口，宿主显式引一次

标签：关键词与短文标记。只负责一块文字底衬（底色、字色、圆角、高度、图标），内容由 `children` 注入，不带业务语义。高度吃全库刻度 token，圆角吃全库圆角档，颜色直接引既有语义色与语义浅色档，不新增色值。

## 设计依据

对照 Vant Tag（公开文档 `packages/vant/src/tag/README.zh-CN.md`）与 TDesign 小程序 Tag（`tag/type.d.ts`）：

| 上游 | 本库取舍 |
|---|---|
| `type` 四色 | 取，映射到既有语义色 `business / success / warning / danger`，默认 `default` 灰 |
| `plain` 空心 | 取，升级成 `variant: solid / soft / outline` 三态（见下）；`plain` 保留为 `variant="outline"` 的旧写法 |
| `round` 胶囊 / `mark` 半圆角 | 取：`round` 翻成 `radius="pill"`，`mark` 单独一条布尔（接管四角，左直角右半圆） |
| `size` | 取，但**不另起一套数值**：直接吃全库高度刻度 `--mptk-control-h-*`，档名与物理高度一一对应 |
| `closeable` / `show` / `close` | 不取：可删除标签的状态由宿主管理，基础库不持状态 |
| `color` / `text-color` 任意值 | 不取：颜色只在配置里换，避免绕过档位 |

本库比上游多做的一步：上游的 Button 与 Tag 各自一套尺寸枚举，同名不同值；本库只有一条高度刻度，两边取子集，**同名档必然同高**（标签 `xs` 与按钮 `xs` 都是 24）。

## 尺寸

| 档 | 高度 | 字号 | 左右内边距 | 说明 |
|---|---|---|---|---|
| `3xs` | 16（`--mptk-control-h-3xs`） | `--mptk-font-3xs`（10） | `--mptk-space-1`（4） | 最小档；12px 字在 16px 高里会顶满上下，所以字降到 10 |
| `xxs` | 20（`--mptk-control-h-xxs`） | `--mptk-font-xs`（12） | `--mptk-space-1`（4） | 16 与 24 之间的过渡档；同样只对标签开放 |
| `xs`（默认） | 24（`--mptk-control-h-xs`） | `--mptk-tag-font`（12） | `--mptk-tag-px`（8） | 与按钮 / 开关 / 分段 `xs` 等高 |
| `sm` | 32（`--mptk-control-h-sm`） | `--mptk-font-sm`（14） | `--mptk-space-3`（12） | 与控件 `sm` 等高 |
| `md` | 40（`--mptk-control-h-md`） | `--mptk-font-md`（15） | `--mptk-space-4`（16） | 与控件 `md` 等高；标签很少有这么大场景，保留备用 |

高度用 `min-height` 吃刻度 token、`line-height` 压到 `--mptk-s-line-flat`，靠 `align-items: center` 居中——**上下不再有内边距参与撑高**。所以改字号不会把高度带跑，同档标签与控件并排必然齐平。`3xs` / `xxs` 两档低于最小可点目标（24），只对标签开放，可点控件不开放。

## 底色形态

| variant | 底 | 描边 | 字 |
|---|---|---|---|
| `solid`（默认） | 语义色本身 | 无（实心块加描边会看着小一圈） | 语义色 type 取 `--mptk-surface-1`；`default` 取 `--mptk-tag-fg`（明暗两套都是白） |
| `soft` | 语义浅色档（`--mptk-business-soft` 等） | 语义色本身 | 语义色本身 |
| `outline` | `--mptk-surface-1` | 语义色本身 | 语义色本身 |

`soft` 就是「边深、中间浅」那一档：底色取语义色自带的浅色阶（明色 8% 混白、暗色 12% 叠底），不用宿主另配色。`default` 色的 soft 底取 `--mptk-default-soft`（明 `gray-1` / 暗 `gray-3`），边取 `--mptk-gray-5`。

## 圆角

| 取值 | 圆角 |
|---|---|
| 不传 | `--mptk-tag-radius`（默认 `radius-xs`，4） |
| `xs` / `sm` / `md` / `lg` / `xl` | 同名全库圆角档（4 / 8 / 12 / 16 / 20） |
| `pill` | `--mptk-radius-pill`（两端半圆） |
| `mark` 布尔 | 接管四角：左上 / 左下直角，右上 / 右下半圆 |

## 图标

| 形态 | 写法 | 规则 |
|---|---|---|
| 前置图标 | `icon="库名:图标名"` | 图标在文字左侧，间距 `--mptk-space-1` |
| 后置图标 | `iconAfter="库名:图标名"` | 图标在文字右侧，间距同上 |
| 纯图标 | 只给 `icon` / `iconAfter`、不给 `children` | **必然是正方形**：宽高都锁成同档高度、左右内边距归零、`flex: none` 挡住父容器拉伸 |

纯图标不接宽度参数：方向就是「宽度 = 档位高度」。想让图标块更大，换 `size` 档，不要给宽度。

图标是字体图标，字形走宿主引入的图标包样式（`mp-taro-kit/ui/icon/<命名空间>/<库名>/style`，基础包也可用聚合入口 `mp-taro-kit/ui/icon/style`）；没引样式时标签仍然排版正确，只是字形不显示。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `type` | `TagType` | 否 | `'default'` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` |
| `size` | `TagSize` | 否 | `'xs'` | `'3xs' \| 'xxs' \| 'xs' \| 'sm' \| 'md'` |
| `variant` | `TagVariant` | 否 | `'solid'` | `'solid' \| 'soft' \| 'outline'` |
| `radius` | `TagRadius` | 否 | 取 `--mptk-tag-radius` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'pill'` |
| `mark` | boolean | 否 | `false` | 单侧半圆，接管四角 |
| `round` | boolean | 否 | `false` | 旧写法，等价 `radius="pill"` |
| `plain` | boolean | 否 | `false` | 旧写法，等价 `variant="outline"` |
| `icon` | string | 否 | — | 前置图标，`库名:图标名` |
| `iconAfter` | string | 否 | — | 后置图标，`库名:图标名` |
| `children` | ReactNode | 否 | — | 标签文字；不传且带图标即纯图标标签 |
| `className` | string | 否 | — | 追加根类名 |

## 样式契约

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-tag-radius` | `var(--mptk-radius-xs)` | 不传 `radius` 时的圆角 |
| `--mptk-tag-px` | `var(--mptk-space-2)` | 默认档（`xs`）左右内边距 |
| `--mptk-tag-font` | `var(--mptk-font-xs)` | 默认档（`xs`）字号 |
| `--mptk-tag-bg` | 明 `gray-6` / 暗 `gray-6` | 默认（`default` + `solid`）实心底；页面底色是 `gray-2`，浅灰档会和背景糊成一片，取到 6 级才有可辨的块面 |
| `--mptk-tag-fg` | 明 `#fff` / 暗 `#fff` | 默认（`default` + `solid`）实心字；深底必须反白，不能沿用全局 `--mptk-fg`。改 `--mptk-tag-bg` 时这条要一起看，底浅了白字就压不住 |
| `--mptk-c-border-w` | `1px` | `soft` / `outline` 的描边宽 |
| `--mptk-business-soft` / `-success-soft` / `-warning-soft` / `-danger-soft` / `-default-soft` | 指向对应色板的浅色档 | `soft` 形态的底 |

高度不再有专属变量：直接引用 `--mptk-control-h-3xs / -xxs / -xs / -sm / -md`。原先的 `--mptk-tag-py` / `--mptk-tag-line` 已删除——它们只用来「凑高度」，正是要根除的写法。`3xs` 档的字号取 `--mptk-font-3xs`（10px），是字号轴新加的最小档。

## 与 Badge 的边界

Badge 只做数字与红点，需要文字底衬就用 Tag。演示站里：首页顶部的渲染器 / 版本号 / 构建号取 `3xs` + `radius="pill"` 的实心形态（渲染器走 `primary`，版本号 / 构建号走默认灰）；主题配置页「基础配置」里那两条明暗色条就是 `xs` 档的 Tag（底色由宿主 className 覆盖成对应 token）；尺寸页的档位 chip 走默认 `xs`。

## 更新日志

- 2026-11-15 14:18:54：新增 Tag 标签：展示类圆角语义变量 --mptk-tag-radius，type / plain / round 三种形态
- 2026-11-15：加 `size`（xxs / xs / sm / md，吃全库高度刻度，默认 xs）；高度改由 `min-height` 定，删除 `--mptk-tag-py` / `--mptk-tag-line`
- 2026-11-15：`shape` 三态改为 `radius` 档位轴 + `mark` 布尔；新增 `variant`（solid / soft / outline）与语义浅色档 `--mptk-*-soft`；新增 `icon` / `iconAfter`，纯图标标签强制正方形
- 2026-11-15：16px 档改名 `3xs` 并把字号降到 `--mptk-font-3xs`（10px）；空出的 `xxs` 给新增的 20px 档，标签尺寸变为 3xs / xxs / xs / sm / md
