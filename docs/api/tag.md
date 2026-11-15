# Tag 标签

## 接口 / 导出

`mp-taro-kit/ui/display`：`Tag`、`TagProps`、`TagType`、`TagSize`、`TagShape`
`mp-taro-kit/ui/display/style`：组件级样式出口，宿主显式引一次

标签：关键词与短文标记。只负责一块文字底衬（底色、字色、圆角、高度），内容由 `children` 注入，不带业务语义。高度吃全库刻度 token，圆角走 `--mptk-tag-*`，颜色直接引既有语义色，不新增色值。

## 设计依据

对照 Vant Tag（公开文档 `packages/vant/src/tag/README.zh-CN.md`）与 TDesign 小程序 Tag（`tag/type.d.ts`）：

| 上游 | 本库取舍 |
|---|---|
| `type` 四色 | 取，映射到既有语义色 `business / success / warning / danger`，默认 `default` 灰 |
| `plain` 空心 | 取：底色回到 `surface-1`，文字取对应语义色 |
| `round` 胶囊 / `mark` 半圆角 | 取，合并成一条 `shape` 轴：`square`（默认小圆角）/ `round`（两端半圆）/ `mark`（单侧半圆） |
| `size` | 取，但**不另起一套数值**：直接吃全库高度刻度 `--mptk-control-h-*`，档名与物理高度一一对应 |
| `closeable` / `show` / `close` | 不取：可删除标签的状态由宿主管理，基础库不持状态 |
| `color` / `text-color` 任意值 | 不取：颜色只在配置里换，避免绕过档位 |

本库比上游多做的一步：上游的 Button 与 Tag 各自一套尺寸枚举，同名不同值；本库只有一条高度刻度，两边取子集，**同名档必然同高**（标签 `xs` 与按钮 `xs` 都是 24）。

## 尺寸

| 档 | 高度 | 字号 | 左右内边距 | 说明 |
|---|---|---|---|---|
| `xxs` | 16（`--mptk-control-h-xxs`） | `--mptk-font-xs`（12） | `--mptk-space-1`（4） | 只对标签开放；16px 低于最小可点目标，可点控件不开放此档 |
| `xs`（默认） | 24（`--mptk-control-h-xs`） | `--mptk-tag-font`（12） | `--mptk-tag-px`（8） | 与按钮 / 开关 / 分段 `xs` 等高 |
| `sm` | 32（`--mptk-control-h-sm`） | `--mptk-font-sm`（14） | `--mptk-space-3`（12） | 与控件 `sm` 等高 |
| `md` | 40（`--mptk-control-h-md`） | `--mptk-font-md`（15） | `--mptk-space-4`（16） | 与控件 `md` 等高；标签很少有这么大场景，保留备用 |

高度用 `min-height` 吃刻度 token、`line-height` 压到 `--mptk-s-line-flat`，靠 `align-items: center` 居中——**上下不再有内边距参与撑高**。所以改字号不会把高度带跑，同档标签与控件并排必然齐平。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `type` | `TagType` | 否 | `'default'` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` |
| `size` | `TagSize` | 否 | `'xs'` | `'xxs' \| 'xs' \| 'sm' \| 'md'` |
| `shape` | `TagShape` | 否 | `'square'` | `'square' \| 'round' \| 'mark'` |
| `round` | boolean | 否 | `false` | 旧写法，等价 `shape="round"`；与 `shape` 同时给时以 `shape` 为准 |
| `plain` | boolean | 否 | `false` | 空心：底色回到 `--mptk-surface-1` |
| `children` | ReactNode | 否 | — | 标签文字 |
| `className` | string | 否 | — | 追加根类名 |

## 样式契约

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-tag-radius` | `var(--mptk-radius-xs)` | 常规圆角；展示类语义变量，改档即全局跟随 |
| `--mptk-tag-px` | `var(--mptk-space-2)` | 默认档（`xs`）左右内边距 |
| `--mptk-tag-font` | `var(--mptk-font-xs)` | 默认档（`xs`）字号 |

高度不再有专属变量：直接引用 `--mptk-control-h-xxs / -xs / -sm / -md`。原先的 `--mptk-tag-py` / `--mptk-tag-line` 已删除——它们只用来「凑高度」，正是要根除的写法。

颜色不新增变量：默认灰底取 `--mptk-gray-3`、字色 `--mptk-fg`；彩色取对应语义色，空心底色取 `--mptk-surface-1`。

## 与 Badge 的边界

Badge 只做数字与红点，需要文字底衬就用 Tag。演示站首页的环境 / 版本标签与尺寸页的档位 chip 都走 Tag。

## 更新日志

- 2026-11-15 14:18:54：新增 Tag 标签：展示类圆角语义变量 --mptk-tag-radius，type / plain / round 三种形态
- 2026-11-15：加 `size`（xxs / xs / sm / md，吃全库高度刻度，默认 xs）与 `shape`（square / round / mark）；高度改由 `min-height` 定，删除 `--mptk-tag-py` / `--mptk-tag-line`；`round` 布尔保留为 `shape="round"` 的等价写法
