export interface LoadingState {
  readonly active: boolean
  readonly count: number
}

export interface LoadingSlot {
  show(): number
  hide(id: number): boolean
  getSnapshot(): LoadingState
  subscribe(listener: () => void): () => void
}

/**
 * 全局唯一 loading 槽：句柄 id 配对，重复 hide / 未知 id 返回 false 且不误关别人的。
 * 计数归零才 inactive；状态真变了才通知，getSnapshot 引用稳定。
 */
export function createLoadingSlot(): LoadingSlot {
  const handles = new Set<number>()
  let seq = 0
  let snapshot: LoadingState = { active: false, count: 0 }
  const listeners = new Set<() => void>()

  const refresh = (): void => {
    const next: LoadingState = { active: handles.size > 0, count: handles.size }
    if (next.active === snapshot.active && next.count === snapshot.count) return
    snapshot = next
    for (const listener of listeners) listener()
  }

  return {
    show(): number {
      const id = ++seq
      handles.add(id)
      refresh()
      return id
    },
    hide(id: number): boolean {
      const removed = handles.delete(id)
      if (removed) refresh()
      return removed
    },
    getSnapshot(): LoadingState {
      return snapshot
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
