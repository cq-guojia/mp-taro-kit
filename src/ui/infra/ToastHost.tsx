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

  const position: ToastPosition = scoped[0]?.payload.position ?? 'top'
  // sonner-native 的 enableStacking / visibleToasts 是 Toaster 级配置，不是第一条 toast 的字段。
  const { enableStacking: stacking, visibleToasts: limit } = config
  const ordered = position === 'top' ? [...scoped].reverse() : scoped
  // sonner-native：visibleToasts 只在 enableStacking 时裁剪；平铺不限条数。
  const visible = stacking ? ordered.slice(0, Math.max(1, limit)) : ordered

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
      {isExpanded && stacking ? <View className="mptk-toast-outside" catchMove={false} onClick={toggle} /> : null}
      <View className={['mptk-toast-track', stacking ? 'mptk-toast-track--stack' : '', isExpanded ? 'mptk-toast-track--expanded' : '', `mptk-toast-track--${position}`].filter(Boolean).join(' ')}>
        {visible.map((entry, index) => {
          const seq = lifecycle.seqOf(entry.id)
          const behind = stacking && !isExpanded && index > 0
          const scale = behind ? Math.max(0.88, 1 - index * 0.04) : 1
          // 实测高度参与 y 计算（sonner-native position-utils 的 allToastHeights）。
          const h = (id: number): number => heights[id] ?? 70
          const gap = 8
          let y: number
          if (stacking && !isExpanded) {
            y = h(visible[0]?.id ?? entry.id) + index * 8 - h(entry.id)
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
              zIndex={stacking && !isExpanded ? visible.length - index : 1}
              onOpen={stacking ? toggle : undefined}
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
