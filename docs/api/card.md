# Card 卡片

## 接口 / 导出

`mp-taro-kit/ui/card`：`Card`、`CardProps`、`CardHead`、`CardHeadProps`、`CardVariant`、`CardRadius`、`CardSize`、`CardColor`、`BuiltinCardColor`、`CardState`、`CardStateInput`、`CardColorParts`、`CardInlineStyle`、`CARD_VARIANTS`、`CARD_RADII`、`CARD_SIZES`、`CARD_COLORS`、`resolveCardState`、`resolveCardColor`
`mp-taro-kit/ui/card/style`：组件级样式出口，宿主显式引一次
`mp-taro-kit/ui/infra`：`CardSurfaceContext` / `useCardSurface` / `CardSurfaceState`，以及贴边内容声明 `CARD_EDGE_CONTENT` / `markCardEdgeContent` / `CardEdgeContentComponent`，组合时由库内部使用

通用卡片容器：只负责「一层壳」（形态、圆角、面、描边、分区间距、裁切），内容一律由 `children` 与槽位从宿主注入。上下留白也归壳决定，但按内容类型派生：普通内容保留，声明了贴边的内容由壳直接归零，不需要子级反向抵消。这是卡片族里第一种样式；后续新卡片放进同一个 `src/ui/card/` 子域、并列给各自的细路径单元，共用本壳的类名与 `--mptk-card-*` 变量，不各自再画一圈圆角。props 类型以 `dist/ui/card/index.d.ts` 为真源，本篇写类型表达不了的运行时行为与设计依据。

## 设计依据：竞品对比

公开文档级核实（`TDesign` 与 `shadcn/ui` 另取包内类型声明核对）。

| 库 / 体系 | 命名 | 开放槽位 | 开放设置 | 本库的取舍 |
|---|---|---|---|---|
| Ant Design Mobile | `Card` | `title` / `extra` / body；`onHeaderClick` / `onBodyClick` | `full`（RN 通栏） | 取 `Card` 命名；分区交互由宿主在注入的节点上自己绑，库不接路由与分区回调 |
| TDesign | `Card` | `cover` / `header` / `title` / `subtitle` / `description` / `avatar` / `content` / `footer` / `actions` | `bordered`、`headerBordered`、`size`、`hoverShadow`、`shadow`、`loading`、`theme` | 取四区槽位、`variant` / `headerDivider` / `footerDivider` / `size` / `loading`；海报类 `theme` 属业务布局，不进 kit |
| shadcn/ui | `Card` + `CardHeader/Title/Description/Action/Content/Footer` | 六个组合子组件 | `size="sm"`、`--card-spacing` | 取它「标题写成组合子节点」的做法，但压成一层 `CardHead`（children 由宿主写、塞图标随便），不拆一堆子控件；间距落成 `--mptk-card-spacing`；贴边取它的 Edge to edge 语义，不用负 margin，改由 Card 渲染期识别贴边内容后自己归零 |
| Arco Design | `Card` | `cover` / `title` / `extra` / `actions` / body | `bordered`、`size`、`hoverable`、`loading` | 取 `cover` / `extra` / `footer` 与 `variant` / `size` / `loading` |
| Naive UI | `Card` | `cover` / `title` / `extra` / `actions` / footer | `bordered`、`segmented`、`embedded`、`closable`、`hoverable` | `segmented` 落到 `headerDivider`；`embedded` 落到 `variant="filled"` + `color="var(--mptk-surface-2)"`；`closable` 属业务状态，不进壳 |
| MUI Paper / Chakra / Radix Themes | `Paper` / `Card` | 组合子组件 | `Paper` 的 `variant="outlined" \| "elevation"`、Chakra 的 `elevated \| outline \| filled \| unstyled`、Radix 的 `surface \| classic \| ghost` | 取它们把「面与边」做成一支形态轴的做法，收成「面 / 边是否开启」的 2×2 四值，不引入阴影轴（本库控件一律平面，见下） |
| Vant / Vant Weapp | `Card` = 商品卡片 | `thumb` / `price` / `num` / `tag` 等十余业务插槽 | `centered`、`currency` 等业务项 | **不取**：业务内容不进基础库。演示站同名占位改标 `ProductCard 商品卡片` |
| react-native-paper | `Card` + `Card.Content` | 组合子组件 | `mode`、`direction` | 取 `CardContext`：父把容器状态传给后代，子组件自己调整，消费方零参数 |

对比后补进去的开放位：`cover` / `footer` 两个槽位 + `CardHead` 组合标题（children 由宿主写）、`variant` 四形态、`size` 枚举、`footerDivider`、`onClick` 派生按压态、`loading` + `loadingContent`。老 `title` / `subtitle` / `extra` / `headerDivider` props 已删除，不再兼容。

竞品普遍没有、本库补上的三处：`radius` 枚举（别家靠主题或宿主写 CSS）、`color` 内置色名 + 任意 CSS 色值双路、按形态决定色值落在哪条通道（有面染底、只有边染线）。组合形态**不新增参数**，由上下文自动收敛，见「与 Cell 组合」。

**形态不用布尔开关拼**：`frame` 这类开关只能表达「有边 / 无边」，说不清「要不要底」。一支 `variant` 把两个维度一起说清，也避免 `frame={false}` + `color` 这种组合里「到底有没有面」要靠调用点自己推理。原 `frame` 参数已由 `variant` 取代（`frame={false}` 等价于 `variant="filled"`），不留双口径。

**不开放阴影轴**：竞品的 `shadow` / `hoverShadow` / elevation 在本库没有对应 token，控件与列表全是平面；卡片要浮起由宿主覆盖 `--mptk-card-border` 或加业务类，不进通用壳。

**样式逃生口不给 `*-style` / `*-ClassName`**：竞品常见这一组，但本库约定「颜色与尺寸值只在 `kit.config.mjs` 写一次」，开了裸样式口子就会绕过档位。宿主定制改走根 `className` 加结构类名（见下表），或业务级覆盖 `--mptk-card-*` 同名变量。

## 形态矩阵

`variant` 一轴同时决定「有没有面」与「有没有边」，四种组合各自完整可用：

| `variant` | 面（底） | 边（描边） | 典型用法 | 色值落点 |
|---|---|---|---|---|
| `surface`（默认） | 有 | 有 | 普通卡片：靠描边界定范围 | 染面 |
| `filled` | 有 | 无 | 整底卡片：靠底色成块；原 `frame={false}` 的形态 | 染面 |
| `outline` | 无（透给页面） | 有 | 只有一圈描边的框 | 染边 |
| `plain` | 无 | 无 | 纯排版分组：只留分区间距与圆角裁切 | 不参与 |

`surface` 就是壳的基线，不额外写规则；其余三种只关掉该关的那一维，分区间距、圆角、槽位、贴边、按压态在四种形态下行为一致。

## 参数 / 输入

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `cover` | ReactNode | 否 | — | 顶部封面 / 媒体区；不给就不渲染这一块，卡片顶部不留白 |
| `footer` | ReactNode | 否 | — | 底部操作区 |
| `children` | ReactNode | 否 | — | 主体内容；所有槽位不给时就是一块纯壳 |
| `variant` | `CardVariant` | 否 | `'surface'` | 枚举 `'surface' \| 'filled' \| 'outline' \| 'plain'`，见「形态矩阵」 |
| `radius` | `CardRadius` | 否 | 不传走 `--mptk-card-radius` | 枚举 `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`，对应 0 / 4 / 8 / 12 / 16 / 20；由 `state.ts` 派生修饰类，宿主不查变量名单、不写样式 |
| `size` | `CardSize` | 否 | `'md'` | 枚举 `'sm' \| 'md' \| 'lg'`，只换分区间距（`--mptk-space-2 / -3 / -4`），不动字号与圆角 |
| `footerDivider` | boolean | 否 | 跟随底部 | 有底部操作区默认就画一条线，取 `--mptk-border`；传 `false` 关掉 |
| `color` | `CardColor` | 否 | 不传走 `--mptk-card-bg` | 内置色名或任意 CSS 色值，落在哪条通道由形态决定，见下 |
| `onClick` | `() => void` | 否 | — | 给了才派生按压态；跳转由宿主注入，本库不接 `url` |
| `disabled` | boolean | 否 | `false` | 短路 `onClick` 与按压反馈 |
| `loading` | boolean | 否 | `false` | 等待态：给了 `loadingContent` 就替换主体，否则保留内容只降一档存在感 |
| `loadingContent` | ReactNode | 否 | — | 骨架屏 / 等待文案由宿主注入；本库不自带骨架屏，也不引 `feedback/spinner`（按需打包） |
| `className` | string | 否 | — | 追加根类名 |

### 颜色口子

`CardColor = BuiltinCardColor | (string & {})`，两条路互不掺：

- **内置色名**（`CARD_COLORS`）：`neutral` 与 `blue` / `green` / `orange` / `red` / `purple` / `cyan` / `pink` / `teal` 八支。走修饰类把 `--mptk-card-bg` 切到已有的 `--mptk-<name>-soft`，不新增色值；`neutral` 回到 `--mptk-surface-1`。同一支色相还把 `--mptk-card-accent` 指向实色 `--mptk-<name>`，只有边的形态拿它当边色。
- **任意 CSS 色值**：`#rrggbb` / `rgb()` / `var()` 等，走根节点显式内联样式 —— 有面的形态写 `backgroundColor`，只有边的形态写 `borderColor`，不依赖 WXML 行内自定义属性。

落点由形态决定，不装作生效：`surface` / `filled` 染面，`outline` 染边，`plain` 既无面又无边，色值与色名都不派生（连类名都不加），需要有色块就用 `filled`、需要色边就用 `outline`。

实现形状与 `src/ui/form/control-color.ts:17-23` 一致；卡片不 `import` form 子域，避免把无关组件打进包。

## 返回 / 输出

组件渲染 `View`；无返回值、不抛错。可被宿主样式定制的结构类名：

| 类名 | 说明 |
|---|---|
| `mptk-card` | 根；修饰类 `--surface` / `--filled` / `--outline` / `--plain`、`--radius-*`、`--size-*`、`--footer-divider`、`--cover`、`--edge-content`、`--edge-top`、`--edge-bottom`、`--<色名>`、`--clickable`、`--pressed`、`--disabled`、`--busy` |
| `mptk-card__cover` | 封面区 |
| `mptk-card__title` / `mptk-card__subtitle` | 标题档位类名：由宿主写在 `CardHead` 的 children 上；Card 自身不再渲染标题区 |
| `mptk-card-head` / `--divider-top` / `--divider` | 标题块：`--divider-top` 是上方分隔线，`--divider` 是标题下的横线，都通到卡片边；标题文字自己缩进一档，见「多段标题」 |
| `mptk-card__body` | 主体，恒满宽 |
| `mptk-card__content` | 普通内容层：左右各一档 `card-spacing`，标题与列表不进这一层 |
| `mptk-card__footer` | 底部操作区 |

行为约定：

- `cover` / `footer` 两个槽位按需渲染：没给的不产生节点，`cover` 给了还会去掉根节点的顶部留白，让封面贴到卡片上沿。标题不再走 Card 槽位——**只走 `CardHead`**。
- 形态始终显式派生一根修饰类，四种形态的类名可以互相覆盖（宿主在页面级写 `.mptk-card--outline` 就能改所有只有边的卡片），不需要按形态再开 props。
- 标题字号取字号档：宿主在 `CardHead` 里写 `View className="mptk-card__title"` 拿 `--mptk-font-lg`（17/24），`mptk-card__subtitle` 拿 `--mptk-font-xs`（12/17、`--mptk-fg-3`）；比正文（`md`，15）低一档。宿主塞图标、写 className 都行，库不改写 children。
- 标题的横线都归 `CardHead` 自己画：前面有内容就画上线 `--divider-top`，后面还有正文才画下线 `--divider`（原头部的下边框），两条都用 `--mptk-border` 且通到卡片边。紧跟标题的列表不补顶线、紧跟标题的列表不画底线，接缝恰好一条；主体与底部之间由 Card 按 `footer` 派生一条同档线（`footerDivider={false}` 关掉）。Card 不再派生 `headerDivider`。
- 上下留白归壳、由 `hasCardEdgeContent()` 在渲染期从 `children` 派生：声明了贴边的内容派生 `--edge-content`，并**按端**派生 `--edge-top` / `--edge-bottom`，该端 padding 直接为字面量 `0`，不经计算表达式、不吃渲染端支持度。子级不做负 margin 反抵消。
- 归零只作用在真正贴边的那一端：正文第一块是 `CardHead` 时保留壳的顶部留白（原来标题就吃这一档）；没有 `footer` 才派生 `--edge-bottom`，列表最后一行不贴底。
- 左右留白不随内容类型变：`mptk-card__body` 恒满宽，`CardHead` 与 `CellGroup` 直挂其下，标题横线与组级线都通到卡片边。普通内容由 Card 包一层 `mptk-card__content` 取 `var(--mptk-card-spacing)`，标题文字由 `CardHead` 自己取同一档，两者左边界对齐。
- 圆角默认取 `--mptk-card-radius`（指向 `--mptk-radius-md`，与控件同档 12px）；`radius` 枚举只是把同名键换到另一档，**取值仍只在 `kit.config.mjs` 写一次**。`none` 给通栏与直角场景，`pill` 不开放给卡片，留给 Badge / Switch。
- 点击态由 `onClick` 派生，按压反馈走 `hoverClass`，抬手后 **70ms** 恢复（`PRESS_STAY_TIME`，不吃 Taro `View` 的 400ms 默认）；反馈是**一层半透明叠加**（`--mptk-card-press`，明色压暗、暗色提亮）叠在根节点自己的底上，而不是换 `background-color`：自定义色值走内联 `backgroundColor`，换底色会被内联样式压住、按压时什么都看不到。四种形态共用这一层，`plain` / `outline` 没有底也能看到反馈。
- `disabled` 短路回调；`loading` 不短路点击，由宿主决定是否同时给 `disabled`。
- 内容密度、字号、圆角、间距一律取 `var(--mptk-*)`，组件不写颜色值、不写兜底；`--mptk-card-bg` / `--mptk-card-border` / `--mptk-card-press` 在 `light` / `dark` 同名同数，宿主可在业务级主题定制时覆盖。
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

- `card-context.ts` 的 `CardSurfaceContext` 向后代声明「你在卡片里」；`CellGroup` 用 `useCardSurface()` 消费后派生 `mptk-cell-group--in-card`、组与行底色改透明。父传子调整的模式对齐 react-native-paper 的 `CardContext`。
- `card-edge.ts` 的 `markCardEdgeContent()` 让 `CellGroup` 声明「我每行自带留白」；`Card` 在渲染期用 `hasCardEdgeContent(children)` 识别到它，派生 `mptk-card--edge-content`，再按槽位派生 `mptk-card--edge-top` / `--edge-bottom` 把该端 padding 直接置 0。同一份声明还让 `Card` 按文档顺序给每个贴边的 `CellGroup` 注入「上边界要不要画、下边界要不要画」两个布尔（`CARD_EDGE_LINES_PROP`）：分组处恒好一条线——前面还有内容就画上边界，只有后面紧跟普通内容时才补下边界（线规则见 [Cell 单元格](cell.md)）。声明是渲染期静态契约，不引入运行时状态、不产生首帧跳动，也不需要 `card` 与 `display/cell` 互相 import。

贴边取 shadcn/ui 的 Edge to edge 语义，但**不用负 margin**：小程序渲染端会静默丢弃变量参与计算的负 margin，编译与 CSS 层叠都查不出来，实机表现为 `margin: 0`，于是壳的 12px 与行的 12px 叠成 24px。改成壳上字面量 `0` 归零后，组合态顶部只剩 Cell 自身的一份 `--mptk-space-3`（12px）。不用 `:has()`，因为小程序 WXSS 不支持结构伪类。

声明识别与边界注入都遍历 `children` 树（含数组与嵌套节点），因此 `<Card><View><CellGroup /></View></Card>` 一样贴边、一样拿得到边界提示。边界是：若某个组件在自身内部才渲染 `CellGroup`、不让它出现在 `Card` 的 children 树里，`Card` 就无从识别，这类内容按根 `className` 自行定制。

遍历会**跳过声明了「脱离文档流」的浮层**（`markCardEdgeOutOfFlow`）。原因：边界判定是渲染期静态遍历，而浮层关闭时渲染 `null`；只看 element 树的话，`<Card><CellGroup /><Popup open={false}>…</Popup></Card>` 里面板 children 会被当成排在 CellGroup 后面的可见内容，贴着卡片底的那条线就多画出来。已声明：`Popup` / `Overlay` / `Drawer` / `Dropdown` / `Dialog`；`Toast` / `Loading` 是行内组件、可见时确实占内容流，不声明。新增的浮层类组件若可能渲染 `null`，应当同样声明，`tests/card.test.mjs` 会逐个校验名单。

因此卡的 `color`（内置色名或自定义色值）能透到 Cell 行，不会被白底盖住。`CellGroup` 的 `inset` / `frame` 服务于它独立作为卡片使用时的形态，组合写法不依赖它们；组内线设置（`dividerTone`）仍归 `CellGroup`，见 [Cell 单元格](cell.md)。

## 示例

```tsx
import { Card, CardHead } from 'mp-taro-kit/ui/card'
import 'mp-taro-kit/ui/card/style'

// 纯壳：什么都不传，圆角走容器级默认档
export const Basic = () => <Card>卡片内容</Card>

// 形态：面与边的四种组合
export const Variants = () => (
  <>
    <Card variant="surface">面 + 边</Card>
    <Card variant="filled">只有面：整底成块</Card>
    <Card variant="outline" color="teal">只有边：色值染这条线</Card>
    <Card variant="plain">都没有：纯排版分组</Card>
  </>
)

// 枚举切档，宿主不用查样式名单
export const Shaped = () => <Card radius="none" size="lg" variant="filled">…</Card>

// 颜色：内置色名 / 自定义色值 / 内嵌面
export const Colored = () => (
  <>
    <Card color="blue">内置 blue</Card>
    <Card color="#f0e6ff">自定义色值</Card>
    <Card variant="filled" color="var(--mptk-surface-2)">整底 + 次级面</Card>
  </>
)

// 封面 / 底部走 Card 槽位，标题走 CardHead
export const WithSlots = () => (
  <Card cover={<MyCover />} footer={<MyFooter />}>
    <CardHead>
      <View className="mptk-card__title">标题</View>
      <View className="mptk-card__subtitle">描述</View>
    </CardHead>
    主体内容
  </Card>
)

// 一张卡片多个标题段：Card 是唯一外框，CardHead 起一段，正文是它的兄弟 children
export const Sections = () => (
  <Card>
    <CardHead>
      <View className="mptk-card__title">提示 alert</View>
      <View className="mptk-card__subtitle">解析即关，不返回用户选择</View>
    </CardHead>
    <Text>第一段内容</Text>
    <CardHead>
      <View className="mptk-card__title">确认 confirm</View>
    </CardHead>
    <Text>第二段内容</Text>
  </Card>
)
```

`CardHead` 的 `children` 是宿主自己写的节点：标题挂 `mptk-card__title` / `mptk-card__subtitle` 拿到字号档，想塞图标或自定义样式就自己加节点 / `className`，库不识别也不改写 children。正文不塞进 `CardHead`，而是作为它的兄弟 children 直接写在 `Card` 里——这样「标题 + 内容」可以随意交错组合。段间线由 Card 渲染期的边界提示决定，线都归标题自己画：首段不画上线（贴卡片顶），末尾标题后面没正文就不画下线，中间接缝恰好一条。上下间距也归标题：上一段内容到上线一档卡片间距、上线到标题一档小间距；标题到下一线一档小间距、下线到正文一档卡片间距。标题左右缩进与卡片顶部留白仍跟换写法前一致；段头不声明贴边。

## 更新日志

- 2026-11-13 15:13:41：新建：竞品对比结论、槽位与设置契约、颜色双路、与 Cell 的组合用法
- 2026-11-13 16:42:48：组合改为零参数：Card 提供上下文，CellGroup 自动收敛外框 / 底色 / 留白；移除 flush 参数
- 2026-11-13 18:43:58：贴边留白改由 Card 渲染期识别内容并归零，删除子级负 margin 反抵消，补行为级断言
- 2026-11-14 11:23:22：贴边时 body 左右留白也归零，左右间距改由贴边内容自己给
- 2026-11-14：贴边归零改按端生效（`--edge-top` / `--edge-bottom`）：有标题不再顶到卡片上边、有底部操作区不再贴底；贴边时头部 `margin-bottom` 归零，分割线到首行不再双倍；卡片内列表左右留白改取 `--mptk-card-spacing`，与标题对齐
- 2026-11-25：新增 `CardHead` 段头：一个 Card 里可重复起多段标题，正文作兄弟 children 随意组合；段间线复用边界 decorator，段头不声明贴边以保留 body 留白；标题由宿主写 View 挂 `mptk-card__title` / `__subtitle`，不拆子标签、不用 CSS 结构伪类
- 2026-11-25 22:25:18：删除老标题 API `title` / `subtitle` / `extra` / `headerDivider` 及 `__header` / `__heading` / `__extra` 结构类名，不留兼容；所有使用点迁到 `CardHead`，只换写法不改视觉
- 2026-11-25 22:56:26：按改动前的头部样式一次性对齐：标题自身画下方横线、保留左右缩进、下留白和卡片顶部留白；紧跟标题的列表不再重复画顶线，只换写法不改样式
- 2026-11-25 23:12:08：修标题线宽随内容漂移：body 恒满宽，标题与 CellGroup 直挂其下，普通内容包一层 `mptk-card__content` 取左右留白；Cell 侧零改动
- 2026-11-25 23:52:13：标题线与上下间距统一归 `CardHead`：非首标题画上线并带上间距，后面有正文才画下线并带下间距；末尾标题只有上线，接缝不叠线
- 2026-11-14 12:37:19：默认圆角改 md（与控件同档 12px）
- 2026-11-14：头部默认带分隔线（`headerDivider` 不给就跟随头部）；说明字号降到 `--mptk-font-xs`
- 2026-11-15 00:20:59：取值真源改为 kit.config.mjs
- 2026-11-15：形态扩成一支 `variant`（`surface` / `filled` / `outline` / `plain`），取代 `frame` 布尔开关；`radius` 补 `none`；补 `footerDivider` 且与 `headerDivider` 同口径默认跟随；色值按形态落通道（有面染底、只有边染线、`plain` 不参与）；按压反馈改为半透明叠加层（新增 `--mptk-card-press`），自定义色值与四种形态都能看到反馈
- 2026-11-17：头/底分区线由 `--mptk-border-faint` 升到 `--mptk-border`，与 CellGroup 外框/标题线同为一级结构线，深浅口径统一
- 2026-11-16 13:48:23：按压反馈抬手后 70ms 恢复（PRESS_STAY_TIME）
- 2026-11-17：CellGroup 位置档注入改为穿透包装层（原来只扫 body 顶层，内容被 View 包一层时全部落回 `none`，上下框线消失）
- 2026-11-17：位置档改成边界提示（上 / 下边界两个布尔）：底线归前一块画（每个分组封口，最后一个元素不画），上边界只在前面是普通内容时画，分组处恒好一条线；浮层跳过说明同步改写，`Overlay` / `Drawer` / `Dropdown` / `Dialog` 补上脱离文档流声明（`Toast` / `Loading` 是行内组件，不声明）
- 2026-11-17：边界遍历补上 `{list.map(…)}` 的数组与 `{cond && …}` 留下的 `false` / `null`：以前数组被当成一块「普通内容」，前一组因此多勾一条底线、数组里的组整块拿不到提示（这就是卡片里「标题上方多一条线」的来源）；`hasCardEdgeContent` 同步跳过脱离文档流的子树
