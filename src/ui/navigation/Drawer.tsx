import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export type DrawerSide = 'left' | 'right'

export interface DrawerProps {
  open: boolean
  side?: DrawerSide
  children?: ReactNode
  onClose?: () => void
  className?: string
}

/** 侧滑面板：不用 Skyline 独占手势 API，两端表现一致。 */
export function Drawer({ open, side = 'left', children, onClose, className }: DrawerProps) {
  if (!open) return null
  const names = ['mptk-drawer__panel', `mptk-drawer__panel--${side}`, className]
  return (
    <View className="mptk-drawer">
      <View className="mptk-drawer__mask" onClick={() => onClose?.()} />
      <View className={names.filter(Boolean).join(' ')}>{children}</View>
    </View>
  )
}
