import { useContext, useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { markHostMounted, markHostUnmounted } from '../commands.js'
import { uiState } from '../state.js'
import type { DialogPayload } from '../state.js'
import { ContentPopup } from '../layout/content-popup/ContentPopup.js'
import type { ContentPopupAction } from '../layout/content-popup/ContentPopup.js'
import { KitPageKeyContext } from './page-key-context.js'
import { useOverlayLifecycle } from './use-overlay-lifecycle.js'
import type { OverlayLifecycleEntry } from './overlay-lifecycle.js'
import { useThemeDark } from './use-theme.js'
import { decideGate, type PopupLockState } from './popup-lock/index.js'
import { isThenable, isSuccess } from '../../runtime/thenable.js'

export interface DialogHostProps {
  className?: string
}

let hostSeq = 0

/**
 * alert / confirm 命令的渲染宿主：一条载荷只归一个 Host，
 * Taro App 在每页 React root 都渲染时不会重复出框。
 */
export function DialogHost({ className }: DialogHostProps) {
  const dark = useThemeDark()
  const pageKey = useContext(KitPageKeyContext)
  const state = uiState()
  const [token] = useState(() => {
    hostSeq += 1
    return `mptk-dialog-host-${String(hostSeq)}`
  })
  const { entries, mountedRef } = useOverlayLifecycle(state.dialogLifecycle, {
    token,
    scope: pageKey,
  })
  const [busyIds, setBusyIds] = useState<readonly number[]>([])
  // 每个弹窗 → 每个 key 的在飞行动作数：例外允许并发（含同 key 重入），只有最后一个 settle 才解锁。
  // 布尔会误清并发的另一个动作，Set 又会让同 key 的先结束者提前解锁，所以用计数表。
  const activeRef = useRef<Map<number, Map<string, number>>>(new Map())
  // 正在跑的动作 key 集合：只有这些按钮转圈，其余被闸门锁住的只置灰、不转圈。
  const [pendingKeys, setPendingKeys] = useState<Readonly<Record<number, readonly string[]>>>({})

  // useOverlayLifecycle 已按 scope 认领；这里只取归本宿主的条目。
  const visible = entries.filter((entry) => state.dialogLifecycle.owns(entry.id, token))

  useEffect(() => {
    markHostMounted('dialog')
    return () => {
      markHostUnmounted('dialog')
      // 宿主卸载时它认领的弹窗就地收尾，不能把 Promise 留在半空。
      // 退场中的条目已在 close 结算过，只解仍 open 的，避免二次结算覆盖用户选择。
      const snapshot = state.dialogLifecycle.getSnapshot()
      const owned = state.dialogLifecycle.release(token)
      for (const id of owned) {
        const payload = state.dialogLifecycle.dismiss(id)
        if (payload !== undefined && snapshot.find((entry) => entry.id === id)?.phase === 'open') {
          payload.resolve(false)
        }
      }
      if (uiState().hosts.dialog <= 0) {
        state.dialogLifecycle.clear((payload) => payload.resolve(false))
      }
    }
  }, [token])

  /** 开始一个动作：登记为活跃 + 转圈。同 key 重入也各记一笔，避免先结束者提前解锁。 */
  const startAction = (id: number, key: string): void => {
    if (!mountedRef.current) return
    const active = activeRef.current.get(id) ?? new Map<string, number>()
    active.set(key, (active.get(key) ?? 0) + 1)
    activeRef.current.set(id, active)
    setBusyIds((ids) => ids.includes(id) ? ids : [...ids, id])
    setPendingKeys((prev) => ({ ...prev, [id]: [...active.keys()] }))
  }

  /** 结束一个动作：只减它自己的 key 一笔；还有别的在飞行动作时整框锁与转圈都保持。 */
  const settleAction = (id: number, key: string): void => {
    if (!mountedRef.current) return
    const active = activeRef.current.get(id)
    const count = active?.get(key)
    if (active === undefined || count === undefined) return
    if (count > 1) active.set(key, count - 1)
    else active.delete(key)
    const settled = active.size === 0
    if (settled) activeRef.current.delete(id)
    setPendingKeys((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      if (settled) delete next[id]
      else next[id] = [...active.keys()]
      return next
    })
    if (settled) setBusyIds((ids) => ids.filter((item) => item !== id))
  }

  /**
   * 逻辑关闭：只标 exiting 并结算一次，节点留在树上等退场完成；
   * finish 由 ContentPopup 的 onExited 驱动，届时再清 busy / owner / 载荷。
   */
  const requestClose = (id: number, confirmed: boolean): void => {
    state.dialogLifecycle.close(id, (payload) => payload.resolve(confirmed))
  }

  const finish = (id: number): void => {
    // 退场完成：该弹窗的在飞行动作一并落地，不能留悬空 key。
    activeRef.current.delete(id)
    setPendingKeys((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setBusyIds((ids) => ids.filter((item) => item !== id))
    state.dialogLifecycle.finish(id)
  }

  /** 命令式载荷投影成闸门状态：与 Popup 广播的是同一形状、同一判定。 */
  const gateFor = (payload: DialogPayload, busy: boolean): PopupLockState => ({
    blocked: busy,
    exceptions: payload.lockExceptions,
  })

  const runAction = (id: number, entry: OverlayLifecycleEntry<DialogPayload>, key: string): void => {
    const payload = entry.payload
    // 已结算 / 退场中 / 卸载后不再受理任何动作。
    if (entry.phase !== 'open' || !mountedRef.current) return
    // 所有动作（含 cancel）统一过闸门判定：忙碌期只有 lockExceptions 命中的 key 放行。
    if (decideGate(gateFor(payload, activeRef.current.has(id)), key).locked) return
    if (key === 'cancel') {
      requestClose(id, false)
      return
    }
    const seq = state.dialogLifecycle.seqOf(id)
    // 默认集合的 confirm 走 onConfirm；自定义集合里即使 key 叫 confirm 也走 onAction，
    // 否则调用方给自定义按钮挂的异步闸门会被静默丢掉（alert 的自定义按钮同理）。
    const task = !payload.customActions && key === 'confirm'
      ? payload.onConfirm
      : payload.onAction
        ? () => payload.onAction?.(key)
        : undefined
    // 同步回调不登记活跃动作：转圈 / 整框锁只属于真的返回 thenable 的动作。
    let result: unknown
    try {
      result = task?.()
    } catch {
      if (state.dialogLifecycle.isCurrent(id, seq) && mountedRef.current) payload.onFailed?.(key)
      return
    }
    if (!isThenable(result)) {
      if (!state.dialogLifecycle.isCurrent(id, seq) || !mountedRef.current) return
      if (isSuccess(result)) requestClose(id, true)
      else payload.onFailed?.(key)
      return
    }
    startAction(id, key)
    const fail = (): void => {
      // 闸门拒绝：只结束自己这个动作；还有别的例外动作在跑时整框锁保持。
      settleAction(id, key)
      payload.onFailed?.(key)
    }
    void Promise.resolve(result).then(
      (value) => {
        if (!state.dialogLifecycle.isCurrent(id, seq) || !mountedRef.current) return
        if (!isSuccess(value)) {
          fail()
          return
        }
        // 成功：busy 留到 onExited → finish，退场帧不翻 busy/catchMove/loading，与声明式 Popup 同帧。
        // 取消 / 叉 / 遮罩已各自传 false；能走到这里的都是成功动作，自定义 key 也算确认。
        requestClose(id, true)
      },
      () => {
        // reject 保持打开可重试，只解 busy。
        if (!state.dialogLifecycle.isCurrent(id, seq) || !mountedRef.current) return
        fail()
      },
    )
  }

  const actionsOf = (id: number, entry: OverlayLifecycleEntry<DialogPayload>): ContentPopupAction[] => {
    const payload = entry.payload
    const busy = busyIds.includes(id)
    const gate = gateFor(payload, busy)
    const pending = pendingKeys[id] ?? []
    return payload.actions.map((action) => {
      const decision = decideGate(gate, action.key)
      const spinning = pending.includes(action.key)
      return {
        text: action.text,
        type: action.type,
        variant: action.variant,
        size: action.size,
        color: action.color,
        // 转圈只属于正在跑的动作；其余被闸门锁住的按钮只是禁用变灰，不转圈。
        loading: spinning,
        // 闸门锁 = 禁用态，与转圈解耦；正在转圈的那个不灰，例外按钮既不禁用也不转圈。
        disabled: decision.locked && !spinning,
        loadingText: action.loadingText,
        lockKey: action.key,
        onClick: () => runAction(id, entry, action.key),
      }
    })
  }

  return (
    <View className={['mptk-dialog-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {visible.map((entry) => {
        const id = entry.id
        const payload = entry.payload
        const exiting = entry.phase === 'exiting'
        const open = !exiting
        return (
          <ContentPopup
            key={id}
            open={open}
            initialOpen={false}
            onExited={() => finish(id)}
            position={payload.position}
            width={payload.width}
            variant={payload.badge !== undefined ? 'badge' : payload.headerImage !== undefined ? 'image' : 'title'}
            badge={payload.badge}
            image={payload.headerImage}
            title={payload.content.title}
            subtitle={payload.content.note}
            headerIcon={payload.content.icon !== undefined
              ? { kind: 'icon', name: payload.content.icon, color: payload.content.iconColor }
              : undefined}
            iconFramed={payload.content.iconColor !== undefined}
            closeable={payload.closeable}
            closable={payload.maskClosable}
            closeOffset={payload.offsets}
            busy={busyIds.includes(id)}
            lockExceptions={payload.lockExceptions}
            onClose={() => requestClose(id, false)}
            footerConfig={{
              layout: payload.layout === 'stack' ? 'stack' : 'row',
              separation: payload.layout === 'joined' ? 'joined' : 'spaced',
              divider: payload.layout === 'joined',
              ratios: payload.layout === 'stack' ? undefined : payload.actions.map(() => 1),
            }}
            actions={actionsOf(id, entry)}
          >
            <View className="mptk-dialog__body">
              <View className="mptk-dialog__description"><Text>{payload.content.description}</Text></View>
            </View>
          </ContentPopup>
        )
      })}
    </View>
  )
}
