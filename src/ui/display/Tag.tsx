import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

export type TagType = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface TagProps {
  type?: TagType
  plain?: boolean
  round?: boolean
  className?: string
  children?: ReactNode
}

/** 标签：关键词与短文标记；圆角走 --mptk-tag-radius，颜色走语义色。 */
export function Tag({
  type = 'default',
  plain = false,
  round = false,
  className,
  children,
}: TagProps) {
  const names = [
    'mptk-tag',
    `mptk-tag--${type}`,
    plain ? 'mptk-tag--plain' : '',
    round ? 'mptk-tag--round' : '',
    className,
  ]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <Text>{children}</Text>
    </View>
  )
}
