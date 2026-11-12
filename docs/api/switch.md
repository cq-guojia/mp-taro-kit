# Switch 开关

## 接口 / 导出

`mp-taro-kit/ui/form/switch`：`Switch`、`SwitchProps`、`SwitchSize`、`SwitchShape`、`ControlColor`、`BuiltinControlColor`
`mp-taro-kit/ui/form/switch/style`：组件级样式出口，宿主显式引一次

二元开关：`checked` 是宿主给的真值，组件完全受控；点整个控件翻转，两侧文字或图标只是开 / 关的画法，不是两个可点的候选项。需要「从 N 项里选一个」用 [Segmented 分段选择](segmented.md)。

### 参数 / 输入

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `checked` | boolean | 是 | 无 | 宿主真值；等待期间的临时显示值不会写回它 |
| `onChange` | `(next: boolean) => unknown` | 否 | 返回 thenable 时进入等待态 | 点一下调用，`next` 是想变成的值 |
| `onFailed` | `() => void` | 否 | 无 | 等待失败时通知宿主回滚自己的值 |
| `size` | `'sm' \| 'md' \| 'lg'` | 否 | 默认 `lg` | 取 `--mptk-control-h-*`，三档为 32 / 40 / 48 |
| `shape` | `'round' \| 'block'` | 否 | 默认 `round` | 圆形滑块或圆角方形滑块 |
| `color` | `ControlColor` | 否 | 默认蓝 | 内置色名 `blue` / `green` / `orange` / `red`，或任意 CSS 色值 |
| `offContent` | ReactNode | 否 | 仅 `shape="block"` | 关侧文字或图标，由宿主注入 |
| `onContent` | ReactNode | 否 | 仅 `shape="block"` | 开侧文字或图标，由宿主注入 |
| `disabled` | boolean | 否 | 默认 `false` | 整控件禁用，点击短路 |
| `loading` | boolean | 否 | 默认 `false` | 外部驱动的等待态，与内部等待取或 |
| `loadingContent` | ReactNode | 否 | 无 | 自定义转圈节点；不给就用组件自带的纯 CSS 转圈 |
| `className` | string | 否 | 无 | 挂到根 `View` |

尺寸三档与默认值取自 WeUI 的按钮高度变量 `--weui-BTN-HEIGHT-SMALL` / `MEDIUM` / `HEIGHT`（32 / 40 / 48，默认 48），真源在本库 `src/design/_tokens.scss` 的 `base` mixin。根 `View` 固定高度等于该档，轨道比行高小并垂直居中，因此与同档控件并排时热区等高、基线一致；要改大小覆盖 `--mptk-control-h-*`，不要给组件传任意高度。轨道与滑块左右各留 3px，拨到两端都不贴边。

选中态主色默认**蓝**（`--mptk-control-active` 指向 `--mptk-control-blue`），与宿主会定制的业务色解耦：改业务色不会把开关染色。`color` 传内置色名时由组件加类名切换变量；传任意 CSS 色值（如 `#8b5cf6`、`rgb(...)`）时由组件把色值显式写到打开态轨道与转圈上，不依赖 WXML 行内自定义属性。滑轨取 `--mptk-control-track`、滑块取 `--mptk-control-thumb`、选中文字取 `--mptk-control-on`，明暗两档分别写在同一真源里，明色下不会双双为白。

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
      onFailed={() => setOn(false)}
    />
  )
}
```

换自定义色值只改一个 prop：`<Switch checked={on} color="#8b5cf6" onChange={setOn} />`。同步回调（如演示站切主题）不产生临时值，点完立刻由宿主给回来的 `checked` 决定显示。

### 错误 / 抛出

| 情形 | 行为 |
|---|---|
| `onChange` 返回 rejected Promise | 界面回弹到宿主 `checked`，控制台输出错误，调用 `onFailed`，不向页面抛出 |
| `onChange` resolve 显式 `false` | 按失败回弹、调用 `onFailed`，不记控制台错误 |
| 等待成功 | 停圈并保持已拨过去的位置，直到宿主把新 `checked` 传回来 |
| `disabled` / `loading` / 等待中 | 点击短路，不调用 `onChange` |
| 宿主在等待期间改 `checked` | 临时显示值作废，以后台值为准，转圈继续到等待结束 |

失败回弹要求宿主配合：若在 `onChange` 里提前改了 `checked`，必须在 `onFailed` 里回滚，否则真值已是新值、组件没有旧值可回。等待态的转圈由组件自带 CSS 绘制，不 import `ui/feedback/Loader`，只引开关不会把图标字体包打进产物。

### 相关

- [Segmented 分段选择](segmented.md)：多项单选，与本篇共用同一套异步切换状态机与色板
- [对外契约](exports.md)：子路径形态、样式基线与 peer 版本下限
- [演示站页与能力域映射](../architecture/demo-mapping.md)：展示页与菜单分组

### 验证状态

已在主库自检与演示站编译产物里核实：三档高度在小程序产物中为 64 / 80 / 96 rpx（对应 32 / 40 / 48 px @375）、组件级出口与样式齐全、异步状态机四条转移、默认蓝与四份主题产物的色板齐全、明色滑轨非白、两端留 3px、内置四色与自定义色值均有断言。滑块位移、转圈动画与两种形状在 Skyline / WebView 双端实机**未验证**。

## 更新日志

- 2026-11-12 14:53:57：新建：两种形状、三档尺寸与异步回弹契约
- 2026-11-12 15:43:18：补默认蓝与四色色板、自定义色值、两端留边及主色与业务色解耦
