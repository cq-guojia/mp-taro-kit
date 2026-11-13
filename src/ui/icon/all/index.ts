// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 全量图标入口：`库名:图标名` → className。新增图标库自动多一项。
import { iconNames as names0 } from '../common/base/names.js'
import { iconNames as names1 } from '../common/base/color/names.js'
import { iconNames as names2 } from '../common/logo/names.js'
import { iconNames as names3 } from '../common/logo/color/names.js'
import { iconNames as names4 } from '../mp-taro-kit/base/names.js'
import { iconNames as names5 } from '../mp-taro-kit/base/color/names.js'

/** 已注册的对外图标库：库名 → 基础类与前缀。 */
export const iconPacks: Readonly<Record<string, { baseClass: string; prefix: string }>> = {
  "common.base": { baseClass: 'koc-i-common-base', prefix: 'koc-i-common-base-' },
  "common.base.color": { baseClass: 'koc-i-common-base-c', prefix: 'koc-i-common-base-c-' },
  "common.logo": { baseClass: 'koc-i-common-logo', prefix: 'koc-i-common-logo-' },
  "common.logo.color": { baseClass: 'koc-i-common-logo-c', prefix: 'koc-i-common-logo-c-' },
  "mp-taro-kit.base": { baseClass: 'mptk-i-base', prefix: 'mptk-i-base-' },
  "mp-taro-kit.base.color": { baseClass: 'mptk-i-base-c', prefix: 'mptk-i-base-c-' },
}

/** 各库当前图标名清单，供选择器与自检。 */
export const iconNamesByPack: Readonly<Record<string, readonly string[]>> = {
  "common.base": names0,
  "common.base.color": names1,
  "common.logo": names2,
  "common.logo.color": names3,
  "mp-taro-kit.base": names4,
  "mp-taro-kit.base.color": names5,
}

const warned = new Set<string>()

function warnOnce(key: string, ...parts: string[]): void {
  if (warned.has(key)) return
  warned.add(key)
  console.warn('[mp-taro-kit:icon]', ...parts)
}

/**
 * `库名:图标名` → className，如 `iconClass('common.base:home')`。
 * 库名不可省；未注册或格式不对时返回空串并告警一次，不跨库回落。
 */
export function iconClass(packAndName: string): string {
  const cut = packAndName.indexOf(':')
  if (cut <= 0 || cut === packAndName.length - 1) {
    warnOnce(packAndName, '图标名要写成 库名:图标名：', packAndName)
    return ''
  }
  const id = packAndName.slice(0, cut)
  const pack = iconPacks[id]
  if (pack === undefined) {
    warnOnce(packAndName, '未注册的图标库 ', id, '：', packAndName)
    return ''
  }
  return [pack.baseClass, pack.prefix + packAndName.slice(cut + 1)].join(' ')
}
