import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'

export interface SpinnerProps {
  /** 边长（px），默认 24。线宽按边长等比缩放，一套几何吃所有尺寸档。 */
  size?: number
  /** 转圈弧颜色；不给则由主题给。轨道色始终由主题给，不跟随自定义色。 */
  color?: string
  /** 追加 class，只允许补布局，不许覆盖外观。 */
  className?: string
}

/**
 * 自绘转圈：双色缺角环。三边是中性轨道色、顶部一弧是主色，整体匀速旋转，
 * 看起来像缺了一角在跑。全程不用图标字体，颜色只由 --mptk-spinner-* 决定，
 * 明暗两套由 styles/theme-* 给，不跟随 currentColor、不蹭宿主业务色。
 */
export function Spinner({ size, color, className }: SpinnerProps) {
  const style: CSSProperties = {}
  if (size !== undefined) {
    style.width = `${String(size)}px`
    style.height = `${String(size)}px`
    style.borderWidth = `${String(Number(Math.max(1, size / 12).toFixed(2)))}px`
  }
  if (color !== undefined) style.borderTopColor = color
  const names = ['mptk-spinner', className].filter(Boolean).join(' ')
  return <View className={names} style={style} />
}
