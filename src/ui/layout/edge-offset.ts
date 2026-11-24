/**
 * 四向有符号偏移：数字按 px、字符串按 CSS 长度；同一轴同时给两边时取先者（top 胜 bottom、left 胜 right）。
 *
 * 图片头与关闭按钮共用这个类型，但各有一套位移写法：
 * - 图片头用 position:relative + 定位属性承载位移，不碰 transform（关闭叉外置档要用它）；
 * - 关闭按钮的档位基线与 transform 全在 CSS，偏移由本文件换算到档位实际锚定的边上，
 *   以内联标准定位属性 calc(var(--mptk-popup-close-base-*) ± 偏移) 叠加。
 */

import type { CSSProperties } from 'react'
import { CLOSE_ANCHOR, type PopupClosePosition } from './close-position.js'

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

type CloseEdge = 'top' | 'right' | 'bottom' | 'left'

/**
 * 把一条边偏移拼成 calc(基线 ± 长度)。invert 表示「这条边的 inset 与调用方给的边方向相反」
 * （例如档位锚 bottom、调用方给 top：top 增大是下移，bottom 就要减小）。
 * 先拆负号再选运算符，避免生成 calc(0px - -10px) 这种 WXSS 不接受的双负号。
 */
function withBase(edge: CloseEdge, value: number | string, invert: boolean): string {
  const length = cssLength(value)
  const negative = length.startsWith('-')
  const magnitude = negative ? length.slice(1) : length
  const plus = invert ? negative : !negative
  return `calc(var(--mptk-popup-close-base-${edge}) ${plus ? '+' : '-'} ${magnitude})`
}

/**
 * 关闭按钮偏移：档位几何与 transform 全在 CSS，这里只把调用方给的四向 inset 增量换算到
 * 档位真正锚定的边上，内联成标准定位属性。不写 var fallback（WXSS 整条丢弃），
 * 也不注入行内自定义属性（Skyline 未核实）。未给偏移不产任何声明。
 */
export function closeOffsetStyle(
  offset: EdgeOffset | undefined,
  position: PopupClosePosition,
): Pick<CSSProperties, CloseEdge> {
  if (offset === undefined) return {}
  const anchor = CLOSE_ANCHOR[position]
  const out: Pick<CSSProperties, CloseEdge> = {}

  if (offset.top !== undefined) {
    out[anchor.y] = withBase(anchor.y, offset.top, anchor.y === 'bottom')
  } else if (offset.bottom !== undefined) {
    out[anchor.y] = withBase(anchor.y, offset.bottom, anchor.y === 'top')
  }
  if (offset.left !== undefined) {
    out[anchor.x] = withBase(anchor.x, offset.left, anchor.x === 'right')
  } else if (offset.right !== undefined) {
    out[anchor.x] = withBase(anchor.x, offset.right, anchor.x === 'left')
  }
  return out
}
