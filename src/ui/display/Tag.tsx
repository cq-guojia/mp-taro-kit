import { Text, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Icon } from './icon/Icon.js'

export type TagType = 'default' | 'primary' | 'success' | 'warning' | 'danger'
/** 高度档：与控件同一条刻度，`3xs`(16) / `xxs`(20) 只对标签开放（低于最小可点目标）。 */
export type TagSize = '3xs' | 'xxs' | 'xs' | 'sm' | 'md'
/** 圆角档：与全库圆角档同名同值，`pill` 即两端半圆。 */
export type TagRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'
/**
 * 底色形态：`solid` 实心、`soft` 浅底加同色描边、`outline` 白底加同色描边。
 * `soft` 的底取语义色自带的浅色档（明 8% / 暗 12%），边与字仍是语义色本身。
 */
export type TagVariant = 'solid' | 'soft' | 'outline'

export interface TagProps {
  type?: TagType
  /** 默认 `xs`(24)：与控件同名档必然等高。 */
  size?: TagSize
  variant?: TagVariant
  /** 圆角档；不传取 `--mptk-tag-radius`。 */
  radius?: TagRadius
  /** 单侧半圆（左直角、右半圆）；给了它就接管四角。 */
  mark?: boolean
  /** 旧写法，等价 `radius="pill"`。 */
  round?: boolean
  /** 旧写法，等价 `variant="outline"`。 */
  plain?: boolean
  /** 前置图标，`库名:图标名`。 */
  icon?: string
  /** 后置图标，`库名:图标名`。 */
  iconAfter?: string
  className?: string
  children?: ReactNode
}

/**
 * 标签：关键词与短文标记。
 * 无 `children` 且带图标时是纯图标标签，宽度锁成同档高度、上下左右不加内边距，必然是正方形。
 */
export function Tag({
  type = 'default',
  size = 'xs',
  variant = 'solid',
  radius,
  mark = false,
  round = false,
  plain = false,
  icon,
  iconAfter,
  className,
  children,
}: TagProps) {
  const form = plain ? 'outline' : variant
  const corner = round ? 'pill' : radius
  const hasText = children !== undefined && children !== null
  const iconOnly = !hasText && Boolean(icon ?? iconAfter)
  const names = [
    'mptk-tag',
    `mptk-tag--${type}`,
    `mptk-tag--${size}`,
    form === 'solid' ? '' : `mptk-tag--${form}`,
    corner === undefined ? '' : `mptk-tag--radius-${corner}`,
    mark ? 'mptk-tag--mark' : '',
    iconOnly ? 'mptk-tag--icon-only' : '',
    className,
  ]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      {icon === undefined ? null : <Icon name={icon} className="mptk-tag__icon" />}
      {hasText ? <Text className="mptk-tag__text">{children}</Text> : null}
      {iconAfter === undefined ? null : <Icon name={iconAfter} className="mptk-tag__icon" />}
    </View>
  )
}
