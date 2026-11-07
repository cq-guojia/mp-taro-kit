import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as ui from '../dist/ui/index.js'

const require = createRequire(import.meta.url)
const cjs = require('../dist/ui/index.cjs')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

/** 模拟 <OverlayHost /> 的关闭动作：出栈并调 payload.resolve。 */
function closeTop(confirmed) {
  const entries = ui.uiState().overlays.getSnapshot()
  const top = entries[entries.length - 1]
  if (top === undefined) return undefined
  const payload = ui.uiState().overlays.dismiss(top.id)
  if (payload === undefined) return undefined
  payload.resolve(confirmed)
  return payload
}

test('未挂载 <OverlayHost /> 时命令式 API 每次都抛错，不静默降级', () => {
  ui.resetUIForTests()
  assert.equal(ui.isOverlayHostMounted(), false)
  for (const call of [
    () => ui.showToast('x'),
    () => ui.showLoading(),
    () => ui.alert('x'),
    () => ui.confirm('x'),
  ]) {
    assert.throws(call, /OverlayHost|挂载/)
  }
  assert.throws(() => ui.showToast('y'), /OverlayHost|挂载/)
  assert.equal(ui.uiState().notices.getSnapshot().length, 0)
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)
})

test('挂载标记与跨副本状态：ESM / CJS 共享同一份单例', () => {
  ui.resetUIForTests()
  const esmNames = Object.keys(ui).sort()
  const cjsNames = Object.keys(cjs).sort()
  assert.deepEqual(cjsNames, esmNames)
  assert.ok(esmNames.length >= 10)
  cjs.markOverlayHostMounted()
  assert.equal(ui.isOverlayHostMounted(), true)
  cjs.showToast('from-cjs')
  assert.equal(ui.uiState().notices.getSnapshot()[0].text, 'from-cjs')
  cjs.markOverlayHostUnmounted()
  assert.equal(ui.isOverlayHostMounted(), false)
})

test('showToast / hideToast / clearToasts 与通知队列上限', () => {
  ui.resetUIForTests()
  ui.markOverlayHostMounted()
  const first = ui.showToast('a')
  ui.showToast('b', 'error')
  assert.equal(ui.uiState().notices.getSnapshot().length, 2)
  assert.equal(ui.uiState().notices.getSnapshot()[1].tone, 'error')
  assert.equal(ui.hideToast(first), true)
  assert.equal(ui.hideToast(first), false)
  assert.equal(ui.clearToasts().length, 1)
  for (let i = 0; i < 5; i += 1) ui.showToast(String(i))
  assert.equal(ui.uiState().notices.getSnapshot().length, 3)
})

test('showLoading / hideLoading 句柄配对，重复 hide 不误关别人的', () => {
  ui.resetUIForTests()
  ui.markOverlayHostMounted()
  const a = ui.showLoading()
  const b = ui.showLoading()
  assert.equal(ui.uiState().loading.getSnapshot().count, 2)
  assert.equal(ui.hideLoading(a), true)
  assert.equal(ui.hideLoading(a), false)
  assert.equal(ui.uiState().loading.getSnapshot().active, true)
  assert.equal(ui.hideLoading(b), true)
  assert.equal(ui.uiState().loading.getSnapshot().active, false)
})

test('confirm() 推栈并由关闭动作 resolve true / false', async () => {
  ui.resetUIForTests()
  ui.markOverlayHostMounted()
  const pending = ui.confirm('确定删除？', { title: '提示', cancelText: '再想想' })
  const entries = ui.uiState().overlays.getSnapshot()
  assert.equal(entries.length, 1)
  assert.equal(entries[0].payload.kind, 'confirm')
  assert.equal(entries[0].payload.cancelText, '再想想')
  closeTop(false)
  assert.equal(await pending, false)
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)

  const second = ui.confirm('再来一次')
  closeTop(true)
  assert.equal(await second, true)
})

test('alert() 解析即关，不携带选择', async () => {
  ui.resetUIForTests()
  ui.markOverlayHostMounted()
  const pending = ui.alert('已完成')
  const entries = ui.uiState().overlays.getSnapshot()
  assert.equal(entries[0].payload.kind, 'alert')
  assert.equal(entries[0].payload.confirmText, '确定')
  closeTop(true)
  assert.equal(await pending, undefined)
})

test('resetUIForTests 清空栈、通知、loading 与挂载标记', () => {
  ui.markOverlayHostMounted()
  ui.showToast('x')
  ui.showLoading()
  ui.confirm('y').catch(() => {})
  ui.resetUIForTests()
  assert.equal(ui.isOverlayHostMounted(), false)
  assert.equal(ui.uiState().notices.getSnapshot().length, 0)
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)
  assert.equal(ui.uiState().loading.getSnapshot().active, false)
})

test('六子域出口与样式实体齐全，产物只指向 peer 不打包平台包', () => {
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout']) {
    assert.equal(exists(`../dist/ui/${domain}/index.js`), true)
    assert.equal(exists(`../dist/ui/${domain}/style/index.css`), true)
  }
  const host = read('../dist/ui/infra/OverlayHost.js')
  assert.match(host, /from ["']react\/jsx-runtime["']/)
  assert.match(host, /@tarojs\/components/)
  const main = read('../dist/ui/index.js')
  assert.doesNotMatch(main, /react\/jsx-runtime|@tarojs\/components/)
})

test('B 方案：组件 .d.ts 返回宿主可解析的 JSX.Element，不再退化为 unknown', () => {
  const decl = read('../dist/ui/infra/OverlayHost.d.ts')
  assert.match(decl, /JSX\.Element/)
  assert.doesNotMatch(decl, /\): unknown/)
})

test('B 方案：宿主真类型环境下组件 .d.ts 可直接作为 JSX 组件使用', () => {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const probe = resolve(root, 'src/__probe.tsx')
  const source = `import { OverlayHost } from ${JSON.stringify(resolve(root, 'dist/ui/infra/OverlayHost'))};\nexport const element = <OverlayHost />;\n`
  const options = { ...parsed.options, noEmit: true }
  const host = ts.createCompilerHost(options)
  const original = host.getSourceFile.bind(host)
  host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
    file === probe
      ? ts.createSourceFile(file, source, languageVersion, true, ts.ScriptKind.TSX)
      : original(file, languageVersion, onError, shouldCreateNewSourceFile)
  host.fileExists = (file) => file === probe || ts.sys.fileExists(file)
  host.readFile = (file) => (file === probe ? source : ts.sys.readFile(file))
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([probe], options, host))
  assert.deepEqual(
    diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, ' ')),
    [],
  )
})

test('样式只写 var(--mptk-*)，不硬编码颜色值', () => {
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout']) {
    const css = read(`../dist/ui/${domain}/style/index.css`)
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/)
    assert.doesNotMatch(css, /--mp-/)
  }
})
