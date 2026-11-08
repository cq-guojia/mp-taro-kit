import { View, Text } from '@tarojs/components'
import { Loader } from './Loader.js'

export interface LoadingProps {
  visible?: boolean
  /** 右侧文案，传空串只留转圈图标 */
  text?: string
  className?: string
}

/** 声明式 Loading；全局唯一 loading 槽由 <OverlayHost /> 消费。转圈由 <Loader /> 提供。 */
export function Loading({ visible = true, text = '加载中', className }: LoadingProps) {
  if (!visible) return null
  const names = ['mptk-fb-loading', className]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <Loader variant="ring" size="md" className="mptk-fb-loading__spin" />
      {text === '' ? null : <Text className="mptk-fb-loading__text">{text}</Text>}
    </View>
  )
}
