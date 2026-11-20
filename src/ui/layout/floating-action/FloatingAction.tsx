import { View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { markCardEdgeOutOfFlow } from '../../infra/card-edge.js'
import { MOTION_DURATION, usePresence } from '../presence.js'
import { Button, type ButtonProps } from '../../actions/Button.js'

/** 常驻按钮的位置档：左右 × 贴底 / 居中，由 FloatingActionGroup 统一决定。 */
export type FloatingActionPosition = 'bottom-right' | 'right-middle' | 'bottom-left' | 'left-middle'

export interface FloatingActionProps extends ButtonProps {
  /** 受控显隐；关闭时播完退场再卸载（与 Overlay 同口径）。 */
  visible?: boolean
  /** 进出场时长（ms），0 立即卸载；只管 JS 卸载时机，过渡曲线走 --mptk-c-motion-duration。 */
  duration?: number
  /** 半透明底（默认）；关掉走 Button 原生底色。传 color 时让位给自定义色。 */
  translucent?: boolean
}

/**
 * 常驻浮动按钮本体：内容轴与四轴外观复用核心 Button（纯图标不传文字即正方形），
 * 默认中性灰（default，不抢眼）、带描边（outline）、中圆角（md）、Button 的 sm 尺寸——都是 Button 原生轴，可各自覆盖。
 * 本组件只加受控显隐与进出场。定位、竖排、安全区、层级归 FloatingActionGroup。
 */
export function FloatingAction({
  visible = true,
  duration = MOTION_DURATION,
  size = 'sm',
  type = 'default',
  variant = 'outline',
  radius = 'md',
  translucent = true,
  className,
  style,
  ...buttonProps
}: FloatingActionProps) {
  const { mounted, open } = usePresence(visible, duration)
  if (!mounted) return null

  const names = [
    'mptk-fab',
    open ? 'mptk-fab--open' : '',
    translucent ? 'mptk-fab--translucent' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <View className={names} style={style}>
      <Button size={size} type={type} variant={variant} radius={radius} {...buttonProps} />
    </View>
  )
}

/* 浮层类：关闭时渲染 null，放在 Card 里不该被当成占内容流的可见内容。 */
markCardEdgeOutOfFlow(FloatingAction)

export interface FloatingActionGroupProps {
  /** 左右 × 贴底 / 居中四档，默认右下；安全区只对两个贴底档生效。 */
  position?: FloatingActionPosition
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * 常驻入口列：一个 fixed 容器统一承载 N 个 FloatingAction。单个按钮自己做 fixed 会互相重叠，
 * 所以定位、多实例竖排、安全区与层级都收在这一层，按钮本体只管内容与显隐。
 */
export function FloatingActionGroup({
  position = 'bottom-right',
  children,
  className,
  style,
}: FloatingActionGroupProps) {
  const names = ['mptk-fab-group', `mptk-fab-group--${position}`, className].filter(Boolean).join(' ')
  return (
    <View className={names} style={style}>
      {children}
    </View>
  )
}
