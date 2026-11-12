import { Fragment, type ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { configure } from 'mp-taro-kit/core'
import type {
  NavigateOptions,
  PlatformFaces,
  PlatformRequestOptions,
  PlatformResponse,
} from 'mp-taro-kit/core'
import { setThemeMode } from 'mp-taro-kit/runtime'
import { OverlayHost } from 'mp-taro-kit/ui/infra'
import themeConfig from './theme.json'

import 'mp-taro-kit/styles/theme-runtime'
import 'mp-taro-kit/ui/infra/style'
import 'mp-taro-kit/ui/icon/base/style'
// 演示站自有的图标：只引样式，类名在用到的地方直接写，不做包出口。
import './icons/demo-color/style/index.scss'
import './app.scss'

function urlOf(options: NavigateOptions): string {
  if (options.params === undefined) return options.url
  const params = options.params
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&')
  if (query === '') return options.url
  return `${options.url}${options.url.includes('?') ? '&' : '?'}${query}`
}

async function request<T>(options: PlatformRequestOptions): Promise<PlatformResponse<T>> {
  const res = await Taro.request({
    url: options.url,
    method: options.method,
    data: options.data,
    header: options.header,
    timeout: options.timeout,
  } as unknown as Parameters<typeof Taro.request>[0])
  return { statusCode: res.statusCode, data: res.data as T }
}

// core 不 import @tarojs/taro：13 个平台方法全部由宿主在入口注入，缺一个当场抛错。
const faces: PlatformFaces = {
  request,
  getStorage: (key) => Taro.getStorageSync(key),
  setStorage: (key, value) => Taro.setStorageSync(key, value),
  removeStorage: (key) => Taro.removeStorageSync(key),
  clearStorage: () => Taro.clearStorageSync(),
  navigateTo: (options) => Taro.navigateTo({ url: urlOf(options) }),
  redirectTo: (options) => Taro.redirectTo({ url: urlOf(options) }),
  switchTab: (options) => Taro.switchTab({ url: urlOf(options) }),
  reLaunch: (options) => Taro.reLaunch({ url: urlOf(options) }),
  navigateBack: (delta) => Taro.navigateBack({ delta }),
  login: async () => {
    const res = await Taro.login()
    return { code: res.code }
  },
  scanCode: async () => {
    const res = await Taro.scanCode({})
    return { result: res.result }
  },
  requestPayment: (options) =>
    Taro.requestPayment(options as unknown as Parameters<typeof Taro.requestPayment>[0]),
}

configure(faces)

// 窗口背景色：Android 底部手势条与转场露出的区域只认这个，不跟随页面 CSS 背景。
// 值与 app.json 的 @bgColor 同源，都取自 theme.json，避免两处色值漂移。
function applyWindowBackground(dark: boolean) {
  const backgroundColor = dark ? themeConfig.dark.bgColor : themeConfig.light.bgColor
  void Taro.setBackgroundColor({
    backgroundColor,
    backgroundColorTop: backgroundColor,
    backgroundColorBottom: backgroundColor,
  })
}

// 主题在 app 入口配置一次：平台能力全部由宿主注入，库侧 runtime 保持零平台依赖。
// auto 跟随系统主题；开关里调 setThemeMode('light' | 'dark' | 'auto') 即可热切换。
setThemeMode('auto', {
  systemDark: () => Taro.getSystemInfoSync().theme === 'dark',
  onSystemDarkChange: (notify) => {
    const onChange = (res: { theme: 'light' | 'dark' }) => notify(res.theme === 'dark')
    Taro.onThemeChange(onChange)
    return () => Taro.offThemeChange(onChange)
  },
  onDarkChange: applyWindowBackground,
})

// 命令式 API 的渲染位置全局只挂一次；页面内容由 Taro 注入 children。
export default function App({ children }: { children?: ReactNode }) {
  return (
    <Fragment>
      {children}
      <OverlayHost />
    </Fragment>
  )
}
