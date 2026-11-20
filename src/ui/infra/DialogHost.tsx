import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { markHostMounted, markHostUnmounted } from '../commands.js'
import { uiState } from '../state.js'
import { Overlay } from '../layout/Overlay.js'
import { useOverlayEntries } from './use-store.js'
import { useThemeDark } from './use-theme.js'

export interface DialogHostProps {
  className?: string
}

/**
 * alert / confirm 命令的渲染宿主：app 入口挂一次即可。
 * 唯一使用 <Overlay> 遮罩的命令宿主；确认类弹窗点空白不关、锁住底层滚动。
 */
export function DialogHost({ className }: DialogHostProps) {
  const dark = useThemeDark()
  const overlays = useOverlayEntries()

  useEffect(() => {
    markHostMounted('dialog')
    return () => markHostUnmounted('dialog')
  }, [])

  const close = (id: number, confirmed: boolean): void => {
    const entry = uiState().overlays.dismiss(id)
    if (entry === undefined) return
    entry.resolve(confirmed)
  }

  return (
    <View className={['mptk-dialog-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {overlays.map((entry) => (
        <View key={entry.id} className="mptk-dialog">
          <Overlay closable={false} />
          <View className={['mptk-dialog__panel', dark ? 'mptk-dark' : ''].filter(Boolean).join(' ')}>
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
