// 日期 / 时间格式化，全部走本机时区。解析失败一律返回 '—'，不抛、不编造时间。
import { t } from './i18n.js'

export type DateLike = Date | number | string

const FALLBACK = '—'
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** 字符串先试原生解析，再试 `-` → `/`（小程序 iOS 只认斜杠格式）。 */
function toDate(value: DateLike): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') return Number.isFinite(value) ? new Date(value) : null
  if (typeof value !== 'string' || value.trim() === '') return null
  let ms = Date.parse(value)
  if (Number.isNaN(ms) && !value.includes('T')) ms = Date.parse(value.replace(/-/g, '/'))
  return Number.isNaN(ms) ? null : new Date(ms)
}

/** `YYYY-MM-DD`。 */
export function formatYmd(value: DateLike): string {
  const d = toDate(value)
  if (!d) return FALLBACK
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** `HH:mm:ss`。 */
export function formatClock(value: DateLike): string {
  const d = toDate(value)
  if (!d) return FALLBACK
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

/** `YYYY-MM-DD HH:mm`。 */
export function formatDateTime(value: DateLike): string {
  const d = toDate(value)
  if (!d) return FALLBACK
  return `${formatYmd(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 时长：有小时 ⇒ `H:MM:SS`，不足 1 小时 ⇒ `MM:SS`；负数 / 非有限 ⇒ `—`。 */
export function formatDurationHms(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return FALLBACK
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`
}

/** 两个时刻是否同一天（本机时区）；任一无效 ⇒ false。 */
export function sameDay(a: DateLike, b: DateLike): boolean {
  const x = toDate(a)
  const y = toDate(b)
  if (!x || !y) return false
  return (
    x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
  )
}

/** 半开区间 `[aFrom, aTo)` 是否重叠；非有限数视为不重叠。 */
export function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  if (![aFrom, aTo, bFrom, bTo].every(Number.isFinite)) return false
  return aFrom < bTo && bFrom < aTo
}

/**
 * 相对时间：过去 ⇒ `N 分钟前`，未来 ⇒ `N 分钟后`；超过 7 天回退 `formatYmd`。
 * 文案走 i18n，宿主注册其他语言后即随之切换；解析失败 ⇒ `—`。
 */
export function relativeTime(value: DateLike, now: DateLike = Date.now()): string {
  const target = toDate(value)
  const base = toDate(now)
  if (!target || !base) return FALLBACK
  const diff = target.getTime() - base.getTime()
  const abs = Math.abs(diff)
  if (abs < MINUTE) return t('relNow')
  if (abs >= 7 * DAY) return formatYmd(target)
  const past = diff < 0
  if (abs < HOUR) return t(past ? 'relMinutesAgo' : 'relMinutesLater', { n: Math.floor(abs / MINUTE) })
  if (abs < DAY) return t(past ? 'relHoursAgo' : 'relHoursLater', { n: Math.floor(abs / HOUR) })
  return t(past ? 'relDaysAgo' : 'relDaysLater', { n: Math.floor(abs / DAY) })
}
