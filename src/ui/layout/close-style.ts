/**
 * 关闭按钮的视觉三轴：形状（正圆 / 圆角方）、描边、底色。
 * 收口成核心 Button 的 radius / variant，不在这里另写按钮皮肤。
 */
export type PopupCloseShape = 'circle' | 'rounded'

export interface PopupCloseStyle {
  variant: 'solid' | 'soft' | 'outline' | 'ghost'
  radius: 'pill' | 'md'
}

/**
 * 两档轴组成 Button 的四种形态：
 * - 有底色 + 有描边 → soft（浅底 + 边）
 * - 有底色 + 无描边 → solid（灰底）
 * - 无底色 + 有描边 → outline（透底 + 边）
 * - 无底色 + 无描边 → ghost（只有叉）
 * 形状只换圆角档：circle 用 pill，rounded 用 md。
 */
export function resolveCloseStyle(
  shape: PopupCloseShape,
  border: boolean,
  background: boolean,
): PopupCloseStyle {
  const variant: PopupCloseStyle['variant'] = !background
    ? border ? 'outline' : 'ghost'
    : border ? 'soft' : 'solid'
  return { variant, radius: shape === 'circle' ? 'pill' : 'md' }
}
