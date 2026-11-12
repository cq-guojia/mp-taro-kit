# Segmented 分段选择

## 接口 / 导出

`mp-taro-kit/ui/form/segmented`：`Segmented`、`SegmentedProps`、`SegmentedItem`、`SegmentedSize`、`SegmentedIndicator`、`ControlColor`、`BuiltinControlColor`
`mp-taro-kit/ui/form/segmented/style`：组件级样式出口，宿主显式引一次

从 N 个候选里选 1 个：`value` 是宿主给的真值，组件完全受控；点第 k 段选第 k 段，点已选中段不重复触发。段数不固定为 2，与二元翻转的 [Switch 开关](switch.md) 是两个不同组件。

### 参数 / 输入

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `items` | `readonly SegmentedItem<T>[]` | 是 | `value` 唯一 | 段清单；空数组时只渲染空容器 |
| `value` | `T extends string` | 是 | 应命中某个 `item.value` | 宿主真值；等待期间的临时显示值不会写回它 |
| `onChange` | `(next: T) => unknown` | 否 | 返回 thenable 时进入等待态 | 点某段调用，`next` 是该段的 `value` |
| `onFailed` | `() => void` | 否 | 无 | 等待失败时通知宿主回滚自己的值 |
| `size` | `'sm' \| 'md' \| 'lg'` | 否 | 默认 `lg` | 取 `--mptk-control-h-*`，三档为 32 / 40 / 48 |
| `indicator` | `'thumb' \| 'line'` | 否 | 默认 `thumb` | 滑动块或频道切换式下划线 |
| `color` | `ControlColor` | 否 | 默认蓝 | 内置色名 `blue` / `green` / `orange` / `red`，或任意 CSS 色值 |
| `disabled` | boolean | 否 | 默认 `false` | 整组禁用，所有段点击短路 |
| `loading` | boolean | 否 | 默认 `false` | 外部驱动的等待态，与内部等待取或 |
| `loadingContent` | ReactNode | 否 | 无 | 自定义转圈节点；不给就用全库共用的自绘 `Spinner` |
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

选中态主色默认**蓝**（`--mptk-control-active` 指向 `--mptk-control-blue`），与宿主会定制的业务色解耦。滑轨取 `--mptk-control-track`、滑动块取 `--mptk-control-active`、滑动块上的选中文字取 `--mptk-control-on`，明色下不会双双为白；下划线形态则用主色画线与文字。`color` 传内置色名时由组件加类名切换变量，传任意 CSS 色值时由组件把色值显式写到滑动块、下划线、选中文字与转圈上，不依赖 WXML 行内自定义属性。

### 返回 / 输出

| 字段 | 类型 | 说明 |
|---|---|---|
| 渲染结果 | `JSX.Element` | 根 `View` 的类名含 `mptk-seg--<size>`、`--<indicator>`、色板与等待状态；段等分，滑动块位置由段数与当前索引算百分比写进内联样式 |

段等分是刻意约束：滑动块按 `100 / items.length` 百分比定位，不读 DOM 尺寸，因此不依赖 `createSelectorQuery`，两端都不受测量时机影响。滑动块宽度减 6px、起点加 3px，选中首段或末段时左右各留 3px，不贴边。横向滚动未纳入本版，段数多时由宿主自行决定容器宽度。

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

### 错误 / 抛出

| 情形 | 行为 |
|---|---|
| `onChange` 返回 rejected Promise | 界面回弹到宿主 `value`，控制台输出错误，调用 `onFailed`，不向页面抛出 |
| `onChange` resolve 显式 `false` | 按失败回弹、调用 `onFailed`，不记控制台错误 |
| 等待成功 | 停圈并保持已选中的位置，直到宿主把新 `value` 传回来 |
| `disabled` / 段级 `disabled` / `loading` / 等待中 | 该段点击短路，不调用 `onChange` |
| 宿主在等待期间改 `value` | 临时显示值作废，以后台值为准，转圈继续到等待结束 |

失败回弹要求宿主配合：若在 `onChange` 里提前改了 `value`，必须在 `onFailed` 里回滚。异步状态机、转圈绘制、色板与错误口径与 [Switch 开关](switch.md) 完全共用：两处等待态都渲染同一个自绘 `Spinner`，不依赖图标字体包；引其中一个组件不会把另一个打进产物。

### 相关

- [Switch 开关](switch.md)：二元翻转，与本篇共用同一套异步切换状态机与色板
- [对外契约](exports.md)：子路径形态、样式基线与 peer 版本下限
- [演示站页与能力域映射](../architecture/demo-mapping.md)：展示页与菜单分组

### 验证状态

已在主库自检与演示站编译产物里核实：三档高度、组件级出口与样式齐全、两组件互不引用、异步状态机四条转移、默认蓝与四份主题产物色板齐全、明色滑轨非白、两端留 3px、内置四色与自定义色值均有断言；自绘转圈的双色几何与明暗两套取值也在主题产物里核对过。段等分定位、滑块过渡、下划线与转圈动画在 Skyline / WebView 双端实机**未验证**。

## 更新日志

- 2026-11-12 14:53:57：新建：items 契约、两种指示器与异步回弹
- 2026-11-12 15:43:18：补默认蓝与四色色板、自定义色值、两端留边及滑轨对比
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
