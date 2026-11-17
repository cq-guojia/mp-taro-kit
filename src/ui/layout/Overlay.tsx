import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { MOTION_DURATION, usePresence } from './presence.js'

export type OverlayTone = 'dark' | 'light'
export type OverlayOpacity = 'thin' | 'default' | 'thick'

export interface OverlayProps {
  visible?: boolean
  /** 底色档：dark 纯黑遮罩（默认）/ light 白遮罩 */
  tone?: OverlayTone
  /** 任取一个色值，盖过 tone；默认值仍走配置里的 token */
  color?: string
  /** 浓度档，也可直接给 0~1 的数字；数字档走 CSS 变量，内联 opacity 会盖掉进出场过渡 */
  opacity?: OverlayOpacity | number
  /** 点遮罩是否回调 onClose；只想监听不关闭就给 closable={false} + onClick */
  closable?: boolean
  onClose?: () => void
  onClick?: () => void
  /** 吞掉背后页面的滚动（滚动穿透）；页面滚动若在消费方的 scroll-view 里，还需要那边配合关掉 scroll-y */
  lockScroll?: boolean
  /** 进出场时长（ms），0 = 不做动画 */
  duration?: number
  className?: string
}

/** 遮罩：全库唯一实现。底色取 --mptk-c-overlay-color，不取 --mptk-fg（那是字色，暗色下会变成浅灰蒙版）。 */
export function Overlay({
  visible = true,
  tone = 'dark',
  color,
  opacity = 'default',
  closable = true,
  onClose,
  onClick,
  lockScroll = true,
  duration = MOTION_DURATION,
  className,
}: OverlayProps) {
  const { mounted, open } = usePresence(visible, duration)
  if (!mounted) return null

  const numeric = typeof opacity === 'number'
  const names = [
    'mptk-overlay',
    `mptk-overlay--${tone}`,
    numeric ? '' : `mptk-overlay--${opacity}`,
    open ? 'mptk-overlay--open' : '',
    className,
  ]
  const style: CSSProperties = {
    ...(numeric ? { '--mptk-overlay-alpha': String(opacity) } : {}),
    ...(color === undefined ? {} : { backgroundColor: color }),
  } as CSSProperties

  return (
    <View
      className={names.filter(Boolean).join(' ')}
      style={style}
      catchMove={lockScroll}
      onClick={() => {
        onClick?.()
        if (closable) onClose?.()
      }}
    />
  )
}

/* 向 Card 声明：遮罩是浮层，关闭时渲染 null、不占内容流。 */
markCardEdgeOutOfFlow(Overlay)
