import { View, Text } from '@tarojs/components'
import type { NoticeTone } from '../../runtime/notify.js'

export interface ToastProps {
  text: string
  tone?: NoticeTone
  visible?: boolean
  className?: string
}

/** 声明式 Toast；自动消失与队列交给命令式 API 与 runtime 的通知中心。 */
export function Toast({ text, tone = 'info', visible = true, className }: ToastProps) {
  if (!visible) return null
  const names = ['mptk-fb-toast', `mptk-fb-toast--${tone}`, className]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <Text>{text}</Text>
    </View>
  )
}
