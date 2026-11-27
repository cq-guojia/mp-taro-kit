import { createSingleton } from '../runtime/singleton.js'

interface WindowBackgroundSlot {
  /** createKitApp 写入的同步函数；未配 themeConfig 时为 null。 */
  sync: ((dark: boolean) => void) | null
}

function slot(): WindowBackgroundSlot {
  return createSingleton<WindowBackgroundSlot>('kit-window-background', () => ({ sync: null }))
}

/** createKitApp 登记；未配 themeConfig 时传 null，页面壳就不越权改窗口色。 */
export function setWindowBackgroundSync(sync: ((dark: boolean) => void) | null): void {
  slot().sync = sync
}

/** 页面显示时按当前主题同步窗口背景，避免官方 DarkMode 配置按系统色画的首帧与用户主题相反。 */
export function syncWindowBackground(dark: boolean): void {
  slot().sync?.(dark)
}
