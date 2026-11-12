import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { useThemeDark } from './use-theme.js'

export interface PageShellProps {
  children?: ReactNode
  className?: string
}

/**
 * 页面根容器：消费端用它替换自己原来的根 <View />，不是额外包一层。
 * 负责挂主题根标记，并按 Skyline 安全区要求铺内容区底色与文字色；高度链仍由宿主外壳类控制。
 * 首帧底色不在这里解决——由宿主 app.json + theme.json 的官方窗口主题配置提供。
 * <OverlayHost /> 与页面是兄弟节点，它自己挂同一标记，弹层才会一起换色。
 */
export function PageShell({ children, className }: PageShellProps) {
  const dark = useThemeDark()
  return (
    <View className={['mptk-page-shell', dark ? 'mptk-dark' : '', className].filter(Boolean).join(' ')}>
      {children}
    </View>
  )
}
