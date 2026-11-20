import { createSingleton } from './singleton.js'

/**
 * 顶部安全区真值，宿主在 app 入口配置一次注入。
 * runtime 层零平台依赖，不 import Taro / React / DOM。
 *
 * 为什么必须注入、不能用 CSS env()：
 * - 页面 navigationStyle: 'custom' 时，微信不预留状态栏空间，fixed 从 y=0 起；
 * - Skyline 渲染器下 env(safe-area-inset-top) 取不到值（常为 0），真机尤其明显；
 * - 真值只能来自 getWindowInfo().statusBarHeight + getMenuButtonBoundingClientRect()。
 */
export interface SafeAreaFaces {
  /** 状态栏高度（px）；取自 Taro.getWindowInfo().statusBarHeight。 */
  readonly statusBarHeight?: number
  /** 右上胶囊几何（px）；取自 Taro.getMenuButtonBoundingClientRect()。 */
  readonly menuButton?: { readonly top: number; readonly height: number }
  /**
   * 底部横条安全区高度（px）= screenHeight - safeArea.bottom。
   * 取自 Taro.getWindowInfo()，Skyline 下 env(safe-area-inset-bottom) 不可靠，必须注入真值。
   */
  readonly bottomInset?: number
}

/** 对外只读快照：全部 px；未注入时全 0，由 CSS env() 兜底。 */
export interface SafeAreaSnapshot {
  /** 状态栏高度 */
  readonly statusBar: number
  /** 导航栏内容区高度（不含状态栏）= 胶囊高 + 上下对称留白，与 NavBar 同口径 */
  readonly navbar: number
  /** 状态栏 + 导航栏：避开状态栏与胶囊的总高度 */
  readonly top: number
  /** 底部横条安全区高度；未注入为 0，由 CSS env() 兜底 */
  readonly bottom: number
  readonly configured: boolean
}

export interface SafeAreaStore {
  readonly getSnapshot: () => SafeAreaSnapshot
  readonly configure: (faces: SafeAreaFaces) => void
  readonly resetForTests: () => void
}

/** 无胶囊几何时的导航栏内容区兜底高度（微信原生内容区 44px）。 */
const NAVBAR_FALLBACK_H = 44

function createSafeAreaStore(): SafeAreaStore {
  let snapshot: SafeAreaSnapshot = { statusBar: 0, navbar: 0, top: 0, bottom: 0, configured: false }

  return {
    getSnapshot: () => snapshot,
    configure: (faces) => {
      const statusBar = faces.statusBarHeight ?? 0
      const menu = faces.menuButton
      // 与 NavBar.tsx 完全同口径：内容高 = 胶囊高 + 上下对称留白（胶囊 top 距状态栏底 = gap）。
      // 不要写成 (top - statusBar + height) * 2——那会把胶囊高也乘进去，算出的高度偏大。
      const navbar =
        menu && menu.height > 0
          ? menu.height + Math.max(menu.top - statusBar, 0) * 2
          : NAVBAR_FALLBACK_H
      // 底部横条取注入真值，负数（异常机型）夹到 0。不在这里加呼吸间距——那是样式职责。
      const bottom = Math.max(faces.bottomInset ?? 0, 0)
      snapshot = { statusBar, navbar, top: statusBar + navbar, bottom, configured: true }
    },
    resetForTests: () => {
      snapshot = { statusBar: 0, navbar: 0, top: 0, bottom: 0, configured: false }
    },
  }
}

/** 跨副本唯一的安全区状态：主包 / 分包各打一份库时也看到同一份注入值。 */
export function safeAreaState(): SafeAreaStore {
  return createSingleton<SafeAreaStore>('safe-area', createSafeAreaStore)
}

/** 宿主在 app 入口注入一次平台真值。 */
export function configureSafeArea(faces: SafeAreaFaces): void {
  safeAreaState().configure(faces)
}

/** 读当前顶部安全区快照。 */
export function getSafeAreaSnapshot(): SafeAreaSnapshot {
  return safeAreaState().getSnapshot()
}

/** 仅测试用：重置注入状态。 */
export function resetSafeAreaForTests(): void {
  safeAreaState().resetForTests()
}
