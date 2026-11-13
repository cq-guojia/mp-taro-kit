# Cell 单元格

## 接口 / 导出

`mp-taro-kit/ui/display/cell`（`Cell` / `CellGroup`）与 `mp-taro-kit/ui/display/cell/style`。

组件级细路径是本库的推荐引用单元；`mp-taro-kit/ui/display` 只做兼容转发。props 类型以 `dist/ui/display/cell/index.d.ts` 为真源，本篇只写类型表达不了的运行时行为。本库不 import 路由，跳转由宿主经 `onClick` 注入。

## 参数 / 输入

### CellGroup

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| title | ReactNode | 否 | — | 分组标题 |
| inset | boolean | 否 | 默认 `false` | `true` 为圆角内收卡片；`false` 为左右通到底的通栏 |
| border | boolean | 否 | 默认 `true` | 通栏形态是否画上下外框；卡片形态不画 |
| dividerTone | `'soft' \| 'match'` | 否 | 默认 `'soft'` | 组内分隔线颜色档位：`soft` 比外框浅一档，`match` 与外框同色 |
| dividerInset | boolean | 否 | 默认 `false` | `true` 让组内分隔线左右各留出内容区边距，不再通到底 |
| frame | boolean | 否 | 默认 `true` | 卡片形态四边描边开关；`false` 得到无边框卡片。通栏上下外框仍由 `border` 控制 |
| children | ReactNode | 否 | 直接子节点为 `Cell` | 组内单元格 |
| className | string | 否 | — | 追加根类名 |

### Cell

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| title | ReactNode | 否 | — | 左侧标题 |
| label | ReactNode | 否 | — | 标题下方的描述信息 |
| value | ReactNode | 否 | — | 右侧内容；给了就优先于 `children` |
| icon | ReactNode | 否 | — | 标题左侧图标位 |
| rightIcon | ReactNode | 否 | — | 右侧图标位；给了就不再渲染 `isLink` 箭头 |
| extra | ReactNode | 否 | — | 值右侧的额外内容位 |
| children | ReactNode | 否 | `value` 为空时生效 | 自定义右侧内容 |
| center | boolean | 否 | 默认 `false` | 左右内容整体垂直居中 |
| border | boolean | 否 | 默认 `true` | 是否画下分隔线；组内最后一格由 `CellGroup` 自动关掉 |
| size | `'normal' \| 'large'` | 否 | 默认 `'normal'` | 单元格大小 |
| isLink | boolean | 否 | 默认 `false` | 纯视觉：只渲染右侧箭头，不派生点击态 |
| arrowDirection | `'right' \| 'left' \| 'up' \| 'down'` | 否 | 默认 `'right'` | 箭头方向 |
| disabled | boolean | 否 | 默认 `false` | 短路 `onClick` 与按压反馈，并置灰 |
| onClick | `() => void` | 否 | — | 点击回调；给了它才有点击态 |
| className | string | 否 | — | 追加根类名 |

## 返回 / 输出

组件渲染 `View`；无返回值、不抛错。可被宿主样式定制的类名：

| 类名 | 说明 |
|---|---|
| `mptk-cell` | 单元格根；修饰类 `--center` / `--large` / `--disabled` / `--divider` |
| `mptk-cell__icon` / `__main` / `__title` / `__label` / `__value` / `__extra` / `__right-icon` / `__arrow` / `__divider` | 单元格内部结构 |
| `mptk-cell-group` | 分组根；修饰类 `--inset` / `--flush`，以及三个设置派生的 `--divider-match` / `--divider-inset` / `--frameless` |
| `mptk-cell-group__title` / `__body` / `__border` | 分组标题、内容区与上下外框 |

行为约定：

- 组内最后一格的 `border` 由 `CellGroup` 按位置注入为 `false`，不依赖结构伪类；独立使用的 `Cell` 由自身 `border` 决定。
- 点击态由 `onClick` 派生，按压反馈走 `hoverClass`，不暴露 `clickable` prop。
- 分隔线与上下外框都是独立 1px 元素；卡片形态由内容区的圆角与 `overflow: hidden` 裁切。外框（卡片四边与通栏形态的上下外框）取 `--mptk-border`；组内分隔线默认取 `--mptk-cell-divider`，比外框浅一档（明色 `rgba(0,0,0,.06)`、暗色 `rgba(255,255,255,.06)`），两者宽度同为 1px。默认值真源在 `src/design/_tokens.scss` 的 `light` / `dark`。
- 三个控件级设置都走 `CellGroup` 的 props，由 `state.ts` 派生修饰类，使用者不写样式：`dividerTone="match"` 把内线切到 `--mptk-border`（与外框同色）；`dividerInset` 让内线左右各留 `var(--mptk-space-4)`，不再通到底；`frame={false}` 去掉卡片四边描边。默认值分别是 `soft` / `false` / `true`，即浅线、贯穿、有边框。
- `frame` 只管卡片四边描边，通栏形态的上下外框仍由 `border` 管；两者互不影响。`dividerInset` 只管线的左右缩进，与卡片风格 `inset` 无关。
- `--mptk-cell-divider` 仍是设计层语义变量，宿主可在业务级主题定制时覆盖同名变量；控件级日常切换用上面的 props，不要求宿主写 CSS。
- 样式必须显式引入 `mp-taro-kit/ui/display/cell/style`，颜色与尺寸只取 `var(--mptk-*)`；`--mptk-*` 的默认值来自 `mp-taro-kit/styles/theme-*`（编译期三选一，或运行时热切换出口）。

## 示例

```tsx
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { iconClass } from 'mp-taro-kit/ui/icon'
import 'mp-taro-kit/ui/display/cell/style'

// 基础用法：通栏，组内最后一格自动不画分隔线
export const Basic = () => (
  <CellGroup>
    <Cell title="单元格" value="内容" />
    <Cell title="单元格" value="内容" label="描述信息" />
  </CellGroup>
)

// 卡片风格：圆角内收
export const Inset = () => (
  <CellGroup inset>
    <Cell title="单元格" value="内容" />
    <Cell title="单元格" value="内容" label="描述信息" />
  </CellGroup>
)

// 单元格大小
export const Large = () => <Cell title="单元格" value="内容" size="large" label="描述信息" />

// 展示图标
export const WithIcon = () => (
  <Cell title="单元格" icon={<Text className={iconClass('home')} />} isLink />
)

// 展示箭头与方向
export const ArrowDown = () => <Cell title="单元格" value="内容" isLink arrowDirection="down" />

// 点击跳转：路由由宿主注入，组件不接 url / link-type
export const Navigate = () => (
  <Cell
    title="单元格"
    isLink
    onClick={() => void Taro.navigateTo({ url: '/pages/detail/index' })}
  />
)

// 分组标题
export const GroupTitle = () => (
  <View>
    <CellGroup title="分组 1">
      <Cell title="单元格" value="内容" />
    </CellGroup>
    <CellGroup title="分组 2">
      <Cell title="单元格" value="内容" />
    </CellGroup>
  </View>
)

// 使用插槽：title / icon / rightIcon / extra / children 都是 ReactNode
export const Slots = () => (
  <Cell
    value="内容"
    isLink
    icon={<Text className={iconClass('home')} />}
    title={<View><Text>单元格</Text></View>}
    rightIcon={<Text className={iconClass('xiugai')} />}
    extra={<Text>extra</Text>}
  />
)

// 垂直居中
export const Center = () => (
  <Cell center title="单元格" value="内容" label="描述信息" />
)

// 点击态与禁用：disabled 短路回调，不触发按压反馈
export const State = () => (
  <CellGroup>
    <Cell title="可点击" isLink onClick={() => {}} />
    <Cell title="禁用" value="内容" disabled isLink onClick={() => {}} />
  </CellGroup>
)
```

## 错误 / 抛出

不抛错。`disabled` 时 `onClick` 不执行；其余情况按宿主回调原样调用。

## 相关

- [exports](exports.md)：组件级细路径的出口形态与样式引用约定
- [演示站映射](../architecture/demo-mapping.md)：演示站只演示形态，不展示代码

## 更新日志

- 2026-11-11 22:31:00：新建：Cell / CellGroup 的 props、组内行为与九种用法代码
- 2026-11-12 11:39:42：默认值来源改为含运行时热切换的主题出口
- 2026-11-13 13:40:27：卡片外框与组内分隔线同色同宽写入行为约定
- 2026-11-13 14:02:01：组内分隔线改默认浅一档（--mptk-cell-divider），并给出变量覆盖回同色的设置入口
- 2026-11-13 14:20:55：三个控件级设置收口到 CellGroup props：dividerTone 枚举、dividerInset、frame；宿主覆盖类删除
