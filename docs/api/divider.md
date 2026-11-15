# Divider 分隔线

## 接口 / 导出

`mp-taro-kit/ui/display`：`Divider`、`DividerProps`、`DividerContentPosition`
`mp-taro-kit/ui/display/style`：组件级样式出口，宿主显式引一次

纯展示分隔线。不传 `children` 时是一条细线；传了就把文字嵌到线中间，文字位置由 `contentPosition` 决定。

## 设计依据

对照 Vant Divider（公开文档 `packages/vant/src/divider/README.zh-CN.md`）：

| Vant | 本库取舍 |
|---|---|
| `content-position`（left / center / right） | 取，React 侧命名 `contentPosition`，默认 `center` |
| 默认插槽放文字 | 取，React 侧用 `children` |
| `dashed` 虚线 | 不取：当前没有虚线场景 |
| `vertical` 竖线 | 不取：需要时再加 |
| `hairline` 0.5px | 不取：统一走 `--mptk-c-border-w` |

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `children` | ReactNode | 否 | — | 分割线中间的文字；不传就是纯线 |
| `contentPosition` | `DividerContentPosition` | 否 | `'center'` | `'left'` / `'center'` / `'right'` |
| `className` | string | 否 | — | 追加根类名 |

## 样式契约

| 变量 | 默认 | 作用 |
|---|---|---|
| `--mptk-divider-content-gap` | `var(--mptk-space-3)` | 文字左右间距 |
| `--mptk-s-divider-stub` | `10%` | `left` / `right` 时靠边一侧的短线长度 |

线色取 `--mptk-border`，文字取 `--mptk-fg-3`，字号与行高取 `--mptk-font-xs` / `--mptk-line-xs`。

## 用途

演示站用带文字形态承担跨块分组标题；原先 `.demo-section__title`、`.demo-icon-group__title`、`.demo-spec__title` 三处手写标题已删除。

## 更新日志

- 2026-11-15 14:51:30：Divider 补带文字形态：children + contentPosition，演示站三处分组标题改用
