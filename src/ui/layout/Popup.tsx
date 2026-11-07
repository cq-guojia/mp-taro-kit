import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Mask } from './Mask.js'

export type PopupPosition = 'top' | 'center' | 'bottom'

export interface PopupProps {
  open: boolean
  position?: PopupPosition
  children?: ReactNode
  onClose?: () => void
  className?: string
}

/** 弹出层：遮罩 + 定位面板，面板内容由 children 注入。 */
export function Popup({ open, position = 'bottom', children, onClose, className }: PopupProps) {
  if (!open) return null
  const names = ['mptk-popup__panel', `mptk-popup__panel--${position}`, className]
  return (
    <View className="mptk-popup">
      <Mask onClose={onClose} />
      <View className={names.filter(Boolean).join(' ')}>{children}</View>
    </View>
  )
}
