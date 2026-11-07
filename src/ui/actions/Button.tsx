import { useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { isThenable, isSuccess } from '../../runtime/thenable.js'

export interface ButtonProps {
  children?: ReactNode
  disabled?: boolean
  /** 异步期间显示的文案；锁宽防跳由样式负责。 */
  loadingText?: string
  className?: string
  /** 返回 Promise 即自动 loading + 防连点；同步返回值不转圈。 */
  onClick?: () => unknown
  /** 显式返回 false（或 Promise<false>）时回调，表示操作没成。 */
  onFailed?: () => void
}

export function Button({
  children,
  disabled = false,
  loadingText,
  className,
  onClick,
  onFailed,
}: ButtonProps) {
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const handleClick = (): void => {
    if (disabled || loading || inFlight.current) return
    const result = onClick?.()
    if (!isThenable(result)) return
    inFlight.current = true
    setLoading(true)
    void Promise.resolve(result).then(
      (value) => {
        inFlight.current = false
        setLoading(false)
        if (!isSuccess(value)) onFailed?.()
      },
      (error: unknown) => {
        inFlight.current = false
        setLoading(false)
        throw error
      },
    )
  }

  const names = ['mptk-btn', disabled ? 'mptk-btn--disabled' : '', loading ? 'mptk-btn--loading' : '', className]
  return (
    <View className={names.filter(Boolean).join(' ')} onClick={handleClick}>
      <Text>{loading && loadingText !== undefined ? loadingText : children}</Text>
    </View>
  )
}
