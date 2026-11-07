// utils 层单点出口：只做具名 re-export，不含实现。
export {
  formatYmd,
  formatClock,
  formatDateTime,
  formatDurationHms,
  relativeTime,
  sameDay,
  overlaps,
  type DateLike,
} from './date.js'
export { safeTrim, truncateBytes, baseNameOf } from './string.js'
export { formatBytes, formatCount, clamp } from './number.js'
export { joinPath, parentOf, extOf, crumbsOf } from './path.js'
export {
  getLocale,
  setLocale,
  t,
  registerMessages,
  type Locale,
  type Messages,
  type MessageParams,
  type Translate,
} from './i18n.js'
