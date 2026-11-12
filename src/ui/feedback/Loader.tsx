import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { Spinner } from './spinner/index.js'

/** 形态：`ring` 圆环旋转 / `blocks` 三块脉动。 */
export type LoaderVariant = 'ring' | 'blocks'

/** 尺寸档：与字号档一一对应，圈径取字号的 1.6 倍，接在文字前面重心才对得上。 */
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LoaderProps {
  /** 形态，默认 `ring`。 */
  variant?: LoaderVariant
  /** 尺寸档，默认 `md`。 */
  size?: LoaderSize
  /** 主色；不给就由主题给（`--mptk-spinner-active`）。两种形态共用同一个默认色。 */
  color?: string
  /** 追加 class（只允许补布局，不许覆盖外观）。 */
  className?: string
}

/**
 * 五档边长（px）：字号 12 / 14 / 15 / 17 / 22 乘以 1.6 → 20 / 22 / 24 / 28 / 36。
 * 比例取自 TDesign：它默认 20px 的圈配 12px 的文案，圈径约是字号的 1.67 倍。
 */
const SIZE_PX: Record<LoaderSize, number> = { xs: 20, sm: 22, md: 24, lg: 28, xl: 36 }

/**
 * blocks 的几何照搬 24 网格：块 7.2×6.0、圆角 1.5、间隔 0.6，三块总宽 22.8、上下居中。
 * 正方形在 24 档看着像「方点」，所以是横向短条而不是方块。
 */
const BLOCK_W_RATIO = 7.2 / 24
const BLOCK_H_RATIO = 6 / 24
const BLOCK_RADIUS_RATIO = 1.5 / 24
const BLOCK_GAP_RATIO = 0.6 / 24
const BLOCK_COUNT = 3
/** 三块依次错开 0.15s，1.2s 周期内推到最亮。 */
const BLOCK_DELAY = 0.15

/** 像素值：去掉浮点噪音，最多两位小数。 */
function toPx(value: number): string {
  return `${String(Number(value.toFixed(2)))}px`
}

/**
 * 加载动画图标：只画图标本身，不带背景、内距与定位 —— 要底色或浮层由调用方套容器。
 *
 * 两轴正交（不是 N×M 份样式）：
 * - `variant`：`ring` 圆环绕圈旋转（默认）/ `blocks` 三块脉动；
 * - `size`：`xs` 12 / `sm` 16 / `md` 24（默认）/ `lg` 32 / `xl` 48。
 *
 * 两种形态共用同一个默认主色 `--mptk-spinner-active`，调用方传 `color` 覆盖；
 * ring 走 `Spinner`（TDesign circular 的圆锥渐变弧 + 环形遮罩），blocks 跟随 `currentColor`。
 */
export function Loader({ variant = 'ring', size = 'md', color, className }: LoaderProps) {
  const names = ['mptk-fb-loader', `mptk-fb-loader--${variant}`]
  if (className !== undefined && className !== '') names.push(className)
  const side = SIZE_PX[size]

  if (variant === 'blocks') {
    const width = toPx(side * BLOCK_W_RATIO)
    const height = toPx(side * BLOCK_H_RATIO)
    const radius = toPx(side * BLOCK_RADIUS_RATIO)
    const gap = toPx(side * BLOCK_GAP_RATIO)
    const box: CSSProperties = { height: toPx(side), width: toPx(side) }
    if (color !== undefined) box.color = color
    return (
      <View className={names.join(' ')} style={box}>
        {Array.from({ length: BLOCK_COUNT }, (_, index) => (
          <View
            key={index}
            className="mptk-fb-loader__block"
            style={{
              animationDelay: `${String(Number((index * BLOCK_DELAY).toFixed(2)))}s`,
              borderRadius: radius,
              height,
              marginRight: index === BLOCK_COUNT - 1 ? '0' : gap,
              width,
            }}
          />
        ))}
      </View>
    )
  }

  /* 转圈由 Spinner 自己旋转，外层只负责尺寸与居中，不再套字形节点。 */
  return (
    <View className={names.join(' ')} style={{ height: toPx(side), width: toPx(side) }}>
      <Spinner size={side} color={color} />
    </View>
  )
}
