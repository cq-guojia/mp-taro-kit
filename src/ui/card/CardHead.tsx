import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import {
  CARD_EDGE_LINES_PROP,
  markCardSectionHead,
  type CardEdgeLines,
} from '../infra/card-edge.js'

export interface CardHeadProps {
  /** 标题区内容：宿主自己写 View 挂 mptk-card__title / __subtitle，图标等节点随便塞。 */
  children?: ReactNode
  className?: string
  /** 内部字段：Card 渲染期注入的边界提示，消费方不传。 */
  [CARD_EDGE_LINES_PROP]?: CardEdgeLines
}

/** 卡片内可重复的段头：只标识「从这里起一段」，段间线由 Card 的边界提示决定。
    正文是它的兄弟节点，所以不声明贴边——Card 的 body 留白必须留着。 */
export function CardHead({
  children,
  className,
  [CARD_EDGE_LINES_PROP]: edgeLines,
}: CardHeadProps) {
  const names = ['mptk-card-head']
  /* 线都归标题：前面有内容画上线，后面有正文画下线，间距跟着线走。 */
  if (edgeLines?.top === true) names.push('mptk-card-head--divider-top')
  if (edgeLines?.bottom === true) names.push('mptk-card-head--divider')
  if (className) names.push(className)
  return <View className={names.join(' ')}>{children}</View>
}

/* 向 Card 声明：本组件是段头，参与边界计算但不自带贴边留白。 */
markCardSectionHead(CardHead)
