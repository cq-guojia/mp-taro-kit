import { View, Text } from '@tarojs/components'
import { Children, cloneElement, isValidElement } from 'react'
import type { ReactNode } from 'react'
import { Cell, type CellProps } from './Cell.js'
import { cellDividerVisible, resolveCellGroupState, type CellDividerTone } from './state.js'

export interface CellGroupProps {
  title?: ReactNode
  /** 圆角内收的卡片风格；不给则是左右通到底的通栏。 */
  inset?: boolean
  /** 通栏形态下是否画上下外边框；卡片形态不画。 */
  border?: boolean
  /** 组内分隔线颜色档位：soft 比外框浅一档（默认），match 与外框同色。 */
  dividerTone?: CellDividerTone
  /** 组内分隔线左右内缩，像微信那样留出距离；默认贯穿到两侧。 */
  dividerInset?: boolean
  /** 卡片形态的四边描边；默认有，false 得到无边框卡片。通栏形态不受影响。 */
  frame?: boolean
  children?: ReactNode
  className?: string
}

/** 单元格分组：通栏 / 卡片共用一套 DOM，最后一格的分隔线由位置决定。 */
export function CellGroup({
  title,
  inset = false,
  border = true,
  dividerTone,
  dividerInset,
  frame,
  children,
  className,
}: CellGroupProps) {
  const state = resolveCellGroupState({ inset, border, dividerTone, dividerInset, frame, className })
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
