import Taro from '@tarojs/taro'
import type {
  NavigateOptions,
  PlatformFaces,
  PlatformRequestOptions,
  PlatformResponse,
} from '../core/faces.js'

function urlOf(options: NavigateOptions): string {
  if (options.params === undefined) return options.url
  const query = Object.keys(options.params)
    .filter((key) => options.params?.[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(options.params?.[key]))}`)
    .join('&')
  if (query === '') return options.url
  return `${options.url}${options.url.includes('?') ? '&' : '?'}${query}`
}

/**
 * 用 Taro 原生 API 生成 13 个平台 faces。业务差异（request 的 baseURL / 鉴权、
 * login / 支付策略等）用 overrides 覆盖；未被覆盖的一律走 Taro 默认实现。
 * 本文件是唯一 import @tarojs/taro 的装配点，主出口不引用它。
 */
export function createTaroFaces(overrides: Partial<PlatformFaces> = {}): PlatformFaces {
  const defaults: PlatformFaces = {
    request: <T>(options: PlatformRequestOptions): Promise<PlatformResponse<T>> =>
      Taro.request({
        url: options.url,
        method: options.method,
        data: options.data,
        header: options.header,
        timeout: options.timeout,
      } as unknown as Parameters<typeof Taro.request>[0]).then((res) => ({
        statusCode: res.statusCode,
        data: res.data as T,
      })),
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
  return { ...defaults, ...overrides }
}
