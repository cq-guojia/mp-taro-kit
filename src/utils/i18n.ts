// 唯一可变状态是语言注册表。默认语言是唯一静态引入的语言包；
// 其他语言由宿主按需加载后 registerMessages 注入，库入口绝不静态引入全量语言包。
import { ZH_CN } from './messages.zh.js'

export type Locale = string
export type Messages = Record<string, string>
export type MessageParams = Record<string, string | number>
export type Translate = (key: string, params?: MessageParams) => string

const DEFAULT_LOCALE: Locale = 'zh-CN'
const registry: Map<Locale, Messages> = new Map([[DEFAULT_LOCALE, ZH_CN]])
let currentLocale: Locale = DEFAULT_LOCALE

export function getLocale(): Locale {
  return currentLocale
}

/** 未注册的语言回落默认中文，不抛。 */
export function setLocale(locale: Locale): void {
  currentLocale = registry.has(locale) ? locale : DEFAULT_LOCALE
}

/** 宿主按需加载语言包后注入；重复注册按 key 合并，不覆盖已有条目。 */
export function registerMessages(locale: Locale, messages: Messages): void {
  const existing = registry.get(locale)
  registry.set(locale, existing ? { ...existing, ...messages } : { ...messages })
}

/** 取当前语言 → 缺 key 回落中文 → 仍缺返回 key；{n} 插值；从不抛。 */
export function t(key: string, params?: MessageParams): string {
  const template = registry.get(currentLocale)?.[key] ?? registry.get(DEFAULT_LOCALE)?.[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.keys(params).includes(name) ? String(params[name]) : match,
  )
}
