import { createSingleton } from './singleton.js'

/** 明 / 暗 / 跟随系统；跟随系统时最终 dark 由 systemDark 决定。 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 对外只读快照；dark 是派生值，组件只读它，不自己重算判定。 */
export interface ThemeSnapshot {
  readonly mode: ThemeMode
  readonly systemDark: boolean
  readonly dark: boolean
}

/**
 * 主题所需的平台能力，宿主在 app 入口配置一次注入。
 * runtime 层零平台依赖，不 import Taro / React / DOM。
 */
export interface ThemeFaces {
  /** 读当前系统是否暗色；不提供时 auto 表现为明色。 */
  readonly systemDark?: () => boolean
  /** 注册系统主题变化监听，返回取消订阅函数；小程序 App 无卸载钩子时可返回 void。 */
  readonly onSystemDarkChange?: (notify: (dark: boolean) => void) => (() => void) | undefined
  /** dark 变化时的原生层副作用：窗口背景、状态栏、导航栏等。 */
  readonly onDarkChange?: (dark: boolean) => void
}

export interface ThemeStore {
  readonly getSnapshot: () => ThemeSnapshot
  readonly subscribe: (listener: () => void) => () => void
  readonly setMode: (mode: ThemeMode, faces?: ThemeFaces) => void
  readonly setSystemDark: (dark: boolean) => void
  readonly resetForTests: () => void
}

function assertMode(mode: ThemeMode): void {
  if (mode === 'light' || mode === 'dark' || mode === 'auto') return
  throw new Error(`[mp-taro-kit/runtime] 非法主题模式 ${String(mode)}；只能是 'light' | 'dark' | 'auto'`)
}

function createThemeStore(): ThemeStore {
  let mode: ThemeMode = 'auto'
  let systemDark = false
  let snapshot: ThemeSnapshot = { mode, systemDark, dark: false }
  let faces: ThemeFaces = {}
  let unsubscribe: (() => void) | undefined
  let lastNotifiedDark: boolean | undefined
  const listeners = new Set<() => void>()

  function recompute(): void {
    const dark = mode === 'auto' ? systemDark : mode === 'dark'
    snapshot = { mode, systemDark, dark }
    for (const listener of listeners) listener()
    if (dark !== lastNotifiedDark) {
      lastNotifiedDark = dark
      faces.onDarkChange?.(dark)
    }
  }

  function bind(next: ThemeFaces): void {
    if (typeof unsubscribe === 'function') unsubscribe()
    unsubscribe = undefined
    faces = next
    if (faces.systemDark) systemDark = faces.systemDark() === true
    if (faces.onSystemDarkChange) {
      unsubscribe = faces.onSystemDarkChange((dark) => setSystemDark(dark))
    }
  }

  function setSystemDark(dark: boolean): void {
    const next = dark === true
    if (next === systemDark) return
    systemDark = next
    recompute()
  }

  function setMode(nextMode: ThemeMode, nextFaces?: ThemeFaces): void {
    assertMode(nextMode)
    const changed = nextMode !== mode
    mode = nextMode
    if (nextFaces !== undefined) bind(nextFaces)
    if (changed || nextFaces !== undefined) recompute()
  }

  function resetForTests(): void {
    if (typeof unsubscribe === 'function') unsubscribe()
    unsubscribe = undefined
    faces = {}
    listeners.clear()
    mode = 'auto'
    systemDark = false
    lastNotifiedDark = undefined
    snapshot = { mode, systemDark, dark: false }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setMode,
    setSystemDark,
    resetForTests,
  }
}

/** 跨副本唯一的主题状态：主包 / 分包各打一份库时也看到同一个 mode。 */
export function themeState(): ThemeStore {
  return createSingleton<ThemeStore>('theme', createThemeStore)
}

/**
 * 设置主题模式。首次调用在 app 入口带上 faces 配置平台能力；
 * 开关里再次调用只传 mode，沿用已注入的能力。
 */
export function setThemeMode(mode: ThemeMode, faces?: ThemeFaces): void {
  themeState().setMode(mode, faces)
}

/** 宿主自行接管系统主题事件时可手动喂值；通常用 faces.onSystemDarkChange 自动接入。 */
export function setSystemDark(dark: boolean): void {
  themeState().setSystemDark(dark)
}

export function getThemeSnapshot(): ThemeSnapshot {
  return themeState().getSnapshot()
}

export function resetThemeForTests(): void {
  themeState().resetForTests()
}
