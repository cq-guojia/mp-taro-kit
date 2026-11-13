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
  if (input.center === true) names.push('mptk-cell--center')
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

export interface CellGroupStateInput {
  inset?: boolean
  border?: boolean
  dividerTone?: CellDividerTone
  dividerInset?: boolean
  frame?: boolean
  /** 由 Card 的上下文传入：装在卡片里时本组不再画自己的外框。消费方无需传参。 */
  inCard?: boolean
  className?: string
}

export interface CellGroupState {
  className: string
  bodyClassName: string
  outerBorder: boolean
}

export function resolveCellGroupState(input: CellGroupStateInput): CellGroupState {
  const inset = input.inset === true
  const names = ['mptk-cell-group', inset ? 'mptk-cell-group--inset' : 'mptk-cell-group--flush']
  if (input.inCard === true) names.push('mptk-cell-group--in-card')
  if (input.dividerTone === 'match') names.push('mptk-cell-group--divider-match')
  if (input.dividerInset === true) names.push('mptk-cell-group--divider-inset')
  if (input.frame === false) names.push('mptk-cell-group--frameless')
  if (input.className) names.push(input.className)
  const body = ['mptk-cell-group__body']
  if (inset) body.push('mptk-cell-group__body--inset')
  return {
    className: names.join(' '),
    bodyClassName: body.join(' '),
    /* 卡片已提供壳：装在里面的组不再画自己的上下外框。 */
    outerBorder: input.border !== false && !inset && input.inCard !== true,
  }
}

/** 组内最后一格不画分隔线：位置由 Group 算出，不依赖结构伪类。 */
export function cellDividerVisible(border: boolean, index: number, lastCellIndex: number): boolean {
  return border && index !== lastCellIndex
}
