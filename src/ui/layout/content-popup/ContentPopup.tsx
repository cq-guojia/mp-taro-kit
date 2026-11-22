import { useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '../../actions/Button.js'
import { Icon } from '../../display/icon/Icon.js'
import { markCardEdgeOutOfFlow } from '../../infra/card-edge.js'
import {
  Popup,
  type PopupClosePosition,
  type PopupCloseShape,
  type PopupContentPadding,
  type PopupRoundSize,
  type PopupSurface,
} from '../Popup.js'
import {
  resolveImageSize,
  type ImageNaturalSize,
  type ImageSizeInput,
} from '../image-size.js'
import type { ImagePopupAction } from '../ImagePopup.js'

/** 头部形态：文字头 / 图片头 / 外伸徽标头。 */
export type ContentPopupVariant = 'title' | 'image' | 'badge'

/** 只做中部与底部；上浮、左右抽屉由基础 Popup 承担，本组件不提供。 */
export type ContentPopupPosition = 'center' | 'bottom'

export type ContentPopupBackgroundDirection = 'to-bottom' | 'to-right' | 'to-bottom-right' | 'to-bottom-left'

/** 纯色字符串（可写 var(--mptk-*)）或两段渐变，走内联 style，不在组件里写死色值。 */
export type ContentPopupBackground =
  | string
  | { from: string; to: string; direction?: ContentPopupBackgroundDirection }

export type ContentPopupActionsLayout = 'row' | 'column'
export type ContentPopupActionsAlign = 'center' | 'left' | 'right'
export type ContentPopupBadgeAlign = 'center' | 'left' | 'right'
export type ContentPopupBadgeRadius = 'none' | 'sm' | 'md' | 'lg' | 'circle' | number | string

/** 图片头：图片尺寸与 ImagePopup 共用同一套解析模型。 */
export interface ContentPopupImage extends ImageSizeInput {
  src: string
  onClick?: () => void
}

/** 按钮直接复用 ImagePopup 的文字按钮 / 图片按钮，不另立一套。 */
export type ContentPopupAction = ImagePopupAction

export interface ContentPopupProps {
  open: boolean
  position?: ContentPopupPosition
  onClose?: () => void
  variant?: ContentPopupVariant

  // 底座透传
  overlay?: boolean
  overlayTone?: 'dark' | 'light'
  overlayOpacity?: 'thin' | 'default' | 'thick'
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  className?: string
  surface?: PopupSurface
  round?: boolean
  roundSize?: PopupRoundSize
  contentPadding?: PopupContentPadding
  panelStyle?: CSSProperties
  closeable?: boolean
  closeShape?: PopupCloseShape
  closeBorder?: boolean
  closeBackground?: boolean
  closePosition?: PopupClosePosition

  // 头部通用
  header?: ReactNode
  headerBackground?: ContentPopupBackground
  headerDivider?: boolean
  panelBackground?: ContentPopupBackground

  // title 档：小图标 + 标题 + 副标题，三件一体
  icon?: string
  glyph?: ReactNode
  title?: string
  subtitle?: string

  // image 档
  image?: ContentPopupImage

  // badge 档：外伸容器 + 图标 + 可选标题
  badgeIcon?: string
  badgeGlyph?: ReactNode
  badgeRadius?: ContentPopupBadgeRadius
  badgeSize?: number
  badgeAlign?: ContentPopupBadgeAlign
  badgeOffset?: number | string
  badgeOverlap?: number | string
  badgeBackground?: ContentPopupBackground
  badgeBorderWidth?: number
  badgeBorderColor?: string

  // 内容与底部
  children?: ReactNode
  footer?: ReactNode
  actions?: ContentPopupAction[]
  actionsLayout?: ContentPopupActionsLayout
  actionsAlign?: ContentPopupActionsAlign
}

const DEFAULT_CONTAINER_WIDTH = 320

const DIRECTION: Record<ContentPopupBackgroundDirection, string> = {
  'to-bottom': '180deg',
  'to-right': '90deg',
  'to-bottom-right': '135deg',
  'to-bottom-left': '225deg',
}

const RADIUS: Record<string, string> = {
  none: 'var(--mptk-radius-none)',
  sm: 'var(--mptk-radius-sm)',
  md: 'var(--mptk-radius-md)',
  lg: 'var(--mptk-radius-lg)',
  circle: '50%',
}

const JUSTIFY: Record<ContentPopupActionsAlign, string> = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
}

function backgroundStyle(value: ContentPopupBackground | undefined): CSSProperties | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return { backgroundColor: value }
  const direction = DIRECTION[value.direction ?? 'to-bottom']
  return { backgroundImage: `linear-gradient(${direction}, ${value.from}, ${value.to})` }
}

function cssLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

function badgeRadiusCss(value: ContentPopupBadgeRadius | undefined): string {
  if (value === undefined) return RADIUS.circle
  if (typeof value === 'number') return `${value}px`
  return RADIUS[value] ?? value
}

function isTextAction(action: ContentPopupAction): action is Extract<ContentPopupAction, { text: string }> {
  return 'text' in action
}

function ActionImage({ action }: { action: Extract<ContentPopupAction, { src: string }> }) {
  const [natural, setNatural] = useState<ImageNaturalSize | undefined>(undefined)
  const { src, alt, onClick, ...sizeInput } = action
  const size = resolveImageSize(
    { width: 'auto', ...sizeInput },
    { containerWidth: 200, natural },
  )
  const handleLoad = (event: { detail: { width: string | number; height: string | number } }) => {
    const width = Number(event.detail.width)
    const height = Number(event.detail.height)
    if (width <= 0 || height <= 0) return
    if (natural !== undefined && natural.width === width && natural.height === height) return
    setNatural({ width, height })
  }
  return (
    <Image
      className="mptk-content-popup__action-image"
      src={src}
      aria-label={alt}
      mode={size.mode}
      style={{
        width: size.width,
        ...(size.height === null ? null : { height: `${String(size.height)}px` }),
      }}
      onLoad={handleLoad}
      onClick={onClick}
    />
  )
}

function renderActions(actions: ContentPopupAction[], layout: ContentPopupActionsLayout, align: ContentPopupActionsAlign) {
  if (actions.length === 0) return null
  return (
    <View
      className={[
        'mptk-content-popup__actions',
        layout === 'column' ? 'mptk-content-popup__actions--column' : '',
      ].filter(Boolean).join(' ')}
      style={layout === 'row' ? { justifyContent: JUSTIFY[align] } : undefined}
    >
      {actions.map((action, index) => {
        if (isTextAction(action)) {
          const { text, ...buttonProps } = action
          return <Button key={index} {...buttonProps}>{text}</Button>
        }
        return <ActionImage key={index} action={action} />
      })}
    </View>
  )
}

/**
 * 配置式内容弹窗：站在 Popup 底座上，一个 variant 旋钮切换文字头 / 图片头 / 外伸徽标头。
 * 头部、内容、底部都是「配置优先、槽位覆盖」；完全自绘走基础 Popup 的 surface='none' 裸壳。
 */
export function ContentPopup({
  open,
  position = 'center',
  onClose,
  variant = 'title',
  overlay,
  overlayTone,
  overlayOpacity,
  closable,
  lockScroll,
  duration,
  className,
  surface = 'panel',
  round,
  roundSize,
  contentPadding,
  panelStyle,
  closeable = true,
  closeShape,
  closeBorder,
  closeBackground,
  closePosition,
  header,
  headerBackground,
  headerDivider,
  panelBackground,
  icon,
  glyph,
  title,
  subtitle,
  image,
  badgeIcon,
  badgeGlyph,
  badgeRadius,
  badgeSize,
  badgeAlign = 'center',
  badgeOffset,
  badgeOverlap,
  badgeBackground,
  badgeBorderWidth,
  badgeBorderColor,
  children,
  footer,
  actions,
  actionsLayout = 'row',
  actionsAlign = 'center',
}: ContentPopupProps) {
  const [natural, setNatural] = useState<ImageNaturalSize | undefined>(undefined)

  const resolvedPosition: ContentPopupPosition = position === 'bottom' ? 'bottom' : 'center'
  const hasTitleContent = title !== undefined || subtitle !== undefined || icon !== undefined || glyph !== undefined
  const hasBadgeContent = badgeIcon !== undefined || badgeGlyph !== undefined || title !== undefined
  const hasHeader =
    header !== undefined ||
    (variant === 'title' && hasTitleContent) ||
    (variant === 'image' && image !== undefined) ||
    (variant === 'badge' && hasBadgeContent)
  const showDivider = headerDivider ?? variant === 'title'
  const hasFooter = footer !== undefined || (actions !== undefined && actions.length > 0)

  // 徽标外伸：百分比参照容器自身，用 transform 位移，不用负 margin（Skyline 不支持）。
  const overlap = badgeOverlap === undefined ? '50%' : cssLength(badgeOverlap) ?? '50%'
  const badgeStyle: CSSProperties = {
    borderRadius: badgeRadiusCss(badgeRadius),
    ...(badgeSize === undefined ? null : { width: `${badgeSize}px`, height: `${badgeSize}px` }),
    ...(badgeBorderWidth === undefined ? null : { borderWidth: `${badgeBorderWidth}px` }),
    ...(badgeBorderColor === undefined ? null : { borderColor: badgeBorderColor }),
    ...backgroundStyle(badgeBackground),
    ...(badgeAlign === 'center'
      ? { left: '50%', transform: `translateX(-50%) translateY(-${overlap})` }
      : badgeAlign === 'left'
        ? { left: cssLength(badgeOffset) ?? '0px', transform: `translateY(-${overlap})` }
        : { right: cssLength(badgeOffset) ?? '0px', transform: `translateY(-${overlap})` }),
  }

  // 给外伸留在面板内的那一段留高，避免标题/正文被徽标压住。容器尺寸未知时交给 CSS 默认档。
  let badgeReserve: string | undefined
  if (badgeSize !== undefined) {
    const overlapPx =
      typeof badgeOverlap === 'number'
        ? badgeOverlap
        : typeof badgeOverlap === 'string' && badgeOverlap.endsWith('%')
          ? badgeSize * parseFloat(badgeOverlap) / 100
          : badgeSize * 0.5
    badgeReserve = `${Math.max(badgeSize - overlapPx, 0)}px`
  }

  const sized = image === undefined ? undefined : resolveImageSize(image, { containerWidth: DEFAULT_CONTAINER_WIDTH, natural })
  const handleLoad = (event: { detail: { width: string | number; height: string | number } }) => {
    const width = Number(event.detail.width)
    const height = Number(event.detail.height)
    setNatural(width > 0 && height > 0 ? { width, height } : undefined)
  }

  const renderedHeader = (() => {
    if (header !== undefined) return header
    if (variant === 'title') {
      return (
        <View className="mptk-content-popup__header mptk-content-popup__header--title" style={backgroundStyle(headerBackground)}>
          {(icon !== undefined || glyph !== undefined) ? (
            <View className="mptk-content-popup__title-icon-slot">
              {icon !== undefined ? <Icon name={icon} className="mptk-content-popup__title-icon" /> : null}
              {glyph !== undefined ? <View className="mptk-content-popup__title-glyph">{glyph}</View> : null}
            </View>
          ) : null}
          <View className="mptk-content-popup__title-text">
            {title !== undefined ? <Text className="mptk-content-popup__title">{title}</Text> : null}
            {subtitle !== undefined ? <Text className="mptk-content-popup__subtitle">{subtitle}</Text> : null}
          </View>
        </View>
      )
    }
    if (variant === 'image' && image !== undefined && sized !== undefined) {
      return (
        <View className="mptk-content-popup__header mptk-content-popup__header--image" style={backgroundStyle(headerBackground)}>
          <Image
            className="mptk-content-popup__image"
            src={image.src}
            mode={sized.mode}
            style={{
              width: sized.width,
              ...(sized.height === null ? null : { height: `${String(sized.height)}px` }),
              ...(sized.needsNatural && natural === undefined ? { opacity: '0' } : null),
            }}
            onLoad={handleLoad}
            onError={() => setNatural(undefined)}
            onClick={image.onClick}
          />
        </View>
      )
    }
    if (variant === 'badge' && hasBadgeContent) {
      return (
        <View
          className="mptk-content-popup__header mptk-content-popup__header--badge"
          style={{ ...backgroundStyle(headerBackground), ...(badgeReserve === undefined ? null : { paddingTop: badgeReserve }) }}
        >
          <View className="mptk-content-popup__badge" style={badgeStyle}>
            {badgeIcon !== undefined ? <Icon name={badgeIcon} size="xl" className="mptk-content-popup__badge-icon" /> : null}
            {badgeGlyph !== undefined ? <View className="mptk-content-popup__badge-glyph">{badgeGlyph}</View> : null}
          </View>
          {title !== undefined ? <Text className="mptk-content-popup__badge-title">{title}</Text> : null}
        </View>
      )
    }
    return null
  })()

  // 徽标外伸后，面板内 top-* 档的关闭叉会压在徽标上，回落到外置档；
  // 中部弹窗默认外下中，底部弹窗的文字头默认面板内右上，其余档沿用底座默认外置右上。
  const resolvedClosePosition: PopupClosePosition | undefined = (() => {
    if (closePosition !== undefined) {
      return variant === 'badge' &&
        (closePosition.startsWith('top-') || closePosition.startsWith('edge-top-'))
        ? 'above-right'
        : closePosition
    }
    if (resolvedPosition === 'center') return 'below-center'
    return 'above-right'
  })()

  const mergedPanelStyle: CSSProperties | undefined =
    panelBackground === undefined && panelStyle === undefined
      ? undefined
      : { ...backgroundStyle(panelBackground), ...panelStyle }

  // 面板 Padding 由本组件自己分层：分割线要通到面板两边，不能窝在底座的 16px 内边距里。
  const contentPaddingValue: PopupContentPadding = contentPadding ?? 0

  return (
    <Popup
      open={open}
      position={resolvedPosition}
      overlay={overlay}
      overlayTone={overlayTone}
      overlayOpacity={overlayOpacity}
      closable={closable}
      lockScroll={lockScroll}
      duration={duration}
      className={[className, 'mptk-content-popup__panel', `mptk-content-popup__panel--${variant}`].filter(Boolean).join(' ')}
      surface={surface}
      round={round}
      roundSize={roundSize}
      contentPadding={contentPaddingValue}
      panelStyle={mergedPanelStyle}
      closeable={closeable && onClose !== undefined}
      closeShape={closeShape}
      closeBorder={closeBorder}
      closeBackground={closeBackground}
      closePosition={resolvedClosePosition}
      onClose={onClose}
    >
      {hasHeader ? (
        <View className={[
          'mptk-content-popup__head',
          variant === 'title' ? 'mptk-content-popup__head--title' : '',
          showDivider ? 'mptk-content-popup__head--divided' : '',
        ].filter(Boolean).join(' ')}>
          {renderedHeader}
        </View>
      ) : null}
      {showDivider ? <View className="mptk-content-popup__divider" /> : null}
      <View className={[
        'mptk-content-popup__content',
        showDivider ? '' : 'mptk-content-popup__content--top-gap',
        hasFooter ? '' : 'mptk-content-popup__content--bottom-gap',
      ].filter(Boolean).join(' ')}>
        {children}
      </View>
      {hasFooter ? (
        <View className="mptk-content-popup__foot">
          {footer !== undefined ? footer : renderActions(actions ?? [], actionsLayout, actionsAlign)}
        </View>
      ) : null}
    </Popup>
  )
}

markCardEdgeOutOfFlow(ContentPopup)
