import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')
const distDir = path.join(root, 'dist')

async function walk(dir) {
  const found = []
  if (!existsSync(dir)) return found
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await walk(full)))
    else found.push(full)
  }
  return found
}

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

const files = await walk(srcDir)
const styles = files.filter((file) => file.endsWith('.css'))
const uncompiled = files.filter((file) => /\.(ts|tsx|scss)$/.test(file))

let emitted = 0
for (const file of styles) {
  const target = path.join(distDir, path.relative(srcDir, file))
  await mkdir(path.dirname(target), { recursive: true })
  await cp(file, target)
  emitted += 1
}

const tokens = path.join(srcDir, 'design', 'tokens.css')
if (existsSync(tokens)) {
  const target = path.join(distDir, 'styles', 'tokens.css')
  await mkdir(path.dirname(target), { recursive: true })
  await cp(tokens, target)
  emitted += 1
}

if (uncompiled.length > 0) {
  console.warn(`[warn] ${uncompiled.length} 个 .ts/.tsx/.scss 源文件尚未接入编译器，不会进入 dist/`)
}
console.log(`[build] dist/ 产物 ${emitted} 个${emitted > 0 ? '' : '（骨架阶段，源码未落）'}`)
