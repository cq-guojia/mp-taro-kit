import { getConfig, getFaces } from './configure.js'

interface Stored<T> {
  v: T
  e: number | null
}

function keyOf(key: string): string {
  return `${getConfig().storagePrefix}${key}`
}

/** 平台异常 / 脏数据 / 过期都按「用户在场」兜底；未 configure() 由 getFaces 抛错。 */
export function storageGet<T = unknown>(key: string): T | undefined {
  const faces = getFaces()
  try {
    const raw = faces.getStorage(keyOf(key))
    if (raw === undefined || raw === null || raw === '') return undefined
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed === null || typeof parsed !== 'object' || !('v' in parsed)) return undefined
    const record = parsed as Stored<T>
    if (record.e !== null && record.e !== undefined && record.e <= Date.now()) {
      faces.removeStorage(keyOf(key))
      return undefined
    }
    return record.v
  } catch {
    return undefined
  }
}

/** 返回 false 表示平台写入失败，不静默、也不抛。 */
export function storageSet<T>(key: string, value: T, ttlMs?: number): boolean {
  const faces = getFaces()
  const record: Stored<T> = { v: value, e: ttlMs === undefined ? null : Date.now() + ttlMs }
  try {
    faces.setStorage(keyOf(key), JSON.stringify(record))
    return true
  } catch {
    return false
  }
}

export function storageRemove(key: string): boolean {
  const faces = getFaces()
  try {
    faces.removeStorage(keyOf(key))
    return true
  } catch {
    return false
  }
}

export function storageClear(): boolean {
  const faces = getFaces()
  try {
    faces.clearStorage()
    return true
  } catch {
    return false
  }
}
