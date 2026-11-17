import { View, Text } from '@tarojs/components'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'
import { useCardSurface } from '../../infra/card-context.js'
import { CARD_EDGE_LINES_PROP, markCardEdgeContent, type CardEdgeLines } from '../../infra/card-edge.js'
import { Cell, type CellProps } from './Cell.js'
import {
  cellDividerVisible,
  resolveCellGroupState,
  type CellDividerTone,
  type CellGroupBorder,
} from './state.js'

export interface CellGroupProps {
  title?: ReactNode
  /** 圆角内收的卡片风格；不给则是左右通到底的通栏。 */
  inset?: boolean
  /**
   * 上下外边框：`'none' | 'top' | 'bottom' | 'both'`，也接受 `true`（= both）/ `false`（= none）。
   * 不给则跟随上下文：通栏整块画上下；装在 Card 里按 Card 注入的边界提示只画分界处缺的那条。
   * 卡片形态（`inset`）的四边由 `frame` 管，`border` 对它不生效。
   */
  border?: boolean | CellGroupBorder
  /** 组内分隔线颜色档位：soft 比外框浅一档（默认），match 与外框同色。 */
  dividerTone?: CellDividerTone
  /**
   * 行与行之间的分隔线左右是否留白；默认 `true`，端点与行文字对齐。
   * `false` 通到底：通栏到屏幕边，装在 Card 里到卡片边（组级结构线始终通底，不受此参数影响）。
   */
  dividerInset?: boolean
  /** 卡片形态的四边描边；默认有，false 得到无边框卡片。通栏形态不受影响。 */
  frame?: boolean
  children?: ReactNode
  className?: string
  /** 内部字段：Card 渲染期注入的边界提示，消费方不传；决定没显式给 border 时画哪条外框线。 */
  [CARD_EDGE_LINES_PROP]?: CardEdgeLines
}

/** 单元格分组：通栏 / 卡片共用一套 DOM，最后一格的分隔线按位置自动收掉。
    装在 Card 里时收到「上 / 下边界要不要画」的提示，分组处恒好一条线，消费方无需传参。 */
export function CellGroup({
  title,
  inset = false,
  border,
  dividerTone,
  dividerInset,
  frame,
  children,
  className,
  [CARD_EDGE_LINES_PROP]: edgeLines,
}: CellGroupProps) {
  const { inCard } = useCardSurface()
  /* 空标题（null / 空串）渲染不出文字，不能当成「有标题」多画一条标题线。 */
  const hasTitle = title !== undefined && title !== null && title !== ''
  const state = resolveCellGroupState({
    inset, border, dividerTone, dividerInset, frame, inCard, edgeLines, className, hasTitle,
  })
  const items = Children.toArray(children)
  let lastCellIndex = -1
  items.forEach((item, index) => {
    if (isValidElement(item) && item.type === Cell) lastCellIndex = index
  })
  const cells = items.map((item, index) => {
    if (!isValidElement<CellProps>(item) || item.type !== Cell) return item
    const ownBorder = item.props.border !== false
    return cloneElement(item, { border: cellDividerVisible(ownBorder, index, lastCellIndex) })
  })

  return (
    <View className={state.className}>
      {hasTitle && (
        <View className="mptk-cell-group__title">
          <Text>{title}</Text>
        </View>
      )}
      {/* 外框线是普通流内元素，不用 absolute 定位：absolute 依赖父级 position 基准，
          一旦基准在某个端上不成立，线就会跑到组外面，与相邻组/标题线叠成两条。
          流内元素的高度计入布局，位置只由前后兄弟决定，不会叠。
          顶线排在标题之后：它标的是列表的上边界，有标题时正好落在标题与列表之间。 */}
      {state.borderTop && <View className="mptk-cell-group__border mptk-cell-group__border--top" />}
      {/* 标题与列表之间那条线：卡片内默认、或通栏显式关掉顶线时，由标题侧补上；与顶线互斥。 */}
      {state.titleDivider && <View className="mptk-cell-group__title-divider" />}
      <View className={state.bodyClassName}>{cells}</View>
      {state.borderBottom && <View className="mptk-cell-group__border mptk-cell-group__border--bottom" />}
    </View>
  )
}

/* 向 Card 声明：本组每行自带上下留白，壳不该再给一层 padding。
   声明是渲染期静态契约，消费方零参数，也不需要 Card import cell 子域。 */
markCardEdgeContent(CellGroup)
