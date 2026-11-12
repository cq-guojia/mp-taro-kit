import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { resolveControlColor, type ControlColor } from '../control-color.js'
import { useAsyncChange } from '../useAsyncChange.js'

/** 控件高度档，取值来自 --mptk-control-h-*。 */
export type SwitchSize = 'sm' | 'md' | 'lg'

/** round = 传统圆形滑块；block = 圆角方形，两侧可放文字或图标。 */
export type SwitchShape = 'round' | 'block'

export interface SwitchProps {
  /** 宿主给的真值；组件完全受控。 */
  checked: boolean
  /** 返回 Promise 时进入「先拨过去再转圈」，失败回弹并回调 onFailed。 */
  onChange?: (next: boolean) => unknown
  /** 异步失败时通知宿主回滚自己的值。 */
  onFailed?: () => void
  size?: SwitchSize
  shape?: SwitchShape
  /** 选中态主色：内置色名或任意 CSS 色值，默认蓝。 */
  color?: ControlColor
  /** 关侧内容，仅 shape="block" 渲染。 */
  offContent?: ReactNode
  /** 开侧内容，仅 shape="block" 渲染。 */
  onContent?: ReactNode
  disabled?: boolean
  /** 外部驱动的等待态。 */
  loading?: boolean
  /** 转圈节点；不给就用组件自带的纯 CSS 转圈，不连图标包。 */
  loadingContent?: ReactNode
  className?: string
}

export function Switch({
  checked,
  onChange,
  onFailed,
  size = 'lg',
  shape = 'round',
  color,
  offContent,
  onContent,
  disabled = false,
  loading = false,
  loadingContent,
  className,
}: SwitchProps) {
  const { display, busy, change } = useAsyncChange(checked, onChange, disabled, loading, onFailed)
  const on = display
  const locked = disabled || loading || busy
  const { className: colorClass, inlineColor } = resolveControlColor('mptk-switch', color)
  const names = [
    'mptk-switch',
    `mptk-switch--${size}`,
    `mptk-switch--${shape}`,
    on ? 'mptk-switch--on' : '',
    colorClass,
    locked ? 'mptk-switch--locked' : '',
    busy ? 'mptk-switch--busy' : '',
    className,
  ]
  const trackStyle = on && inlineColor !== undefined ? { backgroundColor: inlineColor } : undefined
  const spinnerStyle = inlineColor === undefined ? undefined : { borderTopColor: inlineColor }

  return (
    <View className={names.filter(Boolean).join(' ')} onClick={() => change(!on)}>
      <View className="mptk-switch__track" style={trackStyle}>
        <View className="mptk-switch__thumb">
          {busy ? (loadingContent ?? <View className="mptk-switch__spinner" style={spinnerStyle} />) : null}
        </View>
        {shape === 'block' ? (
          <View className="mptk-switch__sides">
            <View className="mptk-switch__side mptk-switch__side--off">{offContent}</View>
            <View className="mptk-switch__side mptk-switch__side--on">{onContent}</View>
          </View>
        ) : null}
      </View>
    </View>
  )
}
