/** 浮层条目。栈只存 payload，不掺 resolve / 渲染器，那是 ui 层的事。 */
export interface OverlayEntry<T> {
  readonly id: number
  readonly payload: T
}

export interface OverlayStack<T> {
  push(payload: T): number
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

  return {
    push(payload: T): number {
      const id = ++seq
      entries = [...entries, { id, payload }]
      notify()
      return id
    },
    dismiss(id: number): T | undefined {
      const found = entries.find((entry) => entry.id === id)
      if (found === undefined) return undefined
      entries = entries.filter((entry) => entry.id !== id)
      notify()
      return found.payload
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
