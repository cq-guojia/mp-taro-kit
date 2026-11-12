import { useSyncExternalStore } from 'react'
import { themeState } from '../../runtime/theme.js'
import type { ThemeSnapshot } from '../../runtime/theme.js'

/** runtime 的主题快照直接喂给 useSyncExternalStore；订阅桥只做转发，不复制状态。 */
export function useThemeSnapshot(): ThemeSnapshot {
  const store = themeState()
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
  )
}

/** 组件只读 dark 派生值，不在组件里重算 light / dark / auto 的判定。 */
export function useThemeDark(): boolean {
  return useThemeSnapshot().dark
}
