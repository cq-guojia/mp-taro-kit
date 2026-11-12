import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { uiState } from '../state.js'
import { markOverlayHostMounted, markOverlayHostUnmounted } from '../commands.js'
import { useLoadingState, useNotices, useOverlayEntries } from './use-store.js'
import { useThemeDark } from './use-theme.js'

export interface OverlayHostProps {
  className?: string
}

/**
 * 命令式 API 的渲染位置。宿主在页面基座挂一次即可；
 * 弹窗 / toast / loading 的具体内容由库渲染，业务内容仍从 children 或 options 传入。
 */
export function OverlayHost({ className }: OverlayHostProps) {
  const dark = useThemeDark()
  const overlays = useOverlayEntries()
  const notices = useNotices()
  const loading = useLoadingState()

  // 渲染期就置位：宿主的页面生命周期（如 onLoad）可能早于 useEffect，
  // 那时组件其实已挂载，只是 effect 未跑，不该被判成「未挂载」而抛错。
  markOverlayHostMounted()

  useEffect(() => {
    // 幂等重置，兼容 StrictMode 的 mount → unmount → mount。
    markOverlayHostMounted()
    return () => markOverlayHostUnmounted()
  }, [])

  const close = (id: number, confirmed: boolean): void => {
    const entry = uiState().overlays.dismiss(id)
    if (entry === undefined) return
    entry.resolve(confirmed)
  }

  return (
    <View className={['mptk-overlay-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {loading.active ? (
        <View className="mptk-loading">
          <Text className="mptk-loading__text">加载中</Text>
        </View>
      ) : null}

      {notices.map((notice) => (
        <View key={notice.id} className={`mptk-toast mptk-toast--${notice.tone}`}>
          <Text>{notice.text}</Text>
        </View>
      ))}

      {overlays.map((entry) => (
        <View key={entry.id} className="mptk-dialog">
          <View className="mptk-dialog__panel">
            {entry.payload.title === undefined ? null : (
              <View className="mptk-dialog__title">
                <Text>{entry.payload.title}</Text>
              </View>
            )}
            <View className="mptk-dialog__body">
              <Text>{entry.payload.message}</Text>
            </View>
            <View className="mptk-dialog__actions">
              {entry.payload.kind === 'confirm' ? (
                <View
                  className="mptk-dialog__action mptk-dialog__action--cancel"
                  onClick={() => close(entry.id, false)}
                >
                  <Text>{entry.payload.cancelText}</Text>
                </View>
              ) : null}
              <View
                className="mptk-dialog__action mptk-dialog__action--confirm"
                onClick={() => close(entry.id, true)}
              >
                <Text>{entry.payload.confirmText}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
