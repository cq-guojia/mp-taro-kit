import { getFaces } from './configure.js'
import type { PaymentOptions } from './faces.js'

/** 微信专有 API 的统一 Promise 化收口；平台失败返回兜底，不抛给页面。 */
export async function login(): Promise<{ code: string } | undefined> {
  const faces = getFaces()
  try {
    const result = await faces.login()
    return result !== null && result !== undefined && typeof result.code === 'string' ? result : undefined
  } catch {
    return undefined
  }
}

export async function scanCode(): Promise<string | undefined> {
  const faces = getFaces()
  try {
    const result = await faces.scanCode()
    return typeof result?.result === 'string' ? result.result : undefined
  } catch {
    return undefined
  }
}

export async function requestPayment(options: PaymentOptions): Promise<boolean> {
  const faces = getFaces()
  try {
    await faces.requestPayment(options)
    return true
  } catch {
    return false
  }
}
