// core 层单点出口：只做具名 re-export，不含实现。
export type {
  HttpMethod,
  NavigateOptions,
  PaymentOptions,
  PlatformFaces,
  PlatformRequestOptions,
  PlatformResponse,
} from './faces.js'
export {
  configure,
  getFaces,
  getConfig,
  resetForTests,
  type CoreConfig,
} from './configure.js'
export {
  request,
  get,
  post,
  put,
  patch,
  remove,
  joinUrl,
  type RequestOptions,
  type HttpResult,
} from './request.js'
export {
  navigateTo,
  redirectTo,
  switchTab,
  reLaunch,
  navigateBack,
  buildUrl,
  type RouteOptions,
} from './router.js'
export { storageGet, storageSet, storageRemove, storageClear } from './storage.js'
export { login, scanCode, requestPayment } from './weapp.js'
