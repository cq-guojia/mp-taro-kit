import { View } from '@tarojs/components'
import { Children } from 'react'
import type { ReactNode } from 'react'
import { CardSurfaceContext, CARD_SURFACE_INSIDE } from '../infra/card-context.js'
import { PRESS_STAY_TIME } from '../infra/press.js'
import {
  cardStartsWithSectionHead,
  decorateCardEdgeChildren,
  hasCardEdgeContent,
  hasCardSectionHead,
} from './edge.js'
import {
  resolveCardState,
  type CardColor,
  type CardRadius,
  type CardSize,
  type CardVariant,
} from './state.js'

export interface CardProps {
  /** 顶部封面 / 媒体区；不给就不渲染这一块。 */
  cover?: ReactNode
  /** 底部操作区。 */
  footer?: ReactNode
  /** 主体内容；槽位全部可选，什么都不给就是一块纯壳。 */
  children?: ReactNode
  /** 形态：surface 面 + 边（默认）/ filled 只有面 / outline 只有边 / plain 都没有。 */
  variant?: CardVariant
  /** 圆角枚举；不给走 --mptk-card-radius（容器级默认档）。 */
  radius?: CardRadius
  /** 内容密度枚举，只换分区间距；默认 md。 */
  size?: CardSize
  /** 主体与底部之间的分隔线；不给则跟随底部：有 footer 默认画，传 false 关掉。 */
  footerDivider?: boolean
  /** 内置色名或任意 CSS 色值；有面时染底，只有边时染线，纯排版形态不参与。 */
  color?: CardColor
  /** 给了才派生按压态，disabled 短路；跳转由宿主注入，本库不接路由。 */
  onClick?: () => void
  disabled?: boolean
  /** 等待态：给了 loadingContent 就替换主体，否则保留内容只降一档存在感。 */
  loading?: boolean
  loadingContent?: ReactNode
  className?: string
}

function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false
}

/** 卡片族第一种样式：带圆角的通用内容壳。分区按需渲染，不给的槽位不产生节点。
    形态由 variant 一轴决定（面 / 边的四种组合），色值由 color 落到该形态真正可见的通道。
    同时向后代声明「你在卡片里」，CellGroup 收到后自己收敛外框与留白，消费方零参数。 */
export function Card({
  cover,
  footer,
  children,
  variant,
  radius,
  size,
  footerDivider,
  color,
  onClick,
  disabled,
  loading,
  loadingContent,
  className,
}: CardProps) {
  const hasCover = filled(cover)
  const hasFooter = filled(footer)
  const body = loading === true && filled(loadingContent) ? loadingContent : children
  const bodyChildren = Children.toArray(body)
  const state = resolveCardState({
    variant, radius, size, footerDivider, color,
    hasCover, hasFooter, onClick, disabled, loading, className,
    hasEdgeContent: hasCardEdgeContent(body),
    hasSectionHead: cardStartsWithSectionHead(bodyChildren),
  })

  // 渲染期给内容里的列表注入边界提示：穿透包装层找到真正的 CellGroup，Card 不 import cell 子域，消费方零参数。
  const decoratedBody = decorateCardEdgeChildren(bodyChildren)
  /* 标题与列表走满宽层，普通内容才包一层带左右留白的层；横线宽度不再随卡里装什么变。 */
  const bodyNodes: ReactNode[] = []
  let plain: ReactNode[] = []
  const emitPlain = (key: number) => {
    if (plain.length === 0) return
    bodyNodes.push(<View key={`plain-${key}`} className="mptk-card__content">{plain}</View>)
    plain = []
  }
  decoratedBody.forEach((node, index) => {
    if (hasCardEdgeContent(node) || hasCardSectionHead(node)) {
      emitPlain(index)
      bodyNodes.push(node)
    } else {
      plain.push(node)
    }
  })
  emitPlain(decoratedBody.length)

  return (
    <CardSurfaceContext.Provider value={CARD_SURFACE_INSIDE}>
      <View
        className={state.className}
        hoverClass={state.hoverClassName}
        hoverStayTime={PRESS_STAY_TIME}
        style={state.inlineStyle}
        onClick={state.clickable ? onClick : undefined}
      >
        {hasCover ? <View className="mptk-card__cover">{cover}</View> : null}
        <View className="mptk-card__body">{bodyNodes}</View>
        {hasFooter ? <View className="mptk-card__footer">{footer}</View> : null}
      </View>
    </CardSurfaceContext.Provider>
  )
}
