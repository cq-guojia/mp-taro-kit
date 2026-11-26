import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { CSSProperties, ReactNode } from 'react'
import { CONTROL_SIZE_DEFAULT } from '../../../design/index.js'
import { resolveControlColor, type ControlColor } from '../control-color.js'
import { useAsyncChange } from '../useAsyncChange.js'
import { useControlGate } from '../../infra/popup-lock/index.js'

/* 量不到段宽时的重试预算：动态容器首拍布局未稳，按帧重试到稳；上限防死循环。 */
const MAX_MEASURE_ATTEMPTS = 30
const MEASURE_RETRY_MS = 32

/** 控件高度档，取值来自 --mptk-control-h-*。 */
export type SegmentedSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** thumb = 滑动块；line = 频道切换那种下划线。 */
export type SegmentedIndicator = 'thumb' | 'line'

/**
 * 段宽策略：
 * - `fit`（默认）：段宽 = 内容 + 左右内边距，整块宽 = 各段之和，超出即横向滚动；
 * - `ratio`：撑满父级，段先按内容占宽、剩余空间均摊（两个字窄、四个字宽）；
 * - `equal`：撑满父级，严格 `100 / N` 等分（唯一不需要测量的模式）。
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
  /** 浮层锁里的身份；配在 Popup 的 lockExceptions 里即可在整框屏蔽时仍可操作。 */
  lockKey?: string
  className?: string
}

interface CellBox {
  left: number
  width: number
}

/**
 * 指示器呈现模式——全组件唯一的决策点 `resolveIndicatorMode` 的输出：
 * - `sliding`：几何量到（或 equal 零测量），track 内一个绝对定位指示器，带过渡，切换时滑动；
 * - `static`：浮层等容器里量不到 item 几何，每段各画一个、靠 opacity 做交叉淡入淡出，
 *              几何随段自身，不做位移动画。
 * 两种形态（thumb / line）共用这一个判别，不各写一套分流。
 */
type IndicatorMode = 'sliding' | 'static'

/** 唯一入口：只有这里决定指示器走哪条轨，其它一切渲染只读它的结果。 */
function resolveIndicatorMode(needsMeasure: boolean, cells: CellBox[] | null): IndicatorMode {
  return !needsMeasure || cells !== null ? 'sliding' : 'static'
}

/** 多实例同时在页面上时选择器会互相命中，用自增序号拼唯一前缀。 */
let uidSeed = 0

export function Segmented<T extends string = string>({
  items,
  value,
  onChange,
  onFailed,
  size = CONTROL_SIZE_DEFAULT,
  width = 'fit',
  indicator = 'thumb',
  radius,
  color,
  disabled = false,
  loading = false,
  lockKey,
  className,
}: SegmentedProps<T>) {
  const gate = useControlGate(lockKey)
  const { display, busy, change } = useAsyncChange(value, onChange, disabled || gate.locked, loading, onFailed)
  const locked = disabled || gate.locked || loading || busy
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
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const measure = useCallback((attempt = 0) => {
    if (!needsMeasure || items.length === 0) {
      setCells(null)
      return
    }
    /* 段位几何按 index 一一对应，所以 track 与每段各挂独立 id、逐个按 `#id` 查：
       组合选择器只能按渲染树顺序批量拿，缺项时无从知道缺的是第几段；
       按 id 查能把「哪一段没量到」暴露出来，任一段为 null 就整体不采用实测几何。 */
    const query = Taro.createSelectorQuery()
    query.select(`#${uid}-track`).boundingClientRect()
    items.forEach((_, index) => {
      query.select(`#${uid}-i${String(index)}`).boundingClientRect()
    })
    query.exec((res) => {
      const track = (res[0] ?? null) as { left: number } | null
      const list = res.slice(1) as ({ left: number; width: number } | null)[]
      if (track === null || list.length !== items.length || list.some((item) => item === null)) {
        if (attempt < MAX_MEASURE_ATTEMPTS) {
          retryTimer.current = setTimeout(() => measure(attempt + 1), MEASURE_RETRY_MS)
        }
        /* 重试耗尽仍量不到：cells 保持 null，由唯一入口切到 static 轨，选中态仍可见。 */
        return
      }
      setCells(list.map((item) => ({ left: item!.left - track.left, width: item!.width })))
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
      if (retryTimer.current !== null) {
        clearTimeout(retryTimer.current)
        retryTimer.current = null
      }
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

  const mode = resolveIndicatorMode(needsMeasure, cells)
  const sliding = mode === 'sliding'
  /* 形态后缀直接用 indicator：thumb / line 的渲染、类名、几何因此天然对称。 */
  const slideClassName = `mptk-seg__${indicator}`
  const selfClassName = `mptk-seg__self-${indicator}`
  const activeCell = needsMeasure ? cells?.[activeIndex] : undefined
  /* sliding 轨的选中段几何：量到用实测像素，等分只用于 equal 这种零测量档。 */
  const span =
    activeCell === undefined
      ? { left: `${String(activeIndex * percent)}%`, width: `${String(percent)}%` }
      : { left: `${String(activeCell.left)}px`, width: `${String(activeCell.width)}px` }

  /* 滑块左右各让一个内缩 token，下划线左右各缩一个间距档。两者都按两次相减写，
     calc 里不用乘法，也不写死像素。 */
  const thumbStyle: CSSProperties = {
    left: `calc(${span.left} + var(--mptk-seg-inset))`,
    width: `calc(${span.width} - var(--mptk-seg-inset) - var(--mptk-seg-inset))`,
    ...(inlineColor === undefined ? {} : { backgroundColor: inlineColor }),
  }
  const lineStyle: CSSProperties = {
    left: `calc(${span.left} + var(--mptk-seg-line-inset))`,
    width: `calc(${span.width} - var(--mptk-seg-line-inset) - var(--mptk-seg-line-inset))`,
    ...(inlineColor === undefined ? {} : { backgroundColor: inlineColor }),
  }
  const indicatorStyle = indicator === 'thumb' ? thumbStyle : lineStyle
  const selfColorStyle = inlineColor === undefined ? undefined : { backgroundColor: inlineColor }

  const names = [
    'mptk-seg',
    `mptk-seg--${size}`,
    `mptk-seg--${width}`,
    `mptk-seg--${indicator}`,
    radius === undefined ? '' : `mptk-seg--radius-${radius}`,
    colorClass,
    locked ? 'mptk-seg--locked' : '',
    busy ? 'mptk-seg--busy' : '',
    gate.exempt ? 'mptk-seg--lock-exempt' : '',
    className,
  ]

  const track = (
    <View id={`${uid}-track`} className="mptk-seg__track">
      {/* sliding 轨：一个 track 级指示器，切换时靠 left / width 过渡滑过去。 */}
      {sliding ? <View className={slideClassName} style={indicatorStyle} /> : null}
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
            {/* static 轨：每段都常驻一个自绘指示器，靠段的选中态切 opacity 做交叉淡入淡出：
                旧段渐隐、新段渐显，过渡只在透明度上，位置与宽高始终跟随段自身，不做位移动画。 */}
            {!sliding ? (
              <View className={`mptk-seg__self ${selfClassName}`} style={selfColorStyle} />
            ) : null}
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
    </View>
  )

  return (
    <View id={uid} className={names.filter(Boolean).join(' ')}>
      {width === 'fit' ? (
        /* fit 的底片宽 = 各段之和，没有可滚的溢出量。用普通 View 而不是 scroll-view：
           Skyline 下 scroll-view 必须显式宽高，放在 Cell 值位那种按内容取宽的父级里会被算成 0，
           整块消失（真机宽松才看得到）；ratio / equal 轨道是 100%、确有横滚需求，仍用 ScrollView。 */
        <View className="mptk-seg__scroll">{track}</View>
      ) : (
        <ScrollView
          className="mptk-seg__scroll"
          scrollX
          scrollWithAnimation
          scrollIntoView={`${uid}-i${String(activeIndex)}`}
        >
          {track}
        </ScrollView>
      )}
    </View>
  )
}
