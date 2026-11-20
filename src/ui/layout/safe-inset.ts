import type { SafeAreaSnapshot } from '../../runtime/safe-area.js'

/** 顶部让位档位：不让 / 只让状态栏 / 让到导航栏下（避开胶囊）。 */
export type TopInsetLevel = 'none' | 'status-bar' | 'nav-bar'

export interface TopInset {
  /** 内容区 padding-top（px），以屏幕顶为 0 的目标位置 */
  readonly paddingTop: number
}

const NONE: TopInset = { paddingTop: 0 }

/**
 * 贴顶浮层的内容让位。
 *
 * 按微信官方做法：**面板贴边定位（top: 0），安全区偏移单独加在内容 padding 上**，
 * 两者不要混在一个定位量里。面板用负 top 去「把底色探到屏顶」在 WebView 下会多让一段，
 * Skyline 下还会被页面容器裁掉、整块顶出去（真机与模拟器表现相反的根因）。
 *
 * 目标位置（以屏幕顶为 0）：`status-bar` 档 = 状态栏底，`nav-bar` 档 = 导航栏底（胶囊下沿）。
 * 未注入真值时返回 0，交给 CSS 的 env() 兜底，不在这里猜。
 */
export function resolveTopInset(level: TopInsetLevel, snapshot: SafeAreaSnapshot): TopInset {
  if (level === 'none' || !snapshot.configured) return NONE
  return { paddingTop: level === 'nav-bar' ? snapshot.top : snapshot.statusBar }
}

/** 面板的定位档位里哪些是贴顶锚定（决定默认让位档）。 */
export function isTopAnchored(position: string): boolean {
  return position === 'top' || position === 'left' || position === 'right'
}

/**
 * 贴底浮层的底部内边距（px）。呼吸间距与顶部取最大，不累加：
 * 横条已经 34px 就盖过 16px 呼吸，再相加会白留一截；非全面屏横条 0 时用呼吸 16px。
 * 未注入真值时返回 0，交给 CSS 的 env() 兜底（不在这里猜横条高度）。
 */
export const BOTTOM_BREATH_PX = 16

export interface BottomInset {
  /** 内容区 padding-bottom（px），以屏幕底为 0 的避让量 */
  readonly paddingBottom: number
}

export function resolveBottomInset(snapshot: SafeAreaSnapshot): BottomInset {
  if (!snapshot.configured) return { paddingBottom: 0 }
  return { paddingBottom: Math.max(BOTTOM_BREATH_PX, snapshot.bottom) }
}
