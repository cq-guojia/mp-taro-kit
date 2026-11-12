import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'

/** 形态：`circular` 圆环（默认）/ `chase` 六点追逐。 */
export type SpinnerVariant = 'circular' | 'chase'

export interface SpinnerProps {
  /** 形态，默认 `circular`。 */
  variant?: SpinnerVariant
  /** 边长（px），默认 24。几何按边长等比缩放，一套吃所有尺寸档。 */
  size?: number
  /** 主色；不给则由主题给（`--mptk-spinner-active`）。 */
  color?: string
  /** 追加 class，只允许补布局，不许覆盖外观。 */
  className?: string
}

/** 六点追逐的点数，照抄 SpinKit sk-chase。 */
const CHASE_DOTS = 6

/**
 * 自绘转圈，两种形态都取自成熟开源实现，只把颜色换成主题变量：
 * - `circular`：TDesign 小程序 `t-loading theme="circular"` 的圆锥渐变弧 + 环形遮罩挖空；
 * - `chase`：SpinKit `sk-chase` 的六点追逐。
 *
 * 两者都不给单边 border 上色：Skyline 下给某一条边单独上色会让 `border-radius`
 * 整个失效、圆环退化成旋转方框（微信开放社区：单边 border + border-radius 暂不支持）。
 */
export function Spinner({ variant = 'circular', size, color, className }: SpinnerProps) {
  const side = size ?? 24
  const box: CSSProperties = { width: `${String(side)}px`, height: `${String(side)}px` }
  if (color !== undefined) box.color = color
  const names = ['mptk-spinner', `mptk-spinner--${variant}`, className].filter(Boolean).join(' ')

  if (variant === 'chase') {
    return (
      <View className={names} style={box}>
        {Array.from({ length: CHASE_DOTS }, (_, index) => (
          <View key={index} className="mptk-spinner__chase-dot" />
        ))}
      </View>
    )
  }

  return (
    <View className={names} style={box}>
      <View className="mptk-spinner__ring" />
    </View>
  )
}
