import { Text, View } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import type { CSSProperties } from 'react'
import type { ToastPayload } from '../../state.js'
import { CloseGlyph } from '../close/CloseGlyph.js'

export interface ToastViewProps {
  readonly payload: ToastPayload
  readonly exiting: boolean
  readonly scale: number
  readonly onOpen?: () => void
  readonly onClose?: () => void
  readonly onAction?: (key: string) => void
  readonly onTouchStart?: CommonEventFunction
  readonly onTouchEnd?: CommonEventFunction
}

type ClickLike = { stopPropagation?: () => void }

export function ToastView({ payload, exiting, scale, onOpen, onClose, onAction, onTouchStart, onTouchEnd }: ToastViewProps) {
  const style: CSSProperties = { transform: `scaleX(${String(scale)})` }
  const names = ['mptk-toast', `mptk-toast--${payload.tone}`, exiting ? 'mptk-toast--exiting' : ''].filter(Boolean).join(' ')
  return (
    <View
      className={names}
      style={style}
      onClick={(event: ClickLike) => { event.stopPropagation?.(); onOpen?.() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {payload.icon === undefined ? null : <Text className="mptk-toast__icon">{payload.icon}</Text>}
      <View className="mptk-toast__body">
        {payload.title === undefined ? null : <Text className="mptk-toast__title">{payload.title}</Text>}
        <Text className="mptk-toast__description">{payload.description}</Text>
        {payload.action === undefined ? null : (
          <View
            className="mptk-toast__action"
            onClick={(event: ClickLike) => { event.stopPropagation?.(); onAction?.(payload.action?.key ?? 'action') }}
          >
            <Text>{payload.action.text}</Text>
          </View>
        )}
      </View>
      {payload.closeButton ? (
        <View
          className="mptk-toast__close"
          onClick={(event: ClickLike) => { event.stopPropagation?.(); onClose?.() }}
        >
          <CloseGlyph size={16} />
        </View>
      ) : null}
    </View>
  )
}
