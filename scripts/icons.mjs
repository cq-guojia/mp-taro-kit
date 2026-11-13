// 按「图标库注册表」从 iconfont 在线链接生成包目录：
//   style/index.scss  字体声明与全部图标类（含 -dark 变体类），原样取自平台产物（只把 // 补成 https）
//   names.ts          基础类、前缀、图标名清单、彩色标记、变体清单
//   index.ts          该包自己的 iconClass；仅 public 包生成，不跨包 import
// 一条注册表记录 = 一个平台项目 = 一种字体；id 的点号直接映射目录层级与 exports 路径。
// 变体不另出文件：`logo` 与 `logo-dark` 是同一个文件里的两个类，用哪个由调用处按位置决定。
// 类名、字形编码、字体地址一律不做二次推导，避免与平台漂移。
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './icons.sources.mjs'
import { pathOf, validateParsed, validateRegistry } from './lib/icons-pack.mjs'
import { parseIcons } from './lib/icons-parse.mjs'

validateRegistry(SOURCES)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 生成过程中解析出的基础类与前缀，聚合入口直接复用，不再读一遍 CSS。
const resolved = new Map()

// 平台产物给基础类写死 font-size: 16px，会盖住宿主设置的图标尺寸。
// 图标是字体，应继承所在文字的字号；需要放大时由宿主/组件用 --mptk-font-* 档位显式决定。
function stripBaseFontSize(css) {
  return css.replace(/(\.[\w-]+\s*\{)([^}]*)(\})/g, (rule, open, declarations, close) => {
    if (!declarations.includes('font-family')) return rule
    return open + declarations.replace(/\s*font-size:\s*[^;]+;/g, '') + close
  })
}

function headerOf(pack, colored, paired) {
  return [
    '/* 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `   包：${pack.id}`,
    `   源：${pack.source}`,
    `   归属：${pack.visibility === 'demo' ? '演示站自有，不对外发布' : '对外图标包'}`,
    `   颜色：${colored ? '彩色字形（COLR/CPAL），color 无效，明暗不跟随' : '单色字形，吃 color，明暗跟随主题'}`,
    ...(paired.length > 0
      ? [`   变体：${paired.join(' ')} 另有 -dark 字形，选哪个类名由调用处按位置决定，本文件不做覆盖`]
      : []),
    '   尺寸：基础类不设 font-size，图标继承所在文字字号，放大由宿主的 --mptk-font-* 档位决定。',
    '   更新：平台改图标 → 改 scripts/icons.sources.mjs 的 SOURCES → pnpm run icons */',
    '',
    '',
  ].join('\n')
}

async function buildPack(pack) {
  const response = await fetch(pack.source)
  if (!response.ok) {
    throw new Error(`[icons] ${pack.id} 拉取失败：${response.status} ${pack.source}`)
  }

  const text = await response.text()
  if (!text.includes('@font-face')) {
    throw new Error(`[icons] ${pack.id} 返回内容里没有 @font-face，链接可能已失效：${pack.source}`)
  }

  const parsed = parseIcons(text)
  validateParsed(pack, parsed)
  const { baseClass, prefix, icons, variants, paired, colored } = parsed

  const body = stripBaseFontSize(
    text.replace(/url\('\/\//g, "url('https://").replace(/url\("\/\//g, 'url("https://'),
  )
  if (/\.[\w-]+\s*\{[^}]*font-family[^}]*font-size/.test(body)) {
    throw new Error(`[icons] ${pack.id} 基础类仍带 font-size，拒绝写出：它会覆盖宿主的图标字号`)
  }

  const dir = path.join(root, pathOf(pack))
  const styleDir = path.join(dir, 'style')
  const styleTarget = path.join(styleDir, 'index.scss')
  mkdirSync(styleDir, { recursive: true })
  writeFileSync(styleTarget, headerOf(pack, colored, paired) + body)

  const iconNames = icons.map((icon) => icon.name)
  const namesHeader = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `// 包：${pack.id}`,
    `// 源：${pack.source}`,
    '',
  ].join('\n')
  // 变体也进 map：iconClass('<name>-dark') 必须拿到确定的类名，不依赖 fallback 拼串。
  const mapLines = [...icons, ...variants].map(
    (icon) => `  ${JSON.stringify(icon.name)}: '${baseClass} ${prefix}${icon.name}',`,
  )
  const namesBody = [
    `export const iconBaseClass = '${baseClass}'`,
    `export const iconPrefix = '${prefix}'`,
    '',
    '/**',
    ' * 当前图标名 → className。',
    ' * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。',
    ' */',
    'export const iconMap: Readonly<Record<string, string>> = {',
    ...mapLines,
    '}',
    '',
    '/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。变体（-dark）不在其中。 */',
    `export const iconNames: readonly string[] = [${iconNames.map((name) => `'${name}'`).join(', ')}]`,
    '',
    '/**',
    ' * 本包字形是否带颜色（COLR/CPAL）：true 时 color 与明暗主题都改不动它。',
    ' * 由平台项目类型决定、整包一致，调用方据此决定要不要费劲上色，不要逐图标猜。',
    ' */',
    `export const iconColored = ${colored}`,
    '',
    '/** 有暗色版的主轴图标名；用 iconClass(`<名>-dark`) 取对应类名，选哪个由调用处决定。 */',
    `export const iconPaired: readonly string[] = [${paired.map((name) => `'${name}'`).join(', ')}]`,
    '',
  ].join('\n')
  writeFileSync(path.join(dir, 'names.ts'), namesHeader + namesBody)
  resolved.set(pack.id, { baseClass, prefix })

  // demo 包只服务演示站：样式 + 类名清单，不生成 index.ts，也就不产生包出口。
  if (pack.visibility === 'demo') {
    console.log(`[icons] ${pack.id} 已生成 ${path.relative(root, dir)}（仅本站：样式 + 类名清单）`)
    return
  }

  // 拆开写是为了让生成物保留模板字面量，同时生成器自身不出现裸 `${` 字面量。
  const classLine = [
    '  return iconMap[name] ?? `',
    '$', '{iconBaseClass} ',
    '$', '{iconPrefix}',
    '$', '{name}`',
  ].join('')
  const indexBody = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `// 包：${pack.id}；需要别的包的图标时引那个包自己的出口，不要跨包 import。`,
    "import { iconBaseClass, iconMap, iconPrefix } from './names.js'",
    '',
    "export { iconBaseClass, iconPrefix, iconMap, iconNames, iconColored, iconPaired } from './names.js'",
    '',
    '/** 取本包图标对应的 className。图标名不做字面量联合，平台增删图标不算类型破坏。 */',
    'export function iconClass(name: string): string {',
    classLine,
    '}',
    '',
  ].join('\n')
  writeFileSync(path.join(dir, 'index.ts'), indexBody)

  const pairNote = paired.length > 0 ? `，${paired.length} 个有暗色字形` : ''
  console.log(`[icons] ${pack.id} 已生成 ${path.relative(root, dir)}（${iconNames.length} 个图标${pairNote}）`)
}

// 全量入口：所有对外库的类名样式与 `库名:图标名` 解析，消费端引这一个就够。
// 不聚合 demo 包 —— 演示站自有图标不对外。
function buildAggregate() {
  const publics = SOURCES.filter((pack) => pack.visibility === 'public')
  const dir = path.join(root, 'src/ui/icon/all')
  const styleDir = path.join(dir, 'style')
  mkdirSync(styleDir, { recursive: true })

  const styleBody = [
    '/* 本文件由 scripts/icons.mjs 生成，请勿手改。',
    '   全量图标样式：引这一条就把所有对外库的 @font-face 与类名带进包。',
    '   @font-face 只声明不下载，字体在元素真正用到时才由引擎加载。 */',
    // 每个 @use 给唯一命名空间：文件名都是 index，不给别名会报 namespace 冲突。
    ...publics.map(
      (pack, index) =>
        `@use '../../${pack.id.split('.').join('/')}/style/index' as pack${index};`,
    ),
    '',
  ].join('\n')
  writeFileSync(path.join(styleDir, 'index.scss'), styleBody)

  const imports = publics.map(
    (pack, index) =>
      `import { iconNames as names${index} } from '../${pack.id.split('.').join('/')}/names.js'`,
  )
  const packLines = publics.map((pack) => {
    const one = resolved.get(pack.id)
    if (one === undefined) {
      throw new Error(`[icons] ${pack.id} 没有解析结果，聚合入口生成中止`)
    }
    return `  ${JSON.stringify(pack.id)}: { baseClass: '${one.baseClass}', prefix: '${one.prefix}' },`
  })
  const nameLines = publics.map((pack, index) => `  ${JSON.stringify(pack.id)}: names${index},`)

  const indexBody = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    '// 全量图标入口：`库名:图标名` → className。新增图标库自动多一项。',
    ...imports,
    '',
    '/** 已注册的对外图标库：库名 → 基础类与前缀。 */',
    'export const iconPacks: Readonly<Record<string, { baseClass: string; prefix: string }>> = {',
    ...packLines,
    '}',
    '',
    '/** 各库当前图标名清单，供选择器与自检。 */',
    'export const iconNamesByPack: Readonly<Record<string, readonly string[]>> = {',
    ...nameLines,
    '}',
    '',
    'const warned = new Set<string>()',
    '',
    'function warnOnce(key: string, ...parts: string[]): void {',
    '  if (warned.has(key)) return',
    '  warned.add(key)',
    "  console.warn('[mp-taro-kit:icon]', ...parts)",
    '}',
    '',
    '/**',
    " * `库名:图标名` → className，如 `iconClass('common.base:home')`。",
    ' * 库名不可省；未注册或格式不对时返回空串并告警一次，不跨库回落。',
    ' */',
    'export function iconClass(packAndName: string): string {',
    "  const cut = packAndName.indexOf(':')",
    '  if (cut <= 0 || cut === packAndName.length - 1) {',
    "    warnOnce(packAndName, '图标名要写成 库名:图标名：', packAndName)",
    "    return ''",
    '  }',
    '  const id = packAndName.slice(0, cut)',
    '  const pack = iconPacks[id]',
    '  if (pack === undefined) {',
    "    warnOnce(packAndName, '未注册的图标库 ', id, '：', packAndName)",
    "    return ''",
    '  }',
    "  return [pack.baseClass, pack.prefix + packAndName.slice(cut + 1)].join(' ')",
    '}',
    '',
  ].join('\n')
  writeFileSync(path.join(dir, 'index.ts'), indexBody)

  console.log(`[icons] all 聚合入口已生成（${publics.length} 个对外库）`)
}

for (const pack of SOURCES) {
  try {
    await buildPack(pack)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

try {
  buildAggregate()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
