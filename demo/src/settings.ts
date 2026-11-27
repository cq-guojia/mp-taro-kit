import { useSyncExternalStore } from 'react'
import Taro from '@tarojs/taro'
import { setThemeMode, type ThemeMode } from 'mp-taro-kit/runtime'
import { STORAGE_KEY, parseSettings, type DemoSettings, type MenuScope } from './settings-core'

let snapshot: DemoSettings | undefined
const listeners = new Set<() => void>()

function current(): DemoSettings {
  if (snapshot === undefined) {
    let raw: unknown
    try {
      raw = Taro.getStorageSync(STORAGE_KEY)
    } catch {
      raw = undefined
    }
    snapshot = parseSettings(raw)
  }
  return snapshot
}

function write(patch: Partial<DemoSettings>): void {
  const next = { ...current(), ...patch }
  snapshot = next
  try {
    Taro.setStorageSync(STORAGE_KEY, next)
  } catch {
    // 缓存写不进去（超容量 / 被清理）时本次会话仍生效，不打断调试。
  }
  for (const listener of listeners) listener()
}

/** 入口在 createKitApp 之前读，避免主题每次冷启动回到 auto。 */
export function initialThemeMode(): ThemeMode {
  return current().themeMode
}

/** 两个主题开关共用一个写入口，避免只改内存不改缓存。 */
export function setDemoThemeMode(mode: ThemeMode): void {
  setThemeMode(mode)
  write({ themeMode: mode })
}

export function useMenuScope(): MenuScope {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => current().menuScope,
    () => current().menuScope,
  )
}

export function setMenuScope(scope: MenuScope): void {
  write({ menuScope: scope })
}
