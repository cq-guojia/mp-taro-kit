import { useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { View } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { markHostMounted, markHostUnmounted, closeToast, retargetToasts, sweepExpiredToasts, subscribeToastExpansion, getToastExpansion, setToastExpansion, getToastConfig } from '../commands.js'
import { uiState } from '../state.js'
import type { ToastPosition } from '../state.js'
import { KitPageKeyContext } from './page-key-context.js'
import { safeAreaState } from '../../runtime/safe-area.js'
import { ToastView } from '../feedback/toast/index.js'

export interface ToastHostProps {
  className?: string
}

type TouchPoint = { clientX?: number; clientY?: number }
type TouchLike = { touches?: TouchPoint[]; changedTouches?: TouchPoint[] }
type TouchEvent = Parameters<CommonEventFunction>[0]

function pointOf(event: TouchLike): TouchPoint | undefined {
  return event.touches?.[0] ?? event.changedTouches?.[0]
}

/** sonner-native constants.ts：折叠时每层露出的边。 */
const STACK_GAP = 8

/** 原版 use-toast-animations.ts：折叠只做 scaleX 横向收窄，不改布局宽度（避免文字重排）。
 *  离堆叠前端越远收得越多，下限 0.8；top 前端在 index 0，其余位置前端在末尾。 */
function stackScaleX(index: number, count: number, position: ToastPosition, screenWidth: number): number {
  const multiplier = position === 'top' ? index : count - index - 1
  const narrowAmount = STACK_GAP * multiplier * 2
  return Math.max(0.8, 1 - narrowAmount / screenWidth)
}

/**
 * 命令式 Toast 的渲染宿主：状态在模块级 store，宿主只画当前页 scope 的条目。
 * 跨页时由 page show 把 scope 交接到新栈顶，剩余时间由 expiresAt 决定。
 */
export function ToastHost({ className }: ToastHostProps) {
  const pageKey = useContext(KitPageKeyContext)
  const state = uiState()
  const lifecycle = state.toastLifecycle
  const subscribe = useCallback((listener: () => void) => lifecycle.subscribe(listener), [lifecycle])
  const getSnapshot = useCallback(() => lifecycle.getSnapshot(), [lifecycle])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const mounted = useRef(true)
  const isExpanded = useSyncExternalStore(subscribeToastExpansion, getToastExpansion, getToastExpansion)
  const config = useSyncExternalStore(subscribeToastExpansion, getToastConfig, getToastConfig)
  const [screenWidth] = useState(() => Taro.getWindowInfo().windowWidth)
  const touches = useRef<Record<number, TouchPoint>>({})

  useEffect(() => {
    mounted.current = true
    if (pageKey) markHostMounted('toast', pageKey)
    else markHostMounted('toast')
    retargetToasts(pageKey ?? '')
    sweepExpiredToasts()
    return () => {
      mounted.current = false
      if (pageKey) markHostUnmounted('toast', pageKey)
      else markHostUnmounted('toast')
    }
  }, [pageKey])

  useDidShow(() => {
    retargetToasts(pageKey ?? '')
    sweepExpiredToasts()
  })

  const scoped = snapshot.filter((entry) => {
    const scope = lifecycle.scopeOf(entry.id)
    return pageKey === undefined ? scope === undefined || scope === '' : scope === pageKey
  })

  const position: ToastPosition = scoped[0]?.payload.position ?? 'bottom'
  // enableStacking / visibleToasts 是 Toaster 级配置；expanded 是交互态。
  // 折叠只是表现形式，点开后就是平铺：所有「当前怎么画」的决策统一认 stacked 这一个派生量。
  const { enableStacking: foldingEnabled, visibleToasts: limit } = config
  const stacked = foldingEnabled && !isExpanded
  const ordered = position === 'top' ? [...scoped].reverse() : scoped
  // visibleToasts 只在真正堆叠时裁剪；展开后按平铺逻辑显示所有条。
  const visible = stacked ? ordered.slice(0, Math.max(1, limit)) : ordered

  /* 卡片高度由内容决定（标题 / 描述 / action 按钮），固定档高会让带 action 的卡片重叠；
     按 sonner-native 的 allToastHeights 实测，首帧兜底 70，量到后重算 y。 */
  const [heights, setHeights] = useState<Readonly<Record<number, number>>>({})
  const measureKey = visible.map((entry) => entry.id).join(',')
  useEffect(() => {
    if (visible.length === 0) return
    const query = Taro.createSelectorQuery()
    for (const entry of visible) query.select(`#mptk-toast-${String(entry.id)}`).boundingClientRect()
    query.exec((res) => {
      const next: Record<number, number> = {}
      visible.forEach((entry, index) => {
        const rect = res[index] as { height?: number } | null
        if (rect !== null && typeof rect?.height === 'number' && rect.height > 0) next[entry.id] = rect.height
      })
      if (Object.keys(next).length === 0) return
      setHeights(next)
    })
    // measureKey 随可见条目变化触发重测；visible 里 payload 不变时高度不会变。
  }, [measureKey])

  const toggle = (): void => {
    setToastExpansion(!isExpanded)
  }

  const onAction = (id: number, seq: number, key: string): void => {
    if (!mounted.current || !lifecycle.isCurrent(id, seq)) return
    state.toastCallbacks.get(id)?.(key)
    closeToast(id)
  }

  const onTouchStart = (id: number, event: TouchEvent): void => {
    const point = pointOf(event as unknown as TouchLike)
    if (point !== undefined) touches.current[id] = point
  }

  const onTouchEnd = (id: number, event: TouchEvent): void => {
    const start = touches.current[id]
    const end = pointOf(event as unknown as TouchLike)
    delete touches.current[id]
    if (start === undefined || end === undefined) return
    const dx = (end.clientX ?? 0) - (start.clientX ?? 0)
    const dy = (end.clientY ?? 0) - (start.clientY ?? 0)
    const threshold = 24
    if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) closeToast(id)
  }

  const safe = safeAreaState().getSnapshot()
  const edge = 16
  const inset = (position === 'top' ? safe.top : position === 'bottom' ? safe.bottom : 0) + edge
  const style = position === 'top'
    ? { paddingTop: `${String(inset)}px` }
    : position === 'bottom'
      ? { paddingBottom: `${String(inset)}px` }
      : {}

  return (
    <View className={['mptk-toast-host', `mptk-toast-host--${position}`, className].filter(Boolean).join(' ')} style={style}>
      {isExpanded && foldingEnabled ? <View className="mptk-toast-outside" catchMove={false} onClick={toggle} /> : null}
      <View className={['mptk-toast-track', stacked ? 'mptk-toast-track--stack' : '', isExpanded && foldingEnabled ? 'mptk-toast-track--expanded' : '', `mptk-toast-track--${position}`].filter(Boolean).join(' ')}>
        {visible.map((entry, index) => {
          const seq = lifecycle.seqOf(entry.id)
          const scale = stacked ? stackScaleX(index, visible.length, position, screenWidth) : 1
          // 实测高度参与 y 计算（sonner-native position-utils 的 allToastHeights）。
          const h = (id: number): number => heights[id] ?? 70
          const gap = 8
          let y: number
          if (stacked) {
            // 原版 position-utils：top 前端在 index 0、y 为正；bottom/center 前端在末尾、y 为负。
            const frontIndex = position === 'top' ? 0 : visible.length - 1
            const frontHeight = h(visible[frontIndex]?.id ?? entry.id)
            const distance = position === 'top' ? index : visible.length - 1 - index
            const offset = frontHeight + distance * STACK_GAP - h(entry.id)
            y = position === 'top' ? offset : -offset
          } else if (position === 'top') {
            y = 0
            for (let i = 0; i < index; i += 1) y += h(visible[i]?.id ?? entry.id) + gap
          } else {
            y = 0
            for (let i = visible.length - 1; i > index; i -= 1) y -= h(visible[i]?.id ?? entry.id) + gap
          }
          return (
            <ToastView
              key={entry.id}
              payload={entry.payload}
              exiting={entry.phase === 'exiting'}
              scale={scale}
              y={y}
              domId={`mptk-toast-${String(entry.id)}`}
              zIndex={stacked ? visible.length - index : 1}
              onOpen={foldingEnabled ? toggle : undefined}
              onClose={() => closeToast(entry.id)}
              onAction={(key) => onAction(entry.id, seq, key)}
              onTouchStart={(event) => onTouchStart(entry.id, event)}
              onTouchEnd={(event) => onTouchEnd(entry.id, event)}
            />
          )
        })}
      </View>
    </View>
  )
}
