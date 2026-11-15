import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

export type TagType = 'default' | 'primary' | 'success' | 'warning' | 'danger'
/** 高度档：与控件同一条刻度，`xxs`(16) 只对标签开放（低于最小可点目标）。 */
export type TagSize = 'xxs' | 'xs' | 'sm' | 'md'
/** 圆角形态：小圆角 / 两端半圆 / 单侧半圆。 */
export type TagShape = 'square' | 'round' | 'mark'

export interface TagProps {
  type?: TagType
  /** 默认 `xs`(24)：与控件同名档必然等高。 */
  size?: TagSize
  shape?: TagShape
  /** 旧写法，等价 `shape="round"`。 */
  round?: boolean
  plain?: boolean
  className?: string
  children?: ReactNode
}

/** 标签：关键词与短文标记；高度吃刻度 token，圆角走 --mptk-tag-radius。 */
export function Tag({
  type = 'default',
  size = 'xs',
  shape,
  round = false,
  plain = false,
  className,
  children,
}: TagProps) {
  const form = shape ?? (round ? 'round' : 'square')
  const names = [
    'mptk-tag',
    `mptk-tag--${type}`,
    `mptk-tag--${size}`,
    form === 'square' ? '' : `mptk-tag--shape-${form}`,
    plain ? 'mptk-tag--plain' : '',
    className,
  ]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <Text>{children}</Text>
    </View>
  )
}
