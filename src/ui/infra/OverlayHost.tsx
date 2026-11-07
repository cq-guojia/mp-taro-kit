import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { uiState } from '../state.js'
import { markOverlayHostMounted, markOverlayHostUnmounted } from '../commands.js'
import { useLoadingState, useNotices, useOverlayEntries } from './use-store.js'

export interface OverlayHostProps {
  className?: string
}

/**
 * 命令式 API 的渲染位置。宿主在页面基座挂一次即可；
 * 弹窗 / toast / loading 的具体内容由库渲染，业务内容仍从 children 或 options 传入。
 */
export function OverlayHost({ className }: OverlayHostProps) {
  const overlays = useOverlayEntries()
  const notices = useNotices()
  const loading = useLoadingState()

  useEffect(() => {
    markOverlayHostMounted()
    return () => markOverlayHostUnmounted()
  }, [])

  const close = (id: number, confirmed: boolean): void => {
    const entry = uiState().overlays.dismiss(id)
    if (entry === undefined) return
    entry.resolve(confirmed)
  }

  return (
    <View className={['mptk-overlay-host', className].filter(Boolean).join(' ')}>
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
