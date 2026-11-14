import { View, Text } from '@tarojs/components'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'
import { useCardSurface } from '../../infra/card-context.js'
import { markCardEdgeContent } from '../../infra/card-edge.js'
import { Cell, type CellProps } from './Cell.js'
import { cellDividerVisible, resolveCellGroupState, type CellDividerTone } from './state.js'

export interface CellGroupProps {
  title?: ReactNode
  /** 圆角内收的卡片风格；不给则是左右通到底的通栏。 */
  inset?: boolean
  /** 通栏形态下是否画上下外边框；卡片形态与装在 Card 内时都不画。 */
  border?: boolean
  /** 组内分隔线颜色档位：soft 比外框浅一档（默认），match 与外框同色。 */
  dividerTone?: CellDividerTone
  /** 卡片形态的四边描边；默认有，false 得到无边框卡片。通栏形态不受影响。 */
  frame?: boolean
  children?: ReactNode
  className?: string
}

/** 单元格分组：通栏 / 卡片共用一套 DOM，最后一格的分隔线由位置决定。
    装在 Card 里时由上下文自动关掉上下外框与自身底色，消费方无需传参。 */
export function CellGroup({
  title,
  inset = false,
  border = true,
  dividerTone,
  frame,
  children,
  className,
}: CellGroupProps) {
  const { inCard } = useCardSurface()
  const state = resolveCellGroupState({ inset, border, dividerTone, frame, inCard, className })
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
      {title !== undefined && (
        <View className="mptk-cell-group__title">
          <Text>{title}</Text>
        </View>
      )}
      <View className={state.bodyClassName}>
        {cells}
        {state.outerBorder && <View className="mptk-cell-group__border mptk-cell-group__border--top" />}
        {state.outerBorder && <View className="mptk-cell-group__border mptk-cell-group__border--bottom" />}
      </View>
    </View>
  )
}

/* 向 Card 声明：本组每行自带上下留白，壳不该再给一层 padding。
   声明是渲染期静态契约，消费方零参数，也不需要 Card import cell 子域。 */
markCardEdgeContent(CellGroup)
