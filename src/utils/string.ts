/** 去首尾空白；非字符串（null / undefined / number）安全返回空串。 */
export function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 路径取末段（`/` 与 `\` 都认）。先剔尾斜杠，否则目录 `b/` 会渲染成空标签。
 */
export function baseNameOf(path: string): string {
  if (typeof path !== 'string') return ''
  const trimmed = path.replace(/[\\/]+$/, '')
  if (trimmed === '') return path
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return cut < 0 ? trimmed : trimmed.slice(cut + 1)
}

function utf8Size(codePoint: number): number {
  if (codePoint <= 0x7f) return 1
  if (codePoint <= 0x7ff) return 2
  if (codePoint <= 0xffff) return 3
  return 4
}

/** 按 UTF-8 字节截断（中文 3 字节、emoji 4 字节），不切半个码点。 */
// 自己按码点算字节，不依赖 TextEncoder —— 小程序运行时未必提供该全局。
export function truncateBytes(text: string, maxBytes: number, suffix = '…'): string {
  if (typeof text !== 'string' || !Number.isFinite(maxBytes) || maxBytes <= 0) return ''
  let total = 0
  for (const ch of text) total += utf8Size(ch.codePointAt(0) ?? 0)
  if (total <= maxBytes) return text

  let suffixBytes = 0
  for (const ch of suffix) suffixBytes += utf8Size(ch.codePointAt(0) ?? 0)
  const budget = maxBytes - suffixBytes

  let out = ''
  let used = 0
  for (const ch of budget <= 0 ? suffix : text) {
    const size = utf8Size(ch.codePointAt(0) ?? 0)
    if (used + size > (budget <= 0 ? maxBytes : budget)) break
    used += size
    out += ch
  }
  return budget <= 0 ? out : out + suffix
}
