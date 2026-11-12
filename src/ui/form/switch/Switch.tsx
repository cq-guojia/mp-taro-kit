import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { resolveControlColor, type ControlColor } from '../control-color.js'
import { useAsyncChange } from '../useAsyncChange.js'
import { Spinner } from '../../feedback/spinner/index.js'

/** 控件高度档，取值来自 --mptk-control-h-*。 */
export type SwitchSize = 'sm' | 'md' | 'lg'

/** round = 传统圆形滑块；block = 圆角方形，两侧可放文字或图标。 */
export type SwitchShape = 'round' | 'block'

export interface SwitchProps {
  /** 宿主给的真值；组件完全受控。 */
  checked: boolean
  /** 返回 Promise 时立刻转圈、位置不动，成功后由宿主把新值传回来；失败只回调 onFailed，不回弹。 */
  onChange?: (next: boolean) => unknown
  /** 异步失败时通知宿主回滚自己的值。 */
  onFailed?: () => void
  size?: SwitchSize
  shape?: SwitchShape
  /** 选中态主色：内置色名或任意 CSS 色值，默认绿（微信原生开关的绿）。 */
  color?: ControlColor
  /** 关侧内容：block 形态放在轨道左侧，round 形态放在滑块里。 */
  offContent?: ReactNode
  /** 开侧内容：block 形态放在轨道右侧，round 形态放在滑块里。 */
  onContent?: ReactNode
  disabled?: boolean
  /** 外部驱动的等待态。 */
  loading?: boolean
  /** 转圈节点；不给就用全库共用的自绘 Spinner，不连图标包。 */
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
  /* 轨道底色是状态色本身的真源，自定义色值只在选中态内联：关态必须留给 track 灰。 */
  const trackStyle = on && inlineColor !== undefined ? { backgroundColor: inlineColor } : undefined
  /* 圆形形态没有两侧，开 / 关内容放进滑块里；等待态优先显示转圈。 */
  const thumbContent = shape === 'round' ? (on ? onContent : offContent) : undefined
  const hasThumbContent = thumbContent !== undefined && thumbContent !== null && thumbContent !== false

  return (
    <View className={names.filter(Boolean).join(' ')} onClick={() => change(!on)}>
      <View className="mptk-switch__track" style={trackStyle}>
        <View className="mptk-switch__veil" />
        <View className="mptk-switch__thumb">
          {busy ? (
            loadingContent ?? <Spinner size={16} color={inlineColor} className="mptk-switch__spinner" />
          ) : hasThumbContent ? (
            <View className="mptk-switch__icon">{thumbContent}</View>
          ) : null}
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
