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
| border | `boolean \| CellGroupBorder` | 否 | 跟随上下文 | 上下外边框，`'none' \| 'top' \| 'bottom' \| 'both'`，也接受 `true`（= both）/ `false`（= none）。不给时通栏画上下、装在 Card 里按上下文推导（见下文的线规则表）。显式传值优先 |
| dividerTone | `'soft' \| 'match'` | 否 | 默认 `'soft'` | 组内分隔线颜色档位：`soft` 比外框浅一档，`match` 与外框同色 |
| dividerInset | boolean | 否 | 默认 `true` | 行与行之间的分隔线左右是否留白：`true` 端点与行文字对齐，`false` 通到底（通栏到屏幕边、装在 Card 里到卡片边）。只管行间线，组级结构线始终通底 |
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
| center | boolean | 否 | 默认 `true` | 整行垂直对齐：默认居中；`false` 改为顶部对齐 |
| border | boolean | 否 | 默认 `true` | 是否画下分隔线；组内最后一格由 `CellGroup` 自动关掉 |
| size | `'normal' \| 'large'` | 否 | 默认 `'normal'` | 单元格大小 |
| valueSize | `'xs' \| 'sm'` | 否 | 默认 `'xs'` | 右侧值字号：`xs` 与 `label` 同档（12/17），`sm` 与标题同档（14/20） |
| isLink | boolean | 否 | 默认 `false` | 纯视觉：只渲染右侧箭头，不派生点击态 |
| arrowDirection | `'right' \| 'left' \| 'up' \| 'down'` | 否 | 默认 `'right'` | 箭头方向 |
| disabled | boolean | 否 | 默认 `false` | 短路 `onClick` 与按压反馈，并置灰 |
| onClick | `() => void` | 否 | — | 点击回调；给了它才有点击态 |
| className | string | 否 | — | 追加根类名 |

## 返回 / 输出

组件渲染 `View`；无返回值、不抛错。可被宿主样式定制的类名：

| 类名 | 说明 |
|---|---|
| `mptk-cell` | 单元格根；修饰类 `--center` / `--top` / `--large` / `--disabled` / `--divider` |
| `mptk-cell__icon` / `__main` / `__title` / `__label` / `__value` / `__extra` / `__right-icon` / `__arrow` / `__divider` | 单元格内部结构；`__value` 带修饰类 `--sm` |
| `mptk-cell-group` | 分组根；修饰类 `--inset` / `--flush` / `--in-card`（装在 Card 里自动派生），以及设置派生的 `--divider-match` / `--divider-inset` / `--divider-flush` / `--frameless` |
| `mptk-cell-group__title` / `__body` / `__border` / `__title-divider` | 分组标题、内容区、上下外框与卡片内的标题线 |

行为约定：

- **背景归环境，Cell 不铺底**：`Cell` 与 `CellGroup` 的组体、行默认 `background-color: transparent`，底色由所在环境透出——页面、`Card`、弹窗面板，或调用方通过 `className` 显式给的面。这样同一个 Cell 放进任何底色的容器都不会顶出一块异色面。需要一块面时由环境提供：套 `Card`、给容器加背景，或在 `Cell` / `CellGroup` 的 `className` 上指定背景，都不是 Cell 自己的默认行为。
- **按压反馈叠半透明层，不换底色**：点击态用 `background-image: linear-gradient(var(--mptk-cell-press), var(--mptk-cell-press))` 叠加，不用 `background-color` 替换——否则会盖掉环境透出的底色（含调用方显式给的面），反馈与真实底色脱节。`--mptk-cell-press` 明档 `rgba(0,0,0,.06)`、暗档 `rgba(255,255,255,.08)`，真源在 `kit.config.mjs`。
- 组内最后一格的 `border` 由 `CellGroup` 按位置注入为 `false`，不依赖结构伪类；独立使用的 `Cell` 由自身 `border` 决定。
- 点击态由 `onClick` 派生，按压反馈走 `hoverClass`，抬手后 70ms 恢复（`PRESS_STAY_TIME`，不吃 Taro `View` 的 400ms 默认），不暴露 `clickable` prop。
- 三种线，都是独立 1px 元素：`__border--top` / `__border--bottom` 是组的上下边界，`__title-divider` 是卡片内「标题与列表之间」那条线（同时是该组的上边界），`mptk-cell__divider` 是行与行之间的线。**组级的两条线（外框与标题线）是流内元素**，位置只由前后兄弟决定，不会因为父级 position 基准失效跑到组外叠成双线；行间线贴在每一行底部（`Cell` 内部），不参与组的边界计算。卡片形态的四边由内容区的圆角与 `overflow: hidden` 裁切。
- 颜色分两档：**边界线**（上下外框与标题线）取 `--mptk-border`，**行间线**默认取 `--mptk-cell-divider`，比边界浅一档（明色 `rgba(0,0,0,.06)`、暗色 `rgba(255,255,255,.06)`），宽度同为 1px。默认值真源在 `kit.config.mjs` 的 `light` / `dark`。
- 三个控件级外观设置都走 `CellGroup` 的 props，由 `state.ts` 派生修饰类，使用者不写样式：`dividerTone="match"` 把内线切到 `--mptk-border`（与外框同色）；`dividerInset={false}` 把行间线通到底；`frame={false}` 去掉卡片四边描边。默认值分别是 `soft` / `true` / `true`，即浅线、行线内缩、有边框。
- 主标题取 `--mptk-font-sm`（14/20）、说明与右侧值取 `--mptk-font-xs`（12/17）、说明上间距取 `--mptk-space-0`（2px）：字号与 Vant Weapp 的 14/12 持平，行高档位各自跟随；上间距比 WeUI / Vant 的 3～4px 再紧一档。右侧值是说明性文字，默认跟 `label` 同档；确需与标题等大时给 `valueSize="sm"`，不要用 className 改字号。
- `value` 位统一靠右（`display:flex; justify-content:flex-end`），与箭头前的文字同一口径。这不只是 `text-align:right`——后者对塞进 `value` 的块级插槽（如 Segmented）无效，会让它贴左；flex 定位保证文字和插槽都贴右。
- 但「值位贴右」只能把插槽的盒子顶到右边，插槽**自己多宽**它管不了。默认 `width="fit"` 的 Segmented 如今整块按内容宽，不依赖父级是否确定宽，直接 `<Cell value={<Segmented …/>} />` 即可（原理见 [Segmented](segmented.md)）。要让底片撑满一段确定宽（右边缘与行右边缘对齐），**外包一层定宽 `View`** 并用 `width="equal"`：`<Cell value={<View className="…定宽…"><Segmented width="equal" …/></View>} />`。宽度必须写在包裹层上、不能直接写在 `<Segmented>` 的 `className` 里：`equal` 根节点自带 `.mptk-seg{width:100%}` 与调用方类名同权重，全局样式表里库样式在后、同权重后者必赢，定宽会被覆盖回 100%。
- 垂直对齐默认居中（WeUI `.weui-cell` 与 TDesign `align="middle"` 的默认口径），由 `mptk-cell` 根的 `align-items: center` 实现；`center={false}` 派生 `mptk-cell--top` 改为整行顶部对齐，适用于多行 `label` 时右侧值要贴标题首行。整行只有根容器管对齐，图标位 / 额外位 / 箭头不各自写 `align-self`，两态下都不会出现「值贴顶、箭头仍居中」的错位。显式 `center` 只追加 `--center` 标记，与默认视觉一致。迁移：旧版 `center` 默认 `false`（顶部对齐），升级后要保留旧观感必须显式写 `center={false}`。不提供 `bottom` 档：单元格场景没有对应形态，不为一个没有真实用法的取值扩枚举。
- 上下外框按边给：`border="top"` 只画上、`"bottom"` 只画下、`"both"` 两条、`"none"` 都不画；布尔 `true` / `false` 分别等于 `both` / `none`。显式传值永远优先于上下文推导：`<Card><CellGroup border="both">` 无论 Group 在卡片里排第几都手动长出上下两条，`border={false}` 也能手动关掉。唯一的例外是 `inset`：卡片形态的上下线已经含在四边里，`border` 对它不生效（见下条 `frame`）。
- 不给 `border` 时按上下文推导，**唯一的线规则是「每个分组是封口的：底线归前一块画；相邻两块的分界处恒好一条线，且标题上方不另起一条」**——两条线紧挨（双线）、同一处叠两条、分界处一条都没有，都算错（两块通栏紧贴、以及调用方自己显式画线这两种情况见后面的「已知边界情况」）：

  | 场景 | 上边界（列表顶） | 下边界（列表底） |
  |---|---|---|
  | 通栏（不在 Card 里） | 画；有标题时它就是标题与列表之间那条线 | 画 |
  | 卡片内、有标题 | 画在标题下（`__title-divider`）；紧跟卡片标题栏或上一分组时不画（那条线由标题栏 / 上一组的底线出） | 画；只有自己是最后一个元素才不画（卡片底边接管） |
  | 卡片内、无标题 | 前面是普通内容才画；紧跟卡片标题栏 / 上一分组 / 卡片顶不画 | 同上 |
  | 卡片形态 `inset` | 不画（四边归 `__body--inset` 的边框） | 不画 |

  也就是说：**底线归「前一块」画**——每个分组的下边界是它自己的封口线，两个分组紧挨时接缝那条线落在前一组列表底、下一组标题（若有）上方；**上边界只在前面是普通内容时才画**，紧跟卡片标题栏（标题栏自带线）、上一分组（它的底线就是这条线）或卡片顶时让位。装在 `Card` 里时这些位置由 `Card` 渲染期算好、以边界提示注入，消费方零参数。
- 有标题的组，标题与列表之间恒好一条线：顶线画了就落在标题与列表之间（顶线排在标题之后），没画就由 `__title-divider` 补上。两者互斥，除了下面第 ⑤ 条的无框卡片之外不会同时画，也不会一起消失。显式 `border` 的「顶线」画的就是这条线：带标题时它落在标题之后，不是组的几何顶边。
- 五种已知边界情况，都是「各自整块成立」而不是漏线：
  ① 两块**通栏**组紧贴摆（`--flush` 外边距为 0）时，上一块的底线与下一块的顶线各画各的，接缝读作 2px；都带标题时，上一块的底线还会落在下一块标题上方一档。要单线就把它们放进同一个 `Card`，由边界提示只留一条。
  ② 组没有任何 `Cell`（空组）时上下框照画——空组本身没有内容可分隔，框还是它的边界。
  ③ `Card` 的 `headerDivider` / `footerDivider` 由卡片自己管，显式关掉后组不会替它补线（关掉就是不要那条线）。
  ④ 显式 `border` 画出来的线是调用方自己画的，`Card` 不会拿它跟相邻组的边界线对账：`<CellGroup border="both"/>` 紧跟一组时，前组的底线与后组的上边界线会各画一条。要单线就只在一侧显式。
  ⑤ `inset` + `frame={false}`（无边框卡片）没有四边，因此也没有标题下那条线——无框就是无框，不是丢线。
- 线分两类：**组级线（外框与标题线）是结构线，一律左右通到底**——通栏通到屏幕边，卡片内用负 margin 抵消 body 的左右内距通到卡片边，不受 `dividerInset` 影响；**行间线是内容线**，端点由 `dividerInset` 决定：`true`（默认）与行文字对齐（通栏留 `var(--mptk-space-4)`，卡片内由 body 的 `--mptk-card-spacing` 内收），`false` 通到底（通栏到屏幕边，卡片内跨出 body 内距到卡片边）。`dividerInset` 曾于 2026-11-14 删除，2026-11-17 按「组合层要能显式控制行线内缩」的真实需求恢复为组件参数，不再靠写死 `left/right: 0` 凑效果。
- `frame` 只管卡片形态（`inset`）的四边描边，与 `border` 互不影响：卡片形态的上下线已经含在四边里，`border` 对它不生效。
- `--mptk-cell-divider` 仍是设计层语义变量，宿主可在业务级主题定制时覆盖同名变量；控件级日常切换用上面的 props，不要求宿主写 CSS。
- 样式必须显式引入 `mp-taro-kit/ui/display/cell/style`，颜色与尺寸只取 `var(--mptk-*)`；`--mptk-*` 的默认值来自 `mp-taro-kit/styles/theme-*`（编译期三选一，或运行时热切换出口）。

## 与 Card 组合

圆角、外框、底色属于「壳」，已抽成通用卡片容器 [Card 卡片](card.md)。由 `Card` 提供壳，`CellGroup` 只管行与组内线，**消费方不传任何形态参数**：

```tsx
<Card>
  <CellGroup>
    <Cell title="单元格" value="内容" />
    <Cell title="单元格" value="内容" label="描述信息" />
  </CellGroup>
</Card>
```

`Card` 通过 `ui/infra/card-context` 向后代声明「你在卡片里」，`CellGroup` 消费后派生 `mptk-cell-group--in-card`、据此调整组内留白与线的归属；底色不需要 `Card` 注入——Cell 与 CellGroup 默认透明，卡片的面色直接透上来。上下外框不是一刀切关掉，而是由 `Card` 渲染期用 `ui/infra/card-edge` 按文档顺序给每组算出「上边界要不要画、下边界要不要画」两个布尔注入，据此让每段之间恒好一条线（规则见上文），显式 `border` 仍可覆盖。同时 `CellGroup` 用 `markCardEdgeContent()` 声明「本组每行自带留白」，`Card` 渲染期识别后派生 `mptk-card--edge-content`，把壳的上下 padding 直接归零。本组不做负 margin 反抵消：小程序渲染端会静默丢弃变量参与计算的负 margin，编译和 CSS 层叠都查不出来，实机会留下两层留白。

卡片内的列表默认**左右不到头**：左右留白统一由组给一档，取卡片自己的 `var(--mptk-card-spacing)`（`sm` 8 / `md` 12 / `lg` 16），行自己不再留左右白，文字与卡片标题、底部操作区左边界对齐；贴边时 `Card` 的 body 左右留白同时归零，避免两道间距叠加。行间线的端点由 `dividerInset` 控制：默认 `true` 时随文字内缩到这一档，`false` 时用负的 `--mptk-card-spacing` 跨出 body 内距、通到卡片边——这是 `CellGroup` 在卡片内的组合层参数，不是宿主写样式。组的 `inset` / `frame` 服务于它独立作为卡片使用时的形态，组合写法不依赖它们；组内线设置（`dividerTone` / `dividerInset`）仍归 `CellGroup`，职责不重叠。

## 示例

```tsx
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { iconClass } from 'mp-taro-kit/ui/icon/common/base'
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

// 行间线端点：默认与行文字对齐；dividerInset={false} 通到底（卡片内到卡片边）
export const DividerInset = () => (
  <View>
    <CellGroup title="默认：行线内缩">
      <Cell title="单元格" value="内容" />
      <Cell title="单元格" value="内容" />
    </CellGroup>
    <CellGroup dividerInset={false} title="dividerInset=false：行线通到底">
      <Cell title="单元格" value="内容" />
      <Cell title="单元格" value="内容" />
    </CellGroup>
  </View>
)

// 单元格大小
export const Large = () => <Cell title="单元格" value="内容" size="large" label="描述信息" />

// 右侧值字号：默认与 label 同档，valueSize="sm" 与标题同档
export const ValueSize = () => (
  <CellGroup>
    <Cell title="单元格" value="内容" label="描述信息" />
    <Cell title="单元格" value="内容" label="描述信息" valueSize="sm" />
  </CellGroup>
)

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

// 垂直对齐：默认居中，center={false} 改为顶部对齐
export const Center = () => (
  <CellGroup>
    <Cell title="默认居中" value="内容" label="描述信息" />
    <Cell center={false} title="顶部对齐" value="内容" label="描述信息" />
  </CellGroup>
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
- 2026-11-13 15:13:41：补「与 Card 组合」：壳职责归 Card，inset / frame 保留兼容但不再扩展
- 2026-11-13 16:42:48：组合改零参数：Card 提供上下文，CellGroup 自动派生 --in-card 并收敛外框 / 底色 / 上下留白
- 2026-11-13 18:43:58：与 Card 组合的留白改由 Card 侧归零，CellGroup 只声明贴边内容，不再用负 margin 抵消
- 2026-11-13 23:24:15：示例图标引用改到 common.base
- 2026-11-14 11:23:22：卡片内的列表默认左右内收：组给一档留白、行归零、分隔线跟着内缩
- 2026-11-14 11:37:33：分隔线默认左右内缩、不再通到底，删除 dividerInset 开关
- 2026-11-14：卡片内列表左右留白改取 `--mptk-card-spacing`，与卡片标题左边界对齐（原先固定 `--mptk-space-4`，差 4px）
- 2026-11-14：Cell 主标题 15→14、说明 14→12（与 Vant Weapp 持平）；新增间距档 `--mptk-space-0: 2px`，label 上间距 4→2
- 2026-11-14：`border` 改为按边给（`none` / `top` / `bottom` / `both`，兼容布尔），装在 Card 里也能显式画出上下线
- 2026-11-14：`center` 默认改 `true`（整行垂直居中），`center={false}` 派生 `--top` 顶部对齐；装饰位不再各自写 `align-self`
- 2026-11-15 00:20:59：默认值真源改为 kit.config.mjs
- 2026-11-15：右侧值字号默认改 `xs`（与 label 同档，原为 `sm`），新增 `valueSize="sm"` 回到标题档
- 2026-11-16 13:48:23：按压反馈抬手后 70ms 恢复（PRESS_STAY_TIME）
- 2026-11-22：Cell / CellGroup 默认不再铺 `--mptk-surface-1` 底色，改透明、由环境透出（页面 / Card / 弹窗面板 / 调用方 className）；按压反馈从换 `background-color` 改为叠 `--mptk-cell-press` 半透明层，不盖掉环境底色。删除 `--in-card` 的透明覆盖规则（默认已透明）
- 2026-11-17：卡片内 CellGroup 的上下外框不再一刀切关掉；Card 渲染期注入位置档（首 / 中 / 末 / 单组），首组不画上、末组不画下、中间组上下都画、单组两头都收；显式 `border` 仍优先
- 2026-11-17：`value` 位改 flex 靠右，块级插槽（如 Segmented）也贴右，不再只靠对块级无效的 `text-align`；段控件在值位里用默认 `fit`（自然宽高），要底片撑满确定宽时才外包定宽 `View` + `width="equal"`——定宽不能写在 Segmented 自己的 className 上，会被库样式同权重覆盖（开发者工具 Skyline 下整块塌成空白）
- 2026-11-17：线规则收敛为「一个分界处恒好一条线，底线归前一块封口」：Card 注入的不再是首 / 中 / 末 / 单的位置档，而是上 / 下边界两个布尔——每组的底线是自己的封口线（最后一个元素不画），上边界只在前面是普通内容时画（紧跟卡片标题栏 / 上一分组时让位），标题上方不再多一条；边界线与标题线统一取 `--mptk-border`，行间线才用浅一档的 `--mptk-cell-divider`；组级的两条线改成流内元素，去掉 absolute 定位
- 2026-11-17：组级线（外框与标题线）定为结构线、一律左右通到底：通栏通到屏幕边，卡片内负 margin 抵消 body 左右内距通到卡片边；行间线维持内缩——结构线通底、内容线内缩，都不给开关
- 2026-11-17：卡内行间线通底做过实机验证，最终还原为有间距；只有分组上下的结构线保持通到卡片边缘
- 2026-11-17：行间线内缩恢复为 `CellGroup` 的 `dividerInset` 参数（默认 `true`），由 Card + CellGroup 组合层派生 `--divider-inset` / `--divider-flush` 修饰类；卡片内通底取负的 `--mptk-card-spacing` 跨出 body 内距，不再靠 `left/right: 0` 的巧合；演示站加「行线内缩」示例
- 2026-11-17：Cell 值位里 fit 模式的 Segmented 改为整块按内容宽（见 segmented.md），默认值位插槽直接可用，不再需要为「看起来对」外包定宽槽
- 2026-11-17：分组标题下留白从 `--mptk-space-1` 加到 `--mptk-space-2`（2 倍），缓解与下面列表贴太紧
- 2026-11-17：Cell 行上下 padding 从 `--mptk-space-3` 减到 6px（`calc(var(--mptk-space-1) + var(--mptk-space-0))`），另加 `min-height`（内容区净高 `--mptk-line-sm` 20 + 上下各 6 = 32px）保底：内容没顶到最小高就居中，超过才按 6px padding 撑开——换大号控件把行顶高也不会显得空，小号内容也不会把行压矮
