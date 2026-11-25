import { createContext, useContext } from 'react'

/**
 * 浮层交互锁：底座把「整框屏蔽 + 例外可点」广播给内部控件。
 * 控件以稳定的 lockKey 认领例外（'close' / 'overlay' / 按钮自定义 key）。
 */
export interface PopupLockState {
  readonly blocked: boolean
  readonly exceptions: readonly string[]
}

const unlocked: PopupLockState = { blocked: false, exceptions: [] }

export const PopupLockContext = createContext<PopupLockState>(unlocked)

export function usePopupLock(): PopupLockState {
  return useContext(PopupLockContext)
}

export function isPopupLockExempt(key: string | undefined, state: PopupLockState): boolean {
  return state.blocked && key !== undefined && state.exceptions.includes(key)
}

/** 控件是否应被锁住；不在 Context 里（裸用按钮）恒为 false。 */
export function usePopupLocked(key?: string): boolean {
  const state = usePopupLock()
  return state.blocked && !isPopupLockExempt(key, state)
}
