import type { OverlayEntry, OverlayStack } from '../../runtime/overlay-stack.js'

/**
 * 通用浮层生命周期：把「逻辑关闭 → 等动画完成 → 物理清理」从具体宿主抽出来。
 * 状态机只认 phase 与 owner，不持计时器 / CSS / React；退场完成由视觉层的 onExited 回调驱动。
 *
 * scope 语义与页面身份一致：undefined = 全局宿主，只认无 scope 的条目；
 * null = 拿不到身份的宿主，不认领；string = 只认同 scope 的条目。
 */
export type OverlayScope = string | null | undefined

export type OverlayLifecycleEntry<T> = OverlayEntry<T>

export interface OverlayLifecycle<T> {
  getSnapshot(): readonly OverlayLifecycleEntry<T>[]
  subscribe(listener: () => void): () => void
  /** 当前代际，异步回调开始时取、完成后交给 isCurrent 校验。 */
  seqOf(id: number): number
  /** 入栈并捕获 scope；返回 id。 */
  open(payload: T, scope?: OverlayScope): number
  /** 逻辑关闭：标记 exiting、结算一次；不动 owner，等 finish 才清理。重复调用返回 false。 */
  close(id: number, settle?: (payload: T) => void): boolean
  /** 退场完成：物理移除 + 释放 owner；重复 / 迟到调用返回 false。 */
  finish(id: number): boolean
  /** 强制单项移除（卸载兜底）：跳过退场，交还 payload 并清掉全部映射。 */
  dismiss(id: number): T | undefined
  /** 卸载 / reset 兜底：一次性物理移除全部并逐个结算。 */
  clear(settleAll?: (payload: T) => void): void
  /** 异步回调代际校验：id 仍在、未关闭、seq 一致。 */
  isCurrent(id: number, seq: number): boolean
  /**
   * 宿主认领；exiting 条目不重新认领（owner 保留到 finish）。
   * useOverlayLifecycle 在 render 期调用本方法与 owns/getSnapshot：实现方不得在这些方法里通知订阅者，
   * 否则就是 render 期同步更新 store，会重演 React #185。
   */
  claim(id: number, owner: string, scope: OverlayScope): boolean
  /** 该条目是否归此宿主。 */
  owns(id: number, owner: string): boolean
  /** 宿主卸载：释放它认领的全部条目，交还仍打开的 id 供调用方结算。 */
  release(owner: string): readonly number[]
}

export function createOverlayLifecycle<T>(stack: OverlayStack<T>): OverlayLifecycle<T> {
  const scopes = new Map<number, OverlayScope>()
  const owners = new Map<number, string>()
  const seqs = new Map<number, number>()
  let seq = 0
  // useSyncExternalStore 要求快照引用稳定：底层次数不变就必须返回同一个数组，
  // 否则 React 认为每次 render 快照都变，重复更新直到 #185。
  let cachedRaw: readonly OverlayEntry<T>[] | undefined
  let cachedSnapshot: readonly OverlayLifecycleEntry<T>[] = []

  return {
    getSnapshot(): readonly OverlayLifecycleEntry<T>[] {
      const raw = stack.getSnapshot()
      if (raw !== cachedRaw) {
        cachedRaw = raw
        cachedSnapshot = raw
      }
      return cachedSnapshot
    },
    subscribe(listener: () => void): () => void {
      return stack.subscribe(listener)
    },
    seqOf(id: number): number {
      return seqs.get(id) ?? 0
    },
    open(payload: T, scope?: OverlayScope): number {
      const id = stack.push(payload)
      seqs.set(id, ++seq)
      scopes.set(id, scope)
      return id
    },
    close(id: number, settle?: (payload: T) => void): boolean {
      const entry = stack.getSnapshot().find((item) => item.id === id)
      if (entry === undefined || entry.phase !== 'open') return false
      const marked = stack.markExiting(id)
      if (marked === undefined) return false
      seqs.set(id, ++seq)
      if (settle !== undefined) settle(entry.payload)
      return true
    },
    finish(id: number): boolean {
      const entry = stack.getSnapshot().find((item) => item.id === id)
      if (entry === undefined || entry.phase !== 'exiting') return false
      const payload = stack.finishExiting(id)
      if (payload === undefined) return false
      seqs.delete(id)
      scopes.delete(id)
      owners.delete(id)
      return true
    },
    dismiss(id: number): T | undefined {
      const payload = stack.dismiss(id)
      if (payload !== undefined) {
        seqs.delete(id)
        scopes.delete(id)
        owners.delete(id)
      }
      return payload
    },
    clear(settleAll?: (payload: T) => void): void {
      // exiting 条目已在 close 结算；兜底只补仍 open 的，避免二次结算覆盖用户选择。
      const pending = stack.getSnapshot()
        .filter((entry) => entry.phase === 'open')
        .map((entry) => entry.payload)
      stack.clear()
      for (const payload of pending) settleAll?.(payload)
      seqs.clear()
      scopes.clear()
      owners.clear()
    },
    isCurrent(id: number, checkSeq: number): boolean {
      const entry = stack.getSnapshot().find((item) => item.id === id)
      return entry !== undefined && entry.phase === 'open' && (seqs.get(id) ?? 0) === checkSeq
    },
    claim(id: number, owner: string, scope: OverlayScope): boolean {
      const entry = stack.getSnapshot().find((item) => item.id === id)
      if (entry === undefined || entry.phase !== 'open') return owners.get(id) === owner
      const existing = owners.get(id)
      if (existing !== undefined) return existing === owner
      const entryScope = scopes.get(id)
      const matched = scope === null
        ? false
        : scope === undefined
          ? entryScope === undefined || entryScope === ''
          : entryScope === scope
      if (!matched) return false
      owners.set(id, owner)
      return true
    },
    owns(id: number, owner: string): boolean {
      return owners.get(id) === owner
    },
    release(owner: string): readonly number[] {
      const released: number[] = []
      for (const [id, value] of owners) {
        if (value !== owner) continue
        owners.delete(id)
        released.push(id)
      }
      return released
    },
  }
}
