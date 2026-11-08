import { Fragment, type ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { configure } from 'mp-taro-kit/core'
import type {
  NavigateOptions,
  PlatformFaces,
  PlatformRequestOptions,
  PlatformResponse,
} from 'mp-taro-kit/core'
import { OverlayHost } from 'mp-taro-kit/ui/infra'

import 'mp-taro-kit/styles/tokens'
import 'mp-taro-kit/ui/infra/style'
import 'mp-taro-kit/ui/icon/style'
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

// 命令式 API 的渲染位置全局只挂一次；页面内容由 Taro 注入 children。
export default function App({ children }: { children?: ReactNode }) {
  return (
    <Fragment>
      {children}
      <OverlayHost />
    </Fragment>
  )
}
