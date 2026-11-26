import { useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { View } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import { markHostMounted, markHostUnmounted, closeToast, retargetToasts, sweepExpiredToasts } from '../commands.js'
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
  const [expanded, setExpanded] = useState<Readonly<Record<string, boolean>>>({})
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
  const stacking = scoped[0]?.payload.enableStacking ?? false
  const limit = scoped[0]?.payload.visibleToasts ?? 3
  const ordered = position === 'top' ? [...scoped].reverse() : scoped
  const visible = ordered.slice(0, Math.max(1, limit))
  const isExpanded = expanded[position] === true

  const toggle = (): void => {
    setExpanded((prev) => ({ ...prev, [position]: !isExpanded }))
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
  const inset = position === 'top' ? safe.top : position === 'bottom' ? safe.bottom : 0
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
          const scale = behind ? Math.max(0.8, 1 - index * 0.1) : 1
          return (
            <ToastView
              key={entry.id}
              payload={entry.payload}
              exiting={entry.phase === 'exiting'}
              scale={scale}
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
