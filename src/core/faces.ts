/**
 * 平台能力的最小本地接口面：只声明本库真正会调的那几个，不 import @tarojs/taro。
 * 宿主在 app 入口用 configure() 注入一次；库不与宿主的 Taro 类型版本焊死，也不引入平台类型依赖。
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

export interface PlatformRequestOptions {
  url: string
  method: HttpMethod
  data?: unknown
  header?: Record<string, string>
  timeout?: number
}

export interface PlatformResponse<T> {
  statusCode: number
  data: T
}

export interface NavigateOptions {
  url: string
  params?: Record<string, string | number | boolean | undefined>
}

export interface PaymentOptions {
  [key: string]: unknown
}

export interface PlatformFaces {
  request<T>(options: PlatformRequestOptions): Promise<PlatformResponse<T>>
  getStorage(key: string): unknown
  setStorage(key: string, value: string): void
  removeStorage(key: string): void
  clearStorage(): void
  navigateTo(options: NavigateOptions): Promise<unknown>
  redirectTo(options: NavigateOptions): Promise<unknown>
  switchTab(options: NavigateOptions): Promise<unknown>
  navigateBack(delta?: number): Promise<unknown>
  reLaunch(options: NavigateOptions): Promise<unknown>
  login(): Promise<{ code: string }>
  scanCode(): Promise<{ result: string }>
  requestPayment(options: PaymentOptions): Promise<unknown>
}
