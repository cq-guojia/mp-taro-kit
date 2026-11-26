import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { Overlay } from '../layout/Overlay.js'
import { MOTION_DURATION, usePresence } from '../layout/presence.js'

export interface DropdownProps {
  open: boolean
  children?: ReactNode
  onClose?: () => void
  /** 是否渲染遮罩，默认渲染 */
  overlay?: boolean
  /** 点遮罩是否关闭，默认关闭 */
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  /** 退场动画完成后触发一次，见 Popup */
  onExited?: () => void
  className?: string
}

/** 下拉面板：只给容器与关闭回调，下拉项内容由 children 注入；遮罩走 layout 那一份。 */
export function Dropdown({
  open,
  children,
  onClose,
  overlay = true,
  closable = true,
  lockScroll = true,
  duration = MOTION_DURATION,
  onExited,
  className,
}: DropdownProps) {
  const { mounted, open: shown } = usePresence(open, duration, { onExited })
  if (!mounted) return null

  const names = ['mptk-dropdown', shown ? 'mptk-dropdown--open' : '']
  const panel = ['mptk-dropdown__panel', className]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {overlay ? (
        <Overlay visible={shown} closable={closable} lockScroll={lockScroll} duration={duration} onClose={onClose} />
      ) : null}
      <View className={panel.filter(Boolean).join(' ')}>{children}</View>
    </View>
  )
}

/* 向 Card 声明：下拉面板是浮层，关闭时渲染 null、不占内容流。 */
markCardEdgeOutOfFlow(Dropdown)
