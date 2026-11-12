import { View, Text } from '@tarojs/components'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'
import { Cell, type CellProps } from './Cell.js'
import { cellDividerVisible, resolveCellGroupState } from './state.js'

export interface CellGroupProps {
  title?: ReactNode
  /** 圆角内收的卡片风格；不给则是左右通到底的通栏。 */
  inset?: boolean
  /** 通栏形态下是否画上下外边框；卡片形态不画。 */
  border?: boolean
  children?: ReactNode
  className?: string
}

/** 单元格分组：通栏 / 卡片共用一套 DOM，最后一格的分隔线由位置决定。 */
export function CellGroup({
  title,
  inset = false,
  border = true,
  children,
  className,
}: CellGroupProps) {
  const state = resolveCellGroupState({ inset, border, className })
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
