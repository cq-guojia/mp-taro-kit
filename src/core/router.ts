import { createSingleton } from '../runtime/singleton.js'
import { getFaces } from './configure.js'
import type { NavigateOptions } from './faces.js'

export interface RouteOptions extends NavigateOptions {
  /** 跳过在途锁，强制发起本次跳转。 */
  force?: boolean
}

/** 在途锁跨副本共用一份；释放时机由真实路由事件 settle 决定，不用固定间隔定时器。 */
function routeLock(): { value: boolean } {
  return createSingleton<{ value: boolean }>('core/route-lock', () => ({ value: false }))
}

export function buildUrl(url: string, params?: NavigateOptions['params']): string {
  if (params === undefined) return url
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&')
  if (query === '') return url
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`
}

async function go(
  kind: 'navigateTo' | 'redirectTo' | 'switchTab' | 'reLaunch',
  options: RouteOptions,
): Promise<boolean> {
  const faces = getFaces()
  const lock = routeLock()
  if (lock.value && options.force !== true) return false
  lock.value = true
  try {
    await faces[kind]({ url: buildUrl(options.url, options.params) })
    return true
  } catch {
    return false
  } finally {
    lock.value = false
  }
}

export function navigateTo(options: RouteOptions): Promise<boolean> {
  return go('navigateTo', options)
}

export function redirectTo(options: RouteOptions): Promise<boolean> {
  return go('redirectTo', options)
}

export function switchTab(options: RouteOptions): Promise<boolean> {
  return go('switchTab', options)
}

export function reLaunch(options: RouteOptions): Promise<boolean> {
  return go('reLaunch', options)
}

export async function navigateBack(delta = 1): Promise<boolean> {
  const faces = getFaces()
  const lock = routeLock()
  if (lock.value) return false
  lock.value = true
  try {
    await faces.navigateBack(delta)
    return true
  } catch {
    return false
  } finally {
    lock.value = false
  }
}
