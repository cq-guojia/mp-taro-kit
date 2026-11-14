import { Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { iconClass } from '../../icon/all/index.js'

/**
 * 尺寸档：图标不另立一套数字，档位名与取值都直接取字号档 `--mptk-font-*`，
 * 与文字同一尺度。档位只用于显式换档；不传 `size` 时图标继承所在文字的字号。
 */
export const ICON_SIZES = {
  xs: 'var(--mptk-font-xs)',
  sm: 'var(--mptk-font-sm)',
  md: 'var(--mptk-font-md)',
  lg: 'var(--mptk-font-lg)',
  xl: 'var(--mptk-font-xl)',
  nav: 'var(--mptk-font-nav)',
} as const

/** 尺寸档名，即字号档名。 */
export type IconSize = keyof typeof ICON_SIZES

export interface IconProps {
  /**
   * `库名:图标名`，库名不可省，如 `common.base:home`。
   * 库名就是 `mp-taro-kit/ui/icon/<命名空间>/<库名>` 里点号前那整段。
   */
  name: string
  /** 字号档名（`IconSize`）或 px 数字；不传则继承所在文字字号。 */
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
