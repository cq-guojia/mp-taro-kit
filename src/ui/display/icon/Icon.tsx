import { Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { iconClass } from '../../icon/all/index.js'

/** 尺寸预设（px）；也可以直接给数字。 */
export const ICON_SIZES = { sm: 14, md: 16, lg: 20, xl: 24 } as const

/** 尺寸预设名。 */
export type IconSize = keyof typeof ICON_SIZES

export interface IconProps {
  /**
   * `库名:图标名`，库名不可省，如 `common.base:home`。
   * 库名就是 `mp-taro-kit/ui/icon/<命名空间>/<库名>` 里点号前那整段。
   */
  name: string
  /** 预设名或 px；不传则继承所在文字字号。 */
  size?: IconSize | number
  className?: string
  style?: CSSProperties
}

/**
 * 图标：字体图标渲染成 `<Text>`，类名由 `iconClass` 拼。
 *
 * 找不到库或名字时返回 `null` 并告警一次，不跨库回落 —— 显示错图标比空白更难查。
 * 字体文件不在包内：`@font-face` 只声明，元素真正用上该字体族时才由引擎下载。
 */
export function Icon({ name, size, className, style }: IconProps) {
  const glyph = iconClass(name)
  if (glyph === '') return null
  const fontSize = size === undefined ? undefined : typeof size === 'number' ? size : ICON_SIZES[size]
  return (
    <Text
      className={[glyph, className].filter(Boolean).join(' ')}
      style={fontSize === undefined ? style : { fontSize, lineHeight: 1, ...style }}
    />
  )
}
