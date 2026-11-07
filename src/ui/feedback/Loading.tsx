import { View, Text } from '@tarojs/components'

export interface LoadingProps {
  visible?: boolean
  text?: string
  className?: string
}

/** 声明式 Loading；全局唯一 loading 槽由 <OverlayHost /> 消费。 */
export function Loading({ visible = true, text = '加载中', className }: LoadingProps) {
  if (!visible) return null
  const names = ['mptk-fb-loading', className]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <Text className="mptk-fb-loading__text">{text}</Text>
    </View>
  )
}
