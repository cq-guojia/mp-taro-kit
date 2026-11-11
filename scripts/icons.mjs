// 按「图标包」从 iconfont 在线链接生成 src/ui/icon/<id>/ 下三个产物：
//   style/index.scss  字体声明与全部图标类，原样取自平台产物（只把 // 补成 https）
//   names.ts          基础类、前缀与图标名清单
//   index.ts          该包自己的 iconClass；不跨包 import，避免打包器把别的包清单拉进来
// 一个包一条 SOURCE：base 是基础包（必引），扩展包按需加项后跑 pnpm run icons。
// 类名、字形编码、字体地址一律不做二次推导，避免与平台漂移。
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCES = [
  { id: 'base', source: 'https://at.alicdn.com/t/c/font_5251349_mscz5eq640k.css' },
]

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 平台产物给基础类写死 font-size: 16px，会盖住宿主设置的图标尺寸。
// 图标是字体，应继承所在文字的字号；需要放大时由宿主/组件用 --mptk-font-* 档位显式决定。
function stripBaseFontSize(css) {
  return css.replace(/(\.[\w-]+\s*\{)([^}]*)(\})/g, (rule, open, declarations, close) => {
    if (!declarations.includes('font-family')) return rule
    return open + declarations.replace(/\s*font-size:\s*[^;]+;/g, '') + close
  })
}

async function buildPack({ id, source }) {
  const response = await fetch(source)
  if (!response.ok) {
    throw new Error(`[icons] ${id} 拉取失败：${response.status} ${source}`)
  }

  const text = await response.text()
  if (!text.includes('@font-face')) {
    throw new Error(`[icons] ${id} 返回内容里没有 @font-face，链接可能已失效：${source}`)
  }

  const body = stripBaseFontSize(
    text.replace(/url\('\/\//g, "url('https://").replace(/url\("\/\//g, 'url("https://'),
  )
  if (/\.[\w-]+\s*\{[^}]*font-family[^}]*font-size/.test(body)) {
    throw new Error(`[icons] ${id} 基础类仍带 font-size，拒绝写出：它会覆盖宿主的图标字号`)
  }

  const header = [
    '/* 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `   包：${id}`,
    `   源：${source}`,
    '   尺寸：基础类不设 font-size，图标继承所在文字字号，放大由宿主的 --mptk-font-* 档位决定。',
    '   更新：平台改图标 → 改 scripts/icons.mjs 的 SOURCES → pnpm run icons */',
    '',
    '',
  ].join('\n')

  const dir = path.join(root, 'src', 'ui', 'icon', id)
  const styleTarget = path.join(dir, 'style', 'index.scss')
  mkdirSync(path.dirname(styleTarget), { recursive: true })
  writeFileSync(styleTarget, header + body)

  // 基础类 = 带 font-family 的那条规则；图标类 = 每个 :before 规则。
  const baseMatch = text.match(/\.([\w-]+)\s*\{[^}]*font-family/)
  if (baseMatch === null) {
    throw new Error(`[icons] ${id} 找不到带 font-family 的基础类，平台产物结构可能变了`)
  }
  const classNames = [...text.matchAll(/\.([\w-]+):before/g)].map((match) => match[1])
  if (classNames.length === 0) {
    throw new Error(`[icons] ${id} 一个图标类都没解析到，平台产物结构可能变了`)
  }

  // 前缀取「所有类名的公共前缀且以短横结尾」，据此把类名还原成图标名。
  let prefix = classNames[0]
  for (const name of classNames) {
    while (!name.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  prefix = prefix.slice(0, prefix.lastIndexOf('-') + 1)
  const iconNames = classNames.map((name) => name.slice(prefix.length))

  const namesHeader = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `// 包：${id}`,
    `// 源：${source}`,
    '',
  ].join('\n')
  const mapLines = iconNames.map(
    (name) => `  ${JSON.stringify(name)}: '${baseMatch[1]} ${prefix}${name}',`,
  )
  const namesBody = [
    `export const iconBaseClass = '${baseMatch[1]}'`,
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
    '/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。 */',
    `export const iconNames: readonly string[] = [${iconNames
      .map((name) => `'${name}'`)
      .join(', ')}]`,
    '',
  ].join('\n')
  writeFileSync(path.join(dir, 'names.ts'), namesHeader + namesBody)

  // 拆开写是为了让生成物保留模板字面量，同时生成器自身不出现裸 `${` 字面量。
  const classLine = [
    '  return iconMap[name] ?? `',
    '$', '{iconBaseClass} ',
    '$', '{iconPrefix}',
    '$', '{name}`',
  ].join('')
  const indexBody = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `// 包：${id}；需要别的包的图标时引那个包自己的出口，不要跨包 import。`,
    "import { iconBaseClass, iconMap, iconPrefix } from './names.js'",
    '',
    "export { iconBaseClass, iconPrefix, iconMap, iconNames } from './names.js'",
    '',
    '/** 取本包图标对应的 className。图标名不做字面量联合，平台增删图标不算类型破坏。 */',
    'export function iconClass(name: string): string {',
    classLine,
    '}',
    '',
  ].join('\n')
  writeFileSync(path.join(dir, 'index.ts'), indexBody)

  console.log(`[icons] ${id} 已生成 ${path.relative(root, styleTarget)}（${classNames.length} 个图标）`)
}

for (const pack of SOURCES) {
  try {
    await buildPack(pack)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
