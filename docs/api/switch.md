# Switch 开关

## 接口 / 导出

`mp-taro-kit/ui/form/switch`：`Switch`、`SwitchProps`、`SwitchSize`、`SwitchShape`、`ControlColor`、`BuiltinControlColor`
`mp-taro-kit/ui/form/switch/style`：组件级样式出口，宿主显式引一次

二元开关：`checked` 是宿主给的真值，组件完全受控；点整个控件翻转，两侧文字或图标只是开 / 关的画法，不是两个可点的候选项。需要「从 N 项里选一个」用 [Segmented 分段选择](segmented.md)。

### 参数 / 输入

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `checked` | boolean | 是 | 无 | 宿主真值；组件从不自己改它，等待期间位置也不动 |
| `onChange` | `(next: boolean) => unknown` | 否 | 返回 thenable 时进入等待态 | 点一下调用，`next` 是想变成的值 |
| `onFailed` | `() => void` | 否 | 无 | 等待失败时通知宿主；组件不做回弹，位置从未变过 |
| `size` | `'sm' \| 'md' \| 'lg'` | 否 | 默认 `lg` | 取 `--mptk-control-h-*`，三档为 32 / 40 / 48 |
| `shape` | `'round' \| 'block'` | 否 | 默认 `round` | 圆形滑块或圆角方形滑块 |
| `color` | `ControlColor` | 否 | 默认绿 | 内置色名 `blue` / `green` / `orange` / `red`，或任意 CSS 色值 |
| `offContent` | ReactNode | 否 | 仅 `shape="block"` | 关侧文字或图标，由宿主注入 |
| `onContent` | ReactNode | 否 | 仅 `shape="block"` | 开侧文字或图标，由宿主注入 |
| `disabled` | boolean | 否 | 默认 `false` | 整控件禁用，点击短路 |
| `loading` | boolean | 否 | 默认 `false` | 外部驱动的等待态，与内部等待取或 |
| `loadingContent` | ReactNode | 否 | 无 | 自定义转圈节点；不给就用全库共用的自绘 `Spinner` |
| `className` | string | 否 | 无 | 挂到根 `View` |

尺寸三档与默认值取自 WeUI 的按钮高度变量 `--weui-BTN-HEIGHT-SMALL` / `MEDIUM` / `HEIGHT`（32 / 40 / 48，默认 48），真源在本库 `src/design/_tokens.scss` 的 `base` mixin。根 `View` 固定高度等于该档，轨道比行高小并垂直居中，因此与同档控件并排时热区等高、基线一致；要改大小覆盖 `--mptk-control-h-*`，不要给组件传任意高度。轨道与滑块左右各留 3px，拨到两端都不贴边。

轨道宽高比照微信原生开关的 52:32（`lg` 档即 52×32），三档按比例缩放为 33×20 / 42×26 / 52×32；滑块直径等于轨道高减 4，带 `0 2px 4px rgba(0,0,0,.2)` 投影 —— 明色关态的白滑块靠这层投影才有边界，否则看着是空的。

选中态主色默认**绿**（`--mptk-control-active` 指向 `--mptk-control-green`，即微信原生开关的绿），与宿主会定制的业务色解耦：改业务色不会把开关染色。`color` 传内置色名时由组件加类名切换变量；传任意 CSS 色值（如 `#8b5cf6`、`rgb(...)`）时由组件把色值显式写到打开态轨道与转圈上，不依赖 WXML 行内自定义属性。滑轨取 `--mptk-control-track`、滑块取 `--mptk-control-thumb`、选中文字取 `--mptk-control-on`，明暗两档分别写在同一真源里，明色下不会双双为白。

### 返回 / 输出

| 字段 | 类型 | 说明 |
|---|---|---|
| 渲染结果 | `JSX.Element` | 根 `View` 的类名含 `mptk-switch--<size>`、形态、开关、色板与等待状态 |

### 示例

`saveNotice` 是宿主自己的后台调用，成功后再把新值传回组件：

```tsx
import { useState } from 'react'
import { Switch } from 'mp-taro-kit/ui/form/switch'
import 'mp-taro-kit/ui/form/switch/style'

function NoticeSwitch() {
  const [on, setOn] = useState(false)
  return (
    <Switch
      checked={on}
      shape="block"
      offContent="关"
      onContent="开"
      color="green"
      onChange={(next) => saveNotice(next).then(() => setOn(next))}
    />
  )
}
```

换自定义色值只改一个 prop：`<Switch checked={on} color="#8b5cf6" onChange={setOn} />`。同步回调（如演示站切主题）不产生临时值，点完立刻由宿主给回来的 `checked` 决定显示。

### 错误 / 抛出

| 情形 | 行为 |
|---|---|
| 点击后 `onChange` 返回 thenable | 立刻锁点击并转圈，开关位置**不动**，等 Promise 结束 |
| 等待成功 | 停圈；由宿主把新 `checked` 传回来，这时才翻过去 |
| `onChange` 返回 rejected Promise | 停圈、控制台输出错误、调用 `onFailed`；位置没动过，不需要回滚 |
| `onChange` resolve 显式 `false` | 同上，只是不记控制台错误 |
| `disabled` / `loading` / 等待中 | 点击短路，不调用 `onChange` |

异步口径跟 Ant Design Mobile 一致：**点了先转圈、成功再翻**，不做乐观更新，所以不存在「先拨过去再弹回来」。`onChange` 里不要在 Promise 结束前改 `checked`，把 `setOn(next)` 放进 `.then()`；失败时位置本来就还在原处，只调 `onFailed` 通知宿主即可。等待态的转圈由全库共用的自绘 `Spinner`（`ui/feedback/spinner`）绘制，默认 `circular` 圆环，颜色跟随开关主色，不依赖图标字体包。

### 相关

- [Segmented 分段选择](segmented.md)：多项单选，与本篇共用同一套异步切换状态机与色板
- [对外契约](exports.md)：子路径形态、样式基线与 peer 版本下限
- [演示站页与能力域映射](../architecture/demo-mapping.md)：展示页与菜单分组

### 验证状态

已在主库自检与演示站编译产物里核实：三档根高在小程序产物中为 64 / 80 / 96 rpx（对应 32 / 40 / 48 px @375）、轨道三档为 66×40 / 84×52 / 104×64 rpx（即 33×20 / 42×26 / 52×32 px）、默认绿与四份主题产物色板齐全、明色滑轨非白、滑块投影与两端留边在样式里、组件级出口与样式齐全；异步改成「先转圈后翻转」后有断言锁住 `useAsyncChange` 不再出现临时显示值。滑块位移、转圈动画与两种形状在 Skyline / WebView 双端实机**未验证**。

## 更新日志

- 2026-11-12 14:53:57：新建：两种形状、三档尺寸与异步回弹契约
- 2026-11-12 15:43:18：补默认蓝与四色色板、自定义色值、两端留边及主色与业务色解耦
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
- 2026-11-12 18:22:33：转圈改为自绘 8 点圆点环，绕开 Skyline 单边边框让圆角失效
- 2026-11-12 20:42:05：转圈改为 TDesign circular 圆环与 SpinKit 六点追逐两形态，默认圆环
- 2026-11-12 21:14:07：外观照微信原生开关重做（52:32 尺寸、默认绿、滑块投影），异步改为点了先转圈、成功再翻转
