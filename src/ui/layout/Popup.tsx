import { ScrollView, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Overlay } from './Overlay.js'
import { MOTION_DURATION, usePresence } from './presence.js'

export type PopupPosition = 'top' | 'center' | 'bottom'

export interface PopupProps {
  open: boolean
  position?: PopupPosition
  children?: ReactNode
  onClose?: () => void
  /** 是否渲染遮罩，默认渲染 */
  overlay?: boolean
  /** 点遮罩是否关闭，默认关闭 */
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  className?: string
}

/** 弹出层：遮罩 + 定位面板，面板内容走内部 scroll-view，超高自己滚。 */
export function Popup({
  open,
  position = 'bottom',
  children,
  onClose,
  overlay = true,
  closable = true,
  lockScroll = true,
  duration = MOTION_DURATION,
  className,
}: PopupProps) {
  const { mounted, open: shown } = usePresence(open, duration)
  if (!mounted) return null

  const names = ['mptk-popup', `mptk-popup--${position}`, shown ? 'mptk-popup--open' : '']
  const panel = ['mptk-popup__panel', `mptk-popup__panel--${position}`, className]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {overlay ? (
        <Overlay visible={shown} closable={closable} lockScroll={lockScroll} duration={duration} onClose={onClose} />
      ) : null}
      <View className={panel.filter(Boolean).join(' ')}>
        <ScrollView scrollY className="mptk-popup__body">
          {children}
        </ScrollView>
      </View>
    </View>
  )
}
