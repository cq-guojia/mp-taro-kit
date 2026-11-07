import { createSingleton } from '../runtime/singleton.js'
import type { PlatformFaces } from './faces.js'

export interface CoreConfig {
  baseURL: string
  timeout: number
  storagePrefix: string
  debug: boolean
  headers: Record<string, string>
}

interface CoreSlot {
  state: { faces: PlatformFaces; config: CoreConfig } | null
}

const DEFAULT_CONFIG: CoreConfig = {
  baseURL: '',
  timeout: 10_000,
  storagePrefix: 'mptk:',
  debug: false,
  headers: {},
}

const REQUIRED_FACES: readonly (keyof PlatformFaces)[] = [
  'request',
  'getStorage',
  'setStorage',
  'removeStorage',
  'clearStorage',
  'navigateTo',
  'redirectTo',
  'switchTab',
  'navigateBack',
  'reLaunch',
  'login',
  'scanCode',
  'requestPayment',
]

const NOT_CONFIGURED =
  '[mp-taro-kit/core] 未调用 configure() 注入平台能力；请在 app 入口配置一次（mp-taro-kit/core 的 configure）'

/** 配置槽用 runtime 的跨副本单例，保证「注入一次」对主包 / 分包各副本都生效。 */
function slot(): CoreSlot {
  return createSingleton<CoreSlot>('core', () => ({ state: null }))
}

/**
 * 宿主启动时调用一次，注入平台能力与库配置。
 * 缺字段是开发者契约违例 ⇒ 当场抛错，不静默降级。
 */
export function configure(faces: PlatformFaces, options: Partial<CoreConfig> = {}): void {
  if (faces === null || typeof faces !== 'object') {
    throw new Error('[mp-taro-kit/core] configure() 需要一个 faces 对象；请在 app 入口注入平台能力')
  }
  for (const key of REQUIRED_FACES) {
    if (typeof faces[key] !== 'function') {
      throw new Error(`[mp-taro-kit/core] configure() 的 faces 缺少 ${key}()；请注入该方法`)
    }
  }
  slot().state = {
    faces,
    config: {
      baseURL: options.baseURL ?? DEFAULT_CONFIG.baseURL,
      timeout: options.timeout ?? DEFAULT_CONFIG.timeout,
      storagePrefix: options.storagePrefix ?? DEFAULT_CONFIG.storagePrefix,
      debug: options.debug ?? DEFAULT_CONFIG.debug,
      headers: options.headers ?? DEFAULT_CONFIG.headers,
    },
  }
}

/** 未配置时每次调用都抛，消息直接给修复动作。 */
export function getFaces(): PlatformFaces {
  const state = slot().state
  if (state === null) throw new Error(NOT_CONFIGURED)
  return state.faces
}

export function getConfig(): CoreConfig {
  const state = slot().state
  if (state === null) throw new Error(NOT_CONFIGURED)
  return state.config
}

/** 仅供单测清空注入状态；产品代码不要调用。 */
export function resetForTests(): void {
  slot().state = null
}
