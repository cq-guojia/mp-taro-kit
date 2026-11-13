# Segmented 分段选择

## 接口 / 导出

`mp-taro-kit/ui/form/segmented`：`Segmented`、`SegmentedProps`、`SegmentedItem`、`SegmentedSize`、`SegmentedWidth`、`SegmentedIndicator`、`SegmentedRadius`、`ControlColor`、`BuiltinControlColor`
`mp-taro-kit/ui/form/segmented/style`：组件级样式出口，宿主显式引一次

从 N 个候选里选 1 个：`value` 是宿主给的真值，组件完全受控；点第 k 段选第 k 段，点已选中段不重复触发。段数不固定为 2，与二元翻转的 [Switch 开关](switch.md) 是两个不同组件。

### 参数 / 输入

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `items` | `readonly SegmentedItem<T>[]` | 是 | `value` 唯一 | 段清单；空数组时只渲染空容器 |
| `value` | `T extends string` | 是 | 应命中某个 `item.value` | 宿主真值；等待期间的临时显示值不会写回它 |
| `onChange` | `(next: T) => unknown` | 否 | 返回 thenable 时进入等待态 | 点某段调用，`next` 是该段的 `value` |
| `onFailed` | `() => void` | 否 | 无 | 等待失败时通知宿主；组件不做回弹，位置从未变过 |
| `size` | `'sm' \| 'md' \| 'lg'` | 否 | 默认 `lg` | 取 `--mptk-control-h-*`，三档为 32 / 40 / 48 |
| `width` | `'fit' \| 'ratio' \| 'equal'` | 否 | 默认 `fit` | 段宽策略：按内容撑开 / 内容 + 剩余均摊 / 严格等分，见下 |
| `indicator` | `'thumb' \| 'line'` | 否 | 默认 `thumb` | 滑动块或频道切换式下划线 |
| `radius` | `'pill'` | 否 | 无 | 半圆形态：容器与滑动块一起切到 `--mptk-radius-pill` |
| `color` | `ControlColor` | 否 | 默认蓝 | 内置色名 `blue` / `green` / `orange` / `red`，或任意 CSS 色值 |
| `disabled` | boolean | 否 | 默认 `false` | 整组禁用，所有段点击短路 |
| `loading` | boolean | 否 | 默认 `false` | 外部驱动的等待态，与内部等待取或；等待时指示器底色呼吸 |
| `className` | string | 否 | 无 | 挂到根 `View` |

`SegmentedItem` 的内容位均为 `ReactNode`，由宿主注入，库内不写死业务字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `value` | `T` | 段代表的值，同时作渲染 key |
| `label` | ReactNode | 标题 |
| `icon` | ReactNode | 标题前的图标或任意节点 |
| `count` | ReactNode | 标题后的计数，如「全部 7」 |
| `description` | ReactNode | 标题下更小的副文本 |
| `disabled` | boolean | 段级禁用，只短路这一段 |

尺寸真源与 Switch 相同：根 `View` 固定高度等于 `--mptk-control-h-*` 档值（32 / 40 / 48，默认 48，取自 WeUI 的按钮高度三档），容器内不叠加上下内边距；滑动块与下划线两种指示器共用同一档高度。要改大小覆盖同名变量，不要传任意高度。

选中态主色默认**蓝**（`--mptk-control-active` 指向 `--mptk-control-blue`），与宿主会定制的业务色解耦。滑轨取 `--mptk-control-track`、滑动块取 `--mptk-control-active`、滑动块上的选中文字取 `--mptk-control-on`，明色下不会双双为白；下划线形态则用主色画线与文字。`color` 传内置色名时由组件加类名切换变量，传任意 CSS 色值时由组件把色值显式写到滑动块、下划线与选中文字上，不依赖 WXML 行内自定义属性。

### 返回 / 输出

| 字段 | 类型 | 说明 |
|---|---|---|
| 渲染结果 | `JSX.Element` | 根 `View` 的类名含 `mptk-seg--<size>`、`--<width>`、`--<indicator>`、`--radius-<radius>`、色板；滑动块与下划线的位置、宽度写在这两个指示器节点的内联样式里 |

段宽有三种策略，由 `width` 选：

| `width` | 段宽 | 定位方式 |
|---|---|---|
| `fit`（默认） | 内容 + 左右内边距，底片宽 = 各段之和 | 量真实矩形 |
| `ratio` | 撑满容器，段先按内容占宽、剩余空间均摊 | 量真实矩形 |
| `equal` | 撑满容器，严格 `100 / N` 等分 | 纯百分比，零测量 |

根 `View` 恒占满父宽（`display: flex; width: 100%`）且背景透明，可见的那条底片是内部的 track：`fit` 时 track 按内容宽、`ratio` / `equal` 时撑满 —— 段多与段少都由 track 的宽度表达，根节点只负责占位与裁剪。宽度不反过来靠内容收缩取宽，原因见 [Skyline 渲染引擎](../dependencies/skyline-rendering.md) 里「收缩取宽塌成 0」那条。

`fit` / `ratio` 的段宽由内容决定，百分比算不出位置，组件因此在挂载后的下一拍用 `Taro.createSelectorQuery()` 量一次 track 与各段的矩形，窗口尺寸变化、段数 / 档位 / 圆角 / 等待态变化时重量；量到之前不画指示器，避免先在错位置闪一下。`equal` 不测量。

超出根节点宽度时由内置 `ScrollView` 横向滚动，当前选中段靠 `scrollIntoView` 自动滚进可视区（`fit` 模式下段数多也不用宿主自己包容器）。因为根节点宽度是确定的 100%，滚动容器才有一把可算的尺子。

滑动块宽度减 6px、起点加 3px，选中首段或末段时左右各留 3px，不贴边；这两个值写在 `src/ui/form/segmented/Segmented.tsx`，样式里的 `--mptk-seg-inset` 只管滑块上下两条边，改留边时两处一起改。下划线的左右缩进取间距档 `--mptk-seg-line-inset`。

### 示例

`saveFilter` 是宿主自己的后台调用，成功后再把新值传回组件：

```tsx
import { useState } from 'react'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import 'mp-taro-kit/ui/form/segmented/style'

const items = [
  { value: 'mine', label: '我的待办', count: 3 },
  { value: 'all', label: '全部', count: 7 },
  { value: 'doing', label: '进行中', count: 2, description: '本周', disabled: true },
]

function FilterBar() {
  const [value, setValue] = useState('mine')
  return (
    <Segmented
      items={items}
      value={value}
      color="green"
      onChange={(next) => saveFilter(next).then(() => setValue(next))}
      onFailed={() => setValue('mine')}
    />
  )
}
```

频道切换只换指示器形态，其余契约不变：`<Segmented items={channels} value={channel} indicator="line" color="#8b5cf6" onChange={setChannel} />`。
段宽策略同理：`<Segmented items={channels} value={channel} width="equal" />` 严格等分、不测量；`width="ratio"` 让两字窄四字宽；不传即 `fit`，按内容撑开、超出就横滑。

### 错误 / 抛出

| 情形 | 行为 |
|---|---|
| 点击后 `onChange` 返回 thenable | 立刻锁点击、指示器底色开始呼吸，选中位置**不动**，等 Promise 结束 |
| 等待成功 | 停呼吸；由宿主把新 `value` 传回来，这时才滑过去 |
| `onChange` 返回 rejected Promise | 停呼吸、控制台输出错误、调用 `onFailed`；位置没动过，不需要回滚 |
| `onChange` resolve 显式 `false` | 同上，只是不记控制台错误 |
| `disabled` / 段级 `disabled` / `loading` / 等待中 | 该段点击短路，不调用 `onChange` |

异步口径与 [Switch 开关](switch.md) 完全共用：**点了先呼吸、成功再切换**，不做乐观更新，所以不存在「先滑过去再弹回来」。`onChange` 里不要在 Promise 结束前改 `value`，把 `setValue(next)` 放进 `.then()`；失败时只调 `onFailed` 通知宿主。

等待态**不盖转圈**：段里全是文字 / 图标，塞一个转圈要么把段挤宽、要么压住字，两个都不能接受。做法是只让选中那一块呼吸（滑块形态呼吸滑块底色，下划线形态呼吸那条线）：`1 → .2 → 1` 的 `opacity`（`@keyframes mptk-control-breathe`，周期 `--mptk-dur-breathe` 280ms），整条轨道、其它段与文字都不跟着闪，也不加节点、不改尺寸。因此本组件不再引 `Spinner`，引它也不会把 spinner 的样式打进产物。

### 相关

- [Switch 开关](switch.md)：二元翻转，与本篇共用同一套异步切换状态机与色板
- [对外契约](exports.md)：子路径形态、样式基线与 peer 版本下限
- [演示站页与能力域映射](../architecture/demo-mapping.md)：展示页与菜单分组

### 验证状态

已在主库自检与演示站编译产物里核实：三档高度、组件级出口与样式齐全、两组件互不引用、异步状态机四条转移、默认蓝与四份主题产物色板齐全、明色滑轨非白、两端留 3px、内置四色与自定义色值均有断言；等待态用底色呼吸而不是转圈（产物里不出现 spinner 几何、出现 `mptk-control-breathe`）也有断言。`equal` 的等分定位、滑块过渡、下划线与呼吸动画在 Skyline / WebView 双端实机**未验证**；`fit` / `ratio` 的 `createSelectorQuery` 测量路径双端实机也**未验证**。

## 更新日志

- 2026-11-12 14:53:57：新建：items 契约、两种指示器与异步回弹
- 2026-11-12 15:43:18：补默认蓝与四色色板、自定义色值、两端留边及滑轨对比
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
- 2026-11-12 18:22:33：转圈改为自绘 8 点圆点环，绕开 Skyline 单边边框让圆角失效
- 2026-11-12 20:42:05：转圈改为 TDesign circular 圆环与 SpinKit 六点追逐两形态，默认圆环
- 2026-11-12 21:14:07：异步改为点了先转圈、成功再切换，去掉乐观更新与回弹
- 2026-11-13 00:13:38：段宽改为 fit / ratio / equal 三档并补 radius，删掉「段等分、不测量、不做横滑」的旧结论
- 2026-11-13 09:08:44：根节点改为定宽 100%、视觉底片下移到 track，说明宽度分工
- 2026-11-13 09:37:34：等待态改为按有无内容位分流：光板控件转圈，有内容的换底色呼吸
- 2026-11-13 09:55:46：呼吸改为只作用在选中滑块：周期快 5 倍到 280ms、谷值加深到 .2，演示站等待时长翻倍
