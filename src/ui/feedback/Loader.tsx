import { View, Text } from '@tarojs/components'
import { iconClass } from '../icon/index.js'

/** 形态：`ring` 图标字形整体旋转 / `blocks` 三个方块依次脉动。 */
export type LoaderVariant = 'ring' | 'blocks'

/** 尺寸档：只改大小，颜色跟随 `currentColor`。 */
export type LoaderSize = 'sm' | 'md' | 'lg'

export interface LoaderProps {
  variant?: LoaderVariant
  size?: LoaderSize
  className?: string
}

/** 边长（px）：ring 用作字号，blocks 用作单个方块边长的一半。 */
const SIZE_PX: Record<LoaderSize, number> = { sm: 16, md: 24, lg: 32 }
/** blocks 相邻方块的间距（px）。 */
const BLOCK_GAP = 4
const BLOCK_COUNT = 3
/** blocks 每个方块错开的动画延迟（秒）。 */
const BLOCK_DELAY = 0.15

/**
 * 加载动画图标：只画图标本身，不带背景、内距与定位 —— 要底色或浮层由调用方套容器。
 *
 * - `ring`：用图标域的 `loading` 字形整体旋转，一个字形零素材；
 * - `blocks`：三个方块用 CSS 缩放 + 透明度错峰，纯样式实现，同样零素材。
 */
export function Loader({ variant = 'ring', size = 'md', className }: LoaderProps) {
  const px = SIZE_PX[size]
  const names = ['mptk-fb-loader', `mptk-fb-loader--${variant}`, className].filter(Boolean)

  if (variant === 'blocks') {
    const side = px / 2
    return (
      <View className={names.join(' ')}>
        {Array.from({ length: BLOCK_COUNT }, (_, index) => (
          <View
            key={index}
            className="mptk-fb-loader__block"
            style={{
              animationDelay: `${String(index * BLOCK_DELAY)}s`,
              height: `${String(side)}px`,
              marginRight: index === BLOCK_COUNT - 1 ? '0' : `${String(BLOCK_GAP)}px`,
              width: `${String(side)}px`,
            }}
          />
        ))}
      </View>
    )
  }

  return (
    <Text
      className={[iconClass('loading'), ...names].join(' ')}
      style={{ fontSize: `${String(px)}px` }}
    />
  )
}
