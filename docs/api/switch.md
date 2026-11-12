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
| `offContent` | ReactNode | 否 | 无 | 关态内容：`block` 放在轨道左侧，`round` 放在滑块里 |
| `onContent` | ReactNode | 否 | 无 | 开态内容：`block` 放在轨道右侧，`round` 放在滑块里 |
| `disabled` | boolean | 否 | 默认 `false` | 整控件禁用，点击短路 |
| `loading` | boolean | 否 | 默认 `false` | 外部驱动的等待态，与内部等待取或 |
| `loadingContent` | ReactNode | 否 | 无 | 自定义转圈节点；不给就用全库共用的自绘 `Spinner` |
| `keepColor` | boolean | 否 | 默认 `false` | 不变色：底色恒为 `color` 的主色、内衬不收缩，只有滑块位置表示状态 |
| `className` | string | 否 | 无 | 挂到根 `View` |

尺寸三档与默认值取自 WeUI 的按钮高度变量 `--weui-BTN-HEIGHT-SMALL` / `MEDIUM` / `HEIGHT`（32 / 40 / 48，默认 48），真源在本库 `src/design/_tokens.scss` 的 `base` mixin。根 `View` 固定高度等于该档，轨道比行高小并垂直居中，因此与同档控件并排时热区等高、基线一致；要改大小覆盖 `--mptk-control-h-*`，不要给组件传任意高度。轨道与滑块左右各留 3px，拨到两端都不贴边：方形滑块宽 `calc(50% - 6px)`、位移 `calc(100% + 6px)`，两半区里的间隙都是 3px。按 `calc(50% - 4px)` / `calc(100% + 2px)` 写会一边 3px、一边 1px，压在滑块上的文字看着偏 2px（踩过）。

圆形形态的轨道宽高比照微信原生开关的 52:32（`lg` 档即 52×32），三档按比例缩放为 33×20 / 42×26 / 52×32；滑块直径等于轨道高减 4，带 `0 2px 4px rgba(0,0,0,.2)` 投影 —— 明色关态的白滑块靠这层投影才有边界，否则看着是空的。

方形形态**不吃**圆形开关的 52:32 比例：那是个与内容无关的定高比例，方形格子照抄它，高度里就没有与左右内边距对应的余量 —— 单图标会变成「宽 28 × 高 20」的横条（踩过）。方形格子改按「内容 + 四边同值内边距」推导，边长记为 `--mptk-switch-cell`：

| 档位 | 内容盒 | 字符字号 | 内边距 | 格子边长 | 档位根高 |
|---|---|---|---|---|---|
| `sm` | `--mptk-font-xs`（12） | 10（盒 − 2） | `--mptk-space-1`（4） | 20 | 32 |
| `md` | `--mptk-font-sm`（14） | 14（同盒） | `--mptk-space-2`（8） | 30 | 40 |
| `lg` | `--mptk-font-md`（15） | 15（同盒） | `--mptk-space-3`（12） | 39 | 48 |

三个量各管一件事，互不牵连：`--mptk-switch-cell-box` 是内容盒边长（格子 = 它 + 2 × 内边距，`--mptk-switch-cell`）、`--mptk-switch-cell-content` 是字符 / 图标自己的字号（默认等于内容盒）、`--mptk-switch-cell-inset` 是滑块留边。轨道的 `min-height` 与每侧的 `min-width` 都取格子边长，高度不写死、内容变大也不会被裁；内容靠 `line-height: 1` 压成正好一个字符字号，**一个图标 / 一个字就是正方形**；`min-width` 再兜住数字、半角符号这类偏窄的内容；两个字及以上按内容横向撑宽、高度不变。最小号把字符字号比内容盒降一号（`calc(内容盒 - 2px)`，写成差值不写绝对值，宿主改字号 token 时跟着走）：`sm` 的内边距只有 4px，12px 图标会把 12px 的滑块整块盖住，缩到 10px 才留得出白；因为格子由内容盒而不是字符字号推导，缩号只缩图标、格子仍是 20×20 的正方形，四边余量同为 5px。宿主放大字号时格子跟着长（仍须小于档位根高，测试有断言）。滑块宽高都是「格子 − 2 × 留边」，四边同值，所以滑块也恒为正方形、两端间隙相等。calc 里不写乘法（小程序 WebView 内核对 `*` 的支持不一致），一律写成两次相加。方形轨道的圆角取 `--mptk-radius-xs`（4px，库内最小档），关态遮罩与滑块内角同取 `xs`：8px 在 32px 高的块上已经有药丸感，看着不够方；圆形形态的轨道与滑块仍取 `--mptk-radius-pill`。

两种形态都能放图标：`block` 的 `offContent` / `onContent` 落在轨道两侧，字号随档取 `--mptk-font-xs` / `--mptk-font-sm` / `--mptk-font-md`、颜色跟随该侧状态色；`round` 的同一对 props 落在滑块里，字号按轨道高的 `0.44` 倍缩放（三档自适应），颜色取 `--mptk-fg-2`。等待态的转圈优先于图标显示。演示站用图标包的 `qiansemoshi`（太阳）与 `shensemoshi`（月亮）做了两形态对照。

放图标或文字时通常不希望整块底色还跟着状态跳（图标本身已经把状态说清楚了）：传 `keepColor` 后轨道底色恒为 `color` 指定的主色、内衬始终收起，只剩滑块左右移动表示状态 —— 整体像一个可拨动的按钮，而不是「关灰开绿」的开关。不传则维持关态 `track` 灰、选中态主色的默认行为。

切换不是两种底色互相渐隐，是**内衬往回收**：

- 轨道底色自己随状态变：关态 `--mptk-control-track`（灰），选中态 `--mptk-control-active`（主色），不加过渡 —— 切换瞬间被内衬盖着，看不见突变。
- 内衬 `mptk-switch__veil` 比轨道内缩 2px，取 `--mptk-surface-base`（明色是页面白、暗色是页面底色）；选中时 `transform: scale(1)` → `scale(0)` 往中心收，露出轨道的主色。
- 滑块同时滑到另一端，时长 `--mptk-dur`（0.2s）、曲线 `--mptk-ease`。

与 Ant Design Mobile 的 Switch 同构：那边 `::before` 内缩 2px、底色取 `--adm-color-background`、`transition: all 200ms`。

**不要反过来做「轨道底色恒为主色、拿遮罩整块盖住」**：那样遮罩必须与轨道严丝合缝，圆角处差一像素抗锯齿就漏出彩色，深色主题下尤其明显（本库这么实现过一次，关态旁边漏绿）。内衬内缩 2px 后，误差落在轨道自己的颜色里，漏不出来。

内衬用真实节点而非伪元素，因为 Skyline 对 `::before` 的支持未经本库验证；尺寸写 `width/height` 而不写四条边定位：Taro 的 postcss 会把 `top/right/bottom/left` 合并成 `inset: 0`，Skyline 不认 `inset`，内衬会塌成 0×0，动画退化成「底色瞬间切换」。收缩动画与滑块位移同样只在产物里核对，双端实机**未验证**。

选中态主色默认**绿**（`--mptk-control-active` 指向 `--mptk-control-green`，即微信原生开关的绿），与宿主会定制的业务色解耦：改业务色不会把开关染色。`color` 传内置色名时由组件加类名切换变量；传任意 CSS 色值（如 `#8b5cf6`、`rgb(...)`）时由组件把色值显式写到打开态轨道与转圈上，不依赖 WXML 行内自定义属性。滑轨取 `--mptk-control-track`、滑块取 `--mptk-control-thumb`、关态内衬取 `--mptk-surface-base`、选中文字取 `--mptk-control-on`，明暗两档分别写在同一真源里，明色下不会双双为白。滑块明暗都取白（`#fff`）：暗色下若跟着轨道一起走深灰，滑块与轨道糊成一片，滑块上的图标 / 文字也失去对比。

颜色按「内容压在哪一层」取，不统一跟随页面前景色：压在白滑块上的内容（方形两侧里位于滑块上的那一侧、圆形滑块里的图标）一律取 `--mptk-control-thumb-fg`（`#1f2328`，明暗同值）；在轨道上的那一侧按轨道底色取——`track` 灰上用 `--mptk-fg`，主色上用 `--mptk-control-on`。若统一用 `--mptk-fg`，暗色下它是浅色，落在白滑块上就看不见了；`keepColor` 关态的轨道也是主色，未选中那侧同样要反白。

状态覆盖靠选择器层级而不是声明顺序：开态规则写成 `.mptk-switch.mptk-switch--on .mptk-switch__side--*`（3 类），稳压 `keepColor` 的 2 类规则。两者若都用 2 类，谁写在文件后面谁赢——`keepColor` 开态的右侧会被刷成反白，白滑块上的图标直接看不见（踩过）。`tests/controls.test.mjs` 断言开态必须带根节点两个类。自定义色值只在选中态内联到轨道上——轨道底色是状态色本身的真源，关态必须留给 `track` 灰，否则内衬一露边就露出自定义色。

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

异步口径跟 Ant Design Mobile 一致：**点了先转圈、成功再翻**，不做乐观更新，所以不存在「先拨过去再弹回来」。`onChange` 里不要在 Promise 结束前改 `checked`，把 `setOn(next)` 放进 `.then()`；失败时位置本来就还在原处，只调 `onFailed` 通知宿主即可。这一条容易写反：演示站两个页面的失败示例曾写成「先在 `onChange` 里 `setState`，再 `return` 一个 rejected Promise」，观感就是「先拨过去、转圈、再弹回来」；现在 `tests/controls.test.mjs` 断言页面里不许出现 `return wait(`，必须写成 `wait(false).then(() => setState(next))`。等待态的转圈由全库共用的自绘 `Spinner`（`ui/feedback/spinner`）绘制，默认 `circular` 圆环，颜色跟随开关主色，不依赖图标字体包。

### 相关

- [Segmented 分段选择](segmented.md)：多项单选，与本篇共用同一套异步切换状态机与色板
- [对外契约](exports.md)：子路径形态、样式基线与 peer 版本下限
- [演示站页与能力域映射](../architecture/demo-mapping.md)：展示页与菜单分组

### 验证状态

已在主库自检与演示站编译产物里核实：三档根高在小程序产物中为 64 / 80 / 96 rpx（对应 32 / 40 / 48 px @375）、圆形轨道三档为 66×40 / 84×52 / 104×64 rpx（即 33×20 / 42×26 / 52×32 px）、默认绿与四份主题产物色板齐全、明色滑轨非白、滑块投影在样式里；方形格子边长按「内容盒 + 2 × 内边距」推导（三档 20 / 30 / 39）、四边同一个内边距、字符字号独立于格子且 sm 档比内容盒小一号（差值写法，md / lg 不许单独缩）、内容 `line-height: 1`、轨道只写 `min-height` 不吃圆形定高、三档只换内容盒与内边距两个 token、格子随档递增且不超档位根高、滑块四边同一个留边且宽高都减两个留边、calc 不许出现乘法、方形轨道 / 遮罩 / 滑块三处圆角统一 `xs`、圆形形态的滑块内图标容器与按轨道高缩放的图标字号、组件级出口与样式齐全；异步改成「先转圈后翻转」后有断言锁住 `useAsyncChange` 不再出现临时显示值；切换动效有断言锁住「关态轨道是 `track` 灰、选中态才是主色、内衬内缩 2px 且 `scale(1)` → `scale(0)`」，禁止退回「底色恒为主色靠遮罩盖」或两层底色渐变；滑块白、`keepColor` 的底色与内衬规则顺序、以及「压在白滑块上的内容恒取 `--mptk-control-thumb-fg`」「开态规则必须是带根节点两个类的 3 类选择器」也各有断言。滑块位移、遮罩收缩、转圈动画与两种形状在 Skyline / WebView 双端实机**未验证**（方形格子按内容自适应的实际观感，尤其单图标正方形，需要真机过一眼）。

## 更新日志

- 2026-11-12 14:53:57：新建：两种形状、三档尺寸与异步回弹契约
- 2026-11-12 15:43:18：补默认蓝与四色色板、自定义色值、两端留边及主色与业务色解耦
- 2026-11-12 17:24:24：转圈改为自绘双色缺角环，去掉图标字体依赖
- 2026-11-12 18:22:33：转圈改为自绘 8 点圆点环，绕开 Skyline 单边边框让圆角失效
- 2026-11-12 20:42:05：转圈改为 TDesign circular 圆环与 SpinKit 六点追逐两形态，默认圆环
- 2026-11-12 21:14:07：外观照微信原生开关重做（52:32 尺寸、默认绿、滑块投影），异步改为点了先转圈、成功再翻转
- 2026-11-12 21:21:49：方形开关每侧最小宽改为跟随轨道高，不再写死 48px
- 2026-11-12 21:40:06：方形开关每侧内边距改为 space-2（两个字不再挤在一起）、轨道圆角降一号到 sm、滑块内角 xs
- 2026-11-12 21:48:05：切换改为关态遮罩向中心收缩（scale 1→0）露出底色，不再是两层底色渐变
- 2026-11-12 21:54:02：`offContent` / `onContent` 在圆形态落进滑块（图标示例用太阳 / 月亮）；方形轨道、遮罩与滑块圆角统一降到最小档 xs；补断言锁住异步示例不许先改值
- 2026-11-12 22:11:25：修遮罩尺寸被 postcss 合并成 `inset:0` 导致 Skyline 下遮罩塌成 0×0、收缩动画失效（表现是底色瞬间切换）；transition 拆成长写
- 2026-11-12 22:19:22：切换重做为「轨道底色随状态变 + 内衬内缩 2px 收缩」，去掉「底色恒为主色、靠遮罩整块盖住」（深色下圆角处漏绿）
- 2026-11-12 22:29:57：新增 `keepColor`（底色不随状态变，只有滑块移动）；暗色滑块由 gray-5 改为白，滑块上的图标 / 文字才有对比
- 2026-11-12 22:37:30：方形滑块宽改 `50% - 6px`、位移改 `100% + 6px`，两端间隙都回到 3px（原来一边 3px 一边 1px，文字看着偏 2px）；白滑块上的内容改用 `--mptk-control-thumb-fg` 恒深，`keepColor` 关态未选中侧改反白
- 2026-11-12 22:42:45：颜色规则改按选择器层级覆盖（开态带根节点两个类），修 `keepColor` 开态右侧图标被反白刷成白色、白滑块上看不见的问题
- 2026-11-12 23:00:44：方形格子改为「1em 内容 + 四边同值内边距」推导（不再吃圆形 52:32 定高）：单图标 / 单字恢复正方形，三档字号与内边距各取 token（格子 20 / 30 / 39），滑块留边收成 `--mptk-switch-cell-inset` 四边同值
- 2026-11-12 23:09:09：方形拆出「内容盒 / 字符字号 / 滑块留边」三个量，最小号字符字号降一号（12 → 10）：12px 图标不再把 12px 滑块盖满，格子仍按内容盒推导保持 20×20 正方形
