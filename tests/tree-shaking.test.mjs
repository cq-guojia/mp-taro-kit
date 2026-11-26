/**
 * 产物级按需引入自检：不是看源码里"理论上可摇"，而是把 dist 的对话框子入口真打包一次，
 * 逐字检查没有把 Toast / Loading / FloatingAction 等无关宿主与组件带进来。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(root, 'dist/ui/commands/dialog/index.js')

const esbuild = (() => {
  const pnpm = join(root, 'node_modules/.pnpm')
  if (!existsSync(pnpm)) return null
  const hit = readdirSync(pnpm).find((name) => name.startsWith('@esbuild+linux-x64@'))
  if (hit === undefined) return null
  const binary = join(pnpm, hit, 'node_modules/@esbuild/linux-x64/bin/esbuild')
  return existsSync(binary) ? binary : null
})()

function bundle(names, dir) {
  const source = join(dir, 'entry.mjs')
  const out = join(dir, `${names.join('-')}.js`)
  writeFileSync(source, `import { ${names.join(', ')} } from ${JSON.stringify(entry)}\nglobalThis.__mptk = { ${names.join(', ')} }\n`)
  execFileSync(esbuild, [
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--external:react',
    '--external:react/jsx-runtime',
    '--external:@tarojs/components',
    '--external:@tarojs/taro',
    source,
    `--outfile=${out}`,
  ], { stdio: 'pipe' })
  return readFileSync(out, 'utf8')
}

test('对话框子入口只带自己的宿主，不连带 Toast / Loading / FloatingAction', { skip: esbuild === null && '本机没有 esbuild 二进制' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'mptk-shake-'))
  try {
    const output = bundle(['confirm'], dir)
    assert.match(output, /\bconfirm\b/)
    for (const gone of ['ToastHost', 'LoadingHost', 'FloatingAction', 'showToast', 'showLoading', 'mptk-toast', 'mptk-fab']) {
      assert.doesNotMatch(output, new RegExp(`\\b${gone}\\b`), `只引 confirm 却带进了 ${gone}`)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('引 confirm + DialogHost 只带 ContentPopup，不带 Toast / Loading / FloatingAction', { skip: esbuild === null && '本机没有 esbuild 二进制' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'mptk-shake-'))
  try {
    const output = bundle(['confirm', 'DialogHost'], dir)
    for (const kept of ['DialogHost', 'ContentPopup', 'confirm']) {
      assert.match(output, new RegExp(`\\b${kept}\\b`), `对话框产物缺 ${kept}`)
    }
    for (const gone of ['ToastHost', 'LoadingHost', 'FloatingAction', 'showToast', 'showLoading', 'mptk-toast', 'mptk-fab']) {
      assert.doesNotMatch(output, new RegExp(`\\b${gone}\\b`), `对话框产物混进了 ${gone}`)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('闸门判定可单独打包：零平台依赖，不带 React / Taro / 任何控件', { skip: esbuild === null && '本机没有 esbuild 二进制' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'mptk-shake-'))
  try {
    const gateEntry = join(root, 'dist/ui/infra/popup-lock/decide.js')
    const source = join(dir, 'gate-entry.mjs')
    const out = join(dir, 'gate.js')
    writeFileSync(source, `import { decideGate } from ${JSON.stringify(gateEntry)}\nglobalThis.__gate = decideGate\n`)
    execFileSync(esbuild, [
      '--bundle', '--format=esm', '--platform=neutral',
      source, `--outfile=${out}`,
    ], { stdio: 'pipe' })
    const output = readFileSync(out, 'utf8')
    assert.match(output, /\bdecideGate\b/, '闸门判定没进产物')
    for (const gone of ['react', 'useContext', '@tarojs', 'mptk-btn', 'DialogHost']) {
      assert.doesNotMatch(output, new RegExp(`\\b${gone}\\b`), `纯判定产物混进了 ${gone}`)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
