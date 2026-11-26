import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import type { OverlayLifecycle, OverlayLifecycleEntry, OverlayScope } from './overlay-lifecycle.js'

/** 宿主视角的生命周期：只看到自己认领的条目（含正在退场、owner 保留的条目）。 */
export interface OverlayLifecycleView<T> {
  readonly entries: readonly OverlayLifecycleEntry<T>[]
  /** 卸载后为 false；异步回调据此不再 setState。 */
  readonly mountedRef: { readonly current: boolean }
}

/**
 * 把通用生命周期接到 React：订阅快照、按 scope 认领、记录挂载状态。
 * 认领沿用既有语义（render 期只写一次 owner，多页宿主不会抢同一条），
 * 卸载时的结算与 release 由调用方在自己的 effect 里做——那属于业务语义。
 */
export function useOverlayLifecycle<T>(
  lifecycle: OverlayLifecycle<T>,
  owner: { token: string; scope: OverlayScope },
): OverlayLifecycleView<T> {
  const subscribe = useCallback(
    (listener: () => void) => lifecycle.subscribe(listener),
    [lifecycle],
  )
  const getSnapshot = useCallback(() => lifecycle.getSnapshot(), [lifecycle])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const entries: OverlayLifecycleEntry<T>[] = []
  for (const entry of snapshot) {
    lifecycle.claim(entry.id, owner.token, owner.scope)
    if (lifecycle.owns(entry.id, owner.token)) entries.push(entry)
  }
  return { entries, mountedRef: mounted }
}
