import { View } from '@tarojs/components'

export interface DividerProps {
  className?: string
}

/** 分隔线：纯展示，无业务内容。 */
export function Divider({ className }: DividerProps) {
  return <View className={['mptk-divider', className].filter(Boolean).join(' ')} />
}
