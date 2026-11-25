import type { ComponentType, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { configure, type CoreConfig, type PlatformFaces } from '../core/index.js'
import { configureSafeArea, setThemeMode, type ThemeMode } from '../runtime/index.js'
import { setPageKeyProvider } from '../runtime/page-route.js'
import { createSingleton } from '../runtime/singleton.js'
import { currentPageKeyFromTaro } from './current-page.js'
import { setKitHosts, type CommandHost } from './kit-hosts.js'
import { createTaroFaces } from './taro-faces.js'

export type { CommandHost } from './kit-hosts.js'

export interface ThemeConfig {
  readonly light: { readonly bgColor: string }
  readonly dark: { readonly bgColor: string }
}

export interface CreateKitAppOptions {
  /** 业务覆盖的 faces；未给的走 Taro 默认实现。 */
  faces?: Partial<PlatformFaces>
  /** core 配置（baseURL / timeout 等），透传 configure。 */
  core?: Partial<CoreConfig>
  /**
   * 主题：mode + 宿主 theme.json + 暗色副作用。
   * onDarkChange 默认用 themeConfig 同步窗口背景，给了就覆盖。
   */
  theme?: {
    mode?: ThemeMode
    themeConfig?: ThemeConfig
    onDarkChange?: (dark: boolean) => void
  }
  /**
   * 要挂载的命令宿主，默认空（不挂任何命令宿主）。
   * 用哪个命令就从 mp-taro-kit/app 显式 import 对应 Host 传进来；不传即不挂，调命令会抛错。
   */
  hosts?: readonly CommandHost[]
}

interface KitAppSlot {
  /** 上次初始化的配置指纹；相同则不重放，不同则整体重配（兼顾 HMR / 多 App 实例）。 */
  fingerprint: string | null
}

function slot(): KitAppSlot {
  return createSingleton<KitAppSlot>('kit-app', () => ({ fingerprint: null }))
}

function applyWindowBackground(dark: boolean, themeConfig?: ThemeConfig): void {
  if (themeConfig === undefined) return
  const bgColor = dark ? themeConfig.dark.bgColor : themeConfig.light.bgColor
  void Taro.setBackgroundColor({
    backgroundColor: bgColor,
    backgroundColorTop: bgColor,
    backgroundColorBottom: bgColor,
  })
}

/**
 * 消费方 app 入口一行接入：configure(faces) + 安全区 + 主题 + 命令宿主。
 * 初始化按配置指纹去重：configure 是整体覆盖，同样配置只做一次，
 * 配置变了（改 faces / 主题，或 HMR 重载）则整体重放，不静默吞掉新配置。
 */
export function createKitApp<P extends { children?: ReactNode }>(
  App: ComponentType<P>,
  options: CreateKitAppOptions = {},
): ComponentType<P> {
  const themeConfig = options.theme?.themeConfig
  const fingerprint = JSON.stringify({
    core: options.core ?? null,
    mode: options.theme?.mode ?? 'auto',
    colors: themeConfig === undefined ? null : [themeConfig.light.bgColor, themeConfig.dark.bgColor],
    hasFaces: options.faces !== undefined,
  })

  const state = slot()
  if (state.fingerprint !== fingerprint) {
    configure(createTaroFaces(options.faces), options.core)

    const windowInfo = Taro.getWindowInfo()
    const menuButton = Taro.getMenuButtonBoundingClientRect()
    // 底部横条真值 = 屏幕高 - 安全区底边。safeArea 在 H5 / 部分机型缺失，取不到按 0，
    // 交 CSS env() 兜底。Skyline 下不能靠 env(safe-area-inset-bottom) 自己取，必须注入。
    const safeArea = windowInfo.safeArea
    const bottomInset =
      safeArea && typeof windowInfo.screenHeight === 'number'
        ? Math.max(windowInfo.screenHeight - safeArea.bottom, 0)
        : 0
    configureSafeArea({
      statusBarHeight: windowInfo.statusBarHeight ?? 0,
      menuButton: { top: menuButton.top, height: menuButton.height },
      bottomInset,
    })

    const onDarkChange =
      options.theme?.onDarkChange ?? ((dark: boolean) => applyWindowBackground(dark, themeConfig))
    setThemeMode(options.theme?.mode ?? 'auto', {
      systemDark: () => Taro.getSystemInfoSync().theme === 'dark',
      onSystemDarkChange: (notify) => {
        const onChange = (res: { theme: 'light' | 'dark' }) => notify(res.theme === 'dark')
        Taro.onThemeChange(onChange)
        return () => Taro.offThemeChange(onChange)
      },
      onDarkChange,
    })
    state.fingerprint = fingerprint
  }

  // Taro 的 App 根节点不投影成页面可见子树，宿主只在 KitPage 里渲染才能进入当前页面。
  setKitHosts(options.hosts ?? [])
  setPageKeyProvider(currentPageKeyFromTaro)

  function KitApp(props: P) {
    return <App {...props} />
  }
  return KitApp
}
