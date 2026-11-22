import { useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '../../actions/Button.js'
import { Icon, type IconSize } from '../../display/icon/Icon.js'
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

/**
 * 头部字色/线色方案，表达「头部底色是什么明暗」，库据此反色：
 * - normal：头部无自定义底色（跟随面板），字色跟随主题；
 * - on-light：浅色头背景，字色与线色固定深色，不随主题翻亮；
 * - on-dark：深色头背景，字色与线色固定浅色。
 */
export type ContentPopupHeaderTone = 'normal' | 'on-light' | 'on-dark'

export type ContentPopupBackgroundDirection =
  | 'to-bottom' | 'to-right' | 'to-bottom-right' | 'to-bottom-left'
  | number

/**
 * 纯色字符串（可写 var(--mptk-*)）或渐变。
 * `to` 缺省即从 from 淡出到面板底色；此时可给两个色标位置（0-100）：
 * - `fadeFrom`：起始色保持到百分之几才开始过渡（不给则从 0% 就过渡）；
 * - `fadeTo`：淡出到 to 色在百分之几**结束**（不给则到 100% 才结束）。
 * 两者配合可让颜色只在顶部一段、到分割线之前就完全回到底色。双色渐变忽略这两个参数。
 */
export type ContentPopupBackground =
  | string
  | {
      from: string
      to?: string
      direction?: ContentPopupBackgroundDirection
      fadeFrom?: number
      fadeTo?: number
    }

export type ContentPopupActionsLayout = 'row' | 'column'
export type ContentPopupActionsAlign = 'center' | 'left' | 'right'
export type ContentPopupBadgeAlign = 'center' | 'left' | 'right'
export type ContentPopupBadgeRadius = 'none' | 'sm' | 'md' | 'lg' | 'circle' | number | string
/** 外伸徽标预设色：整条渐变随明/暗主题反色（明档深、暗档浅），显式 background 优先。 */
export type ContentPopupBadgeTone = 'blue' | 'green' | 'red' | 'yellow'

/**
 * 头部图标四形态（判别联合，消除 string 歧义），title 档与 badge 档共用一份渲染：
 * - icon：库内置图标，name 必须是 `库名:图标名`；size 缺省由所在槽位的 CSS 字号决定；
 * - iconClass：第三方/字体图标，className 可含多个类名，样式由接入方图标库自带；
 * - image：图片，数字宽高按 px、字符串按 CSS 长度；外伸档由容器 aspectFill 裁圆；
 * - glyph：自绘节点（SVG-mask 组件等），尺寸由调用方在节点里自定。
 * color 仅对单色字体图标生效（COLR/CPAL 彩色字形吃不到 color）。
 */
export type ContentPopupHeaderIcon =
  | { kind: 'icon'; name: string; size?: IconSize | number; color?: string }
  | { kind: 'iconClass'; className: string; size?: number | string; color?: string }
  | { kind: 'image'; src: string; width?: number | string; height?: number | string; onClick?: () => void }
  | { kind: 'glyph'; node: ReactNode }

/** 旧名保留为别名：徽标内容就是头部图标内容，不再另立一套类型。 */
export type ContentPopupBadgeContent = ContentPopupHeaderIcon

/** 头部图片背景：正交于纯色/渐变，走 CSS background-image，不裁切外伸图标。 */
export interface ContentPopupHeaderImage {
  src: string
  mode?: 'cover' | 'contain'
  position?: string
  repeat?: boolean
}

/** 外伸徽标：图标容器（仅 raised 档用）+ 定位，几何与内容正交；外伸形态只带一个标题，不带副标题。 */
export interface ContentPopupBadge {
  content: ContentPopupHeaderIcon
  /** 预设色：默认 blue，明档深渐变 / 暗档浅渐变随主题反色；显式 background 盖过它。 */
  tone?: ContentPopupBadgeTone
  /** 容器尺寸，数字按 px、字符串按 CSS 长度；缺省走 token。 */
  size?: number | string
  radius?: ContentPopupBadgeRadius
  background?: ContentPopupBackground
  /** 徽标外圈的描边：缺省开、宽/色走 token；false 关闭。与 header 的横向分割线是两回事。 */
  border?: false | { width?: number | string; color?: string }
  /** 向上浮出量，默认 50%，参照容器自身高度；走 transform，不接负值。 */
  overlap?: number | string
  /** 有符号微调：x 参照面板宽、y 用 top 承载；center 档 x 也生效。 */
  offset?: { x?: number | string; y?: number | string; anchor?: ContentPopupBadgeAlign }
}

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
  /** 头部纯色/渐变；与 headerImage 同给时图片盖在色/渐变之上。 */
  headerBackground?: ContentPopupBackground
  /** 头部图片背景，走 CSS background-image；外伸图标不受裁切。 */
  headerImage?: ContentPopupHeaderImage
  /** 头部底色的明暗：浅底传 on-light 配深字、深底传 on-dark 配浅字；normal 跟随主题。 */
  headerTone?: ContentPopupHeaderTone
  headerDivider?: boolean
  /** 分割线颜色，默认随 headerTone（normal 走 --mptk-border，on-light 走深线，on-dark 走浅线）。 */
  headerDividerColor?: string
  panelBackground?: ContentPopupBackground

  // 头部图标与文案：title 档与 badge 档共用同一套渲染
  /** 四形态图标，优先级高于 glyph / icon；不给时由 glyph、icon 依次回填。 */
  headerIcon?: ContentPopupHeaderIcon
  /** 图标颜色，仅单色字体图标生效；显式传入优先于 headerTone 的字色 token。 */
  iconColor?: string
  /** 旧字段：库内置图标名（库名:图标名），等价于 headerIcon={ kind:'icon', name }。 */
  icon?: string
  /** 旧字段：自绘图标节点，等价于 headerIcon={ kind:'glyph', node }。 */
  glyph?: ReactNode
  /** 主标题（font-lg），title 与 badge 两档同一尺寸。 */
  title?: string
  /** 副标题（font-xs），只用于 title 档；badge 档不显示副标题。 */
  subtitle?: string

  // image 档
  image?: ContentPopupImage

  // badge 档：外伸容器 + 四形态内容 + 可选标题，全部收进一个 badge 对象
  badge?: ContentPopupBadge

  // 内容与底部
  children?: ReactNode
  footer?: ReactNode
  actions?: ContentPopupAction[]
  actionsLayout?: ContentPopupActionsLayout
  actionsAlign?: ContentPopupActionsAlign
}

const DEFAULT_CONTAINER_WIDTH = 320

const DEFAULT_GRADIENT_ANGLE = 165

const DIRECTION: Record<Exclude<ContentPopupBackgroundDirection, number>, string> = {
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
  const direction = value.direction
  const angle = typeof direction === 'number'
    ? `${String(direction)}deg`
    : direction === undefined
      ? `${String(DEFAULT_GRADIENT_ANGLE)}deg`
      : DIRECTION[direction]
  // to 缺省即淡出到面板底色（明/暗各一支），真正融进环境；显式传 'transparent' 才淡出到透明。
  const to = value.to ?? 'var(--mptk-surface-elevated)'
  // fadeFrom / fadeTo 只作用于单色渐隐（无显式 to），都是 0-100 的位置：
  //   fadeFrom：起始色保持到 N% 才开始过渡（缺省 0，即立刻过渡）；
  //   fadeTo：到 M% 就淡出到 to 色（缺省 100，即到末端才淡出）。
  // M% 之后 CSS 渐变自动保持 to 色到 100%，于是「到分割线之前已经是底色」。
  // 双色渐变忽略这两个参数。
  if (value.to !== undefined || (value.fadeFrom === undefined && value.fadeTo === undefined)) {
    return { backgroundImage: `linear-gradient(${angle}, ${value.from}, ${to})` }
  }
  const fromEnd = value.fadeFrom ?? 0
  const toStart = value.fadeTo ?? 100
  return {
    backgroundImage: `linear-gradient(${angle}, ${value.from} 0%, ${value.from} ${String(fromEnd)}%, ${to} ${String(toStart)}%)`,
  }
}

function cssLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

function addToPercent(base: string, value: number | string): string {
  if (typeof value === 'number') return `calc(${base} ${value < 0 ? '-' : '+'} ${Math.abs(value)}px)`
  const raw = value.trim()
  const negative = raw.startsWith('-')
  return `calc(${base} ${negative ? '-' : '+'} ${negative ? raw.slice(1) : raw})`
}

function badgeRadiusCss(value: ContentPopupBadgeRadius | undefined): string {
  if (value === undefined) return RADIUS.circle
  if (typeof value === 'number') return `${value}px`
  return RADIUS[value] ?? value
}

/**
 * 四形态图标的唯一渲染入口：title 档与 badge 档共用，只靠外层槽位（inline / raised）决定几何。
 * 类名统一为 __lead-*，不再给两档各写一套；尺寸缺省交给所在槽位的 CSS 字号。
 */
function HeaderLead({ content, color }: { content: ContentPopupHeaderIcon; color?: string }) {
  if (content.kind === 'icon') {
    const ink = content.color ?? color
    return (
      <Icon
        name={content.name}
        size={content.size}
        style={ink === undefined ? undefined : { color: ink }}
        className="mptk-content-popup__lead-icon"
      />
    )
  }
  if (content.kind === 'iconClass') {
    const ink = content.color ?? color
    return (
      <Text
        className={`mptk-content-popup__lead-iconclass ${content.className}`}
        style={{
          ...(content.size === undefined ? null : { fontSize: cssLength(content.size) }),
          ...(ink === undefined ? null : { color: ink }),
        }}
      />
    )
  }
  if (content.kind === 'image') {
    return (
      <Image
        className="mptk-content-popup__lead-image"
        src={content.src}
        mode="aspectFill"
        onClick={content.onClick}
        style={{
          ...(content.width === undefined ? null : { width: cssLength(content.width) }),
          ...(content.height === undefined ? null : { height: cssLength(content.height) }),
        }}
      />
    )
  }
  return <View className="mptk-content-popup__lead-glyph">{content.node}</View>
}

/**
 * 头部内容的唯一渲染入口：图标 + 文案块。
 * raised（外伸徽标）只多一层带几何的盒子；inline（文字头）用无边框的图标槽。
 * 文案块与字号两档完全一致，raised 仅加居中与顶部间距的修饰类。
 */
function HeaderContent({
  lead, raised, tone, boxStyle, title, subtitle, color,
}: {
  lead?: ContentPopupHeaderIcon
  raised: boolean
  tone?: ContentPopupBadgeTone
  boxStyle?: CSSProperties
  title?: string
  subtitle?: string
  color?: string
}) {
  const icon = lead === undefined ? null : <HeaderLead content={lead} color={color} />
  const hasText = title !== undefined || subtitle !== undefined
  return (
    <>
      {icon === null ? null : raised ? (
        <View className={`mptk-content-popup__badge mptk-content-popup__badge--tone-${tone ?? 'blue'}`} style={boxStyle}>{icon}</View>
      ) : (
        <View className="mptk-content-popup__lead-slot">{icon}</View>
      )}
      {hasText ? (
        <View className={[
          'mptk-content-popup__title-text',
          raised ? 'mptk-content-popup__title-text--raised' : '',
        ].filter(Boolean).join(' ')}>
          {title !== undefined ? <Text className="mptk-content-popup__title">{title}</Text> : null}
          {subtitle !== undefined ? <Text className="mptk-content-popup__subtitle">{subtitle}</Text> : null}
        </View>
      ) : null}
    </>
  )
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
  headerImage,
  headerTone = 'normal',
  headerDivider,
  headerDividerColor,
  panelBackground,
  headerIcon,
  iconColor,
  icon,
  glyph,
  title,
  subtitle,
  image,
  badge,
  children,
  footer,
  actions,
  actionsLayout = 'row',
  actionsAlign = 'center',
}: ContentPopupProps) {
  const [natural, setNatural] = useState<ImageNaturalSize | undefined>(undefined)

  const resolvedPosition: ContentPopupPosition = position === 'bottom' ? 'bottom' : 'center'
  const lead: ContentPopupHeaderIcon | undefined = headerIcon ??
    (glyph !== undefined ? { kind: 'glyph', node: glyph } : undefined) ??
    (icon !== undefined ? { kind: 'icon', name: icon } : undefined)
  const hasTitleContent = title !== undefined || subtitle !== undefined || lead !== undefined
  const hasBadgeContent = badge !== undefined
  const hasHeader =
    header !== undefined ||
    (variant === 'title' && hasTitleContent) ||
    (variant === 'image' && image !== undefined) ||
    (variant === 'badge' && hasBadgeContent)
  // header 横向分割线只有文字头默认开；图片头、外伸徽标头默认没有，要分隔由调用方显式 headerDivider 打开。
  // 这与徽标容器外圈那道描边（badge.border）是两回事。
  const showDivider = headerDivider ?? variant === 'title'
  const hasFooter = footer !== undefined || (actions !== undefined && actions.length > 0)

  // 徽标外伸：浮出量走 transform（百分比参照容器自身）、有符号微调走 left/right/top，不用负 margin（Skyline 不支持）。
  const badgeAnchor = badge?.offset?.anchor ?? 'center'
  const overlap = badge?.overlap === undefined ? '50%' : cssLength(badge.overlap) ?? '50%'
  const offsetX = badge?.offset?.x === undefined ? undefined : cssLength(badge.offset.x)
  const offsetY = badge?.offset?.y === undefined ? undefined : cssLength(badge.offset.y)
  const badgeSizeCss = badge?.size === undefined ? undefined : cssLength(badge.size)
  // 显式纯色要盖掉 tone 预设渐变：背景图绘制在背景色之上，只给 backgroundColor 会被盖住。
  const badgeBg = backgroundStyle(badge?.background)
  const badgeBgStyle: CSSProperties | undefined = badgeBg === undefined
    ? undefined
    : 'backgroundImage' in badgeBg
      ? badgeBg
      : { ...badgeBg, backgroundImage: 'none' }
  // 徽标外圈描边缺省开：宽走组件 token、色走面板底色（SCSS 默认）；false 才关。
  const badgeBorder = badge?.border
  const badgeBorderStyle: CSSProperties = badgeBorder === false
    ? { borderWidth: 0 }
    : {
        borderStyle: 'solid',
        borderWidth: badgeBorder?.width === undefined ? 'var(--mptk-c-content-popup-badge-border-w)' : cssLength(badgeBorder.width),
        ...(badgeBorder?.color === undefined ? null : { borderColor: badgeBorder.color }),
      }
  const badgeStyle: CSSProperties = badge === undefined ? {} : {
    borderRadius: badgeRadiusCss(badge.radius),
    ...(badgeSizeCss === undefined ? null : { width: badgeSizeCss, height: badgeSizeCss }),
    ...badgeBorderStyle,
    ...badgeBgStyle,
    ...(offsetY === undefined ? null : { top: offsetY }),
    ...(badgeAnchor === 'center'
      ? { left: offsetX === undefined ? '50%' : addToPercent('50%', offsetX), transform: `translateX(-50%) translateY(-${overlap})` }
      : badgeAnchor === 'left'
        ? { left: offsetX ?? '0px', transform: `translateY(-${overlap})` }
        : { right: offsetX ?? '0px', transform: `translateY(-${overlap})` }),
  }

  // 给外伸留在面板内的那一段留高。尺寸/浮出都是数字（或数字百分比）时精确算，否则交给 CSS token 默认档。
  let badgeReserve: string | undefined
  if (badge !== undefined && typeof badge.size === 'number') {
    const sizePx = badge.size
    const rawOverlap = badge.overlap
    const overlapPx =
      typeof rawOverlap === 'number'
        ? rawOverlap
        : typeof rawOverlap === 'string' && rawOverlap.endsWith('%')
          ? sizePx * parseFloat(rawOverlap) / 100
          : typeof rawOverlap === 'string' && rawOverlap.endsWith('px')
            ? parseFloat(rawOverlap)
            : sizePx * 0.5
    const shiftY = typeof badge.offset?.y === 'number' ? badge.offset.y : 0
    badgeReserve = `${Math.max(sizePx - overlapPx + shiftY, 0)}px`
  }

  const sized = image === undefined ? undefined : resolveImageSize(image, { containerWidth: DEFAULT_CONTAINER_WIDTH, natural })
  const handleLoad = (event: { detail: { width: string | number; height: string | number } }) => {
    const width = Number(event.detail.width)
    const height = Number(event.detail.height)
    setNatural(width > 0 && height > 0 ? { width, height } : undefined)
  }

  // 三档内容 + 自定义槽位只是「头部内容」；承载背景与留白的壳统一在下面渲染一层。
  // title 与 badge 共用 HeaderContent（同一份图标四形态 + 同一份文案块），只有 image 是独立的整头图片。
  const headerBody = (() => {
    if (header !== undefined) return header
    if (variant === 'title') {
      return (
        <HeaderContent lead={lead} raised={false} title={title} subtitle={subtitle} color={iconColor} />
      )
    }
    if (variant === 'image' && image !== undefined && sized !== undefined) {
      return (
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
      )
    }
    if (variant === 'badge' && badge !== undefined) {
      // 外伸形态只有居中档带标题；靠左/靠右不出文案，副标题任何档都不显示。
      return (
        <HeaderContent
          lead={badge.content}
          raised
          tone={badge.tone}
          boxStyle={badgeStyle}
          title={badgeAnchor === 'center' ? title : undefined}
          color={iconColor}
        />
      )
    }
    return null
  })()

  const headerClassName = [
    'mptk-content-popup__header',
    `mptk-content-popup__header--${variant}`,
    headerTone === 'normal' ? '' : `mptk-content-popup__header--${headerTone}`,
    showDivider ? 'mptk-content-popup__header--divided' : '',
  ].filter(Boolean).join(' ')
  const headerImageStyle: CSSProperties | undefined = headerImage === undefined ? undefined : {
    backgroundImage: `url("${headerImage.src}")`,
    backgroundSize: headerImage.mode ?? 'cover',
    backgroundPosition: headerImage.position ?? 'center',
    backgroundRepeat: headerImage.repeat === true ? 'repeat' : 'no-repeat',
  }
  const headerStyle: CSSProperties = {
    ...backgroundStyle(headerBackground),
    ...headerImageStyle,
    ...(variant === 'badge' && badgeReserve !== undefined ? { paddingTop: badgeReserve } : null),
    ...(showDivider && headerDividerColor !== undefined ? { borderBottomColor: headerDividerColor } : null),
  }

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
        <View className={headerClassName} style={headerStyle}>
          {headerBody}
        </View>
      ) : null}
      <View className={[
        'mptk-content-popup__content',
        'mptk-content-popup__content--top-gap',
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
