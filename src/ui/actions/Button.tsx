import { useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { isThenable, isSuccess } from '../../runtime/thenable.js'

/** 控件高度档，取值来自 --mptk-control-h-*，与 Switch / Segmented / Input 同轴。 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * 圆角档：不传就用 `--mptk-control-radius`（库内控件统一圆角），
 * 传 `pill` 是左右半圆（999px，不是 50% —— 长方形上 50% 会变椭圆）。
 */
export type ButtonRadius = 'sm' | 'md' | 'lg' | 'pill'

export interface ButtonProps {
  children?: ReactNode
  size?: ButtonSize
  radius?: ButtonRadius
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
  size = 'lg',
  radius,
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

  const names = [
    'mptk-btn',
    `mptk-btn--${size}`,
    radius === undefined ? '' : `mptk-btn--radius-${radius}`,
    disabled ? 'mptk-btn--disabled' : '',
    loading ? 'mptk-btn--loading' : '',
    className,
  ]
  return (
    <View className={names.filter(Boolean).join(' ')} onClick={handleClick}>
      <Text>{loading && loadingText !== undefined ? loadingText : children}</Text>
    </View>
  )
}
