import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatYmd,
  formatClock,
  formatDateTime,
  formatDurationHms,
  relativeTime,
  sameDay,
  overlaps,
  safeTrim,
  truncateBytes,
  baseNameOf,
  formatBytes,
  formatCount,
  clamp,
  joinPath,
  parentOf,
  extOf,
  crumbsOf,
  getLocale,
  setLocale,
  t,
  registerMessages,
} from '../dist/utils/index.js'

const NOW = Date.parse('2026/11/07 12:00:00')
const MINUTE = 60_000

test('date：格式化走本机时区，无效输入返回兜底不抛', () => {
  assert.equal(formatYmd('2026-11-07T10:30:45'), '2026-11-07')
  assert.equal(formatClock('2026-11-07T10:30:45'), '10:30:45')
  assert.equal(formatDateTime('2026-11-07T10:30:45'), '2026-11-07 10:30')
  assert.equal(formatYmd('2026-11-07 10:30:00'), '2026-11-07')
  assert.equal(formatYmd('不是日期'), '—')
  assert.equal(formatClock(null), '—')
  assert.equal(formatDateTime(NaN), '—')
})

test('date：时长、同日、区间重叠', () => {
  assert.equal(formatDurationHms(3_661_000), '1:01:01')
  assert.equal(formatDurationHms(65_000), '01:05')
  assert.equal(formatDurationHms(-1), '—')
  assert.equal(sameDay('2026-11-07 01:00:00', '2026-11-07 23:00:00'), true)
  assert.equal(sameDay('2026-11-07', '2026-11-08'), false)
  assert.equal(sameDay('不是日期', NOW), false)
  assert.equal(overlaps(0, 10, 5, 15), true)
  assert.equal(overlaps(0, 10, 10, 20), false)
  assert.equal(overlaps(NaN, 10, 0, 5), false)
})

test('date：相对时间过去 / 未来 / 超期 / 无效', () => {
  assert.equal(relativeTime(NOW, NOW), '刚刚')
  assert.equal(relativeTime(NOW - 3 * MINUTE, NOW), '3 分钟前')
  assert.equal(relativeTime(NOW + 2 * 60 * MINUTE, NOW), '2 小时后')
  assert.equal(relativeTime(NOW + 8 * 24 * 60 * MINUTE, NOW), formatYmd(NOW + 8 * 24 * 60 * MINUTE))
  assert.equal(relativeTime('不是日期', NOW), '—')
})

test('string：安全 trim、UTF-8 截断不切半个字、路径末段', () => {
  assert.equal(safeTrim('  a  '), 'a')
  assert.equal(safeTrim(null), '')
  assert.equal(safeTrim(42), '')
  assert.equal(truncateBytes('abc', 10), 'abc')
  assert.equal(truncateBytes('中文中文', 9), '中文…')
  assert.equal(truncateBytes('😀a', 5), '😀a')
  assert.equal(truncateBytes('abc', 0), '')
  assert.equal(baseNameOf('a/b/'), 'b')
  assert.equal(baseNameOf('C:\\a\\b.md'), 'b.md')
  assert.equal(baseNameOf(''), '')
})

test('number：字节 / 计数 / clamp，非法值不抛', () => {
  assert.equal(formatBytes(0), '—')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1536), '1.5 KB')
  assert.equal(formatBytes(NaN), '—')
  assert.equal(formatCount(1234), '1.2K')
  assert.equal(formatCount(123456), '123K')
  assert.equal(formatCount(NaN), '—')
  assert.equal(clamp(5, 0, 10), 5)
  assert.equal(clamp(-1, 0, 10), 0)
  assert.equal(clamp(11, 0, 10), 10)
  assert.equal(clamp(NaN, 0, 10), 0)
  assert.equal(clamp(5, 10, 0), 10)
})

test('path：拼接、父目录、扩展名、面包屑', () => {
  assert.equal(joinPath('a/', '/b'), 'a/b')
  assert.equal(joinPath('', 'b'), 'b')
  assert.equal(joinPath('a/', ''), 'a')
  assert.equal(parentOf('a/b/'), 'a')
  assert.equal(parentOf('a'), '')
  assert.equal(extOf('a/B.MD?v=1'), 'md')
  assert.equal(extOf('a/.hidden'), '')
  assert.equal(extOf('a/b'), '')
  assert.deepEqual(crumbsOf('/a//b/'), ['a', 'b'])
})

test('i18n：默认只中文、运行时注册其他语言、未注册回落、相对时间随之切换', () => {
  assert.equal(getLocale(), 'zh-CN')
  assert.equal(t('relMinutesAgo', { n: 3 }), '3 分钟前')
  assert.equal(t('missing.key'), 'missing.key')

  registerMessages('en-US', { relMinutesAgo: '{n} min ago' })
  setLocale('en-US')
  assert.equal(getLocale(), 'en-US')
  assert.equal(t('relMinutesAgo', { n: 3 }), '3 min ago')
  assert.equal(t('relHoursAgo', { n: 2 }), '2 小时前')
  assert.equal(relativeTime(NOW - 3 * MINUTE, NOW), '3 min ago')

  setLocale('fr-FR')
  assert.equal(getLocale(), 'zh-CN')
  setLocale('zh-CN')
})
