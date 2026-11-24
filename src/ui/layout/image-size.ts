/**
 * 图片显示尺寸解析：把调用方的语义参数（宽 / 高 / 比例 / 原图 / 上界 / 溢出策略）
 * 收敛成一组确定的渲染描述，单图与多图、图片主体与图片按钮共用同一套规则。
 *
 * 设计要点（对齐 CSS aspect-ratio / object-fit 与微信 Image 的 widthFix/heightFix）：
 * - 比例统一口径为「宽 / 高」（对齐 CSS aspect-ratio），来源优先级：
 *   ratio > naturalWidth/naturalHeight > onLoad 回灌的真实尺寸。
 * - 目标宽 width：number(px) / '100%'(显式铺满内容区) / 'auto'(按原尺寸，不放大)；
 *   未给时取 ctx.containerWidth（内容区可用宽）作为默认像素宽 —— 确定宽才能让外层面板贴合，
 *   不用 '100%'（宽由容器决定、JS 拿不到像素值，小图会被拉满）。
 * - 目标高 height：number(px) / 'auto'(默认，由宽 + 比例推导)。
 * - 上界 maxWidth/maxHeight：number(px) 或 CSS 字符串（如 '80vh'）；只是天花板，
 *   图比它小就原样显示、绝不放大。
 * - fit：'contain'(默认，等比缩进上界、不拉伸) / 'scroll'(撞 maxHeight 改 Y 轴滚动)。
 * - 全局硬约束：不用 scaleToFill、任何情况不拉伸；滚动只做 Y 轴，绝不 X 轴。
 */

/** 撞上界后的行为：等比缩进（默认）/ 保持尺寸改 Y 轴滚动（长图）。 */
export type ImageFitMode = 'contain' | 'scroll'

/** 目标宽：px 数字 / 铺满内容区 / 按原图尺寸（不放大）。 */
export type ImageWidthSpec = number | '100%' | 'auto'
/** 目标高：px 数字 / 按比例自适应。 */
export type ImageHeightSpec = number | 'auto'
/** 上界：px 数字或 CSS 长度字符串（如 '80vh' / '90%'）。 */
export type ImageSizeToken = number | string

export interface ImageSizeInput {
  width?: ImageWidthSpec
  height?: ImageHeightSpec
  /** 宽 / 高，对齐 CSS aspect-ratio */
  ratio?: number
  naturalWidth?: number
  naturalHeight?: number
  maxWidth?: ImageSizeToken
  maxHeight?: ImageSizeToken
  fit?: ImageFitMode
}

/** Image onLoad 回灌的真实像素尺寸。 */
export interface ImageNaturalSize {
  width: number
  height: number
}

/** 解析上下文：面板内容区可用宽 + onLoad 拿到的真实尺寸。 */
export interface ImageSizeContext {
  containerWidth: number
  natural?: ImageNaturalSize
}

export interface ResolvedImageSize {
  /** 图片 CSS 宽度（number=px，字符串按 CSS 值）。滚动档即视口宽度。 */
  width: number | string
  /** 图片的确定像素宽；null = 宽度由容器决定（'100%' 档）。供外层面板贴合图片宽度。 */
  widthPx: number | null
  /** 图片 CSS 高度（px）；只有定高档锁死，其余恒 null 交给原生按比例撑高 */
  height: number | null
  /** 图片按真实比例的显示高（px）；供 Swiper / 视口定高。null = 比例未知 */
  displayHeight: number | null
  /**
   * Taro Image 的 mode：widthFix 锁宽高自适应、heightFix 锁宽自适应。
   * 铁律：只锁一个维度，绝不把 fixed height 与 maxHeight 同时写给 Image——
   * 那会让原生把整图等比缩进小盒（长图压成细条、滚动失效）。
   */
  mode: 'widthFix' | 'heightFix'
  /** 是否套 Y 轴滚动视口 */
  scroll: boolean
  /** 滚动视口高度；非滚动档不写到 Image 上 */
  maxHeight?: string
  /** 首帧无比例、需等 onLoad 回灌真实尺寸才算最终几何 */
  needsNatural: boolean
}

const cssSize = (value: ImageSizeToken | undefined): string | undefined =>
  value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value

/** 取 px 数值上界（number 或 'Npx'）；vh/% 等无法在 JS 折算，返回 null。 */
const pxNumber = (value: ImageSizeToken | undefined): number | null =>
  typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value)
      ? parseFloat(value)
      : null

/** 宽 / 高比例，来源优先级：显式 ratio > 声明的 original > onLoad 真实尺寸。
 *  导出供"按真实渲染宽反推显示高"复用——必须与 resolver 同口径，否则原生 widthFix 的
 *  实际高度与 JS 算出的高度会差一倍（声明比例与 onLoad 真实比例不一致时）。 */
export function resolveRatio(input: ImageSizeInput, ctx: ImageSizeContext): number | null {
  if (input.ratio !== undefined && input.ratio > 0) return input.ratio
  if (
    input.naturalWidth !== undefined &&
    input.naturalHeight !== undefined &&
    input.naturalWidth > 0 &&
    input.naturalHeight > 0
  ) {
    return input.naturalWidth / input.naturalHeight
  }
  if (ctx.natural !== undefined && ctx.natural.width > 0 && ctx.natural.height > 0) {
    return ctx.natural.width / ctx.natural.height
  }
  return null
}

/**
 * 'auto' 的确定像素宽：取原图宽，但不放大到超过内容区（宽图不出面板）。
 * 原图宽未知（未传 natural* 且 onLoad 未回灌）时退回内容区宽。
 */
function autoWidth(input: ImageSizeInput, ctx: ImageSizeContext): number {
  const natural = ctx.natural?.width ?? input.naturalWidth ?? ctx.containerWidth
  return Math.min(natural, ctx.containerWidth)
}

/**
 * 解析一张图的最终渲染描述。铁律：Image 上只锁一个维度，由原生按比例撑另一边，绝不拉伸、绝不压成盒子。
 * - fit=scroll：视口锁宽（width 或铺满）+ 锁高（maxHeight），图片用 widthFix 按宽撑出真实高，超出视口在 Y 轴滚；
 * - 定高（height=number）：只锁 height、走 heightFix，显示宽 = height × ratio，供面板贴合；
 * - 定宽 / auto / 未给：只锁 width、走 widthFix，显示高 = width / ratio，供 Swiper / 视口定高
 *   （未给时 width 取 ctx.containerWidth 这一确定像素）；
 * - '100%'（仅显式传）：宽度交给容器、widthFix 自适应，widthPx 为 null（面板退回默认宽）；
 * - 比例未知的首帧 needsNatural=true，组件先隐藏、onLoad 回灌后重算，避免跳变。
 *
 * maxWidth / maxHeight 只是上界（不放大），三档都生效：定宽档折算进 width（有比例时 maxHeight 也反推宽度上限）；
 * 定高档折算进 height；scroll 档 maxWidth 约束视口宽、maxHeight 是滚动视口高度（不写到 Image 上）。
 * 上界与比例无关——maxWidth 不需要 ratio 就能生效。
 */
export function resolveImageSize(input: ImageSizeInput, ctx: ImageSizeContext): ResolvedImageSize {
  const ratio = resolveRatio(input, ctx)
  // 未给宽时默认「内容区可用宽」这一确定像素宽，而非 '100%'：
  // '100%' 的宽度由容器决定、拿不到像素值，面板无法贴合、图片总被拉满内容区。
  const widthSpec: ImageWidthSpec = input.width ?? ctx.containerWidth
  const heightSpec = input.height ?? 'auto'
  const scroll = (input.fit ?? 'contain') === 'scroll'
  const maxHeight = cssSize(input.maxHeight)
  const maxWPx = pxNumber(input.maxWidth)
  const maxHPx = pxNumber(input.maxHeight)

  // 滚动档：视口固定宽 + 固定高。图片只锁宽走 widthFix、按真实比例撑高，超出部分在视口里 Y 滚动。
  // 关键：绝不把 maxHeight 写到 Image（旧版 aspectFit + height + maxHeight 把长图压成细条、滚动失效）。
  // height 与 scroll 冲突：滚动档高度由视口（maxHeight）决定，height 不生效。
  if (scroll) {
    if (widthSpec === '100%') {
      return { width: '100%', widthPx: null, height: null, displayHeight: null, mode: 'widthFix', scroll: true, maxHeight, needsNatural: false }
    }
    let widthPx = widthSpec === 'auto' ? autoWidth(input, ctx) : widthSpec
    if (maxWPx !== null) widthPx = Math.min(widthPx, maxWPx)
    return {
      width: `${String(widthPx)}px`, widthPx, height: null,
      displayHeight: ratio === null ? null : Math.round(widthPx / ratio),
      mode: 'widthFix', scroll: true, maxHeight,
      needsNatural: ratio === null,
    }
  }

  // 定高：只锁 height 走 heightFix，宽按比例自适应。面板贴合用「显示宽」= height × ratio（不是原图像素宽）。
  // 上界同样生效：maxHeight 压高度；比例已知时 maxWidth 反推最大高度，两者取更小。
  if (typeof heightSpec === 'number') {
    let heightPx = heightSpec
    if (maxHPx !== null) heightPx = Math.min(heightPx, maxHPx)
    if (ratio !== null && ratio > 0 && maxWPx !== null) {
      heightPx = Math.min(heightPx, Math.floor(maxWPx / ratio))
    }
    return {
      width: 'auto',
      widthPx: ratio === null ? null : Math.round(heightPx * ratio),
      height: heightPx,
      displayHeight: heightPx,
      mode: 'heightFix', scroll: false, needsNatural: ratio === null,
    }
  }

  // '100%'：宽度交给容器、widthFix 自适应，拿不到确定像素宽；
  // 比例已知时按内容区宽折算显示高（多图 Swiper 需要确定高度，否则只能拿兜底值）。
  // 宽度不依赖比例，首帧就显示（不藏）；多图高度回灌后修正，有高度过渡兜着。
  if (widthSpec === '100%') {
    return {
      width: '100%', widthPx: null, height: null,
      displayHeight: ratio === null ? null : Math.round(ctx.containerWidth / ratio),
      mode: 'widthFix', scroll: false, needsNatural: false,
    }
  }

  // 定宽（number）/ 按原图宽（auto）：只锁 width 走 widthFix，按比例撑高。
  let widthPx = widthSpec === 'auto' ? autoWidth(input, ctx) : widthSpec
  // contain 上界：maxWidth 恒生效；有比例时 maxHeight 反推宽度上限。图片仍 widthFix、不拉伸。
  const caps = [maxWPx, ratio !== null && ratio > 0 && maxHPx !== null ? Math.round(maxHPx * ratio) : null]
    .filter((v): v is number => v !== null)
  if (caps.length > 0) widthPx = Math.min(widthPx, ...caps)
  return {
    width: `${String(widthPx)}px`, widthPx, height: null,
    displayHeight: ratio === null ? null : Math.round(widthPx / ratio),
    mode: 'widthFix', scroll: false,
    needsNatural: ratio === null,
  }
}
