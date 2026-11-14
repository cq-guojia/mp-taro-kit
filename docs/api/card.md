# Card 卡片

## 接口 / 导出

`mp-taro-kit/ui/card`：`Card`、`CardProps`、`CardRadius`、`CardSize`、`CardColor`、`BuiltinCardColor`、`CARD_RADII`、`CARD_SIZES`、`CARD_COLORS`、`resolveCardState`、`resolveCardColor`
`mp-taro-kit/ui/card/style`：组件级样式出口，宿主显式引一次
`mp-taro-kit/ui/infra`：`CardSurfaceContext` / `useCardSurface` / `CardSurfaceState`，以及贴边内容声明 `CARD_EDGE_CONTENT` / `markCardEdgeContent` / `CardEdgeContentComponent`，组合时由库内部使用

通用卡片容器：只负责「一层壳」（圆角、面、描边、分区间距、裁切），内容一律由 `children` 与槽位从宿主注入。上下留白也归壳决定，但按内容类型派生：普通内容保留，声明了贴边的内容由壳直接归零，不需要子级反向抵消。这是卡片族里第一种样式；后续新卡片放进同一个 `src/ui/card/` 子域、并列给各自的细路径单元，共用本壳的类名与 `--mptk-card-*` 变量，不各自再画一圈圆角。props 类型以 `dist/ui/card/index.d.ts` 为真源，本篇写类型表达不了的运行时行为与设计依据。

## 设计依据：竞品对比

公开文档级核实（`TDesign` 与 `shadcn/ui` 另取包内类型声明核对）。

| 库 / 体系 | 命名 | 开放槽位 | 开放设置 | 本库的取舍 |
|---|---|---|---|---|
| Ant Design Mobile | `Card` | `title` / `extra` / body；`onHeaderClick` / `onBodyClick` | `full`（RN 通栏） | 取 `Card` 命名；分区交互由宿主在注入的节点上自己绑，库不接路由与分区回调 |
| TDesign | `Card` | `cover` / `header` / `title` / `subtitle` / `description` / `avatar` / `content` / `footer` / `actions` | `bordered`、`headerBordered`、`size`、`hoverShadow`、`shadow`、`loading`、`theme` | 取四区槽位、`frame` / `headerDivider` / `size` / `loading`；海报类 `theme` 属业务布局，不进 kit |
| shadcn/ui | `Card` + `CardHeader/Title/Description/Action/Content/Footer` | 六个组合子组件 | `size="sm"`、`--card-spacing` | 结构等价，但小程序按需打包不做 barrel 全量导出，改为 props 槽位；间距落成 `--mptk-card-spacing`；贴边取它的 Edge to edge 语义，不用负 margin，改由 Card 渲染期识别贴边内容后自己归零 |
| Arco Design | `Card` | `cover` / `title` / `extra` / `actions` / body | `bordered`、`size`、`hoverable`、`loading` | 取 `cover` / `extra` / `footer` 与 `frame` / `size` / `loading` |
| Naive UI | `Card` | `cover` / `title` / `extra` / `actions` / footer | `bordered`、`segmented`、`embedded`、`closable`、`hoverable` | `segmented` 落到 `headerDivider`；`closable` / `embedded` 属业务状态，不进壳 |
| Vant / Vant Weapp | `Card` = 商品卡片 | `thumb` / `price` / `num` / `tag` 等十余业务插槽 | `centered`、`currency` 等业务项 | **不取**：业务内容不进基础库。演示站同名占位改标 `ProductCard 商品卡片` |
| react-native-paper | `Card` + `Card.Content` | 组合子组件 | `mode`、`direction` | 取 `CardContext`：父把容器状态传给后代，子组件自己调整，消费方零参数 |

对比后补进去的开放位：`cover` / `title` / `subtitle` / `extra` / `footer` 五个槽位、`size` 枚举、`headerDivider`、`onClick` 派生按压态、`loading` + `loadingContent`。

竞品普遍没有、本库补上的两处：`radius` 枚举（别家靠主题或宿主写 CSS）、`color` 内置色名 + 任意 CSS 色值双路。组合形态**不新增参数**，由上下文自动收敛，见「与 Cell 组合」。

**样式逃生口不给 `*-style` / `*-ClassName`**：竞品常见这一组，但本库约定「颜色与尺寸值只在 `kit.config.mjs` 写一次」，开了裸样式口子就会绕过档位。宿主定制改走根 `className` 加结构类名（见下表），或业务级覆盖 `--mptk-card-*` 同名变量。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `cover` | ReactNode | 否 | — | 顶部封面 / 媒体区；不给就不渲染这一块，卡片顶部不留白 |
| `title` | ReactNode | 否 | — | 头部标题 |
| `subtitle` | ReactNode | 否 | — | 标题下的副标题 / 描述 |
| `extra` | ReactNode | 否 | — | 头部右侧操作区 |
| `footer` | ReactNode | 否 | — | 底部操作区 |
| `children` | ReactNode | 否 | — | 主体内容；所有槽位不给时就是一块纯壳 |
| `radius` | `CardRadius` | 否 | 不传走 `--mptk-card-radius` | 枚举 `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`，对应 4 / 8 / 12 / 16 / 20；由 `state.ts` 派生修饰类，宿主不查变量名单、不写样式 |
| `size` | `CardSize` | 否 | `'md'` | 枚举 `'sm' \| 'md' \| 'lg'`，只换分区间距（`--mptk-space-2 / -3 / -4`），不动字号与圆角 |
| `frame` | boolean | 否 | `true` | 四边描边开关；`false` 得到无边框卡片，圆角与底色仍在 |
| `headerDivider` | boolean | 否 | 跟随头部 | 有头部（标题 / 副标题 / 右侧操作任一）默认就画一条 1px 线，取 `--mptk-border-faint`；传 `false` 关掉 |
| `color` | `CardColor` | 否 | 不传走 `--mptk-card-bg` | 内置色名或任意 CSS 色值，见下 |
| `onClick` | `() => void` | 否 | — | 给了才派生按压态；跳转由宿主注入，本库不接 `url` |
| `disabled` | boolean | 否 | `false` | 短路 `onClick` 与按压反馈 |
| `loading` | boolean | 否 | `false` | 等待态：给了 `loadingContent` 就替换主体，否则保留内容只降一档存在感 |
| `loadingContent` | ReactNode | 否 | — | 骨架屏 / 等待文案由宿主注入；本库不自带骨架屏，也不引 `feedback/spinner`（按需打包） |
| `className` | string | 否 | — | 追加根类名 |

### 颜色口子

`CardColor = BuiltinCardColor | (string & {})`，两条路互不掺：

- **内置色名**（`CARD_COLORS`）：`neutral` 与 `blue` / `green` / `orange` / `red` / `purple` / `cyan` / `pink` / `teal` 八支。走修饰类把 `--mptk-card-bg` 切到已有的 `--mptk-<name>-soft`，不新增色值；`neutral` 回到 `--mptk-surface-1`。
- **任意 CSS 色值**：`#rrggbb` / `rgb()` / `var()` 等，走根节点显式内联 `backgroundColor`，不依赖 WXML 行内自定义属性。

实现形状与 `src/ui/form/control-color.ts:17-23` 一致；卡片不 `import` form 子域，避免把无关组件打进包。

## 返回 / 输出

组件渲染 `View`；无返回值、不抛错。可被宿主样式定制的结构类名：

| 类名 | 说明 |
|---|---|
| `mptk-card` | 根；修饰类 `--radius-*`、`--size-*`、`--frameless`、`--header-divider`、`--cover`、`--edge-content`、`--edge-top`、`--edge-bottom`、`--<色名>`、`--clickable`、`--pressed`、`--disabled`、`--busy` |
| `mptk-card__cover` | 封面区 |
| `mptk-card__header` / `__heading` / `__title` / `__subtitle` / `__extra` | 头部四区 |
| `mptk-card__body` | 主体 |
| `mptk-card__footer` | 底部操作区 |

行为约定：

- 五个槽位全部按需渲染：没给的槽位不产生节点，`cover` 给了还会去掉根节点的顶部留白，让封面贴到卡片上沿。
- 头部字号取字号档：`title` 是 `--mptk-font-lg`（17/24），`subtitle` 是 `--mptk-font-xs`（12/17、`--mptk-fg-3`），比正文（`md`，15）低一档，与列表里的辅助文字同档。宿主不改字号，换档就走主题变量。
- 头部与主体之间默认带一条 1px 分隔线（`--mptk-border-faint`）：有头部就该把标题区和内容分开，不必每个调用点再传 `headerDivider`；要连成一片时传 `headerDivider={false}`。
- 上下留白归壳、由 `hasCardEdgeContent()` 在渲染期从 `children` 派生：普通内容保留 `var(--mptk-card-spacing)`；声明了贴边的内容派生 `--edge-content`，并**按端**派生 `--edge-top` / `--edge-bottom`，该端 padding 直接为字面量 `0`，不经计算表达式、不吃渲染端支持度。子级不做负 margin 反抵消。
- 归零只作用在真正贴边的那一端：没有 `title` / `subtitle` / `extra` 才派生 `--edge-top`（否则标题会被顶到卡片上边），没有 `footer` 才派生 `--edge-bottom`。所以「Card 带标题 + 里面一个 CellGroup」两端都保留留白，标题不再贴着卡片边、列表最后一行也不贴底。
- 贴边时 body 的左右留白归零，左右间距改由贴边内容自己给（`CellGroup` 取 `var(--mptk-card-spacing)`，与卡片标题、底部操作区同一档），保证内容与分隔线离卡片边只有一道距离、且左边界与标题对齐。
- 贴边列表的首行自带一份上留白，所以头部到 body 的 `margin-bottom` 同时归零：否则「分割线 → 第一行」会变成「行与行」的两倍。
- 圆角默认取 `--mptk-card-radius`（`base` mixin 指向 `--mptk-radius-md`，与控件同档 12px）；`radius` 枚举只是把同名键换到另一档，**取值仍只在 `kit.config.mjs` 写一次**。`pill` 不开放给卡片，留给 Badge / Switch。
- 点击态由 `onClick` 派生，按压反馈走 `hoverClass`；`disabled` 短路回调；`loading` 不短路点击，由宿主决定是否同时给 `disabled`。
- 内容密度、字号、圆角、间距一律取 `var(--mptk-*)`，组件不写颜色值、不写兜底；`--mptk-card-bg` / `--mptk-card-border` 在 `light` / `dark` 同名同数，宿主可在业务级主题定制时覆盖。
- 样式必须显式引入 `mp-taro-kit/ui/card/style`，基线来自 `mp-taro-kit/styles/theme-*`。

## 与 Cell 组合：零参数契约

圆角、外框、底色都由 `Card` 提供，`CellGroup` 只管行与组内线。消费方**不传任何形态参数**：

```tsx
import { Card } from 'mp-taro-kit/ui/card'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/cell/style'

export const CellInCard = () => (
  <Card>
    <CellGroup>
      <Cell title="单元格" value="内容" />
      <Cell title="单元格" value="内容" label="描述信息" />
    </CellGroup>
  </Card>
)
```

组合由 `ui/infra` 的两处契约自己成立，都不需要消费方参与：

- `card-context.ts` 的 `CardSurfaceContext` 向后代声明「你在卡片里」；`CellGroup` 用 `useCardSurface()` 消费后不渲染上下外框（`outerBorder=false`）、派生 `mptk-cell-group--in-card`、组与行底色改透明。父传子调整的模式对齐 react-native-paper 的 `CardContext`。
- `card-edge.ts` 的 `markCardEdgeContent()` 让 `CellGroup` 声明「我每行自带留白」；`Card` 在渲染期用 `hasCardEdgeContent(children)` 识别到它，派生 `mptk-card--edge-content`，再按槽位派生 `mptk-card--edge-top` / `--edge-bottom` 把该端 padding 直接置 0。声明是渲染期静态契约，不引入运行时状态、不产生首帧跳动，也不需要 `card` 与 `display/cell` 互相 import。

贴边取 shadcn/ui 的 Edge to edge 语义，但**不用负 margin**：小程序渲染端会静默丢弃变量参与计算的负 margin，编译与 CSS 层叠都查不出来，实机表现为 `margin: 0`，于是壳的 12px 与行的 12px 叠成 24px。改成壳上字面量 `0` 归零后，组合态顶部只剩 Cell 自身的一份 `--mptk-space-3`（12px）。不用 `:has()`，因为小程序 WXSS 不支持结构伪类。

声明识别遍历 `children` 树（含数组与嵌套节点），因此 `<Card><View><CellGroup /></View></Card>` 一样贴边。边界是：若某个组件在自身内部才渲染 `CellGroup`、不让它出现在 `Card` 的 children 树里，`Card` 就无从识别，这类内容按根 `className` 自行定制。

因此卡的 `color`（内置色名或自定义色值）能透到 Cell 行，不会被白底盖住。`CellGroup` 的 `inset` / `frame` 服务于它独立作为卡片使用时的形态，组合写法不依赖它们；组内线设置（`dividerTone`）仍归 `CellGroup`，见 [Cell 单元格](cell.md)。

## 示例

```tsx
import { Card } from 'mp-taro-kit/ui/card'
import 'mp-taro-kit/ui/card/style'

// 纯壳：什么都不传，圆角走容器级默认档
export const Basic = () => <Card>卡片内容</Card>

// 枚举切档，宿主不用查样式名单
export const Shaped = () => <Card radius="xl" size="lg" frame={false}>…</Card>

// 颜色：内置色名 / 自定义色值
export const Colored = () => (
  <>
    <Card color="blue">内置 blue</Card>
    <Card color="#f0e6ff">自定义色值</Card>
  </>
)

// 四区槽位全开
export const WithSlots = () => (
  <Card
    cover={<MyCover />}
    title="标题"
    subtitle="描述"
    extra={<MyAction />}
    footer={<MyFooter />}
    headerDivider
  >
    主体内容
  </Card>
)
```

## 更新日志

- 2026-11-13 15:13:41：新建：竞品对比结论、槽位与设置契约、颜色双路、与 Cell 的组合用法
- 2026-11-13 16:42:48：组合改为零参数：Card 提供上下文，CellGroup 自动收敛外框 / 底色 / 留白；移除 flush 参数
- 2026-11-13 18:43:58：贴边留白改由 Card 渲染期识别内容并归零，删除子级负 margin 反抵消，补行为级断言
- 2026-11-14 11:23:22：贴边时 body 左右留白也归零，左右间距改由贴边内容自己给
- 2026-11-14：贴边归零改按端生效（`--edge-top` / `--edge-bottom`）：有标题不再顶到卡片上边、有底部操作区不再贴底；贴边时头部 `margin-bottom` 归零，分割线到首行不再双倍；卡片内列表左右留白改取 `--mptk-card-spacing`，与标题对齐
- 2026-11-14 12:37:19：默认圆角改 md（与控件同档 12px）
- 2026-11-14：头部默认带分隔线（`headerDivider` 不给就跟随头部）；说明字号降到 `--mptk-font-xs`
- 2026-11-15 00:20:59：取值真源改为 kit.config.mjs
