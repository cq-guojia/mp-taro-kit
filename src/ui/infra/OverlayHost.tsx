import { View } from '@tarojs/components'
import { DialogHost } from './DialogHost.js'
import { ToastHost } from './ToastHost.js'
import { LoadingHost } from './LoadingHost.js'
import { useThemeDark } from './use-theme.js'

export interface OverlayHostProps {
  className?: string
}

/**
 * 兼容出口：三类命令宿主的组合（等于同时挂 ToastHost + DialogHost + LoadingHost）。
 * 新代码推荐按需只挂需要的那一个宿主；本组件保留只为不打断既有消费方。
 */
export function OverlayHost({ className }: OverlayHostProps) {
  const dark = useThemeDark()
  return (
    <View className={['mptk-overlay-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      <LoadingHost />
      <ToastHost />
      <DialogHost />
    </View>
  )
}
