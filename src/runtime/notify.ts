export type NoticeTone = 'info' | 'success' | 'warn' | 'error'

/** 文案由调用方传已翻译好的字符串；runtime 不做 i18n，也不做定时消失。 */
export interface Notice {
  readonly id: number
  readonly text: string
  readonly tone: NoticeTone
}

export interface NotifyCenter {
  show(text: string, tone?: NoticeTone): number
  dismiss(id: number): boolean
  clear(): Notice[]
  getSnapshot(): readonly Notice[]
  subscribe(listener: () => void): () => void
}

/**
 * 通知队列：core 与 ui 共用同一份。超出 limit 挤掉最旧一条，
 * 自动消失 / 动画交给 ui 层，本层不碰平台定时器。
 */
export function createNotifyCenter(limit = 3): NotifyCenter {
  let notices: Notice[] = []
  let seq = 0
  const listeners = new Set<() => void>()
  const max = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3

  const notify = (): void => {
    for (const listener of listeners) listener()
  }

  return {
    show(text: string, tone: NoticeTone = 'info'): number {
      const id = ++seq
      notices = [...notices, { id, text, tone }]
      if (notices.length > max) notices = notices.slice(notices.length - max)
      notify()
      return id
    },
    dismiss(id: number): boolean {
      const exists = notices.some((notice) => notice.id === id)
      if (!exists) return false
      notices = notices.filter((notice) => notice.id !== id)
      notify()
      return true
    },
    clear(): Notice[] {
      if (notices.length === 0) return []
      const removed = notices
      notices = []
      notify()
      return removed
    },
    getSnapshot(): readonly Notice[] {
      return notices
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
