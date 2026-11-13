import { useCallback, useEffect, useState } from 'react'
import { ScrollView, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { CSSProperties, ReactNode } from 'react'
import { resolveControlColor, type ControlColor } from '../control-color.js'
import { useAsyncChange } from '../useAsyncChange.js'

/** 控件高度档，取值来自 --mptk-control-h-*。 */
export type SegmentedSize = 'sm' | 'md' | 'lg'

/** thumb = 滑动块；line = 频道切换那种下划线。 */
export type SegmentedIndicator = 'thumb' | 'line'

/**
 * 段宽策略：
 * - `fit`（默认）：段宽 = 内容 + 左右内边距，整块宽 = 各段之和，超出即横向滚动；
 * - `ratio`：撑满容器，段先按内容占宽、剩余空间均摊（两个字窄、四个字宽）；
 * - `equal`：撑满容器，严格 `100 / N` 等分（唯一不需要测量的模式）。
 */
export type SegmentedWidth = 'fit' | 'ratio' | 'equal'

/** 圆角档：默认跟随 `--mptk-control-radius`；pill = 左右半圆。 */
export type SegmentedRadius = 'pill'

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
  /** 返回 Promise 时立刻锁点击并显示呼吸条，位置不动，成功后由宿主把新值传回来。 */
  onChange?: (next: T) => unknown
  onFailed?: () => void
  size?: SegmentedSize
  width?: SegmentedWidth
  indicator?: SegmentedIndicator
  radius?: SegmentedRadius
  /** 选中态主色：内置色名或任意 CSS 色值，默认蓝。 */
  color?: ControlColor
  disabled?: boolean
  /** 外部驱动的等待态；等待时指示器底色呼吸，位置、尺寸与文字都不变。 */
  loading?: boolean
  className?: string
}

interface CellBox {
  left: number
  width: number
}

/** 多实例同时在页面上时选择器会互相命中，用自增序号拼唯一前缀。 */
let uidSeed = 0

export function Segmented<T extends string = string>({
  items,
  value,
  onChange,
  onFailed,
  size = 'lg',
  width = 'fit',
  indicator = 'thumb',
  radius,
  color,
  disabled = false,
  loading = false,
  className,
}: SegmentedProps<T>) {
  const { display, busy, change } = useAsyncChange(value, onChange, disabled, loading, onFailed)
  const locked = disabled || loading || busy
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === display))
  const percent = items.length > 0 ? 100 / items.length : 0
  const { className: colorClass, inlineColor } = resolveControlColor('mptk-seg', color)
  const [uid] = useState(() => {
    uidSeed += 1
    return `mptk-seg-${String(uidSeed)}`
  })

  /* 段宽不等（fit / ratio）时百分比算不出位置，只能量一次真实尺寸；equal 模式零测量。 */
  const needsMeasure = width !== 'equal'
  const [cells, setCells] = useState<CellBox[] | null>(null)

  const measure = useCallback(() => {
    if (!needsMeasure || items.length === 0) {
      setCells(null)
      return
    }
    const query = Taro.createSelectorQuery()
    query.select(`#${uid} .mptk-seg__track`).boundingClientRect()
    query.selectAll(`#${uid} .mptk-seg__item`).boundingClientRect()
    query.exec((res) => {
      const track = (res[0] ?? null) as { left: number } | null
      const list = (res[1] ?? []) as { left: number; width: number }[]
      if (track === null || list.length !== items.length) return
      setCells(list.map((item) => ({ left: item.left - track.left, width: item.width })))
    })
  }, [items.length, needsMeasure, uid])

  /* 首帧布局没完成时量不到，放到下一拍；items 数量 / 档位 / 圆角变化都会改变段宽，需要重量。
     等待态只让指示器底色呼吸，不加节点、不改段宽，所以不必重量。 */
  useEffect(() => {
    if (!needsMeasure) {
      setCells(null)
      return undefined
    }
    const timer = setTimeout(measure, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [measure, needsMeasure, size, radius, width])

  useEffect(() => {
    if (!needsMeasure) return undefined
    const onResize = (): void => {
      measure()
    }
    Taro.onWindowResize(onResize)
    return () => {
      Taro.offWindowResize(onResize)
    }
  }, [measure, needsMeasure])

  const activeCell = needsMeasure ? cells?.[activeIndex] : undefined
  /* 未量到之前不画指示器，避免先在错位置闪一下。 */
  const ready = !needsMeasure || activeCell !== undefined

  /** 选中段的几何：等分用百分比，其余用实测像素；未量到之前为空，指示器不画。 */
  const span =
    activeCell === undefined
      ? { left: `${String(activeIndex * percent)}%`, width: `${String(percent)}%` }
      : { left: `${String(activeCell.left)}px`, width: `${String(activeCell.width)}px` }

  /* 滑块左右各让 3px：宽度扣左右两份（6px）、起点加左边一份，选到首段或末段都不贴边。
     3px 是细分视觉值，与样式里的 --mptk-seg-inset 同值（那边只管上下两条边）。 */
  const thumbStyle: CSSProperties = {
    left: `calc(${span.left} + 3px)`,
    width: `calc(${span.width} - 6px)`,
    ...(inlineColor === undefined ? {} : { backgroundColor: inlineColor }),
  }
  /* 下划线左右各缩一个间距档，取值走 CSS 变量；宽度按两次相减写，calc 里不用乘法。 */
  const lineStyle: CSSProperties = {
    left: `calc(${span.left} + var(--mptk-seg-line-inset))`,
    width: `calc(${span.width} - var(--mptk-seg-line-inset) - var(--mptk-seg-line-inset))`,
    ...(inlineColor === undefined ? {} : { backgroundColor: inlineColor }),
  }
  const names = [
    'mptk-seg',
    `mptk-seg--${size}`,
    `mptk-seg--${width}`,
    `mptk-seg--${indicator}`,
    radius === undefined ? '' : `mptk-seg--radius-${radius}`,
    colorClass,
    locked ? 'mptk-seg--locked' : '',
    busy ? 'mptk-seg--busy' : '',
    className,
  ]

  return (
    <View id={uid} className={names.filter(Boolean).join(' ')}>
      <ScrollView
        className="mptk-seg__scroll"
        scrollX
        scrollWithAnimation
        scrollIntoView={`${uid}-i${String(activeIndex)}`}
      >
        <View className="mptk-seg__track">
          {indicator === 'thumb' && ready ? <View className="mptk-seg__thumb" style={thumbStyle} /> : null}
          {items.map((item, index) => {
            const active = item.value === display
            const itemDisabled = item.disabled === true || locked
            const itemNames = [
              'mptk-seg__item',
              active ? 'mptk-seg__item--on' : '',
              itemDisabled ? 'mptk-seg__item--disabled' : '',
            ]
            const textStyle: CSSProperties | undefined =
              indicator === 'line' && active && inlineColor !== undefined ? { color: inlineColor } : undefined
            return (
              <View
                key={item.value}
                id={`${uid}-i${String(index)}`}
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
              </View>
            )
          })}
          {indicator === 'line' && ready ? <View className="mptk-seg__line" style={lineStyle} /> : null}
        </View>
      </ScrollView>
    </View>
  )
}
