# Tag 标签

## 接口 / 导出

`mp-taro-kit/ui/display`：`Tag`、`TagProps`、`TagType`
`mp-taro-kit/ui/display/style`：组件级样式出口，宿主显式引一次

标签：关键词与短文标记。只负责一块文字底衬（底色、字色、圆角、内边距），内容由 `children` 注入，不带业务语义。圆角与内边距全部走 `--mptk-tag-*`，颜色直接引既有语义色，不新增色值。

## 设计依据

对照 Vant Tag（公开文档 `packages/vant/src/tag/README.zh-CN.md`）：

| Vant | 本库取舍 |
|---|---|
| `type` 四色 | 取，映射到既有语义色 `business / success / warning / danger`，默认 `default` 灰 |
| `plain` 空心 | 取：底色回到 `surface-1`，文字取对应语义色 |
| `round` 胶囊 | 取：圆角翻到 `pill` 档 |
| `size`（large / medium） | 不取：当前只有 12px 一档，需要再加轴 |
| `mark` 半圆角 | 不取：业务角标，不进基础库 |
| `closeable` / `show` / `close` | 不取：可删除标签的状态由宿主管理，基础库不持状态 |
| `color` / `text-color` 任意值 | 不取：颜色只在配置里换，避免绕过档位 |

本库补的一处：`--mptk-tag-radius` 语义圆角变量，与 `--mptk-control-radius`（控件）、`--mptk-card-radius`（卡片）并列，补上展示类这一层。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `type` | `TagType` | 否 | `'default'` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` |
| `plain` | boolean | 否 | `false` | 空心：底色回到 `--mptk-surface-1` |
| `round` | boolean | 否 | `false` | 胶囊：圆角取 `--mptk-radius-pill` |
| `children` | ReactNode | 否 | — | 标签文字 |
| `className` | string | 否 | — | 追加根类名 |

## 样式契约

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-tag-radius` | `var(--mptk-radius-xs)` | 常规圆角；展示类语义变量，改档即全局跟随 |
| `--mptk-tag-px` | `var(--mptk-space-2)` | 左右内边距 |
| `--mptk-tag-py` | `var(--mptk-space-1)` | 上下内边距 |
| `--mptk-tag-font` | `var(--mptk-font-xs)` | 字号 |
| `--mptk-tag-line` | `var(--mptk-line-xs)` | 行高 |

颜色不新增变量：默认灰底取 `--mptk-gray-3`、字色 `--mptk-fg`；彩色取对应语义色，空心底色取 `--mptk-surface-1`。

## 与 Badge 的边界

Badge 只做数字与红点，需要文字底衬就用 Tag。演示站首页的环境 / 版本标签与尺寸页的档位 chip 都走 Tag。

## 更新日志

- 2026-11-15 14:18:54：新增 Tag 标签：展示类圆角语义变量 --mptk-tag-radius，type / plain / round 三种形态
