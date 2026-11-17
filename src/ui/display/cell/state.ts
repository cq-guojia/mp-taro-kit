/** Cell / CellGroup 的状态与类名解析：零 React / Taro 依赖，自检可直接调用真实逻辑。 */
import type { CardEdgePosition } from '../../infra/card-edge.js'

export type CellSize = 'normal' | 'large'
/** 右侧值的字号档：`xs` 与 label 同档（默认），`sm` 与标题同档。 */
export type CellValueSize = 'xs' | 'sm'
export type CellArrowDirection = 'right' | 'left' | 'up' | 'down'

export interface CellStateInput {
  center?: boolean
  border?: boolean
  size?: CellSize
  valueSize?: CellValueSize
  /** 只管箭头是否渲染，不参与点击态与类名派生。 */
  isLink?: boolean
  arrowDirection?: CellArrowDirection
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export interface CellState {
  className: string
  hoverClassName: string
  valueClassName: string
  arrowClassName: string
  clickable: boolean
  divider: boolean
}

export function resolveCellState(input: CellStateInput): CellState {
  const clickable = input.onClick !== undefined && input.disabled !== true
  const divider = input.border !== false
  const names = ['mptk-cell']
  /* 默认垂直居中（WeUI / TDesign 都以此为默认）；显式 center={false} 才回到顶部对齐。 */
  if (input.center === false) names.push('mptk-cell--top')
  else if (input.center === true) names.push('mptk-cell--center')
  if (input.size === 'large') names.push('mptk-cell--large')
  if (input.disabled === true) names.push('mptk-cell--disabled')
  if (divider) names.push('mptk-cell--divider')
  if (input.className) names.push(input.className)
  return {
    className: names.join(' '),
    hoverClassName: clickable ? 'mptk-cell--clickable' : 'none',
    valueClassName: `mptk-cell__value${input.valueSize === 'sm' ? ' mptk-cell__value--sm' : ''}`,
    arrowClassName: `mptk-cell__arrow mptk-cell__arrow--${input.arrowDirection ?? 'right'}`,
    clickable,
    divider,
  }
}

export type CellDividerTone = 'soft' | 'match'

/** 上下外边框形态：CSS 本来就把 border-top / border-bottom 当两个独立属性，这里照抄这个模型。 */
export type CellGroupBorder = 'none' | 'top' | 'bottom' | 'both'

export interface CellGroupStateInput {
  inset?: boolean
  /** 上下外边框：`true` = both、`false` = none；不给则按上下文推导（见 edgePosition）。显式传值优先。 */
  border?: boolean | CellGroupBorder
  dividerTone?: CellDividerTone
  frame?: boolean
  /** 由 Card 的上下文传入：装在卡片里。消费方无需传参。 */
  inCard?: boolean
  /** Card 在渲染期注入的位置档；只在不传 border 时用来推导该画哪条外框线。消费方无需传。 */
  edgePosition?: CardEdgePosition
  /** 由 CellGroup 在渲染期传入：有组标题。标题与列表之间永远一条线，不随位置档丢。 */
  hasTitle?: boolean
  className?: string
}

export interface CellGroupState {
  className: string
  bodyClassName: string
  /** 任意一条边在画（兼容旧字段）。 */
  outerBorder: boolean
  borderTop: boolean
  borderBottom: boolean
  /** 标题与列表之间那条线由标题自己提供：有标题且位置档不画上边线时为真。 */
  titleDivider: boolean
}

/** 布尔兼容旧写法；显式值优先，没传才用上下文推导出的 fallback。 */
function resolveBorderEdges(
  border: boolean | CellGroupBorder | undefined,
  fallback: CellGroupBorder,
): { borderTop: boolean; borderBottom: boolean } {
  const shape: CellGroupBorder =
    border === true ? 'both' : border === false ? 'none' : border ?? fallback
  return {
    borderTop: shape === 'both' || shape === 'top',
    borderBottom: shape === 'both' || shape === 'bottom',
  }
}

/**
 * 卡片内按位置派生外框线：**只画下边线，永不画上边线**。
 *
 * 组与组之间的分隔只由「前一组的底边线」提供：后一组再画一条上边线，两条就会紧挨着出现
 * 双线（上一组底 + 下一组顶），而且上边线落在列表顶部、标题在它上面，表现为「标题下没线、
 * 组上面多一条」。第一组贴卡片边界/标题区不画，最后一组贴卡片底不画，中间每组一条底线。
 * 想要组的顶部边框由消费方显式传 `border="top" | "both"`。
 */
function defaultBorderInCard(position: CardEdgePosition | undefined): CellGroupBorder {
  switch (position) {
    case 'first':
    case 'middle': return 'bottom'
    default: return 'none'
  }
}

export function resolveCellGroupState(input: CellGroupStateInput): CellGroupState {
  const inset = input.inset === true
  const inCard = input.inCard === true
  const names = ['mptk-cell-group', inset ? 'mptk-cell-group--inset' : 'mptk-cell-group--flush']
  if (inCard) names.push('mptk-cell-group--in-card')
  if (input.dividerTone === 'match') names.push('mptk-cell-group--divider-match')
  if (input.frame === false) names.push('mptk-cell-group--frameless')
  if (input.className) names.push(input.className)
  const body = ['mptk-cell-group__body']
  if (inset) body.push('mptk-cell-group__body--inset')
  /* 卡片形态（inset）的四边由 frame 管，这里只管通栏 / 卡片内列表的上下两条线。 */
  const edges = inset
    ? { borderTop: false, borderBottom: false }
    : resolveBorderEdges(input.border, inCard ? defaultBorderInCard(input.edgePosition) : 'both')
  /* 标题与列表之间必须恰好一条线：位置档不画上边线时（first / single，或卡片内无位置档），
     这条线由标题自己给；位置档画上边线时线就落在列表顶部，标题不再重复画。
     inset 形态的列表自带四边描边，标题在外侧，同样不重复。 */
  const titleDivider = input.hasTitle === true && !inset && !edges.borderTop
  return {
    className: names.join(' '),
    bodyClassName: body.join(' '),
    outerBorder: edges.borderTop || edges.borderBottom,
    borderTop: edges.borderTop,
    borderBottom: edges.borderBottom,
    titleDivider,
  }
}

/** 组内最后一格不画分隔线：位置由 Group 算出，不依赖结构伪类。 */
export function cellDividerVisible(border: boolean, index: number, lastCellIndex: number): boolean {
  return border && index !== lastCellIndex
}
