/**
 * 关闭按钮的视觉三轴：形状（正圆 / 圆角方）、描边、底色（有 / 透明）。
 * 收口成核心 Button 的 radius / variant，不在这里另写按钮皮肤。
 */
export type PopupCloseShape = 'circle' | 'rounded'

export interface PopupCloseStyle {
  variant: 'solid' | 'soft'
  radius: 'pill' | 'sm'
  /** 背景「否」= 非实底（底色由落点决定）；叉色不随这轴变，只由落点与 variant 决定 */
  translucent: boolean
}

/**
 * 描边定 variant（有边 soft / 无边 solid），背景轴单独走 translucent：
 * 两轴正交，背景切「否」只走非实底（默认透明）、叉色（--mptk-btn-fg）保持不变。
 * 形状只换圆角档：circle 用 pill（999px 半圆），rounded 用 sm（8px 小方角）。
 * 用 xs=4px 太小、md=12px 在方块上又接近正圆，sm 是两档之间看得清的一档。
 */
export function resolveCloseStyle(
  shape: PopupCloseShape,
  border: boolean,
  background: boolean,
): PopupCloseStyle {
  return {
    variant: border ? 'soft' : 'solid',
    radius: shape === 'circle' ? 'pill' : 'sm',
    translucent: !background,
  }
}
