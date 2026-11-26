/**
 * 浮层条目的生命周期阶段：open 可交互，exiting 仍挂载、等动画播完才物理移除。
 * phase 是纯状态，计时与 React 回调都在 ui 层。
 */
export type OverlayPhase = 'open' | 'exiting'

/** 浮层条目。栈只存 payload 与阶段，不掺 resolve / 渲染器，那是 ui 层的事。 */
export interface OverlayEntry<T> {
  readonly id: number
  readonly payload: T
  readonly phase: OverlayPhase
}

export interface OverlayStack<T> {
  push(payload: T): number
  /** 逻辑关闭：标记退场但保留条目；重复调用幂等。 */
  markExiting(id: number): OverlayEntry<T> | undefined
  /** 退场完成：物理移除，交还 payload；重复调用返回 undefined。 */
  finishExiting(id: number): T | undefined
  /** 立即物理移除（强制路径：卸载 / reset）。与动画无关。 */
  dismiss(id: number): T | undefined
  clear(): T[]
  getSnapshot(): readonly OverlayEntry<T>[]
  subscribe(listener: () => void): () => void
}

/**
 * 栈用不可变替换维护：getSnapshot 返回稳定引用，可直接喂给 useSyncExternalStore。
 * 只有状态真变了才通知订阅者；无效 id / 空栈 clear 返回兜底值且不抛。
 */
export function createOverlayStack<T>(): OverlayStack<T> {
  let entries: OverlayEntry<T>[] = []
  let seq = 0
  const listeners = new Set<() => void>()

  const notify = (): void => {
    for (const listener of listeners) listener()
  }

  const remove = (id: number): T | undefined => {
    const found = entries.find((entry) => entry.id === id)
    if (found === undefined) return undefined
    entries = entries.filter((entry) => entry.id !== id)
    notify()
    return found.payload
  }

  return {
    push(payload: T): number {
      const id = ++seq
      entries = [...entries, { id, payload, phase: 'open' }]
      notify()
      return id
    },
    markExiting(id: number): OverlayEntry<T> | undefined {
      const found = entries.find((entry) => entry.id === id)
      if (found === undefined) return undefined
      if (found.phase === 'exiting') return found
      entries = entries.map((entry) =>
        entry.id === id ? { id, payload: entry.payload, phase: 'exiting' as const } : entry)
      notify()
      return entries.find((entry) => entry.id === id)
    },
    finishExiting(id: number): T | undefined {
      const found = entries.find((entry) => entry.id === id)
      if (found === undefined || found.phase !== 'exiting') return undefined
      return remove(id)
    },
    dismiss(id: number): T | undefined {
      return remove(id)
    },
    clear(): T[] {
      if (entries.length === 0) return []
      const payloads = entries.map((entry) => entry.payload)
      entries = []
      notify()
      return payloads
    },
    getSnapshot(): readonly OverlayEntry<T>[] {
      return entries
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
