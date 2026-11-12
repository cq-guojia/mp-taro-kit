// 按「图标包」从 iconfont 在线链接生成包目录：
//   style/index.scss  字体声明与全部图标类（含 -dark 变体类），原样取自平台产物（只把 // 补成 https）
//   names.ts          基础类、前缀、图标名清单、彩色标记、变体清单
//   index.ts          该包自己的 iconClass；不跨包 import，避免打包器把别的包清单拉进来
// 变体不另出文件：`logo` 与 `logo-dark` 是同一个文件里的两个类，用哪个由调用处按位置决定。
// 一个包一条 SOURCE：base 是基础包（必引），扩展包按需加项后跑 pnpm run icons。
// 类名、字形编码、字体地址一律不做二次推导，避免与平台漂移。
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseIcons } from './lib/icons-parse.mjs'

// 一个 iconfont 项目 = 一个包 = 一种字体。彩色/单色是项目级属性，不能混在一个项目里：
// 勾了「彩色」的项目里，连单色线稿也会被包成 COLR 字形，color 从此失效。
// 命名：单色不标后缀、多色加 -color；demo 自有图标生成到 demo/src/icons，不进组件库。
const SOURCES = [
  { id: 'base', source: 'https://at.alicdn.com/t/c/font_5251349_5n3d5h8pvsn.css' },
  { id: 'base-color', source: 'https://at.alicdn.com/t/c/font_5252363_pclbus5fo1.css' },
  {
    id: 'demo',
    source: 'https://at.alicdn.com/t/c/font_5252365_nutafgslh8.css',
    dest: 'demo/src/icons',
    styleOnly: true,
  },
  {
    id: 'demo-color',
    source: 'https://at.alicdn.com/t/c/font_5252364_9p54ba62mzm.css',
    dest: 'demo/src/icons',
    styleOnly: true,
  },
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

function headerOf(id, source, colored, paired) {
  return [
    '/* 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `   包：${id}`,
    `   源：${source}`,
    `   颜色：${colored ? '彩色字形（COLR/CPAL），color 无效，明暗不跟随' : '单色字形，吃 color，明暗跟随主题'}`,
    ...(paired.length > 0
      ? [`   变体：${paired.join(' ')} 另有 -dark 字形，选哪个类名由调用处按位置决定，本文件不做覆盖`]
      : []),
    '   尺寸：基础类不设 font-size，图标继承所在文字字号，放大由宿主的 --mptk-font-* 档位决定。',
    '   更新：平台改图标 → 改 scripts/icons.mjs 的 SOURCES → pnpm run icons */',
    '',
    '',
  ].join('\n')
}

async function buildPack({ id, source, dest = 'src/ui/icon', styleOnly = false }) {
  const response = await fetch(source)
  if (!response.ok) {
    throw new Error(`[icons] ${id} 拉取失败：${response.status} ${source}`)
  }

  const text = await response.text()
  if (!text.includes('@font-face')) {
    throw new Error(`[icons] ${id} 返回内容里没有 @font-face，链接可能已失效：${source}`)
  }

  const { baseClass, prefix, icons, variants, paired, colored } = parseIcons(text)

  const body = stripBaseFontSize(
    text.replace(/url\('\/\//g, "url('https://").replace(/url\("\/\//g, 'url("https://'),
  )
  if (/\.[\w-]+\s*\{[^}]*font-family[^}]*font-size/.test(body)) {
    throw new Error(`[icons] ${id} 基础类仍带 font-size，拒绝写出：它会覆盖宿主的图标字号`)
  }

  const dir = path.join(root, dest, id)
  const styleDir = path.join(dir, 'style')
  const styleTarget = path.join(styleDir, 'index.scss')
  mkdirSync(styleDir, { recursive: true })
  writeFileSync(styleTarget, headerOf(id, source, colored, paired) + body)

  // demo 自有图标只服务演示站，不承担对外契约，只要样式；类名在 demo 里直接写。
  if (styleOnly) {
    console.log(`[icons] ${id} 已生成 ${path.relative(root, styleTarget)}（仅样式）`)
    return
  }

  const iconNames = icons.map((icon) => icon.name)
  const namesHeader = [
    '// 本文件由 scripts/icons.mjs 生成，请勿手改。',
    `// 包：${id}`,
    `// 源：${source}`,
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
  console.log(`[icons] ${id} 已生成 ${path.relative(root, styleTarget)}（${iconNames.length} 个图标${pairNote}）`)
}

for (const pack of SOURCES) {
  try {
    await buildPack(pack)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
