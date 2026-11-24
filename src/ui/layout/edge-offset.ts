/**
 * 四向有符号偏移：数字按 px、字符串按 CSS 长度；同一轴同时给两边时取先者（top 胜 bottom、left 胜 right）。
 *
 * 图片头与关闭按钮共用这个类型，但各有一套位移写法：
 * - 图片头用 position:relative + 定位属性承载位移，不碰 transform（关闭叉外置档要用它）；
 * - 关闭按钮的档位基线、偏移换算与 transform 全在 CSS；本文件只把调用方给的四向值
 *   原样写成行内 CSS 变量 --mptk-popup-close-shift-*，零默认值由公共档位类提供。
 */

export interface EdgeOffset {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
}

/** 数字按 px，字符串原样透传（支持 '10%'、'2vh'、'var(--x)' 等 CSS 长度）。 */
export function cssLength(value: number | string): string
export function cssLength(value: number | string | undefined): string | undefined
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
 * 关闭按钮偏移：只把调用方给的四向值原样交给 CSS，零默认值写在公共档位类里。
 * 档位自己用 calc(基线 + 正向 - 反向) 算最终定位，JS 不判断哪条边生效、不拼 calc、不碰 transform。
 */
export function closeOffsetVars(offset: EdgeOffset | undefined): Record<string, string> {
  return {
    '--mptk-popup-close-shift-top': cssLength(offset?.top) ?? '0px',
    '--mptk-popup-close-shift-right': cssLength(offset?.right) ?? '0px',
    '--mptk-popup-close-shift-bottom': cssLength(offset?.bottom) ?? '0px',
    '--mptk-popup-close-shift-left': cssLength(offset?.left) ?? '0px',
  }
}
