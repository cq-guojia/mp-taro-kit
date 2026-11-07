import { View } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface OverlayProps {
  visible?: boolean
  children?: ReactNode
  className?: string
}

/** 浮层定位容器：只负责层级与定位，内容由 children 注入。 */
export function Overlay({ visible = true, children, className }: OverlayProps) {
  if (!visible) return null
  return <View className={['mptk-overlay', className].filter(Boolean).join(' ')}>{children}</View>
}
