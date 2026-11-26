/**
 * 浮层闸门状态与唯一判定：零平台依赖的纯函数，Node 自检可直接加载。
 * Popup 广播它、DialogHost 命令式构造它、各控件读取它——全部共用这一份形状与判定。
 */
export interface PopupLockState {
  readonly blocked: boolean
  readonly exceptions: readonly string[]
}

/** 单个 key 的闸门裁决；控件与命令式动作共用这一种结果。 */
export interface GateDecision {
  /** 闸门整体是否锁住（面板 / 遮罩层用）。 */
  readonly blocked: boolean
  /** 本 key 是否被白名单放行。放行只在 blocked 时成立。 */
  readonly exempt: boolean
  /** 本 key 此刻是否应被锁住。 */
  readonly locked: boolean
}

/**
 * 全库唯一的闸门判定：blocked 且未被例外放行即为 locked。
 * 没有 key 的控件无法申请例外，blocked 时一律锁住。
 */
export function decideGate(state: PopupLockState, key?: string): GateDecision {
  const exempt = state.blocked && key !== undefined && state.exceptions.includes(key)
  return { blocked: state.blocked, exempt, locked: state.blocked && !exempt }
}

/**
 * 嵌套浮层合并：任意一层锁住即整体锁住；例外必须每一层都放行才放行。
 * 例外取交集（外层未锁时它等于没约束，直接采用内层）——并集会让内层自己放的 key
 * 绕过外层锁，这是错的。与 decideGate 同处一文件，判定口径只有一处。
 */
export function mergeNestedLock(
  outer: PopupLockState,
  inner: { blocked: boolean; exceptions?: readonly string[] },
): PopupLockState {
  const blocked = inner.blocked || outer.blocked
  if (inner.exceptions === undefined) return { blocked, exceptions: outer.exceptions }
  if (!outer.blocked) return { blocked, exceptions: inner.exceptions }
  return {
    blocked,
    exceptions: inner.exceptions.filter((key) => outer.exceptions.includes(key)),
  }
}

/** 解锁态单例：Context 默认值与各控件的非浮层基线共用。 */
export const UNLOCKED_GATE: PopupLockState = { blocked: false, exceptions: [] }
