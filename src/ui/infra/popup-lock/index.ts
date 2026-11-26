import { createContext, useContext } from 'react'
import { decideGate, UNLOCKED_GATE, type PopupLockState, type GateDecision } from './decide.js'

export { decideGate, mergeNestedLock, UNLOCKED_GATE, type PopupLockState, type GateDecision } from './decide.js'

/** 闸门广播：Popup 把合并后的状态放进 Context，子树控件只读取判定。 */
export const PopupLockContext = createContext<PopupLockState>(UNLOCKED_GATE)

export function usePopupLock(): PopupLockState {
  return useContext(PopupLockContext)
}

/** 控件接入闸门的统一入口：读一次 Context，给出完整裁决。 */
export function useControlGate(key?: string): GateDecision {
  return decideGate(usePopupLock(), key)
}

/** 兼容旧调用：判定委托给 decideGate，不另写一份逻辑。 */
export function isPopupLockExempt(key: string | undefined, state: PopupLockState): boolean {
  return decideGate(state, key).exempt
}

/** 兼容旧调用；裸用控件不在 Context 里时恒为 false。 */
export function usePopupLocked(key?: string): boolean {
  return useControlGate(key).locked
}
