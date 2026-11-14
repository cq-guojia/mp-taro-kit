// 统一配置链回归：从配置真源走到最终生效行为，断言全部取自配置，不写死默认值。
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  generate, mergeConfig, validateConfig, resolveAlias, readTokensTemplate,
} from '../scripts/lib/kit-config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const read = (relative) => readFileSync(path.join(root, relative), 'utf8')
const exists = (relative) => existsSync(path.join(root, relative))
const stripStamp = (text) => text.replace(/^\/\/ @mptk-inputs:[0-9a-f]+\r?\n/m, '')

const defaults = (await import(pathToFileURL(path.join(root, 'kit.config.mjs')).href)).default
const overrides = (await import(pathToFileURL(path.join(root, 'demo/kit.config.mjs')).href)).default
const pkg = JSON.parse(read('package.json'))

const GROUPS = ['primitives', 'base', 'surface', 'light', 'dark', 'component', 'structure', 'runtime', 'window']

test('配置真源全量可配：九组齐备、明暗同名同数、键数有锚点', () => {
  assert.doesNotThrow(() => validateConfig(defaults))
  for (const group of GROUPS) assert.equal(typeof defaults[group], 'object', `缺分组 ${group}`)
  assert.equal(defaults.schemaVersion, 1)
  assert.deepEqual(Object.keys(defaults.light).sort(), Object.keys(defaults.dark).sort())
  assert.deepEqual(Object.keys(defaults.primitives.light).sort(), Object.keys(defaults.primitives.dark).sort())
  const total = ['base', 'light', 'dark', 'component', 'structure']
    .reduce((sum, group) => sum + Object.keys(defaults[group]).length, 0)
  assert.ok(total > 200, `可配项只有 ${total} 个，配置表被截断了`)
})

test('别名与合并：CSS 运行时别名原样保留，配置层别名解析到字面量，未知键当场拦下', () => {
  assert.equal(resolveAlias('@blue', defaults, 'light'), defaults.primitives.light.blue)
  assert.equal(resolveAlias('@blue', defaults, 'dark'), defaults.primitives.dark.blue)
  assert.equal(resolveAlias('@light:gray-2', defaults, 'dark'), defaults.primitives.light['gray-2'])
  assert.equal(resolveAlias('@dark:gray-1', defaults, 'light'), defaults.primitives.dark['gray-1'])
  assert.equal(resolveAlias('var(--mptk-radius-md)', defaults, 'light'), 'var(--mptk-radius-md)')
  assert.throws(() => resolveAlias('@not-exist', defaults, 'light'), /不存在的色板项/)

  const cyclic = structuredClone(defaults)
  cyclic.primitives.light.blue = '@blue'
  assert.throws(() => resolveAlias('@blue', cyclic, 'light'), /成环/)

  assert.throws(() => mergeConfig(defaults, { base: { '--mptk-not-exist': '1px' } }), /不是可配项/)
  assert.throws(() => mergeConfig(defaults, { runtime: { notifyLimit: '3' } }), /类型不符/)
  assert.equal(
    mergeConfig(defaults, { base: { '--mptk-radius-md': '13px' } }).base['--mptk-radius-md'],
    '13px',
  )
})

test('库模式产物与落盘一致，且绝不读宿主差异', () => {
  const { files, config } = generate(defaults, {}, {
    mode: 'lib', tokensTemplate: readTokensTemplate(root),
  })
  for (const [relative, content] of Object.entries(files)) {
    assert.ok(exists(relative), `缺生成物 ${relative}`)
    assert.equal(stripStamp(read(relative)), content, `${relative} 与配置不一致`)
  }
  assert.equal(config.component['--mptk-c-spinner-rotate-dur'], defaults.component['--mptk-c-spinner-rotate-dur'])
  assert.notEqual(config.component['--mptk-c-spinner-rotate-dur'], overrides.component['--mptk-c-spinner-rotate-dur'])
})

test('宿主模式产物与落盘一致：差异真的进覆盖层与配置表', () => {
  const { files } = generate(defaults, overrides, { mode: 'host', outDir: 'demo/src' })
  for (const [relative, content] of Object.entries(files)) {
    assert.ok(exists(relative), `缺生成物 ${relative}`)
    assert.equal(stripStamp(read(relative)), content, `${relative} 与配置不一致`)
  }
  const changed = Object.entries(overrides.component)[0]
  const applied = overrides.component[changed[0]]
  assert.ok(files['demo/src/app-theme.scss'].includes(`${changed[0]}: ${applied};`), '差异没进宿主覆盖层')
  assert.ok(files['demo/src/kit-config.generated.ts'].includes(`"value": "${applied}"`), '差异没进配置页数据')
  assert.equal(
    JSON.parse(files['demo/src/theme.json']).light.bgColor,
    defaults.primitives.light[defaults.window.light.bgColor.replace('@light:', '')],
  )
})

test('变异：改一个键只 diff 目标声明，生成器不能退化成恒等函数', () => {
  const target = '--mptk-radius-md'
  const variant = generate(mergeConfig(defaults, { base: { [target]: '13px' } }), {}, {
    mode: 'lib', tokensTemplate: readTokensTemplate(root),
  })
  const baseline = generate(defaults, {}, { mode: 'lib', tokensTemplate: readTokensTemplate(root) })
  const declarations = (text) => Object.fromEntries(
    [...text.matchAll(/^\s*([\w-]+):\s*([^;]+);/gm)].map((hit) => [hit[1], hit[2].trim()]),
  )
  const before = declarations(baseline.files['src/design/_tokens.scss'])
  const after = declarations(variant.files['src/design/_tokens.scss'])
  const diff = Object.keys(before).filter((key) => before[key] !== after[key])
  assert.deepEqual(diff, [target])
  assert.equal(after[target], '13px')
})

test('发布链：CLI / 纯函数 / 默认表与源码逐字一致，两个出口都能加载', () => {
  for (const [source, published] of [
    ['scripts/gen-kit-config.mjs', 'dist/config/cli.mjs'],
    ['scripts/lib/kit-config.mjs', 'dist/config/lib/kit-config.mjs'],
    ['kit.config.mjs', 'dist/config/defaults.mjs'],
  ]) {
    assert.ok(exists(published), `发布产物缺 ${published}`)
    assert.equal(read(published), read(source), `${published} 与源码漂移`)
  }
  assert.ok(pkg.files.includes('dist') && pkg.files.includes('plugin'))
  assert.equal(pkg.bin['mptk-gen-config'], './dist/config/cli.mjs')
  assert.ok(exists('plugin/index.js') && exists('plugin/package.json'), 'Taro 插件物理入口缺失')

  const plugin = require(path.join(root, 'plugin/index.js'))
  assert.equal(typeof plugin, 'function', 'Taro resolve.sync 找到的入口必须是可 require 的函数')
  assert.equal(plugin, require(path.join(root, 'dist/plugin/index.cjs')), '物理入口与 exports 入口必须是同一份实现')
  assert.equal(typeof require(path.join(root, 'dist/runtime/kit-config.cjs')).setKitConfig, 'function')
})

test('运行时契约：默认表、core 默认值与命令式 API 都读同一份配置', async () => {
  const config = await import(pathToFileURL(path.join(root, 'dist/runtime/kit-config.js')).href)
  assert.equal(config.getKitConfig().runtime.toastDuration, defaults.runtime.toastDuration)
  assert.equal(config.getKitConfig().runtime.notifyLimit, defaults.runtime.notifyLimit)
  assert.equal(config.getKitConfig().runtime.core.timeout, defaults.runtime.core.timeout)

  const changed = config.setKitConfig({ runtime: { toastDuration: 4321 } })
  assert.equal(changed.runtime.toastDuration, 4321)
  assert.equal(config.getKitConfig().runtime.notifyLimit, defaults.runtime.notifyLimit, '局部覆盖不能抹掉其余默认值')
  config.setKitConfig({ runtime: { toastDuration: defaults.runtime.toastDuration } })
})

test('最终生效行为：Toast 按配置的时长自动消失，hide / clear 不留悬空定时器', async (t) => {
  const ui = await import(pathToFileURL(path.join(root, 'dist/ui/index.js')).href)
  const duration = defaults.runtime.toastDuration
  // Node 的 mock timers 只接管 setTimeout；clearTimeout 走原生实现，对 mock 句柄是空操作，
  // 但库自己会同步删掉 toastTimers 里的句柄，所以不影响「不留悬空回调」的断言。
  t.mock.timers.enable({ apis: ['setTimeout'] })
  try {
    ui.resetUIForTests()
    ui.markOverlayHostMounted()

    const id = ui.showToast('配置时长')
    assert.equal(ui.uiState().notices.getSnapshot().length, 1)
    assert.equal(ui.uiState().toastTimers.has(id), true)
    t.mock.timers.tick(duration - 1)
    assert.equal(ui.uiState().notices.getSnapshot().length, 1, '没到配置时长不该消失')
    t.mock.timers.tick(1)
    assert.equal(ui.uiState().notices.getSnapshot().length, 0, '到点必须由库自己关掉')
    assert.equal(ui.uiState().toastTimers.size, 0, '定时器句柄要自己清掉')

    const sticky = ui.showToast('常驻', 'info', 0)
    t.mock.timers.tick(duration * 2)
    assert.equal(ui.uiState().notices.getSnapshot().length, 1, 'duration=0 表示常驻')
    assert.equal(ui.hideToast(sticky), true)
    assert.equal(ui.uiState().toastTimers.size, 0)
    ui.resetUIForTests()
  } finally {
    t.mock.timers.reset()
  }
})
