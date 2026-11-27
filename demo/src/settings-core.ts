import type { ThemeMode } from 'mp-taro-kit/runtime'

export type MenuScope = 'developed' | 'all'
export type DemoSettings = { themeMode: ThemeMode; menuScope: MenuScope }

export const STORAGE_KEY = 'mptk:demo-settings'

const THEME_MODES: readonly string[] = ['light', 'dark', 'auto']
const MENU_SCOPES: readonly string[] = ['developed', 'all']

function defaults(): DemoSettings {
  return { themeMode: 'auto', menuScope: 'developed' }
}

/** 缓存里只有合法枚举才认，脏值一律回默认，不把非法值带进 UI。 */
export function resolveSettings(raw: unknown): DemoSettings {
  if (raw === null || typeof raw !== 'object') return defaults()
  const value = raw as Partial<DemoSettings>
  const themeMode = value.themeMode
  const menuScope = value.menuScope
  return {
    themeMode: THEME_MODES.includes(themeMode ?? '') ? (themeMode as ThemeMode) : 'auto',
    menuScope: MENU_SCOPES.includes(menuScope ?? '') ? (menuScope as MenuScope) : 'developed',
  }
}

/** Taro 同步读可能给字符串或对象，两种形态都收口到同一份校验。 */
export function parseSettings(raw: unknown): DemoSettings {
  if (typeof raw !== 'string') return resolveSettings(raw)
  try {
    return resolveSettings(JSON.parse(raw) as unknown)
  } catch {
    return defaults()
  }
}
