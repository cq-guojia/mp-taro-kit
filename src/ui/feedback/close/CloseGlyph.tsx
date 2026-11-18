import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'

export interface CloseGlyphProps {
  /**
   * 边长，默认 `1em` —— 与所在文字（或按钮图标位）同尺寸，换字号档自动跟上。
   * 数字按 px；字符串原样使用。
   */
  size?: number | string
  /** 追加 class，只允许补布局，不许覆盖外观。 */
  className?: string
}

/**
 * 自绘关闭叉：字体图标的叉字形墨迹相对行盒偏上，且各端基线算法不同而无法用固定位移根治。
 * 这里把叉画成 viewBox 正中的 SVG path，用遮罩着色 —— 几何中心就是 viewBox 中心，跨端绝对居中。
 * 颜色取 currentColor：放进 Button 图标位时由按钮字色（--mptk-btn-fg）注入，深浅底自动跟随。
 */
export function CloseGlyph({ size, className }: CloseGlyphProps) {
  const side = size ?? '1em'
  const length = typeof side === 'number' ? `${String(side)}px` : side
  const box: CSSProperties = { width: length, height: length }
  const names = ['mptk-close-glyph', className].filter(Boolean).join(' ')
  return <View className={names} style={box} />
}
