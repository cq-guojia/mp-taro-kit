/**
 * 四向有符号偏移：相对锚点「向内为正、向外为负」，数字按 px、字符串按 CSS 长度。
 *
 * 图片头与关闭按钮共用同一套语义，避免两处各写一份正负约定：
 * - 图片头用 position:relative + 定位属性承载位移，不碰 transform（关闭叉外置档要用它）；
 * - 关闭按钮把四向值作为 CSS 变量交给档位样式，用 calc(档位值 + 变量) 叠加，不改原定位。
 *
 * 横向同一轴同时给两边时按 CSS 自身规则取「左」（left 与 right 同时给，left 胜）。
 * 纵向是例外：关闭按钮沿用 CSS 规则，图片头为了「上下同时外伸」做了专门归一化，见 resolveImageShift。
 */

export interface EdgeOffset {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
}

/** 数字按 px，字符串原样透传（支持 '10%'、'2vh'、'var(--x)' 等 CSS 长度）。 */
export function cssLength(value: number | string | undefined): string | undefined {
  return value === undefined ? undefined : typeof value === 'number' ? `${value}px` : value
}

/** 取 px 数值上界（number 或 'Npx'）；%、vh、var() 等无法在 JS 折算，返回 null。 */
export function pxLength(value: number | string | undefined): number | null {
  return typeof value === 'number'
    ? value
    : typeof value === 'string' && /^-?\d+(\.\d+)?px$/.test(value)
      ? parseFloat(value)
      : null
}

/**
 * 图片头的相对位移。纵向只写 top（bottom 永远不写），因为 relative 同时写 top/bottom 时 CSS 只认 top，
 * 而 bottom 的「外伸」要靠 header 收窄来体现（见 resolveImageHeaderHeight），写进 CSS 会双重计算。
 * top 未给时纵向不位移（不再回落到 bottom）；横向同一轴取左为先（CSS 规则）。
 */
export function resolveImageShift(offset: EdgeOffset | undefined): EdgeOffset {
  if (offset === undefined) return {}
  const top = cssLength(offset.top)
  const right = cssLength(offset.right)
  const left = cssLength(offset.left)
  return {
    ...(top !== undefined ? { top } : null),
    ...(left !== undefined ? { left } : right !== undefined ? { right } : null),
  }
}

/**
 * 关闭按钮档位用的相对位移，保留原语义：同一轴取先者（top 胜、left 胜）。
 */
export function resolveEdgeShift(offset: EdgeOffset | undefined): EdgeOffset {
  if (offset === undefined) return {}
  const top = cssLength(offset.top)
  const right = cssLength(offset.right)
  const bottom = cssLength(offset.bottom)
  const left = cssLength(offset.left)
  return {
    ...(top !== undefined ? { top } : bottom !== undefined ? { bottom } : null),
    ...(left !== undefined ? { left } : right !== undefined ? { right } : null),
  }
}

/** 垂直外伸是否启用：top / bottom 至少一个是 px 数字。字符串（%、vh、var）不参与测量与收窄。 */
export function needsImageInset(offset: EdgeOffset | undefined): boolean {
  if (offset === undefined) return false
  return pxLength(offset.top) !== null || pxLength(offset.bottom) !== null
}

/**
 * 图片头需要收窄到的显式高度 = 图片真实显示高 + top + bottom（向下 clamp 到 0）。
 * 只有字符串偏移时返回 undefined（退回图片自然撑高）；heightPx / ratio 任一缺失也算不出。
 * 注意 bottom 在这里参与运算，但不写进 CSS 位移——这正是"上下同时外伸"的关键分工。
 */
export function resolveImageHeaderHeight(
  offset: EdgeOffset | undefined,
  realWidth: number | null,
  ratio: number | null,
): string | undefined {
  if (!needsImageInset(offset) || realWidth === null || ratio === null || ratio <= 0) return undefined
  const top = pxLength(offset?.top) ?? 0
  const bottom = pxLength(offset?.bottom) ?? 0
  const imageHeight = realWidth / ratio
  return `${Math.max(imageHeight + top + bottom, 0)}px`
}

/**
 * 关闭按钮的四向叠加量。档位 CSS 写 calc(档位值 + var(--mptk-popup-close-offset-*, 0px))，
 * 未给偏移时变量为 0，原档位位置一字不变。正负语义与图片头一致：正=向内收、负=向外伸。
 */
export function closeOffsetVars(offset: EdgeOffset | undefined): Record<string, string> {
  return {
    '--mptk-popup-close-offset-top': cssLength(offset?.top) ?? '0px',
    '--mptk-popup-close-offset-right': cssLength(offset?.right) ?? '0px',
    '--mptk-popup-close-offset-bottom': cssLength(offset?.bottom) ?? '0px',
    '--mptk-popup-close-offset-left': cssLength(offset?.left) ?? '0px',
  }
}
