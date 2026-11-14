/** Cell / CellGroup 的状态与类名解析：零 React / Taro 依赖，自检可直接调用真实逻辑。 */

export type CellSize = 'normal' | 'large'
export type CellArrowDirection = 'right' | 'left' | 'up' | 'down'

export interface CellStateInput {
  center?: boolean
  border?: boolean
  size?: CellSize
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
  /** 上下外边框：`true` = both、`false` = none；不给则跟随上下文（通栏画上下、装在 Card 里不画）。 */
  border?: boolean | CellGroupBorder
  dividerTone?: CellDividerTone
  frame?: boolean
  /** 由 Card 的上下文传入：装在卡片里时本组不再画自己的外框。消费方无需传参。 */
  inCard?: boolean
  className?: string
}

export interface CellGroupState {
  className: string
  bodyClassName: string
  /** 任意一条边在画（兼容旧字段）。 */
  outerBorder: boolean
  borderTop: boolean
  borderBottom: boolean
}

/** 布尔兼容旧写法；不给则跟随上下文：通栏默认上下都画，卡片形态与装在 Card 里默认都不画。 */
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
    : resolveBorderEdges(input.border, inCard ? 'none' : 'both')
  return {
    className: names.join(' '),
    bodyClassName: body.join(' '),
    outerBorder: edges.borderTop || edges.borderBottom,
    borderTop: edges.borderTop,
    borderBottom: edges.borderBottom,
  }
}

/** 组内最后一格不画分隔线：位置由 Group 算出，不依赖结构伪类。 */
export function cellDividerVisible(border: boolean, index: number, lastCellIndex: number): boolean {
  return border && index !== lastCellIndex
}
