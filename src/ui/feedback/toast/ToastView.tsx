import { Text, View } from '@tarojs/components'
import type { CommonEventFunction } from '@tarojs/components'
import type { CSSProperties } from 'react'
import type { ToastPayload, ToastTone } from '../../state.js'
import { Icon } from '../../display/icon/Icon.js'
import { Button } from '../../actions/Button.js'
import { CloseGlyph } from '../close/CloseGlyph.js'

export interface ToastViewProps {
  readonly payload: ToastPayload
  readonly exiting: boolean
  readonly scale: number
  readonly y: number
  readonly domId?: string
  readonly zIndex?: number
  readonly onOpen?: () => void
  readonly onClose?: () => void
  readonly onAction?: (key: string) => void
  readonly onTouchStart?: CommonEventFunction
  readonly onTouchEnd?: CommonEventFunction
}

/** 与 Dialog 的 DIALOG_TYPE_ICON 同一套库内置字体图标：带圈的勾 / 叉 / 警告 / 信息。 */
const TONE_ICON: Record<ToastTone, string> = {
  success: 'common.base:gou',
  error: 'common.base:guanbi',
  warning: 'common.base:warn',
  info: 'common.base:info',
}

type ClickLike = { stopPropagation?: () => void }

export function ToastView({ payload, exiting, scale, y, domId, zIndex, onOpen, onClose, onAction, onTouchStart, onTouchEnd }: ToastViewProps) {
  // 顶部从容器顶往下排（top:0 + 正 y），底部从容器底往上排（bottom:0 + 负 y）。
  // 底部若也用 top:0，卡片会从屏幕底边往下长，真机只露出半截。
  const bottomAligned = payload.position === 'bottom' || payload.position === 'center'
  const style: CSSProperties = {
    position: 'absolute',
    ...(bottomAligned ? { bottom: 0 } : { top: 0 }),
    right: 0,
    left: 0,
    transform: `translateY(${String(y)}px) scaleX(${String(scale)})`,
    zIndex,
  }
  const names = [
    'mptk-toast',
    `mptk-toast--${payload.tone}`,
    `mptk-toast--${payload.position}`,
    `mptk-toast--enter-${payload.position}`,
    exiting ? `mptk-toast--exit-${payload.position}` : '',
    exiting ? 'mptk-toast--exiting' : '',
  ].filter(Boolean).join(' ')
  return (
    <View
      id={domId}
      className={names}
      style={style}
      onClick={(event: ClickLike) => { event.stopPropagation?.(); onOpen?.() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <View className="mptk-toast__icon-ring">
        <Icon name={payload.icon ?? TONE_ICON[payload.tone]} className="mptk-toast__icon" />
      </View>
      <View className="mptk-toast__body">
        {payload.title === undefined ? null : <Text className="mptk-toast__title">{payload.title}</Text>}
        <Text className="mptk-toast__description">{payload.description}</Text>
        {payload.action === undefined ? null : (
          <View className="mptk-toast__action" onClick={(event: ClickLike) => event.stopPropagation?.()}>
            <Button size="xs" type="default" variant="soft" radius="lg" onClick={() => onAction?.(payload.action?.key ?? 'action')}>
              {payload.action.text}
            </Button>
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
