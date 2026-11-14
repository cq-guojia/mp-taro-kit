// 统一配置生成器的纯函数核心：不写盘、不读环境，只把「默认表 ⊕ 差异」算成一组产物文本。
// 库侧（--lib）与宿主侧（--host）都调 generate()，--check 拿它的结果独立比对。
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const GENERATED_HEADER = (what) =>
  `// 请勿手改：由 scripts/gen-kit-config.mjs 从 kit.config.mjs 生成（${what}）。\n` +
  `// 改皮肤请改 kit.config.mjs 或消费方自己的差异文件，然后重新构建。\n`

export const SENTINEL = {
  base: ['// @mptk-generated:base:start', '// @mptk-generated:base:end'],
  surface: ['// @mptk-generated:surface:start', '// @mptk-generated:surface:end'],
  light: ['// @mptk-generated:light:start', '// @mptk-generated:light:end'],
  dark: ['// @mptk-generated:dark:start', '// @mptk-generated:dark:end'],
}

/** 允许覆盖的路径：每个顶层组都可整体给子键，runtime.core 也允许逐项。 */
export const MERGEABLE_GROUPS = [
  'primitives', 'base', 'surface', 'light', 'dark', 'component', 'structure', 'runtime', 'window',
]

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** 深合并，只认默认表里已有的键；未知键是拼写错误，当场拦下而不是静默忽略。 */
export function mergeConfig(defaults, overrides) {
  const errors = []
  const walk = (base, patch, trail) => {
    if (!isPlainObject(patch)) {
      errors.push(`${trail} 必须是对象`)
      return base
    }
    const out = { ...base }
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'schemaVersion') continue
      if (!(key in base)) {
        errors.push(`${trail}.${key} 不是可配项；请检查拼写，或先在库默认表里加这个键`)
        continue
      }
      const current = base[key]
      if (isPlainObject(current) && isPlainObject(value)) {
        out[key] = walk(current, value, `${trail}.${key}`)
      } else if (typeof current === typeof value || current === null) {
        out[key] = value
      } else {
        errors.push(`${trail}.${key} 类型不符：默认 ${typeof current}，给了 ${typeof value}`)
      }
    }
    return out
  }
  const merged = walk(defaults, overrides, 'kit.config')
  if (errors.length > 0) throw new Error(`配置校验失败：\n  - ${errors.join('\n  - ')}`)
  return { ...merged, schemaVersion: defaults.schemaVersion }
}

/**
 * 解析配置层别名：'@blue' 取当前明暗色板，'@light:gray-2' 取指定色板。
 * CSS 的 var(--mptk-*) 是运行时别名，原样保留（宿主改基础档时语义键要跟着走）。
 */
export function resolveAlias(value, config, mode = 'light', seen = new Set()) {
  if (typeof value !== 'string') return value
  const hit = /^@(light|dark)?:?([\w-]+)$/.exec(value)
  if (!hit) return value
  const palette = config.primitives[hit[1] ?? mode]
  if (!palette || !(hit[2] in palette)) {
    throw new Error(`别名 ${value} 指向不存在的色板项`)
  }
  if (seen.has(value)) throw new Error(`别名链成环：${[...seen, value].join(' → ')}`)
  const next = palette[hit[2]]
  if (typeof next === 'string' && next.startsWith('@')) {
    return resolveAlias(next, config, hit[1] ?? mode, new Set([...seen, value]))
  }
  return next
}

function pxOf(value) {
  const hit = /^(-?[\d.]+)px$/.exec(String(value).trim())
  return hit ? Number(hit[1]) : null
}

/** 生成前校验：结构、别名、单位、档位单调递增、运行时取值。 */
export function validateConfig(config) {
  const errors = []
  for (const group of MERGEABLE_GROUPS) {
    if (!isPlainObject(config[group])) errors.push(`缺分组 ${group}`)
  }
  if (config.schemaVersion !== 1) errors.push(`schemaVersion 只支持 1，收到 ${config.schemaVersion}`)

  const keys = (group) => Object.keys(config[group] ?? {}).sort()
  const lightKeys = keys('light')
  const darkKeys = keys('dark')
  if (lightKeys.length === 0) errors.push('light 不能为空')
  if (lightKeys.join(',') !== darkKeys.join(',')) {
    const onlyLight = lightKeys.filter((key) => !darkKeys.includes(key))
    const onlyDark = darkKeys.filter((key) => !lightKeys.includes(key))
    errors.push(`明暗键不同名同数：light 独有 [${onlyLight}]，dark 独有 [${onlyDark}]`)
  }

  for (const [group, mode] of [['light', 'light'], ['dark', 'dark'], ['base', 'light'], ['component', 'light'], ['structure', 'light']]) {
    for (const [key, value] of Object.entries(config[group] ?? {})) {
      try {
        resolveAlias(value, config, mode)
      } catch (error) {
        errors.push(`${group}.${key} ${error.message}`)
      }
      if (typeof value !== 'string') errors.push(`${group}.${key} 必须是字符串值`)
    }
  }
  for (const mode of ['light', 'dark']) {
    for (const [key, value] of Object.entries(config.window?.[mode] ?? {})) {
      try {
        resolveAlias(value, config, mode)
      } catch (error) {
        errors.push(`window.${mode}.${key} ${error.message}`)
      }
    }
  }

  // 档位严格递增：只对明确以 px 表达的档位组做，避免把 s/ms/无单位/函数值一刀切。
  const tiers = [
    ['radius', ['--mptk-radius-xs', '--mptk-radius-sm', '--mptk-radius-md', '--mptk-radius-lg', '--mptk-radius-xl']],
    ['space', ['--mptk-space-0', '--mptk-space-1', '--mptk-space-2', '--mptk-space-3', '--mptk-space-4']],
    ['control-h', ['--mptk-control-h-sm', '--mptk-control-h-md', '--mptk-control-h-lg']],
  ]
  for (const [name, list] of tiers) {
    const values = list.map((key) => pxOf(config.base?.[key]))
    if (values.some((value) => value === null)) {
      errors.push(`${name} 档位必须是 px 字面量`)
      continue
    }
    for (let i = 1; i < values.length; i += 1) {
      if (values[i] <= values[i - 1]) {
        errors.push(`${name} 档位未严格递增：${list[i - 1]}=${values[i - 1]}px → ${list[i]}=${values[i]}px`)
      }
    }
  }
  if (!(Number(config.runtime?.toastDuration) > 0)) errors.push('runtime.toastDuration 必须 > 0')
  if (!(Number(config.runtime?.notifyLimit) > 0)) errors.push('runtime.notifyLimit 必须 > 0')
  if (!(Number(config.runtime?.core?.timeout) > 0)) errors.push('runtime.core.timeout 必须 > 0')
  if (!['sm', 'md', 'lg'].includes(config.runtime?.controlSizeDefault)) {
    errors.push('runtime.controlSizeDefault 必须是 sm/md/lg')
  }
  if (errors.length > 0) throw new Error(`配置校验失败：\n  - ${errors.join('\n  - ')}`)
  return config
}

function declarationLines(group, config, mode) {
  return Object.entries(group).map(([key, raw]) => {
    const value = resolveAlias(raw, config, mode)
    return `  ${key}: ${value};`
  })
}

/** 只替换 _tokens.scss 里四个 mixin 的声明体；出口文件一行不动。 */
export function renderTokensScss(config, template) {
  let out = template
  const bodies = {
    base: [
      ...declarationLines(config.base, config, 'light'),
      ...declarationLines(config.component, config, 'light'),
      ...declarationLines(config.structure, config, 'light'),
    ],
    surface: declarationLines(config.surface, config, 'light'),
    light: declarationLines(config.light, config, 'light'),
    dark: declarationLines(config.dark, config, 'dark'),
  }
  for (const [name, lines] of Object.entries(bodies)) {
    const [start, end] = SENTINEL[name]
    const begin = out.indexOf(start)
    const finish = out.indexOf(end)
    if (begin < 0 || finish < 0 || finish < begin) {
      throw new Error(`_tokens.scss 缺哨兵 ${name}；生成器不猜括号边界`)
    }
    out = `${out.slice(0, begin + start.length)}\n${lines.join('\n')}\n${out.slice(finish)}`
  }
  return out
}

/**
 * 关键帧百分比是 CSS 选择器的一部分，语法上不能写 var()。
 * 从 structure 组生成 Sass 变量，组件在 @keyframes 里 #{} 插值，值仍只来自配置。
 */
export function renderKeyframesScss(config) {
  const keys = Object.keys(config.structure).filter((key) => key.startsWith('--mptk-s-kf-'))
  if (keys.length === 0) throw new Error('structure 组缺关键帧百分比配置')
  const lines = keys.map((key) => {
    const name = key.replace('--mptk-s-', '')
    return `$mptk-${name}: ${resolveAlias(config.structure[key], config, 'light')};`
  })
  return [
    '// 请勿手改：由 scripts/gen-kit-config.mjs --lib 从 kit.config.mjs 生成。',
    '// 关键帧百分比是 CSS 选择器，不能写 var()；这里生成 Sass 变量供组件 #{} 插值。',
    ...lines,
    '',
  ].join('\n')
}

function tsLiteral(value, indent = '  ') {
  if (Array.isArray(value)) {
    const pad = `${indent}  `
    const lines = value.map((item) => `${pad}${tsLiteral(item, pad)},`)
    return `[\n${lines.join('\n')}\n${indent}]`
  }
  if (isPlainObject(value)) {
    const pad = `${indent}  `
    const lines = Object.entries(value).map(([key, item]) =>
      `${pad}${JSON.stringify(key)}: ${tsLiteral(item, pad)},`)
    return `{\n${lines.join('\n')}\n${indent}}`
  }
  return JSON.stringify(value)
}

/** design 层只读字面量，不 import runtime（保持五层依赖方向）。 */
export function renderDesignGenerated(config) {
  return GENERATED_HEADER('design 层默认常量') +
    `\nexport const CONTROL_SIZE_DEFAULT: 'sm' | 'md' | 'lg' = ${JSON.stringify(config.runtime.controlSizeDefault)}\n` +
    `\nexport const KIT_RUNTIME_DEFAULTS = ${tsLiteral({
      toastDuration: config.runtime.toastDuration,
      notifyLimit: config.runtime.notifyLimit,
    })}\n`
}

/** runtime 层的完整默认表：供配置槽、core 默认值、命令式 API 读取。 */
export function renderRuntimeGenerated(config) {
  const runtime = config.runtime
  return GENERATED_HEADER('runtime 层默认表') +
    `\nexport interface KitConfigDefaults {\n` +
    `  schemaVersion: number\n` +
    `  runtime: {\n` +
    `    toastDuration: number\n` +
    `    notifyLimit: number\n` +
    `    controlSizeDefault: 'sm' | 'md' | 'lg'\n` +
    `    core: {\n` +
    `      baseURL: string\n` +
    `      timeout: number\n` +
    `      storagePrefix: string\n` +
    `      debug: boolean\n` +
    `      headers: Record<string, string>\n` +
    `    }\n` +
    `  }\n` +
    `  window: { light: Record<string, string>; dark: Record<string, string> }\n` +
    `}\n` +
    `\nexport const DEFAULT_KIT_CONFIG: KitConfigDefaults = ${tsLiteral({
      schemaVersion: config.schemaVersion,
      runtime,
      window: {
        light: Object.fromEntries(Object.entries(config.window.light)
          .map(([key, value]) => [key, resolveAlias(value, config, 'light')])),
        dark: Object.fromEntries(Object.entries(config.window.dark)
          .map(([key, value]) => [key, resolveAlias(value, config, 'dark')])),
      },
    })}\n`
}

/** 中文名映射：配置页显示用；没列出的键回退到英文键名。 */
const LABELS = {
  '--mptk-radius-xs': '圆角 XS', '--mptk-radius-sm': '圆角 SM', '--mptk-radius-md': '圆角 MD',
  '--mptk-radius-lg': '圆角 LG', '--mptk-radius-xl': '圆角 XL', '--mptk-radius-pill': '药丸圆角',
  '--mptk-radius-none': '无圆角', '--mptk-control-radius': '控件圆角',
  '--mptk-card-radius': '卡片圆角', '--mptk-card-spacing': '卡片分区间距',
  '--mptk-space-0': '间距 0', '--mptk-space-1': '间距 1', '--mptk-space-2': '间距 2',
  '--mptk-space-3': '间距 3', '--mptk-space-4': '间距 4',
  '--mptk-control-h-sm': '控件高度 SM', '--mptk-control-h-md': '控件高度 MD',
  '--mptk-control-h-lg': '控件高度 LG',
  '--mptk-font-xs': '字号 XS', '--mptk-font-sm': '字号 SM', '--mptk-font-md': '字号 MD',
  '--mptk-font-lg': '字号 LG', '--mptk-font-xl': '字号 XL', '--mptk-font-nav': '导航字号',
  '--mptk-line-xs': '行高 XS', '--mptk-line-sm': '行高 SM', '--mptk-line-md': '行高 MD',
  '--mptk-line-lg': '行高 LG', '--mptk-line-xl': '行高 XL', '--mptk-line-nav': '导航行高',
  '--mptk-fg': '主要文字', '--mptk-fg-2': '次要文字', '--mptk-fg-3': '弱化文字', '--mptk-fg-4': '禁用文字',
  '--mptk-surface-1': '卡片面', '--mptk-surface-2': '次级面', '--mptk-surface-3': '下沉面',
  '--mptk-surface-base': '页面底色', '--mptk-border': '边框', '--mptk-border-faint': '浅边框',
  '--mptk-border-strong': '重边框', '--mptk-cell-divider': '组内分隔线',
  '--mptk-card-bg': '卡片底色', '--mptk-card-border': '卡片描边',
  '--mptk-business': '业务色', '--mptk-success': '成功色', '--mptk-warning': '警告色',
  '--mptk-danger': '错误色', '--mptk-spinner-active': '等待主色',
  '--mptk-opacity-busy': '等待态透明度', '--mptk-dur': '标准动效时长',
  '--mptk-dur-fast': '快速动效时长', '--mptk-dur-run': '运行动效时长',
  '--mptk-dur-breathe': '呼吸动效周期', '--mptk-ease': '缓动曲线',
}
const GROUP_LABELS = {
  base: '基础尺寸', light: '明色', dark: '暗色', component: '组件视觉值',
  structure: '结构常量', runtime: '运行时默认', window: '窗口主题',
}

function unitOf(value) {
  if (/^-?[\d.]+px$/.test(value)) return 'px'
  if (/^-?[\d.]+(s|ms)$/.test(value)) return 'ms'
  if (/^-?[\d.]+$/.test(value)) return ''
  if (/^#|^rgba?\(/.test(value)) return 'color'
  return ''
}

const TIER_LABELS = { '': '本色', '-hover': '悬停', '-active': '按下', '-soft': '浅底' }

/**
 * 演示站色板的展示清单：色相取 primitive 里的基色名，档位取每支色相都齐的后缀，
 * 灰阶取 light 组的 gray-N。清单只由配置派生，页面与 Sass 都不再各写一份。
 */
export function swatchGroups(config) {
  const baseHues = Object.keys(config.primitives.light)
    .filter((name) => /^[a-z]+$/.test(name) && name !== 'white')
  const hues = baseHues.filter((hue) => `--mptk-${hue}` in config.light)
  const tiers = ['', '-hover', '-active', '-soft']
    .filter((suffix) => hues.length > 0 && hues.every((hue) => `--mptk-${hue}${suffix}` in config.light))
  const grays = Object.keys(config.light)
    .map((key) => /^--mptk-gray-(\d+)$/.exec(key))
    .filter((hit) => hit !== null)
    .map((hit) => Number(hit[1]))
    .sort((a, b) => a - b)
  if (hues.length === 0 || tiers.length === 0 || grays.length === 0) {
    throw new Error('配置里找不到完整的色相 / 档位 / 灰阶，演示站色板无法生成')
  }
  return {
    hues,
    tiers: tiers.map((suffix) => ({ suffix, label: TIER_LABELS[suffix] ?? suffix })),
    grays,
  }
}

/** 色块类名与颜色 token 一一对应：light 组每个键都有一条 var() 规则，不复制色值。 */
export function renderHostSwatchesScss(config) {
  const names = Object.keys(config.light)
    .filter((key) => key.startsWith('--mptk-'))
    .map((key) => key.replace(/^--mptk-/, ''))
  return GENERATED_HEADER('演示站色板类名与颜色 token 的对应') +
    '\n// 类名与取值都从 kit.config.mjs 的 light 组派生；新增色相 / 档位 / 灰阶无需改样式或页面。\n' +
    '@mixin demo-swatches {\n' +
    names.map((name) =>
      `  .demo-swatch--${name} {\n    background-color: var(--mptk-${name});\n  }\n`).join('') +
    '}\n'
}

/** 配置页数据源：全量键 + 中文名 + 英文键 + 单位 + 当前生效值 + 分组。 */
export function renderHostGenerated(config) {
  const rows = []
  for (const group of ['base', 'light', 'dark', 'component', 'structure']) {
    const mode = group === 'dark' ? 'dark' : 'light'
    for (const [key, raw] of Object.entries(config[group])) {
      const value = resolveAlias(raw, config, mode)
      rows.push({
        key,
        label: LABELS[key] ?? key.replace(/^--mptk-/, ''),
        group,
        groupLabel: GROUP_LABELS[group],
        value,
        unit: unitOf(value),
        note: key.replace(/^--mptk-/, ''),
      })
    }
  }
  for (const [key, value] of Object.entries(config.runtime)) {
    if (isPlainObject(value)) {
      for (const [sub, item] of Object.entries(value)) {
        rows.push({ key: `runtime.${key}.${sub}`, label: `${GROUP_LABELS.runtime} · ${sub}`, group: 'runtime', groupLabel: GROUP_LABELS.runtime, value: isPlainObject(item) ? JSON.stringify(item) : String(item), unit: '', note: `${key}.${sub}` })
      }
    } else {
      rows.push({ key: `runtime.${key}`, label: `${GROUP_LABELS.runtime} · ${key}`, group: 'runtime', groupLabel: GROUP_LABELS.runtime, value: String(value), unit: /duration|timeout/i.test(key) ? 'ms' : '', note: key })
    }
  }
  for (const mode of ['light', 'dark']) {
    for (const [key, raw] of Object.entries(config.window[mode])) {
      rows.push({ key: `window.${mode}.${key}`, label: `窗口主题 · ${mode} · ${key}`, group: 'window', groupLabel: GROUP_LABELS.window, value: resolveAlias(raw, config, mode), unit: /Color/i.test(key) ? 'color' : '', note: `${mode}.${key}` })
    }
  }
  const swatches = swatchGroups(config)
  return GENERATED_HEADER('当前生效配置与可配项清单') +
    `\nexport interface KitConfigRow {\n  key: string\n  label: string\n  group: string\n  groupLabel: string\n  value: string\n  unit: string\n  note: string\n}\n` +
    `\nexport const KIT_CONFIG_ROWS: KitConfigRow[] = ${tsLiteral(rows)}\n` +
    `\nexport const KIT_CONFIG_BY_KEY: Record<string, KitConfigRow> = Object.fromEntries(KIT_CONFIG_ROWS.map((row) => [row.key, row]))\n` +
    `\nexport const KIT_SWATCH_HUES: string[] = ${tsLiteral(swatches.hues)}\n` +
    `\nexport const KIT_SWATCH_TIERS: { suffix: string; label: string }[] = ${tsLiteral(swatches.tiers)}\n` +
    `\nexport const KIT_SWATCH_GRAYS: number[] = ${tsLiteral(swatches.grays)}\n`
}

/** 宿主覆盖层：只写差异键；没有差异时给出可直接取消注释的全量清单。 */
export function renderHostThemeScss(config, overrides) {
  const declared = []
  for (const group of ['base', 'component', 'structure', 'light', 'dark']) {
    for (const [key, raw] of Object.entries(overrides[group] ?? {})) {
      declared.push({ key, value: resolveAlias(raw, config, group === 'dark' ? 'dark' : 'light'), mode: group === 'dark' ? 'dark' : 'light' })
    }
  }
  const lightLines = declared.filter((item) => item.mode === 'light').map((item) => `  ${item.key}: ${item.value};`)
  const darkLines = declared.filter((item) => item.mode === 'dark').map((item) => `  ${item.key}: ${item.value};`)
  const template = [
    '// 这里展示的是「可覆盖项清单」：取消注释即生效，值仍由生成器写入，不在样式里手写。',
    '// 可配项示例（完整清单见 src/kit-config.generated.ts）：',
    '//   --mptk-surface-base / --mptk-radius-md / --mptk-business / --mptk-font-md',
    '//   --mptk-c-mask-opacity / --mptk-c-spinner-rotate-dur / --mptk-s-full',
    '// 只写要改的键到项目根 kit.config.mjs，值由生成器写回这里。',
  ]
  return GENERATED_HEADER('站点主题覆盖层') +
    `\npage {\n${template.map((line) => `  ${line}`).join('\n')}\n${lightLines.map((line) => `  ${line.trim()}`).join('\n')}${lightLines.length ? '\n' : ''}}\n` +
    `\n.mptk-dark {\n  // 暗色差异落这里；明色未覆盖的键继续吃库默认。\n${darkLines.map((line) => `  ${line.trim()}`).join('\n')}${darkLines.length ? '\n' : ''}}\n` +
    `\n.mptk-light {\n  // 局部反色覆盖位；通常无需改动。\n}\n`
}

export function renderThemeJson(config) {
  const pick = (mode) => Object.fromEntries(
    Object.entries(config.window[mode]).map(([key, raw]) => [key, resolveAlias(raw, config, mode)]),
  )
  return `${JSON.stringify({ light: pick('light'), dark: pick('dark') }, null, 2)}\n`
}

/**
 * 纯函数：给默认表与差异，算出全部产物文本。
 * mode='lib' 只产库侧；mode='host' 只产宿主侧；两者都不读对方的配置。
 * outDir 是宿主生成物相对项目根的目录：本仓库 demo 传 'demo/src'，
 * 真实消费方（Taro 插件）传 'src'，生成器不假设宿主目录结构。
 */
export function generate(defaults, overrides, { mode, tokensTemplate, outDir = 'demo/src' }) {
  const config = validateConfig(mergeConfig(defaults, overrides))
  const files = {}
  if (mode === 'lib') {
    files['src/design/_tokens.scss'] = renderTokensScss(config, tokensTemplate)
    files['src/design/_keyframes.scss'] = renderKeyframesScss(config)
    files['src/design/kit-config.generated.ts'] = renderDesignGenerated(config)
    files['src/runtime/kit-config.generated.ts'] = renderRuntimeGenerated(config)
  } else if (mode === 'host') {
    const prefix = outDir.replace(/^\/+|\/+$/g, '')
    files[`${prefix}/app-theme.scss`] = renderHostThemeScss(config, overrides)
    files[`${prefix}/theme.json`] = renderThemeJson(config)
    files[`${prefix}/kit-config.generated.ts`] = renderHostGenerated(config)
    files[`${prefix}/kit-swatches.generated.scss`] = renderHostSwatchesScss(config)
  } else {
    throw new Error(`未知生成模式 ${mode}`)
  }
  return { files, config }
}

/** 独立读盘：库默认表与宿主差异文件都通过原生 ESM 动态 import，无需转译、无新依赖。 */
export async function loadConfigFile(file) {
  const url = pathToFileURL(path.resolve(file)).href
  const mod = await import(`${url}?v=${Date.now()}`)
  if (!mod.default || !isPlainObject(mod.default)) {
    throw new Error(`${file} 必须 export default 一个对象`)
  }
  return mod.default
}

/**
 * 读 _tokens.scss 当模板：它自己也是生成物，必须先剥掉上一次的输入指纹行，
 * 否则每生成一次就多一行，--check 永远漂移。
 */
export function readTokensTemplate(root) {
  return readFileSync(path.join(root, 'src/design/_tokens.scss'), 'utf8')
    .replace(/^\/\/ @mptk-inputs:[0-9a-f]+\r?\n/m, '')
}
