import { useContext, useEffect, useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import { markHostMounted, markHostUnmounted } from '../commands.js'
import { uiState } from '../state.js'
import type { DialogPayload } from '../state.js'
import { ContentPopup } from '../layout/content-popup/ContentPopup.js'
import type { ContentPopupAction } from '../layout/content-popup/ContentPopup.js'
import { KitPageKeyContext } from './page-key-context.js'
import { useOverlayEntries } from './use-store.js'
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
  const overlays = useOverlayEntries()
  const [token] = useState(() => {
    hostSeq += 1
    return `mptk-dialog-host-${String(hostSeq)}`
  })
  const [busyIds, setBusyIds] = useState<readonly number[]>([])
  const busyRef = useRef<Set<number>>(new Set())
  const state = uiState()

  // Taro 会保留上一页页面树：undefined 是手动全局宿主，null 是拿不到身份的页面宿主，都不抢页面弹窗。
  const owns = (entry: { payload: DialogPayload }): boolean => pageKey === undefined
    ? entry.payload.pageKey === undefined || entry.payload.pageKey === ''
    : pageKey !== null && entry.payload.pageKey === pageKey
  for (const entry of overlays) {
    if (owns(entry) && !state.dialogOwners.has(entry.id)) state.dialogOwners.set(entry.id, token)
  }
  const visible = overlays.filter((entry) => owns(entry) && state.dialogOwners.get(entry.id) === token)

  useEffect(() => {
    markHostMounted('dialog')
    return () => {
      markHostUnmounted('dialog')
      // 宿主卸载时它认领的弹窗就地收尾，不能把 Promise 留在半空。
      for (const [id, owner] of state.dialogOwners) {
        if (owner !== token) continue
        state.dialogOwners.delete(id)
        const entry = uiState().overlays.dismiss(id)
        if (entry !== undefined) entry.resolve(false)
      }
      if (uiState().hosts.dialog <= 0) {
        for (const payload of uiState().overlays.clear()) payload.resolve(false)
        state.dialogOwners.clear()
      }
    }
  }, [token])

  const setBusy = (id: number, value: boolean): void => {
    if (value) busyRef.current.add(id)
    else busyRef.current.delete(id)
    setBusyIds((ids) => value
      ? (ids.includes(id) ? ids : [...ids, id])
      : ids.filter((item) => item !== id))
  }

  const dismiss = (id: number, confirmed: boolean): void => {
    if (busyRef.current.has(id)) return
    const entry = uiState().overlays.dismiss(id)
    state.dialogOwners.delete(id)
    if (entry !== undefined) entry.resolve(confirmed)
  }

  const runAction = (id: number, payload: DialogPayload, key: string) => {
    if (busyRef.current.has(id)) return
    if (key === 'cancel') {
      dismiss(id, false)
      return
    }
    setBusy(id, true)
    const task = key === 'confirm'
      ? payload.onConfirm
      : payload.kind === 'confirm'
        ? () => payload.onAction?.(key)
        : undefined
    return Promise.resolve()
      .then(() => task?.())
      .then(
        (result) => {
          setBusy(id, false)
          if (result !== false) dismiss(id, key === 'confirm')
        },
        () => {
          setBusy(id, false)
        },
      )
  }

  const actionsOf = (id: number, payload: DialogPayload): ContentPopupAction[] =>
    payload.actions.map((action) => ({
      text: action.text,
      type: action.type,
      variant: action.variant,
      size: action.size,
      color: action.color,
      loadingText: action.loadingText,
      lockKey: action.key,
      onClick: () => runAction(id, payload, action.key),
    }))

  return (
    <View className={['mptk-dialog-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {visible.map((entry) => {
        const payload = entry.payload
        const busy = busyIds.includes(entry.id)
        const layout = payload.layout
        const actions = actionsOf(entry.id, payload)
        return (
          <ContentPopup
            key={entry.id}
            open
            position={payload.position}
            width={payload.width}
            variant={payload.badge !== undefined ? 'badge' : payload.headerImage !== undefined ? 'image' : 'title'}
            badge={payload.badge}
            image={payload.headerImage}
            title={payload.content.variant === 'icon' ? payload.content.title : undefined}
            subtitle={payload.content.variant === 'icon' ? payload.content.note : undefined}
            headerIcon={payload.content.variant === 'icon' && payload.content.icon !== undefined
              ? { kind: 'icon', name: payload.content.icon }
              : undefined}
            closeable={payload.closeable}
            closable={payload.maskClosable}
            closeOffset={payload.offsets}
            busy={busy}
            lockExceptions={payload.lockExceptions}
            onClose={() => dismiss(entry.id, false)}
            footerConfig={{
              layout: layout === 'stack' ? 'stack' : 'row',
              separation: layout === 'joined' ? 'joined' : 'spaced',
              divider: layout === 'joined',
              ratios: layout === 'stack' ? undefined : actions.map(() => 1),
            }}
            actions={actions}
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
