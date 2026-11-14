// 测试辅助：把编译产物里的 var(--mptk-*) 递归解析回配置真源的字面量。
// 组件样式改成只读变量后，断言仍应验证「最终生效的值」，而不是把 var() 当结论。
import defaults from '../../kit.config.mjs'
import { resolveAlias } from '../../scripts/lib/kit-config.mjs'

export function tokensOf(mode = 'light') {
  return {
    ...defaults.base,
    ...defaults.component,
    ...defaults.structure,
    ...defaults.surface,
    ...defaults[mode],
  }
}

/** 解析 var() 链与配置层别名（@blue / @light:gray-2），保留无法解析的原式以便断言暴露问题。 */
export function resolveCssVars(css, mode = 'light') {
  const tokens = tokensOf(mode)
  const resolve = (text, seen) => text.replace(/var\((--mptk-[\w-]+)\)/g, (whole, name) => {
    if (seen.has(name) || !(name in tokens)) return whole
    const next = new Set(seen).add(name)
    return resolve(String(resolveAlias(tokens[name], defaults, mode)), next)
  })
  return resolve(css, new Set())
}

/**
 * catalog.ts 被测试以 CJS 求值；它 import 生成表，这里给一份只含生成表的 require 替身。
 * 值仍来自配置真源，不让演示站数据模块在测试里退化成空值。
 */
export function catalogModuleStub(specifier) {
  if (!specifier.includes('kit-config.generated')) {
    throw new Error(`catalog.ts 不该依赖 ${specifier}`)
  }
  const rows = tokensOf()
  return {
    KIT_CONFIG_BY_KEY: Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, { value }])),
    KIT_CONFIG_ROWS: Object.entries(rows).map(([key, value]) => ({ key, value, group: '', groupLabel: '' })),
  }
}
