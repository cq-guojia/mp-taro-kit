import type { SafeAreaSnapshot } from '../../runtime/safe-area.js'

/** 顶部让位档位：不让 / 只让状态栏 / 让到导航栏下（避开胶囊）。 */
export type TopInsetLevel = 'none' | 'status-bar' | 'nav-bar'

export interface TopInset {
  /** 面板向上探出的高度（px）：负 top 把底色盖到屏顶，内容被一起抬高，必须原样补回 */
  readonly overhang: number
  /** 内容区 padding-top（px）= 探出高度 + 目标位置（目标位置以屏幕顶为 0） */
  readonly bodyPaddingTop: number
}

const NONE: TopInset = { overhang: 0, bodyPaddingTop: 0 }

/**
 * 贴顶浮层的让位几何。
 *
 * 面板用 `top: -<探出量>` 把底色盖到屏顶（Skyline 下 fixed 的 0 不含状态栏，写 0 会露白），
 * 代价是面板内容也被抬高同样一段。所以内容让位 = **探出量 + 目标位置**，两个量必须同时算，
 * 只算目标位置就会整块少让一个状态栏高度（真机上表现为「只让了状态栏」甚至到顶）。
 *
 * 目标位置（以屏幕顶为 0）：`status-bar` 档 = 状态栏底，`nav-bar` 档 = 导航栏底（胶囊下沿）。
 *
 * 未注入真值时返回 0，交给 CSS 的 env() 兜底，不在这里猜。
 */
export function resolveTopInset(level: TopInsetLevel, snapshot: SafeAreaSnapshot): TopInset {
  if (level === 'none' || !snapshot.configured) return NONE
  const overhang = snapshot.statusBar
  const target = level === 'nav-bar' ? snapshot.top : snapshot.statusBar
  return { overhang, bodyPaddingTop: overhang + target }
}

/** 面板的定位档位里哪些是贴顶锚定（需要负 top 探出）。 */
export function isTopAnchored(position: string): boolean {
  return position === 'top' || position === 'left' || position === 'right'
}
