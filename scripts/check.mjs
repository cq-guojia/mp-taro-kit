import { existsSync, readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const release = process.argv.includes('--release')
const errors = []

const requiredExports = [
  '.', './design', './runtime', './utils', './core', './ui',
  './ui/*', './ui/*/style', './styles/tokens', './package.json',
]

if (!pkg.files?.includes('dist')) errors.push('files 未包含 dist')
if ('miniprogram' in pkg) errors.push('不应存在 miniprogram 字段')
if (!pkg.types?.startsWith('./dist/')) errors.push('types 未指向 dist/')

const exportsMap = pkg.exports ?? {}
for (const key of requiredExports) {
  if (!(key in exportsMap)) errors.push(`exports 缺少 ${key}`)
}
if ('./skyline' in exportsMap) errors.push('不应存在 ./skyline 出口')

const sideEffects = pkg.sideEffects
if (!Array.isArray(sideEffects) || !sideEffects.some((pattern) => pattern.includes('.css'))) {
  errors.push('sideEffects 必须是包含 CSS 的白名单数组')
}

for (const dep of ['@tarojs/taro', '@tarojs/components', 'react']) {
  if (!pkg.peerDependencies?.[dep]) errors.push(`peerDependencies 缺少 ${dep}`)
}

for (const [key, value] of Object.entries(exportsMap)) {
  if (key === './package.json') continue
  const targets = typeof value === 'string'
    ? [value]
    : [value.types, value.import, value.require].filter(Boolean)
  for (const target of targets) {
    if (!target.startsWith('./dist/')) errors.push(`exports ${key} 的目标 ${target} 不在 dist/ 下`)
  }
  const cssOnly = typeof value === 'string' && value.endsWith('.css')
  const hasTypes = typeof value === 'object' && Boolean(value.types)
  if (!cssOnly && !hasTypes) errors.push(`exports ${key} 缺少 types 条件`)
  if (typeof value === 'object' && (!value.import || !value.require)) {
    errors.push(`exports ${key} 缺少 import/require 条件`)
  }
}

// exports 用通配（`./ui/*`、`./ui/*/style`），坏路径在清单自洽性里看不出来：
// 解析能成功、文件却不存在，照样能发版。逐个对照 src/ui 下的出口单元，
// 保证每个 index.ts / style/index.scss 在 dist 里都有对应产物。
const srcUiDir = path.join(root, 'src', 'ui')
const distUiDir = path.join(root, 'dist', 'ui')
async function collectFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await collectFiles(full, out)
    else out.push(full)
  }
  return out
}
for (const file of await collectFiles(srcUiDir)) {
  const rel = path.relative(srcUiDir, file)
  if (rel === 'index.ts' || rel.endsWith(`${path.sep}index.ts`)) {
    const dir = path.dirname(path.join(distUiDir, rel))
    for (const name of ['index.js', 'index.cjs', 'index.d.ts']) {
      if (!existsSync(path.join(dir, name))) {
        errors.push(`通配出口 ${rel} 在 dist 里缺 ${name}`)
      }
    }
  }
  if (rel.endsWith(`style${path.sep}index.scss`)) {
    const target = path.join(distUiDir, rel.replace(/\.scss$/, '.css'))
    if (!existsSync(target)) errors.push(`通配样式出口 ${rel} 在 dist 里缺 index.css`)
  }
}

// 主题出口自动校验：扫 src/design/theme-*.scss，逐条核对 exports 与 dist 产物。
// 新增一个主题文件即自动纳入，漏配 export 或漏编译当场拦下，不维护模式清单。
const themeSources = (await collectFiles(path.join(root, 'src', 'design')))
  .filter((file) => path.basename(file).startsWith('theme-') && file.endsWith('.scss'))
for (const source of themeSources) {
  const name = path.basename(source).replace(/\.scss$/, '')
  const key = `./styles/${name}`
  if (!(key in exportsMap)) errors.push(`主题文件 ${path.basename(source)} 缺 exports ${key}`)
  if (!existsSync(path.join(root, 'dist', 'styles', `${name}.css`))) {
    errors.push(`主题出口 ${key} 在 dist/styles 里缺 ${name}.css`)
  }
}

const distDir = path.join(root, 'dist')
let artifacts = 0
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await collect(full)
    else if (/\.(js|cjs|d\.ts|css)$/.test(entry.name)) artifacts += 1
  }
}
if (existsSync(distDir)) await collect(distDir)

if (release) {
  if (artifacts === 0) errors.push('dist/ 没有构建产物，拒绝发布空包；请先落源码并接入 TS/SCSS 编译器')
  for (const required of ['index.js', 'index.cjs', 'index.d.ts']) {
    if (!existsSync(path.join(distDir, required))) {
      errors.push(`dist/ 缺少 ${required}，拒绝发布只有样式或半成品的包`)
    }
  }
}
if (errors.length > 0) {
  for (const error of errors) console.error(`[FAIL] ${error}`)
  process.exit(1)
}
if (artifacts === 0) {
  console.warn('[warn] dist/ 暂无产物（骨架阶段，源码未落）；pnpm run guard 会拒绝发版')
}
console.log(`[check] 包清单自洽性通过，dist 产物 ${artifacts} 个`)
