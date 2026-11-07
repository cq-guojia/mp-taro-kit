import { View } from '@tarojs/components'

export interface MaskProps {
  visible?: boolean
  onClose?: () => void
  className?: string
}

/** 遮罩：点击回调由宿主给，库不决定关闭策略。 */
export function Mask({ visible = true, onClose, className }: MaskProps) {
  if (!visible) return null
  const names = ['mptk-mask', className]
  return <View className={names.filter(Boolean).join(' ')} onClick={() => onClose?.()} />
}
