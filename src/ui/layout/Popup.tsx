import { ScrollView, View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { getSafeAreaSnapshot } from '../../runtime/safe-area.js'
import { Button } from '../actions/Button.js'
import { CloseGlyph } from '../feedback/close/CloseGlyph.js'
import { resolveCloseStyle, type PopupCloseShape } from './close-style.js'
import {
  isOutsideClosePosition,
  resolveClosePosition,
  type PopupClosePosition,
  type PopupPosition,
} from './close-position.js'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { Overlay, type OverlayOpacity, type OverlayTone } from './Overlay.js'
import { MOTION_DURATION, usePresence } from './presence.js'
import { isTopAnchored, resolveTopInset, type TopInsetLevel } from './safe-inset.js'

export type { PopupClosePosition, PopupPosition } from './close-position.js'
export type { PopupCloseShape } from './close-style.js'

/**
 * 顶部让位：`none` 不让；`status-bar` 只让状态栏；`nav-bar` 让状态栏 + 导航栏（避开胶囊）。
 * 页面 `navigationStyle: 'custom'` 时 fixed 从屏幕顶起，必须让；不传时按位置推导。
 */
export type PopupInsetTop = TopInsetLevel

/** 面板圆角尺寸档：平角 / 小 / 中 / 大；只作用于圆角已开启（round 或居中档）的面板。 */
export type PopupRoundSize = 'none' | 'sm' | 'md' | 'lg'

/**
 * 内容内边距：数字四边统一，或按边给；单位 px。
 * 替换面板预留的 16px（--mptk-space-4），不替换让位——让位独立加在 body 上，两者相加。
 */
export type PopupContentPadding = number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>

export interface PopupProps {
  open: boolean
  position?: PopupPosition
  children?: ReactNode
  onClose?: () => void
  /** 是否渲染遮罩，默认渲染 */
  overlay?: boolean
  /** 遮罩底色档：dark 黑（默认）/ light 泛白；透传给内部 Overlay */
  overlayTone?: OverlayTone
  /** 遮罩浓度档：thin / default（默认）/ thick；透传给内部 Overlay */
  overlayOpacity?: OverlayOpacity
  /** 点遮罩是否关闭，默认关闭 */
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  className?: string
  /** 面板圆角，默认关（平角）；开时尺寸由 roundSize 决定 */
  round?: boolean
  /** 面板圆角尺寸档：none / sm / md（默认）/ lg；居中档恒圆，贴边档需同时开 round */
  roundSize?: PopupRoundSize
  /** 显示关闭按钮，默认关；只有 bottom / center 档支持，其余档忽略 */
  closeable?: boolean
  /** 关闭按钮形状，默认 circle（正圆）；rounded 为圆角方 */
  closeShape?: PopupCloseShape
  /** 关闭按钮是否带描边，默认 true；与 closeBackground 组合出核心 Button 的四种底色形态 */
  closeBorder?: boolean
  /** 关闭按钮是否带底色，默认 true；关掉且不带描边即只有叉 */
  closeBackground?: boolean
  /** 关闭按钮位置：按面板形态取可用档，不传用该形态默认值；左右 / 上档忽略 */
  closePosition?: PopupClosePosition
  /**
   * 顶部让位：status-bar 只让状态栏，nav-bar 再让导航栏（避开胶囊）。
   * 不传时按位置推导：top/left/right 默认 nav-bar，bottom/center 默认 none。
   * 真值来自 runtime 注入（getWindowInfo + 胶囊几何）；未注入时走 CSS env() 兜底。
   */
  insetTop?: PopupInsetTop
  /** 内容内边距：替换面板预留的 16px，不替换让位；数字四边统一，对象按边给（未给的边留默认） */
  contentPadding?: PopupContentPadding
}

/** 弹出层：遮罩 + 定位面板，面板内容走内部 scroll-view，超高自己滚。 */
export function Popup({
  open,
  position = 'bottom',
  children,
  onClose,
  overlay = true,
  overlayTone,
  overlayOpacity,
  closable = true,
  lockScroll = true,
  duration = MOTION_DURATION,
  className,
  round = false,
  roundSize = 'md',
  closeable = false,
  closeShape = 'circle',
  closeBorder = true,
  closeBackground = true,
  closePosition,
  insetTop,
  contentPadding,
}: PopupProps) {
  const { mounted, open: shown } = usePresence(open, duration)
  if (!mounted) return null

  // 让位只对上 / 左 / 右生效：先按位置判定，center / bottom 即使传了 insetTop 也强制 none。
  const resolvedInset: PopupInsetTop = isTopAnchored(position) ? insetTop ?? 'nav-bar' : 'none'
  // 面板贴边定位不动，让位单独加在内容上：WebView / Skyline 同一套几何。
  // 未注入真值时为 0，由 CSS 的 env() 兜底。
  const inset = resolveTopInset(resolvedInset, getSafeAreaSnapshot())
  const bodyStyle = inset.paddingTop > 0 ? { paddingTop: `${inset.paddingTop}px` } : undefined

  // 面板四边 padding：默认走 CSS 的 --mptk-space-4，只把显式给的边写成行内 px 覆盖。
  // 这份是「预留内边距」，与 body 上的让位各占一层，两者相加互不替换。
  const pad: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>> =
    typeof contentPadding === 'number'
      ? { top: contentPadding, right: contentPadding, bottom: contentPadding, left: contentPadding }
      : contentPadding ?? {}
  const panelStyle: CSSProperties | undefined =
    pad.top === undefined && pad.right === undefined && pad.bottom === undefined && pad.left === undefined
      ? undefined
      : {
          ...(pad.top === undefined ? null : { paddingTop: `${pad.top}px` }),
          ...(pad.right === undefined ? null : { paddingRight: `${pad.right}px` }),
          ...(pad.bottom === undefined ? null : { paddingBottom: `${pad.bottom}px` }),
          ...(pad.left === undefined ? null : { paddingLeft: `${pad.left}px` }),
        }

  // 关闭按钮按面板形态取档：左右 / 上档直接不渲染；不支持的位置回落到该形态默认值。
  const resolvedClosePosition = resolveClosePosition(position, closePosition)
  const closeOutside = resolvedClosePosition !== null && isOutsideClosePosition(resolvedClosePosition)
  const closeStyle = resolveCloseStyle(closeShape, closeBorder, closeBackground)

  const names = [
    'mptk-popup',
    `mptk-popup--${position}`,
    round ? 'mptk-popup--round' : '',
    `mptk-popup--radius-${roundSize}`,
    resolvedInset === 'none' ? '' : `mptk-popup--inset-${resolvedInset}`,
    closeOutside ? 'mptk-popup--close-outside' : '',
    shown ? 'mptk-popup--open' : '',
  ]
  const panel = ['mptk-popup__panel', `mptk-popup__panel--${position}`, className]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {overlay ? (
        <Overlay
          visible={shown}
          tone={overlayTone}
          opacity={overlayOpacity}
          closable={closable}
          lockScroll={lockScroll}
          duration={duration}
          onClose={onClose}
        />
      ) : null}
      <View className={panel.filter(Boolean).join(' ')} style={panelStyle}>
        <ScrollView scrollY className="mptk-popup__body" style={bodyStyle}>
          {children}
        </ScrollView>
        {/* 关闭按钮必须排在 scroll-view 后面：Skyline 下 scroll-view 是原生视图、绘制在后，
            放前面会被它盖住，点上去没反应。按钮复用核心 Button 的 xs 档与按压变色。 */}
        {closeable && onClose && resolvedClosePosition !== null ? (
          <Button
            glyph={<CloseGlyph size="12.8px" />}
            size="xs"
            type="default"
            variant={closeStyle.variant}
            radius={closeStyle.radius}
            className={[
              'mptk-popup__close',
              `mptk-popup__close--${resolvedClosePosition}`,
              closeStyle.translucent ? 'mptk-popup__close--translucent' : '',
            ].filter(Boolean).join(' ')}
            onClick={onClose}
          />
        ) : null}
      </View>
    </View>
  )
}

/* 向 Card 声明：关闭时渲染 null、不占内容流。没有这条声明，Card 静态遍历 children 会把
   面板内容当成排在 CellGroup 后面的可见内容，前面那组因此多补一条底线。 */
markCardEdgeOutOfFlow(Popup)
