import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

export type DividerContentPosition = 'left' | 'center' | 'right'

export interface DividerProps {
  children?: ReactNode
  contentPosition?: DividerContentPosition
  className?: string
}

/** 分隔线：无内容时一条细线；有内容时文字嵌在线中，位置走 contentPosition。 */
export function Divider({
  children,
  contentPosition = 'center',
  className,
}: DividerProps) {
  const names = ['mptk-divider', className]
  if (children === undefined || children === null || children === '') {
    return <View className={names.filter(Boolean).join(' ')} />
  }
  if (contentPosition !== 'center') {
    names.push(`mptk-divider--content-${contentPosition}`)
  }
  names.push('mptk-divider--text')
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <View className="mptk-divider__line" />
      <Text className="mptk-divider__text">{children}</Text>
      <View className="mptk-divider__line" />
    </View>
  )
}
