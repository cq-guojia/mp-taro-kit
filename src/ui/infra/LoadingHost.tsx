import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { markHostMounted, markHostUnmounted } from '../commands.js'
import { useLoadingState } from './use-store.js'
import { useThemeDark } from './use-theme.js'

export interface LoadingHostProps {
  className?: string
}

/** 全局 Loading 命令的渲染宿主：app 入口挂一次即可，不带遮罩。 */
export function LoadingHost({ className }: LoadingHostProps) {
  const dark = useThemeDark()
  const loading = useLoadingState()

  useEffect(() => {
    markHostMounted('loading')
    return () => markHostUnmounted('loading')
  }, [])

  if (!loading.active) return null
  return (
    <View className={['mptk-loading-host', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      <View className="mptk-loading">
        <Text className="mptk-loading__text">加载中</Text>
      </View>
    </View>
  )
}
