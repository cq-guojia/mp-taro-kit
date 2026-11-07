import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface SafeAreaProps {
  children?: ReactNode
  position?: 'top' | 'bottom'
  className?: string
}

/** 安全区容器：只提供留白，内容由 children 注入。 */
export function SafeArea({ children, position = 'bottom', className }: SafeAreaProps) {
  const names = ['mptk-safe-area', `mptk-safe-area--${position}`, className].filter(Boolean)
  return <View className={names.join(' ')}>{children}</View>
}
