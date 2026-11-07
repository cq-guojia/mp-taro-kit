import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface BadgeProps {
  count?: number | string
  dot?: boolean
  children?: ReactNode
  className?: string
}

/** 徽标：数字 / 小红点，宿主只给数值，不进业务逻辑。 */
export function Badge({ count, dot = false, children, className }: BadgeProps) {
  const names = ['mptk-badge', className]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      {children}
      {dot ? (
        <View className="mptk-badge__dot" />
      ) : count === undefined ? null : (
        <View className="mptk-badge__count">
          <Text>{count}</Text>
        </View>
      )}
    </View>
  )
}
