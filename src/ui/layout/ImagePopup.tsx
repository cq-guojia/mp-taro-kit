import { useEffect, useState } from 'react'
import { Image, ScrollView, Swiper, SwiperItem, View } from '@tarojs/components'
import { Button, type ButtonProps } from '../actions/Button.js'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { type EdgeOffset } from './edge-offset.js'
import { Popup, type PopupClosePosition, type PopupSurface } from './Popup.js'
import {
  resolveImageSize,
  type ImageNaturalSize,
  type ImageSizeInput,
  type ResolvedImageSize,
} from './image-size.js'

/**
 * 一组按钮中的「文字按钮」：文字 + 现成 Button 的样式轴（size / type / variant / color 等全透传）+ 点击回调。
 * 判别式：有 text 即文字按钮。
 */
export interface ImagePopupTextAction extends Omit<ButtonProps, 'children'> {
  text: string
}

/**
 * 一组按钮中的「图片按钮」：传图片链接代替文字按钮。有 src 即图片按钮。
 * 尺寸复用同一套模型（宽 / 高 / 比例 / 原宽高 / 上界），另一边按原图比例自适应，不引入第二套刻度；
 * `fit` 不适用（按钮图没有长图滚动视口）。
 */
export interface ImagePopupImageAction extends Omit<ImageSizeInput, 'fit'> {
  src: string
  alt?: string
  onClick?: () => void
}

export type ImagePopupAction = ImagePopupTextAction | ImagePopupImageAction

function isTextAction(action: ImagePopupAction): action is ImagePopupTextAction {
  return 'text' in action
}

/** 一组按钮的排布，控件级轴，不塞进单个 Button。 */
export type ImagePopupActionsAlign = 'center' | 'left' | 'right'

/** 一屏：一张图 + 它自己的尺寸配置 + 它自己的按钮组；单张直出，多张自动出 Swiper + 红点。 */
export interface ImagePopupSlide extends ImageSizeInput {
  src: string
  onClick?: () => void
  actions?: ImagePopupAction[]
  actionsAlign?: ImagePopupActionsAlign
}

export interface ImagePopupProps {
  open: boolean
  slides: ImagePopupSlide[]
  onClose?: () => void
  /** 退场动画完成后触发一次，见 Popup */
  onExited?: () => void
  /** 关闭按钮位置，沿用 Popup 现有档；不传按形态取底座默认（top / center 外下中，bottom 外上中） */
  closePosition?: PopupClosePosition
  /** 关闭按钮四向微调，叠加在 closePosition 档位之上；正=向内收、负=向外伸。 */
  closeOffset?: EdgeOffset
  closeable?: boolean
  closeShape?: 'circle' | 'rounded'
  closeBorder?: boolean
  closeBackground?: boolean
  overlayTone?: 'dark' | 'light'
  overlayOpacity?: 'thin' | 'default' | 'thick'
  closable?: boolean
  /** 多图是否显示红点，默认开（微信原生 indicator） */
  showIndicators?: boolean
}

const ALIGN_JUSTIFY: Record<ImagePopupActionsAlign, string> = {
  center: 'center',
  left: 'flex-start',
  right: 'flex-end',
}

/**
 * 单图默认宽：裸壳居中档 320px 面板宽（surface=none 无内边距，内容即面板宽）。
 * slides 未给 width 时按此像素宽显示（不再走 '100%' 拉满）——确定宽才能让面板贴合图片，
 * 也直接作为多图 Swiper 高度 / 滚动视口宽的兜底值。
 */
const DEFAULT_CONTAINER_WIDTH = 320

/**
 * 图片按钮的尺寸容器宽：按钮图只放宽 / 高两轴，未给宽时按原图尺寸（不放大、不超这个宽），
 * 原图尺寸未知时以此兜底。按钮细节图通常很小，取 200px 这一行内容宽。
 */
const ACTION_IMAGE_CONTAINER_WIDTH = 200

/**
 * 一张图渲染成 Image。尺寸一律走 resolveImageSize —— 单图、多图每屏、图片按钮共用同一套解析。
 * 铁律：mode 只锁一个维度（widthFix 锁宽 / heightFix 锁高），另一边由原生按比例撑开，绝不拉伸。
 * 绝不把 maxHeight 写到 Image —— 长图由外层 ScrollView 定高并在 Y 轴滚，图片本身保持真实比例。
 */
function renderSlideImage(
  src: string,
  size: ResolvedImageSize,
  natural: ImageNaturalSize | null | undefined,
  onNatural?: (natural: ImageNaturalSize | null) => void,
  onClick?: () => void,
  className = 'mptk-image-popup__image',
) {
  // 加载失败 / 尺寸非法（0×0）时回传 null：这张图的几何已「定论」，不能再保持隐藏，否则永远看不见。
  const settle = (natural: ImageNaturalSize | null) => {
    if (onNatural !== undefined) onNatural(natural)
  }
  const handleLoad = onNatural
    ? (event: { detail: { width: string | number; height: string | number } }) => {
        const width = Number(event.detail.width)
        const height = Number(event.detail.height)
        settle(width > 0 && height > 0 ? { width, height } : null)
      }
    : undefined
  const handleError = onNatural ? () => settle(null) : undefined
  return (
    <Image
      className={className}
      src={src}
      mode={size.mode}
      style={{
        width: size.width,
        ...(size.height === null ? null : { height: `${String(size.height)}px` }),
        // 上界在 resolver 里折算进 width，这里不再写 maxWidth/maxHeight —— 
        // 给 widthFix 图叠 maxHeight 会让原生把整图压进小盒（长图变细条）。
        // 首帧还没有比例时短暂隐藏（undefined = 还没结果），onLoad 回灌或 onError 定论后显示，避免跳变。
        ...(size.needsNatural && natural === undefined ? { opacity: '0' } : null),
      }}
      onLoad={handleLoad}
      onError={handleError}
      onClick={onClick}
    />
  )
}

/**
 * 绘制一张图：scroll 档套只开 scroll-y 的视口——视口固定宽（贴合图片）+ 固定高（maxHeight），
 * 图片以 widthFix 按真实比例撑高，超出视口在 Y 轴滚，不被压缩；其余档图片直出。
 */
function renderPicture(
  slide: ImagePopupSlide,
  size: ResolvedImageSize,
  natural: ImageNaturalSize | null | undefined,
  onNatural: (natural: ImageNaturalSize | null) => void,
) {
  const image = renderSlideImage(slide.src, size, natural, onNatural, slide.onClick)
  if (!size.scroll) return image
  const viewportHeight = size.maxHeight ?? '80vh'
  return (
    <ScrollView
      className="mptk-image-popup__scroll"
      scrollY
      scrollX={false}
      style={{ width: size.width, height: viewportHeight }}
    >
      {image}
    </ScrollView>
  )
}

/**
 * 图片按钮：自己记 onLoad 回灌的原图尺寸，'auto' 才能真正按原图宽显示（不放大、不超按钮容器宽）。
 * 与文字按钮混排时不会独占整行；显式给了 width / height / 比例时按自己的轴解析。
 */
function ActionImage({ action }: { action: ImagePopupImageAction }) {
  const [natural, setNatural] = useState<ImageNaturalSize | undefined>(undefined)
  const { src, alt, onClick, ...sizeInput } = action
  const size = resolveImageSize(
    { width: 'auto', ...sizeInput },
    { containerWidth: ACTION_IMAGE_CONTAINER_WIDTH, natural },
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
      className="mptk-image-popup__action-image"
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

/** 一组按钮渲染：文字按钮走现成 Button；图片按钮走同一套尺寸模型。 */
function renderActions(actions: ImagePopupAction[], align: ImagePopupActionsAlign) {
  if (actions.length === 0) return null
  return (
    <View className="mptk-image-popup__actions" style={{ justifyContent: ALIGN_JUSTIFY[align] }}>
      {actions.map((action, index) => {
        if (isTextAction(action)) {
          const { text, ...buttonProps } = action
          return (
            <Button key={index} {...buttonProps}>
              {text}
            </Button>
          )
        }
        return <ActionImage key={index} action={action} />
      })}
    </View>
  )
}

/**
 * 图片弹窗：一张图配一组按钮，单图直出、多图翻页（红点跟随）。
 * 底层就是 surface="none" 的 Popup —— 遮罩 / 浮起 / 关闭按钮全沿用，面板本身不画壳。
 */
export function ImagePopup({
  open,
  slides,
  onClose,
  onExited,
  closePosition,
  closeOffset,
  closeable = true,
  closeShape = 'circle',
  closeBorder = true,
  closeBackground = false,
  overlayTone,
  overlayOpacity,
  closable,
  showIndicators = true,
}: ImagePopupProps) {
  const [current, setCurrent] = useState(0)
  // 每张图各自记住 onLoad 回灌的真实尺寸，按 src 索引（换图不串比例）；
  // null = 这张图已定论但拿不到尺寸（加载失败 / 0×0），不再保持隐藏。
  const [naturals, setNaturals] = useState<Record<string, ImageNaturalSize | null>>({})
  const multi = slides.length > 1
  // 索引恒钳到有效范围，单图也必须归零。此前只在 multi 时钳制：多图滑到第 3 张后
  // 切回单图（slides 只剩 1 项），current 仍是 1/2 → slides[index] 为 undefined →
  // 组件 return null，表现为「单图点几遍后就再也打不开」。
  const index = slides.length === 0 ? 0 : Math.min(Math.max(current, 0), slides.length - 1)
  // 钳制也要落回状态：否则 slides 变短后再变长，会跳回旧页码。
  useEffect(() => {
    setCurrent((prev) => (prev > slides.length - 1 ? Math.max(slides.length - 1, 0) : prev))
  }, [slides.length])
  const slide = slides[index]
  const surface: PopupSurface = 'none'

  if (slide === undefined) return null

  const onNatural = (src: string) => (natural: ImageNaturalSize | null) =>
    setNaturals((prev) => {
      const old = prev[src]
      const same =
        old === natural ||
        (old !== undefined &&
          old !== null &&
          natural !== null &&
          old.width === natural.width &&
          old.height === natural.height)
      return same ? prev : { ...prev, [src]: natural }
    })

  // 每张图各自解析尺寸：多图每屏的独立尺寸设置（宽 / 高 / 比例 / 原宽高 / 上界 / 滚动）才会生效。
  const sized = slides.map((item) =>
    resolveImageSize(item, { containerWidth: DEFAULT_CONTAINER_WIDTH, natural: naturals[item.src] ?? undefined }),
  )
  const size = sized[index]

  // Swiper 必须有确定高度，否则原生组件高度塌陷、图片只显示一半。
  // 高度跟随「当前页」而非取所有页最大值：切到高图框就高、关闭叉随之下移，切到矮图框就矮。
  // 普通屏取图片的「显示高」（width/ratio 或定高值），矮图就矮、高图就高；比例未知的首帧用宽兜底。
  // scroll 屏取滚动视口高：maxHeight 原样交给 CSS（px / vh 都能用），未给时与视口同口径用 80vh。
  const viewportOf = (item: ResolvedImageSize): number | string => {
    if (item.scroll) return item.maxHeight ?? '80vh'
    if (item.displayHeight !== null) return item.displayHeight
    if (item.widthPx !== null) return item.widthPx
    return DEFAULT_CONTAINER_WIDTH
  }
  const swiperHeight = multi ? viewportOf(size) : 0

  // 面板宽度贴合当前图片：用解析出的确定像素宽 widthPx（定宽 / 原宽高 / 图片按钮两轴）。
  // 修复此前用 typeof size.width==='number' 判断——width 变成 CSS 字符串后该判断恒失败，
  // 面板退回居中档固定 280px，导致左右留白、below-right 的叉比图片更靠右。
  const panelStyle =
    size.widthPx !== null ? { width: `${String(size.widthPx)}px`, maxWidth: '100vw' } : undefined

  return (
    <Popup
      open={open}
      onExited={onExited}
      position="center"
      surface={surface}
      className="mptk-image-popup__panel"
      panelStyle={panelStyle}
      closeable={closeable && onClose !== undefined}
      closePosition={closePosition}
      closeOffset={closeOffset}
      closeShape={closeShape}
      closeBorder={closeBorder}
      closeBackground={closeBackground}
      overlayTone={overlayTone}
      overlayOpacity={overlayOpacity}
      closable={closable}
      onClose={onClose}
    >
      {multi ? (
        <View className="mptk-image-popup__slider">
          <Swiper
            className="mptk-image-popup__swiper"
            style={{ height: typeof swiperHeight === 'number' ? `${String(swiperHeight)}px` : swiperHeight }}
            indicatorDots={showIndicators}
            current={index}
            onChange={(event) => setCurrent(event.detail.current)}
          >
            {slides.map((item, itemIndex) => (
              <SwiperItem key={`${item.src}-${String(itemIndex)}`}>
                <View className="mptk-image-popup__slide">
                  {renderPicture(item, sized[itemIndex], naturals[item.src], onNatural(item.src))}
                </View>
              </SwiperItem>
            ))}
          </Swiper>
          {renderActions(slide.actions ?? [], slide.actionsAlign ?? 'center')}
        </View>
      ) : (
        <View className="mptk-image-popup__single">
          {renderPicture(slide, size, naturals[slide.src], onNatural(slide.src))}
          {renderActions(slide.actions ?? [], slide.actionsAlign ?? 'center')}
        </View>
      )}
    </Popup>
  )
}

/* 向 Card 声明：关闭时渲染 null、不占内容流。没有这条声明，Card 静态遍历 children 会把
   面板当成排在 CellGroup 后面的可见内容，前面那组因此多补一条底线。 */
markCardEdgeOutOfFlow(ImagePopup)
