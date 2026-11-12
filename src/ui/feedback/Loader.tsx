import { View } from '@tarojs/components'
import { Spinner } from './spinner/index.js'

/** 形态：`ring` 双色缺角环旋转 / `blocks` 三块脉动。 */
export type LoaderVariant = 'ring' | 'blocks'

/** 尺寸档：五档，几何按 24 网格等比缩放。 */
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LoaderProps {
  /** 形态，默认 `ring`。 */
  variant?: LoaderVariant
  /** 尺寸档，默认 `md`。 */
  size?: LoaderSize
  /** 追加 class（只允许补布局，不许覆盖外观）。 */
  className?: string
}

/** 五档边长（px）：12 / 16 / 24 / 32 / 48。 */
const SIZE_PX: Record<LoaderSize, number> = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 }

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
 * - `variant`：`ring` 开口弧整体旋转（默认）/ `blocks` 三块脉动；
 * - `size`：`xs` 12 / `sm` 16 / `md` 24（默认）/ `lg` 32 / `xl` 48。
 *
 * ring 用自绘双色缺角环：顶部一弧取 --mptk-spinner-active，其余三边取
 * --mptk-spinner-track，明暗两套由主题给；全程不碰图标字体。
 * blocks 仍跟随 currentColor，要换色在调用点给 `style={{ color }}`。
 */
export function Loader({ variant = 'ring', size = 'md', className }: LoaderProps) {
  const names = ['mptk-fb-loader', `mptk-fb-loader--${variant}`]
  if (className !== undefined && className !== '') names.push(className)
  const side = SIZE_PX[size]

  if (variant === 'blocks') {
    const width = toPx(side * BLOCK_W_RATIO)
    const height = toPx(side * BLOCK_H_RATIO)
    const radius = toPx(side * BLOCK_RADIUS_RATIO)
    const gap = toPx(side * BLOCK_GAP_RATIO)
    return (
      <View className={names.join(' ')} style={{ height: toPx(side), width: toPx(side) }}>
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
      <Spinner size={side} />
    </View>
  )
}
