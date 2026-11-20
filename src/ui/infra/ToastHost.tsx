import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { markHostMounted, markHostUnmounted } from '../commands.js'
import { useNotices } from './use-store.js'
import { useThemeDark } from './use-theme.js'

export interface ToastHostProps {
  className?: string
}

/**
 * Toast 命令的渲染宿主：app 入口挂一次即可。
 * 轻量提示浮在内容之上，不带遮罩、不锁滚动——遮罩只属于 DialogHost。
 */
export function ToastHost({ className }: { className?: ToastHostProps['className'] }) {
  const dark = useThemeDark()
  const notices = useNotices()

  useEffect(() => {
    markHostMounted('toast')
    return () => markHostUnmounted('toast')
  }, [])

  return (
    <View className={['mptk-toast-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {notices.map((notice) => (
        <View key={notice.id} className={`mptk-toast mptk-toast--${notice.tone}`}>
          <Text>{notice.text}</Text>
        </View>
      ))}
    </View>
  )
}
