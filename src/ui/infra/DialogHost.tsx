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
  const busyRef = useRef<Set<number>>(new Set())

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

  const setBusy = (id: number, value: boolean): void => {
    if (!mountedRef.current) return
    if (value) busyRef.current.add(id)
    else busyRef.current.delete(id)
    setBusyIds((ids) => value
      ? (ids.includes(id) ? ids : [...ids, id])
      : ids.filter((item) => item !== id))
  }

  /**
   * 逻辑关闭：只标 exiting 并结算一次，节点留在树上等退场完成；
   * finish 由 ContentPopup 的 onExited 驱动，届时再清 busy / owner / 载荷。
   */
  const requestClose = (id: number, confirmed: boolean): void => {
    state.dialogLifecycle.close(id, (payload) => payload.resolve(confirmed))
  }

  const finish = (id: number): void => {
    setBusy(id, false)
    state.dialogLifecycle.finish(id)
  }

  const runAction = (id: number, entry: OverlayLifecycleEntry<DialogPayload>, key: string): void => {
    const payload = entry.payload
    // 已结算 / 退场中 / 卸载后不再受理任何动作。
    if (entry.phase !== 'open' || !mountedRef.current) return
    if (key === 'cancel') {
      requestClose(id, false)
      return
    }
    // 忙碌期只放行 lockExceptions 命中的 key；与 UI 层的放行口径一致。
    if (busyRef.current.has(id) && !payload.lockExceptions.includes(key)) return
    const seq = state.dialogLifecycle.seqOf(id)
    setBusy(id, true)
    const task = key === 'confirm'
      ? payload.onConfirm
      : payload.kind === 'confirm'
        ? () => payload.onAction?.(key)
        : undefined
    void Promise.resolve()
      .then(() => task?.())
      .then(
        (result) => {
          if (!state.dialogLifecycle.isCurrent(id, seq) || !mountedRef.current) return
          if (result === false) {
            // 闸门拒绝：保持打开，只解 busy 让用户重试。
            setBusy(id, false)
            return
          }
          // 成功：busy 留到 onExited → finish，退场帧不翻 busy/catchMove/loading，与声明式 Popup 同帧。
          requestClose(id, key === 'confirm')
        },
        () => {
          // reject / false 保持打开可重试，只解 busy。
          if (!state.dialogLifecycle.isCurrent(id, seq) || !mountedRef.current) return
          setBusy(id, false)
        },
      )
  }

  const actionsOf = (id: number, entry: OverlayLifecycleEntry<DialogPayload>): ContentPopupAction[] => {
    const payload = entry.payload
    const busy = busyIds.includes(id)
    return payload.actions.map((action) => ({
      text: action.text,
      type: action.type,
      variant: action.variant,
      size: action.size,
      color: action.color,
      loading: busy && !payload.lockExceptions.includes(action.key),
      loadingText: action.loadingText,
      lockKey: action.key,
      onClick: () => runAction(id, entry, action.key),
    }))
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
            locked={false}
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
