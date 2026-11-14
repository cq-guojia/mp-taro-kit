import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { CardSurfaceContext, CARD_SURFACE_INSIDE } from '../infra/card-context.js'
import { hasCardEdgeContent } from './edge.js'
import { resolveCardState, type CardColor, type CardRadius, type CardSize } from './state.js'

export interface CardProps {
  /** 顶部封面 / 媒体区；不给就不渲染这一块。 */
  cover?: ReactNode
  /** 头部标题。 */
  title?: ReactNode
  /** 标题下的副标题 / 描述。 */
  subtitle?: ReactNode
  /** 头部右侧的操作区。 */
  extra?: ReactNode
  /** 底部操作区。 */
  footer?: ReactNode
  /** 主体内容；槽位全部可选，什么都不给就是一块纯壳。 */
  children?: ReactNode
  /** 圆角枚举；不给走 --mptk-card-radius（容器级默认档）。 */
  radius?: CardRadius
  /** 内容密度枚举，只换分区间距；默认 md。 */
  size?: CardSize
  /** 四边描边；默认有，false 得到无边框卡片。 */
  frame?: boolean
  /** 头部与主体之间的分隔线；不给则跟随头部：有头部默认画，传 false 关掉。 */
  headerDivider?: boolean
  /** 内置色名或任意 CSS 色值；不给走 --mptk-card-bg。 */
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
    同时向后代声明「你在卡片里」，CellGroup 收到后自己收敛外框与留白，消费方零参数。 */
export function Card({
  cover,
  title,
  subtitle,
  extra,
  footer,
  children,
  radius,
  size,
  frame,
  headerDivider,
  color,
  onClick,
  disabled,
  loading,
  loadingContent,
  className,
}: CardProps) {
  const hasHeader = filled(title) || filled(subtitle) || filled(extra)
  const hasCover = filled(cover)
  const body = loading === true && filled(loadingContent) ? loadingContent : children
  const state = resolveCardState({
    radius, size, frame, headerDivider, color, hasCover, hasHeader, onClick, disabled, loading, className,
    hasFooter: filled(footer),
    hasEdgeContent: hasCardEdgeContent(body),
  })
  const cardStyle = state.inlineColor !== undefined ? { backgroundColor: state.inlineColor } : undefined

  return (
    <CardSurfaceContext.Provider value={CARD_SURFACE_INSIDE}>
      <View
        className={state.className}
        hoverClass={state.hoverClassName}
        style={cardStyle}
        onClick={state.clickable ? onClick : undefined}
      >
        {hasCover ? <View className="mptk-card__cover">{cover}</View> : null}
        {hasHeader ? (
          <View className="mptk-card__header">
            <View className="mptk-card__heading">
              {filled(title) ? <View className="mptk-card__title">{title}</View> : null}
              {filled(subtitle) ? <View className="mptk-card__subtitle">{subtitle}</View> : null}
            </View>
            {filled(extra) ? <View className="mptk-card__extra">{extra}</View> : null}
          </View>
        ) : null}
        <View className="mptk-card__body">{body}</View>
        {filled(footer) ? <View className="mptk-card__footer">{footer}</View> : null}
      </View>
    </CardSurfaceContext.Provider>
  )
}
