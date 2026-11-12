import { Fragment, useEffect, type ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { configure } from 'mp-taro-kit/core'
import type {
  NavigateOptions,
  PlatformFaces,
  PlatformRequestOptions,
  PlatformResponse,
} from 'mp-taro-kit/core'
import { OverlayHost } from 'mp-taro-kit/ui/infra'

import 'mp-taro-kit/styles/theme-auto'
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

// 窗口背景色：Android 的底部系统手势条区域只认这个，不跟随页面 CSS 背景。
const WINDOW_BACKGROUND = {
  light: '#ffffff',
  dark: '#15181c',
} as const

function applyWindowBackground(theme: 'light' | 'dark') {
  const backgroundColor = WINDOW_BACKGROUND[theme]
  void Taro.setBackgroundColor({
    backgroundColor,
    backgroundColorTop: backgroundColor,
    backgroundColorBottom: backgroundColor,
  })
}

// 命令式 API 的渲染位置全局只挂一次；页面内容由 Taro 注入 children。
export default function App({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const theme = Taro.getSystemInfoSync().theme === 'dark' ? 'dark' : 'light'
    applyWindowBackground(theme)
    const onChange = (res: { theme: 'light' | 'dark' }) => applyWindowBackground(res.theme)
    Taro.onThemeChange(onChange)
    return () => Taro.offThemeChange(onChange)
  }, [])

  return (
    <Fragment>
      {children}
      <OverlayHost />
    </Fragment>
  )
}
