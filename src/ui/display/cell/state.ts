/** Cell / CellGroup 的状态与类名解析：零 React / Taro 依赖，自检可直接调用真实逻辑。 */
import type { CardEdgeLines } from '../../infra/card-edge.js'

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
  /** 上下外边框：`true` = both、`false` = none；不给则按上下文推导（见 edgeLines）。显式传值优先。 */
  border?: boolean | CellGroupBorder
  dividerTone?: CellDividerTone
  /** 行间线左右是否留白；默认 true（与行文字对齐），false 通到容器边。 */
  dividerInset?: boolean
  frame?: boolean
  /** 由 Card 的上下文传入：装在卡片里。消费方无需传参。 */
  inCard?: boolean
  /** Card 在渲染期注入的边界提示；只在不传 border 时用来推导该画哪条外框线。消费方无需传。 */
  edgeLines?: CardEdgeLines
  /** 由 CellGroup 在渲染期传入：有组标题。标题与列表之间永远一条线，不随卡片位置丢。 */
  hasTitle?: boolean
  className?: string
}

export interface CellGroupState {
  className: string
  bodyClassName: string
  /** 上下任一条边在画（Card 与自检据此判断组有没有外框）。 */
  outerBorder: boolean
  borderTop: boolean
  borderBottom: boolean
  /** 标题与列表之间那条线由标题自己提供：有标题且外框顶线未画时为真。 */
  titleDivider: boolean
}

/** 布尔兼容旧写法；显式值优先，没传才用上下文推导出的 fallback。 */
function resolveBorderEdges(
  border: boolean | CellGroupBorder | undefined,
  fallback: { top: boolean; bottom: boolean },
): { borderTop: boolean; borderBottom: boolean } {
  if (border === true) return { borderTop: true, borderBottom: true }
  if (border === false) return { borderTop: false, borderBottom: false }
  if (border === undefined) return { borderTop: fallback.top, borderBottom: fallback.bottom }
  return {
    borderTop: border === 'both' || border === 'top',
    borderBottom: border === 'both' || border === 'bottom',
  }
}

/**
 * 线的归属（全形态唯一规则）：
 *
 * 1. 相邻两块的分界处恒好一条线，任何两条线都不许紧挨；
 * 2. 底线归前一块画：每个分组的下边界是它自己的封口线，只有自己排在最后才不画（卡片底边接管）；
 * 3. 上边界只在前面是普通内容时画：紧跟卡片标题栏（标题栏自带线）或上一分组
 *    （上一组的底线就是这条线）时让位，自己是第一块也不画；
 * 4. 有标题时，标题与列表之间那条线：外框顶线画了就由它承担（它排在标题之后），
 *    没画（标题栏 / 上一组的线接管）就由标题线补上。
 *
 * 通栏（不在 Card 里）整块自带上下两条封口边界；卡片内由 Card 逐块注入 `edgeLines`。
 */
export function resolveCellGroupState(input: CellGroupStateInput): CellGroupState {
  const inset = input.inset === true
  const inCard = input.inCard === true
  const titled = input.hasTitle === true && !inset
  const names = ['mptk-cell-group', inset ? 'mptk-cell-group--inset' : 'mptk-cell-group--flush']
  if (inCard) names.push('mptk-cell-group--in-card')
  if (input.dividerTone === 'match') names.push('mptk-cell-group--divider-match')
  /* 行间线内缩默认开：即使不传也派生类名，让「默认内缩」成为可见的组件状态，
     而不是靠 CSS 基础规则凑出来的巧合。只有显式 false 才切通底。 */
  names.push(input.dividerInset === false ? 'mptk-cell-group--divider-flush' : 'mptk-cell-group--divider-inset')
  if (input.frame === false) names.push('mptk-cell-group--frameless')
  if (input.className) names.push(input.className)
  const body = ['mptk-cell-group__body']
  if (inset) body.push('mptk-cell-group__body--inset')
  /* 卡片形态（inset）的四边由 frame 管，这里只管通栏 / 卡片内列表的上下两条线。 */
  const hint = inCard
    ? input.edgeLines ?? { top: false, bottom: false }
    : { top: true, bottom: true }
  /* 卡片内的提示已按文档顺序算好归属，直接用；显式 border 给的方向永远优先。 */
  const fallback = hint
  const edges = inset
    ? { borderTop: false, borderBottom: false }
    : resolveBorderEdges(input.border, fallback)
  /* 标题与列表之间恒好一条线：外框顶线画了就由它承担（它就排在标题之后），没画（卡片内默认、
     通栏显式关掉顶线）就由标题线补上。inset 的四边归 frame，标题线不参与。 */
  const titleDivider = titled && !edges.borderTop
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
