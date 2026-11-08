// 从 iconfont 在线链接生成 src/ui/icon 下的两个产物：
//   style/index.scss  字体声明与全部图标类，原样取自平台产物（只把 // 补成 https）
//   names.ts          基础类、前缀与图标名清单，供演示站遍历与第三方查表
// 类名、字形编码、字体地址一律不做二次推导，避免与平台漂移。
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// iconfont 项目 5251349 的在线链接；平台上改了图标后这个地址的 hash 会变，需同步替换。
const SOURCE = 'https://at.alicdn.com/t/c/font_5251349_mscz5eq640k.css'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const styleTarget = path.join(root, 'src', 'ui', 'icon', 'style', 'index.scss')
const namesTarget = path.join(root, 'src', 'ui', 'icon', 'names.ts')

const response = await fetch(SOURCE)
if (!response.ok) {
  console.error(`[icons] 拉取失败：${response.status} ${SOURCE}`)
  process.exit(1)
}

const text = await response.text()
if (!text.includes('@font-face')) {
  console.error(`[icons] 返回内容里没有 @font-face，链接可能已失效：${SOURCE}`)
  process.exit(1)
}

const body = text.replace(/url\('\/\//g, "url('https://").replace(/url\("\/\//g, 'url("https://')
const header = [
  '/* 本文件由 scripts/icons.mjs 生成，请勿手改。',
  `   源：${SOURCE}`,
  '   更新：平台改图标 → 生成 → 复制新在线链接 → 改 scripts/icons.mjs 的 SOURCE → pnpm run icons */',
  '',
  '',
].join('\n')

mkdirSync(path.dirname(styleTarget), { recursive: true })
writeFileSync(styleTarget, header + body)

// 基础类 = 带 font-family 的那条规则；图标类 = 每个 :before 规则。
const baseMatch = text.match(/\.([\w-]+)\s*\{[^}]*font-family/)
if (baseMatch === null) {
  console.error('[icons] 找不到带 font-family 的基础类，平台产物结构可能变了')
  process.exit(1)
}
const classNames = [...text.matchAll(/\.([\w-]+):before/g)].map((match) => match[1])
if (classNames.length === 0) {
  console.error('[icons] 一个图标类都没解析到，平台产物结构可能变了')
  process.exit(1)
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
  `// 源：${SOURCE}`,
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
writeFileSync(namesTarget, namesHeader + namesBody)

console.log(`[icons] 已生成 ${path.relative(root, styleTarget)}（${classNames.length} 个图标）`)
console.log(`[icons] 已生成 ${path.relative(root, namesTarget)}（基础类 ${baseMatch[1]}，前缀 ${prefix}）`)
