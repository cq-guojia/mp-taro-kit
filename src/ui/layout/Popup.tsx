import { ScrollView, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { getSafeAreaSnapshot } from '../../runtime/safe-area.js'
import {
  isOutsideClosePosition,
  resolveClosePosition,
  type PopupClosePosition,
  type PopupPosition,
} from './close-position.js'
import { Icon } from '../display/icon/index.js'
import { Overlay } from './Overlay.js'
import { MOTION_DURATION, usePresence } from './presence.js'
import { isTopAnchored, resolveTopInset, type TopInsetLevel } from './safe-inset.js'

export type { PopupClosePosition, PopupPosition } from './close-position.js'

/** 关闭按钮底形：只有叉、圆形浮出、圆角方形浮出。 */
export type PopupCloseShape = 'plain' | 'circle' | 'rounded'

/**
 * 顶部让位：`none` 不让；`status-bar` 只让状态栏；`nav-bar` 让状态栏 + 导航栏（避开胶囊）。
 * 页面 `navigationStyle: 'custom'` 时 fixed 从屏幕顶起，必须让；不传时按位置推导。
 */
export type PopupInsetTop = TopInsetLevel

export interface PopupProps {
  open: boolean
  position?: PopupPosition
  children?: ReactNode
  onClose?: () => void
  /** 是否渲染遮罩，默认渲染 */
  overlay?: boolean
  /** 点遮罩是否关闭，默认关闭 */
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  className?: string
  /** 面板圆角，默认关（平角）；开时尺寸读 --mptk-c-popup-radius */
  round?: boolean
  /** 显示关闭按钮，默认关；只有 bottom / center 档支持，其余档忽略 */
  closeable?: boolean
  /** 关闭按钮底形，默认只有叉 */
  closeShape?: PopupCloseShape
  /** 关闭按钮位置：按面板形态取可用档，不传用该形态默认值；左右 / 上档忽略 */
  closePosition?: PopupClosePosition
  /**
   * 顶部让位：status-bar 只让状态栏，nav-bar 再让导航栏（避开胶囊）。
   * 不传时按位置推导：top/left/right 默认 nav-bar，bottom/center 默认 none。
   * 真值来自 runtime 注入（getWindowInfo + 胶囊几何）；未注入时走 CSS env() 兜底。
   */
  insetTop?: PopupInsetTop
}

/** 弹出层：遮罩 + 定位面板，面板内容走内部 scroll-view，超高自己滚。 */
export function Popup({
  open,
  position = 'bottom',
  children,
  onClose,
  overlay = true,
  closable = true,
  lockScroll = true,
  duration = MOTION_DURATION,
  className,
  round = false,
  closeable = false,
  closeShape = 'plain',
  closePosition,
  insetTop,
}: PopupProps) {
  const { mounted, open: shown } = usePresence(open, duration)
  if (!mounted) return null

  // 贴顶 / 左右档会盖住状态栏与胶囊，默认让出导航栏；贴底 / 居中默认不让。
  const resolvedInset: PopupInsetTop = insetTop ?? (isTopAnchored(position) ? 'nav-bar' : 'none')
  // 面板贴边定位不动，让位单独加在内容上：WebView / Skyline 同一套几何。
  // 未注入真值时为 0，由 CSS 的 env() 兜底。
  const inset = resolveTopInset(resolvedInset, getSafeAreaSnapshot())
  const bodyStyle = inset.paddingTop > 0 ? { paddingTop: `${inset.paddingTop}px` } : undefined

  // 关闭按钮按面板形态取档：左右 / 上档直接不渲染；不支持的位置回落到该形态默认值。
  const resolvedClosePosition = resolveClosePosition(position, closePosition)
  const closeOutside = resolvedClosePosition !== null && isOutsideClosePosition(resolvedClosePosition)

  const names = [
    'mptk-popup',
    `mptk-popup--${position}`,
    round ? 'mptk-popup--round' : '',
    resolvedInset === 'none' ? '' : `mptk-popup--inset-${resolvedInset}`,
    closeOutside ? 'mptk-popup--close-outside' : '',
    shown ? 'mptk-popup--open' : '',
  ]
  const panel = ['mptk-popup__panel', `mptk-popup__panel--${position}`, className]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {overlay ? (
        <Overlay visible={shown} closable={closable} lockScroll={lockScroll} duration={duration} onClose={onClose} />
      ) : null}
      <View className={panel.filter(Boolean).join(' ')}>
        <ScrollView scrollY className="mptk-popup__body" style={bodyStyle}>
          {children}
        </ScrollView>
        {/* 关闭按钮必须排在 scroll-view 后面：Skyline 下 scroll-view 是原生视图、绘制在后，
            放前面会被它盖住，点上去没反应。按钮保持原尺寸，靠这个顺序保证点得着。 */}
        {closeable && onClose && resolvedClosePosition !== null ? (
          <View
            className={[
              'mptk-popup__close',
              `mptk-popup__close--${closeShape}`,
              `mptk-popup__close--${resolvedClosePosition}`,
            ].join(' ')}
            onClick={onClose}
          >
            <Icon name="common.base:guanbi" size="xs" />
          </View>
        ) : null}
      </View>
    </View>
  )
}
