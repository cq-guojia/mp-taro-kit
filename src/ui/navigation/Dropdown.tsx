import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface DropdownProps {
  open: boolean
  children?: ReactNode
  onClose?: () => void
  className?: string
}

/** 下拉面板：只给容器与关闭回调，下拉项内容由 children 注入。 */
export function Dropdown({ open, children, onClose, className }: DropdownProps) {
  if (!open) return null
  const names = ['mptk-dropdown__panel', className]
  return (
    <View className="mptk-dropdown">
      <View className="mptk-dropdown__mask" onClick={() => onClose?.()} />
      <View className={names.filter(Boolean).join(' ')}>{children}</View>
    </View>
  )
}
