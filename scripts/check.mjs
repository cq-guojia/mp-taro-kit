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
