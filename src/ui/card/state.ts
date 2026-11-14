/** Card 的状态与类名解析：零 React / Taro 依赖，Node 自检可直接调用真实逻辑。 */

/** 圆角枚举：容器级档位，值只在 src/design/_tokens.scss 写一次。 */
export const CARD_RADII = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export type CardRadius = (typeof CARD_RADII)[number]

/** 内容密度枚举：只换分区间距，不换字号与圆角。 */
export const CARD_SIZES = ['sm', 'md', 'lg'] as const
export type CardSize = (typeof CARD_SIZES)[number]

/** 内置色名：对齐 _tokens.scss 的 8 支色相；neutral 回到中性面。 */
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

export interface CardStateInput {
  radius?: CardRadius
  size?: CardSize
  frame?: boolean
  /** 不给就跟随 hasHeader：有头部默认画线，显式 false 才关。 */
  headerDivider?: boolean
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
  inlineColor: string | undefined
}

export function resolveCardState(input: CardStateInput): CardState {
  const clickable = input.onClick !== undefined && input.disabled !== true
  const busy = input.loading === true
  const { className: colorClass, inlineColor } = resolveCardColor(input.color)
  const names = ['mptk-card']
  /* 不给 radius 就走 --mptk-card-radius，宿主不必知道变量名单。 */
  if (input.radius !== undefined) names.push(`mptk-card--radius-${input.radius}`)
  names.push(`mptk-card--size-${input.size ?? 'md'}`)
  if (input.frame === false) names.push('mptk-card--frameless')
  /* 有头部就默认画线：标题区与内容区靠一条 1px 分开；显式 headerDivider={false} 才不画。 */
  if (input.headerDivider ?? (input.hasHeader === true)) names.push('mptk-card--header-divider')
  if (input.hasCover === true) names.push('mptk-card--cover')
  if (colorClass) names.push(colorClass)
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
    inlineColor,
  }
}
