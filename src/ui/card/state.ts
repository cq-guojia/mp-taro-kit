/** Card 的状态与类名解析：零 React / Taro 依赖，Node 自检可直接调用真实逻辑。 */

/** 形态枚举：面与边的四种组合，一轴说清「要不要底、要不要边」。 */
export const CARD_VARIANTS = ['surface', 'filled', 'outline', 'plain'] as const
export type CardVariant = (typeof CARD_VARIANTS)[number]

/** 圆角枚举：容器级档位，值只在 kit.config.mjs 写一次。none 给通栏 / 直角场景。 */
export const CARD_RADII = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const
export type CardRadius = (typeof CARD_RADII)[number]

/** 内容密度枚举：只换分区间距，不换字号与圆角。 */
export const CARD_SIZES = ['sm', 'md', 'lg'] as const
export type CardSize = (typeof CARD_SIZES)[number]

/** 内置色名：对齐 kit.config.mjs 的 8 支色相；neutral 回到中性面。 */
export const CARD_COLORS = [
  'neutral', 'blue', 'green', 'orange', 'red', 'purple', 'cyan', 'pink', 'teal',
] as const
export type BuiltinCardColor = (typeof CARD_COLORS)[number]

/** 内置色名，或任意 CSS 色值（#rrggbb / rgb() / var() 等）。 */
export type CardColor = BuiltinCardColor | (string & {})

export interface CardColorParts {
  className: string
  inlineColor: string | undefined
}

/** 内置色走类名切变量；自定义色值走显式内联样式，两条路互不掺。 */
export function resolveCardColor(color?: CardColor): CardColorParts {
  if (color === undefined) return { className: '', inlineColor: undefined }
  if ((CARD_COLORS as readonly string[]).includes(color)) {
    return { className: `mptk-card--${color}`, inlineColor: undefined }
  }
  return { className: '', inlineColor: color }
}

/** 根节点的内联样式：色值落在哪条通道由形态决定，不靠行内自定义属性。 */
export interface CardInlineStyle {
  backgroundColor?: string
  borderColor?: string
}

export interface CardStateInput {
  variant?: CardVariant
  radius?: CardRadius
  size?: CardSize
  /** 不给就跟随 hasHeader：有头部默认画线，显式 false 才关。 */
  headerDivider?: boolean
  /** 不给就跟随 hasFooter：有底部默认画线，显式 false 才关。 */
  footerDivider?: boolean
  color?: CardColor
  hasCover?: boolean
  /** 由 Card 渲染期从槽位派生：有标题 / 副标题 / 右侧操作就算有头部。 */
  hasHeader?: boolean
  /** 由 Card 渲染期从槽位派生：有底部操作区。 */
  hasFooter?: boolean
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  /** 由 Card 渲染期从 children 派生：内容是贴边组件时，壳自己关掉上下留白。 */
  hasEdgeContent?: boolean
  className?: string
}

export interface CardState {
  className: string
  hoverClassName: string
  clickable: boolean
  busy: boolean
  inlineStyle: CardInlineStyle | undefined
}

/** 色值落在哪条通道：有面的形态染底，只有边的形态染线，plain 不参与。 */
function resolveInlineStyle(
  variant: CardVariant,
  inlineColor: string | undefined,
): CardInlineStyle | undefined {
  if (inlineColor === undefined || variant === 'plain') return undefined
  return variant === 'outline' ? { borderColor: inlineColor } : { backgroundColor: inlineColor }
}

export function resolveCardState(input: CardStateInput): CardState {
  const variant = input.variant ?? 'surface'
  const clickable = input.onClick !== undefined && input.disabled !== true
  const busy = input.loading === true
  const color = resolveCardColor(input.color)
  const names = ['mptk-card']
  /* 形态始终显式派生：四个值各有一种面 / 边组合，宿主不必自己拼开关。 */
  names.push(`mptk-card--${variant}`)
  /* 不给 radius 就走 --mptk-card-radius，宿主不必知道变量名单。 */
  if (input.radius !== undefined) names.push(`mptk-card--radius-${input.radius}`)
  names.push(`mptk-card--size-${input.size ?? 'md'}`)
  /* 有头部就默认画线：标题区与内容区靠一条 1px 分开；显式 headerDivider={false} 才不画。 */
  if (input.headerDivider ?? (input.hasHeader === true)) names.push('mptk-card--header-divider')
  /* 底部操作区同口径：有 footer 就默认画线，两个分区的默认行为一致。 */
  if (input.footerDivider ?? (input.hasFooter === true)) names.push('mptk-card--footer-divider')
  if (input.hasCover === true) names.push('mptk-card--cover')
  /* plain 没有面也没有边，色值无处可落，连类名都不派生，不装作生效。 */
  if (color.className && variant !== 'plain') names.push(color.className)
  if (clickable) names.push('mptk-card--clickable')
  if (busy) names.push('mptk-card--busy')
  if (input.disabled === true) names.push('mptk-card--disabled')
  /* 内容是贴边组件：壳自己关掉留白，不留空白给子级抵消。
     只在真正贴边的那一端归零——有头部就保留上留白，有底部就保留下留白。 */
  if (input.hasEdgeContent === true) {
    names.push('mptk-card--edge-content')
    if (input.hasHeader !== true) names.push('mptk-card--edge-top')
    if (input.hasFooter !== true) names.push('mptk-card--edge-bottom')
  }
  if (input.className) names.push(input.className)
  return {
    className: names.join(' '),
    hoverClassName: clickable ? 'mptk-card--pressed' : 'none',
    clickable,
    busy,
    inlineStyle: resolveInlineStyle(variant, color.inlineColor),
  }
}
