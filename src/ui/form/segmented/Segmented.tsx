import { View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { resolveControlColor, type ControlColor } from '../control-color.js'
import { useAsyncChange } from '../useAsyncChange.js'

/** 控件高度档，取值来自 --mptk-control-h-*。 */
export type SegmentedSize = 'sm' | 'md' | 'lg'

/** thumb = 滑动块；line = 频道切换那种下划线。 */
export type SegmentedIndicator = 'thumb' | 'line'

export interface SegmentedItem<T extends string = string> {
  /** 该段代表的值（唯一）。 */
  value: T
  label?: ReactNode
  icon?: ReactNode
  /** 段内计数，如「全部 7」。 */
  count?: ReactNode
  /** 标题下更小的副文本。 */
  description?: ReactNode
  disabled?: boolean
}

export interface SegmentedProps<T extends string = string> {
  items: readonly SegmentedItem<T>[]
  /** 宿主给的真值；组件完全受控。 */
  value: T
  /** 返回 Promise 时进入「先拨过去再转圈」，失败回弹并回调 onFailed。 */
  onChange?: (next: T) => unknown
  onFailed?: () => void
  size?: SegmentedSize
  indicator?: SegmentedIndicator
  /** 选中态主色：内置色名或任意 CSS 色值，默认蓝。 */
  color?: ControlColor
  disabled?: boolean
  /** 外部驱动的等待态。 */
  loading?: boolean
  /** 转圈节点；不给就用组件自带的纯 CSS 转圈，不连图标包。 */
  loadingContent?: ReactNode
  className?: string
}

export function Segmented<T extends string = string>({
  items,
  value,
  onChange,
  onFailed,
  size = 'lg',
  indicator = 'thumb',
  color,
  disabled = false,
  loading = false,
  loadingContent,
  className,
}: SegmentedProps<T>) {
  const { display, busy, change } = useAsyncChange(value, onChange, disabled, loading, onFailed)
  const locked = disabled || loading || busy
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === display))
  const percent = items.length > 0 ? 100 / items.length : 0
  const { className: colorClass, inlineColor } = resolveControlColor('mptk-seg', color)
  /* 左右各留 3px：宽度减 6px、起点加 3px，选到首段或末段都不贴边。 */
  const thumbStyle: CSSProperties = {
    width: `calc(${String(percent)}% - 6px)`,
    left: `calc(${String(activeIndex * percent)}% + 3px)`,
    ...(inlineColor === undefined ? {} : { backgroundColor: inlineColor }),
  }
  const lineStyle: CSSProperties | undefined =
    inlineColor === undefined ? undefined : { backgroundColor: inlineColor }
  const spinnerStyle: CSSProperties | undefined =
    inlineColor === undefined ? undefined : { borderTopColor: inlineColor }
  const names = [
    'mptk-seg',
    `mptk-seg--${size}`,
    `mptk-seg--${indicator}`,
    colorClass,
    locked ? 'mptk-seg--locked' : '',
    className,
  ]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {indicator === 'thumb' && items.length > 0 ? (
        <View className="mptk-seg__thumb" style={thumbStyle} />
      ) : null}
      {items.map((item) => {
        const active = item.value === display
        const itemDisabled = item.disabled === true || locked
        const itemNames = [
          'mptk-seg__item',
          active ? 'mptk-seg__item--on' : '',
          itemDisabled ? 'mptk-seg__item--disabled' : '',
        ]
        const textStyle: CSSProperties | undefined =
          indicator === 'line' && active && inlineColor !== undefined
            ? { color: inlineColor }
            : undefined
        return (
          <View
            key={item.value}
            className={itemNames.filter(Boolean).join(' ')}
            style={textStyle}
            onClick={() => {
              if (!itemDisabled && !active) change(item.value)
            }}
          >
            {item.icon === undefined ? null : <View className="mptk-seg__icon">{item.icon}</View>}
            <View className="mptk-seg__text">
              <View className="mptk-seg__label">
                {item.label}
                {item.count === undefined ? null : <View className="mptk-seg__count">{item.count}</View>}
              </View>
              {item.description === undefined ? null : (
                <View className="mptk-seg__desc">{item.description}</View>
              )}
            </View>
            {busy && active ? (loadingContent ?? <View className="mptk-seg__spinner" style={spinnerStyle} />) : null}
            {indicator === 'line' && active ? <View className="mptk-seg__line" style={lineStyle} /> : null}
          </View>
        )
      })}
    </View>
  )
}
