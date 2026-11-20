/** 面板贴哪条边：决定关闭按钮支持哪些形态。 */
export type PopupPosition = 'top' | 'center' | 'bottom' | 'left' | 'right'

/**
 * 关闭按钮位置（按形态分档，不是每个档都能用全部位置）：
 * - `top-left` / `top-right`：面板内，离上边与左右边各一个间距档
 * - `edge-top-left` / `edge-top-right`：跨上边一半（只垂直跨，左右仍留内侧间距）
 * - `above-right` / `above-center`：面板上方，与面板留一个间距档
 * - `below-center` / `below-right`：面板下方，与面板留一个间距档
 */
export type PopupClosePosition =
  | 'top-left'
  | 'top-right'
  | 'edge-top-left'
  | 'edge-top-right'
  | 'above-right'
  | 'above-center'
  | 'below-center'
  | 'below-right'

/**
 * 各形态允许的位置。左右抽屉不进表：传什么都不渲染关闭按钮。
 * - bottom / center：内部档与跨半档左右两侧都支持（top-left/top-right、edge-top-left/edge-top-right），面板上方外置档通用；
 * - center 另支持面板下方外置档；
 * - top：面板贴顶，只支持面板下方外置档（关闭按钮落在面板下沿之外）。
 */
const ALLOWED: Partial<Record<PopupPosition, readonly PopupClosePosition[]>> = {
  bottom: ['top-left', 'edge-top-left', 'top-right', 'edge-top-right', 'above-right', 'above-center'],
  center: ['top-right', 'edge-top-right', 'above-right', 'below-center', 'below-right'],
  top: ['below-center', 'below-right'],
}

/* 默认一律右上：bottom / center 取面板外右上（above-right，与面板留一个间距档）；
   top 档贴顶、上方外置档不可用，取面板下方外置右侧（below-right）。 */
const DEFAULT: Partial<Record<PopupPosition, PopupClosePosition>> = {
  bottom: 'above-right',
  center: 'above-right',
  top: 'below-right',
}

/** 左右抽屉没有关闭按钮：传任何位置都返回 null。传了本形态不支持的位置则回落到默认值。 */
export function resolveClosePosition(
  panel: PopupPosition,
  requested: PopupClosePosition | undefined,
): PopupClosePosition | null {
  const allowed = ALLOWED[panel]
  if (!allowed) return null
  return requested !== undefined && allowed.includes(requested) ? requested : (DEFAULT[panel] ?? allowed[0])
}

/** 跨边 / 外置档需要面板放开 overflow，否则按钮被裁掉。 */
export function isOutsideClosePosition(position: PopupClosePosition): boolean {
  return position !== 'top-left' && position !== 'top-right'
}
