import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { SOURCES } from '../scripts/icons.sources.mjs'
import { exportPathOf, pathOf } from '../scripts/lib/icons-pack.mjs'
import * as ui from '../dist/ui/index.js'
import * as cellState from '../dist/ui/display/cell/state.js'
import { resolveCssVars, catalogModuleStub } from './helpers/kit-config.mjs'

const require = createRequire(import.meta.url)
const cjs = require('../dist/ui/index.cjs')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

test('图标基础类不写死 font-size：全部对外包的生成物与发布产物都遵守', () => {
  for (const pack of SOURCES.filter((item) => item.visibility === 'public')) {
    for (const relative of [
      `../${pathOf(pack)}/style/index.scss`,
      `../dist/${exportPathOf(pack)}/style/index.css`,
    ]) {
      const css = read(relative)
      const rule = css.match(/\.[\w-]+\s*\{[^}]*font-family:[^}]*!important[^}]*\}/)
      assert.ok(rule, `${relative} 找不到图标基础类规则`)
      assert.doesNotMatch(rule[0], /font-size/, `${relative} 基础类不应写死 font-size`)
    }
  }
  assert.match(read('../scripts/icons.mjs'), /stripBaseFontSize/, '生成器必须剥离平台产物的基础类字号')
})

test('图标库按命名空间分包：public 三件套齐全，demo 不进发布产物，旧出口只转发', () => {
  for (const pack of SOURCES) {
    const dir = pathOf(pack)
    assert.ok(exists(`../${dir}/style/index.scss`), `${pack.id} 缺样式生成物`)
    assert.ok(exists(`../${dir}/names.ts`), `${pack.id} 缺类名清单`)
    if (pack.visibility === 'public') {
      assert.ok(exists(`../${dir}/index.ts`), `${pack.id} 缺包出口`)
      assert.ok(exists(`../dist/${exportPathOf(pack)}/index.js`), `${pack.id} 缺 dist 出口`)
    } else {
      assert.ok(!exists(`../${dir}/index.ts`), `${pack.id} 是演示站自有，不应生成包出口`)
      assert.ok(!exists(`../dist/${exportPathOf(pack)}`), `${pack.id} 不应进发布产物`)
    }
  }
  assert.match(read('../scripts/icons.sources.mjs'), /export const SOURCES/, '注册表必须是独立真源')
  assert.match(read('../scripts/icons.mjs'), /validateParsed/, '生成器必须做平台 CSS 交叉校验')
  assert.match(read('../src/ui/icon/index.ts'), /common\/base\/index\.js/, '旧 JS 出口须转发到 common.base')
  assert.match(
    read('../src/ui/icon/style/index.scss'),
    /common\/base\/style\/index/,
    '旧样式出口须转发到 common.base',
  )
  assert.doesNotMatch(read('../src/ui/feedback/style/index.scss'), /@use.*icon/, 'feedback 不得内联图标样式')
})

test('明暗三选一：三个主题出口产物齐全且行为分明', () => {
  const light = read('../dist/styles/theme-light.css')
  const dark = read('../dist/styles/theme-dark.css')
  const auto = read('../dist/styles/theme-auto.css')
  for (const [mode, css] of [['theme-light', light], ['theme-dark', dark], ['theme-auto', auto]]) {
    assert.match(css, /page\s*\{/, `${mode} 必须自带页面基线`)
    assert.match(css, /--mptk-radius-md:\s*12px/, `${mode} 必须含共享基线`)
  }
  assert.doesNotMatch(light, /prefers-color-scheme|--mptk-fg:\s*#e6e8eb/, '固定明不得含暗色值')
  assert.doesNotMatch(
    dark,
    /--mptk-surface-base:\s*#f2f3f5|@media \(prefers-color-scheme: dark\)/,
    '固定暗不得铺明色值，也不得跟系统走',
  )
  assert.match(dark, /--mptk-fg:\s*#e6e8eb/, '固定暗必须含暗色值')
  assert.match(auto, /--mptk-surface-base:\s*#f2f3f5/, '跟随系统默认明')
  assert.match(auto, /@media \(prefers-color-scheme: dark\)/, '跟随系统必须包媒体查询')
  assert.match(auto, /--mptk-fg:\s*#e6e8eb/, '跟随系统必须含暗色值')
  for (const stale of ['../src/design/tokens.css', '../src/design/dark-values.css']) {
    assert.ok(!exists(stale), `${stale} 不应存在：值只能在 _tokens.scss 里写一次`)
  }
  const pkg = JSON.parse(read('../package.json'))
  for (const name of ['theme-light', 'theme-dark', 'theme-auto']) {
    assert.ok(pkg.exports[`./styles/${name}`], `exports 缺少 ./styles/${name}`)
  }
})

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

/** 三件宿主一次性挂载的测试辅助。 */
function mountAll() {
  ui.markHostMounted('toast')
  ui.markHostMounted('dialog')
  ui.markHostMounted('loading')
}

function allMounted() {
  return ui.isHostMounted('toast') && ui.isHostMounted('dialog') && ui.isHostMounted('loading')
}

test('未挂载 <OverlayHost /> 时命令式 API 每次都抛错，不静默降级', () => {
  ui.resetUIForTests()
  assert.equal(allMounted(), false)
  for (const call of [
    () => ui.showLoading(),
    () => ui.alert('x'),
    () => ui.confirm('x'),
  ]) {
    assert.throws(call, /OverlayHost|挂载/)
  }
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)
})

test('挂载标记与跨副本状态：ESM / CJS 共享同一份单例', () => {
  ui.resetUIForTests()
  const esmNames = Object.keys(ui).sort()
  const cjsNames = Object.keys(cjs).sort()
  assert.deepEqual(cjsNames, esmNames)
  assert.ok(esmNames.length >= 7)
  cjs.markHostMounted('toast')
  cjs.markHostMounted('dialog')
  cjs.markHostMounted('loading')
  assert.equal(allMounted(), true)
  cjs.markHostUnmounted('toast')
  cjs.markHostUnmounted('dialog')
  cjs.markHostUnmounted('loading')
  assert.equal(allMounted(), false)
})

test('showLoading / hideLoading 句柄配对，重复 hide 不误关别人的', () => {
  ui.resetUIForTests()
  mountAll()
  const a = ui.showLoading()
  const b = ui.showLoading()
  assert.equal(ui.uiState().loading.getSnapshot().count, 2)
  assert.equal(ui.hideLoading(a), true)
  assert.equal(ui.hideLoading(a), false)
  assert.equal(ui.uiState().loading.getSnapshot().active, true)
  assert.equal(ui.hideLoading(b), true)
  assert.equal(ui.uiState().loading.getSnapshot().active, false)
})

test('showToast 推可序列化载荷，close 幂等，scope 交接不丢有效期', async () => {
  ui.resetUIForTests()
  mountAll()
  const id = ui.showToast({
    title: '标题',
    description: '内容',
    tone: 'success',
    closeButton: true,
    action: { key: 'undo', text: '撤销' },
    enableStacking: true,
    visibleToasts: 3,
    duration: 0,
  })
  const lifecycle = ui.uiState().toastLifecycle
  const entry = lifecycle.getSnapshot().find((item) => item.id === id)
  assert.ok(entry, 'Toast 必须入栈')
  assert.equal(entry.payload.description, '内容')
  assert.equal(entry.payload.tone, 'success')
  assert.equal(entry.payload.closeButton, true)
  assert.equal(entry.payload.enableStacking, true)
  assert.equal(entry.payload.expiresAt, Number.POSITIVE_INFINITY)
  assert.equal(typeof entry.payload.onAction, 'undefined', '回调不许进载荷')
  assert.equal(lifecycle.setScope(id, 'next-page'), true, '跨页 scope 必须可交接')
  assert.equal(lifecycle.scopeOf(id), 'next-page')
  assert.equal(ui.closeToast(id), true)
  assert.equal(ui.closeToast(id), false, 'close 必须幂等')
  assert.equal(ui.hideToast(id), false, '已关闭后 hide 返回 false')
  await new Promise((resolve) => setTimeout(resolve, 360))
  assert.equal(lifecycle.getSnapshot().length, 0, '退场结束后必须物理移除，否则透明节点会永久拦截点击、折叠层不会回位')
})

test('Toast 关掉上面一条后，下面一条必须补位（退场条目不占位）', async () => {
  ui.resetUIForTests()
  mountAll()
  const lifecycle = ui.uiState().toastLifecycle
  const first = ui.showToast({ description: '第一条', duration: 0 })
  const second = ui.showToast({ description: '第二条', duration: 0 })
  assert.equal(ui.closeToast(first), true)
  assert.equal(lifecycle.getSnapshot().map((e) => e.phase).join(','), 'exiting,open')
  await new Promise((resolve) => setTimeout(resolve, 360))
  assert.deepEqual(lifecycle.getSnapshot().map((e) => e.id), [second], '旧条目物理移除后只剩第二条，余项 y 变化走 transform 补间')
})

test('Toast 展开态全局唯一：展开暂停计时、收起恢复、剩 1 条自动收起', async () => {
  ui.resetUIForTests()
  mountAll()
  const state = ui.uiState()
  assert.equal(ui.getToastExpansion(), false, '默认折叠')
  ui.showToast({ description: 'a', duration: 120, enableStacking: true })
  ui.showToast({ description: 'b', duration: 120, enableStacking: true })
  ui.showToast({ description: 'c', duration: 120, enableStacking: true })
  assert.equal(state.toastTimers.size, 3)
  assert.equal(ui.setToastExpansion(true), true)
  assert.equal(ui.getToastExpansion(), true)
  assert.equal(state.toastTimers.size, 0, '展开必须暂停计时（sonner-native pauseAllTimers）')
  await new Promise((resolve) => setTimeout(resolve, 180))
  assert.equal(state.toastLifecycle.getSnapshot().filter((e) => e.phase === 'open').length, 3, '展开期间不得自动消失')
  ui.setToastExpansion(false)
  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(ui.getToastExpansion(), false)
  ui.resetUIForTests()
  mountAll()
  const first = ui.showToast({ description: 'x', duration: 0, enableStacking: true })
  ui.showToast({ description: 'y', duration: 0, enableStacking: true })
  ui.setToastExpansion(true)
  ui.closeToast(first)
  await new Promise((resolve) => setTimeout(resolve, 360))
  assert.equal(ui.getToastExpansion(), false, '关闭到剩 1 条必须自动收起')
})

test('Toast 位置补间：绝对定位 + transform transition，移除后 y 改变有过渡', () => {
  const host = read('../src/ui/infra/ToastHost.tsx')
  const view = read('../src/ui/feedback/toast/ToastView.tsx')
  const css = read('../src/ui/infra/style/index.scss')
  assert.match(host, /y=\{y\}/, '每条 toast 的 y 必须写进 transform')
  assert.match(view, /position: 'absolute'/, '卡片必须绝对定位，flex 重排无法过渡')
  assert.match(css, /transition: transform var\(--mptk-c-toast-stack-dur\)/, '位置变化必须走 600ms 补间')
  assert.match(host, /stacking \? ordered\.slice\(0, Math\.max\(1, limit\)\) : ordered/, 'visibleToasts 只在堆叠时裁剪')
})

test('confirm() 推栈并由关闭动作 resolve true / false', async () => {
  ui.resetUIForTests()
  mountAll()
  const pending = ui.confirm('确定删除？', { title: '提示', cancelText: '再想想' })
  const entries = ui.uiState().overlays.getSnapshot()
  assert.equal(entries.length, 1)
  assert.equal(entries[0].payload.kind, 'confirm')
  assert.equal(entries[0].payload.content.description, '确定删除？')
  assert.equal(entries[0].payload.layout, 'joined')
  assert.equal(entries[0].payload.actions[0].text, '再想想')
  assert.equal(entries[0].payload.actions[1].text, '确定')
  assert.equal(entries[0].payload.closeable, false)
  assert.equal(entries[0].payload.maskClosable, false)
  closeTop(false)
  assert.equal(await pending, false)
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)

  const spaced = ui.confirm('横排形态', { layout: 'spaced', cancelText: '再想想' })
  const spacedEntries = ui.uiState().overlays.getSnapshot()
  assert.equal(spacedEntries[spacedEntries.length - 1].payload.actions[0].text, '再想想')
  assert.equal(spacedEntries[spacedEntries.length - 1].payload.actions[1].text, '确定')
  closeTop(false)
  assert.equal(await spaced, false)

  const stacked = ui.confirm('竖排形态', { layout: 'stack', cancelText: '再想想' })
  const stackedEntries = ui.uiState().overlays.getSnapshot()
  assert.equal(stackedEntries[stackedEntries.length - 1].payload.actions[0].text, '确定')
  assert.equal(stackedEntries[stackedEntries.length - 1].payload.actions[1].text, '再想想')
  closeTop(false)
  assert.equal(await stacked, false)

  const second = ui.confirm('再来一次')
  closeTop(true)
  assert.equal(await second, true)
})

test('alert() 解析即关，不携带选择', async () => {
  ui.resetUIForTests()
  mountAll()
  const pending = ui.alert('已完成')
  const entries = ui.uiState().overlays.getSnapshot()
  assert.equal(entries[0].payload.kind, 'alert')
  assert.equal(entries[0].payload.actions[0].text, '确定')
  assert.equal(entries[0].payload.content.description, '已完成')
  closeTop(true)
  assert.equal(await pending, undefined)
})

test('固定 type 换图标；普通 icon 上语义色并保留副标题，带 badge 时换外伸图标与底色', async () => {
  ui.resetUIForTests()
  mountAll()
  const expected = {
    success: { icon: 'common.base:gou', tone: 'green', fg: 'var(--mptk-c-dialog-type-fg-success)' },
    error: { icon: 'common.base:guanbi', tone: 'red', fg: 'var(--mptk-c-dialog-type-fg-error)' },
    warning: { icon: 'common.base:warn', tone: 'yellow', fg: 'var(--mptk-c-dialog-type-fg-warning)' },
    info: { icon: 'common.base:info', tone: 'blue', fg: 'var(--mptk-c-dialog-type-fg-info)' },
  }
  for (const [type, spec] of Object.entries(expected)) {
    // 普通 icon 档：换图标 + 给图标上色，副标题保留，不造 badge、不带底色。
    const plain = ui.alert(`${type} 提示`, { type, note: '标题下的小字' })
    const plainPayload = ui.uiState().overlays.getSnapshot()[0].payload
    assert.equal(plainPayload.content.variant, 'icon')
    assert.equal(plainPayload.content.icon, spec.icon, `${type} 应映射到指定图标`)
    assert.equal(plainPayload.content.iconColor, spec.fg, `${type} inline 图标应上语义色`)
    assert.equal(plainPayload.content.note, '标题下的小字', '普通档备注要进载荷')
    assert.equal(plainPayload.badge, undefined, '普通档不该凭空造 badge')
    assert.equal(plainPayload.content.iconTone, undefined, '普通档不该带色底字段')
    closeTop(true)
    await plain

    // 外伸档：图标换成固定图标，底色换成对应红黄蓝绿。
    const raised = ui.alert(`${type} 外伸`, {
      type,
      badge: { content: { kind: 'icon', name: 'common.base:home' } },
    })
    const raisedPayload = ui.uiState().overlays.getSnapshot()[0].payload
    assert.deepEqual(raisedPayload.badge.content, { kind: 'icon', name: spec.icon })
    assert.equal(raisedPayload.badge.tone, spec.tone, `${type} 外伸底色`)
    closeTop(true)
    await raised
  }
  const custom = ui.confirm('自定义图标', { type: 'success', icon: 'common.base:home' })
  const customContent = ui.uiState().overlays.getSnapshot()[0].payload.content
  assert.equal(customContent.icon, 'common.base:home', '显式 icon 覆盖固定图标')
  assert.equal(customContent.iconColor, undefined, '自定义 icon 不套语义色，也就没有圆环')
  closeTop(true)
  await custom
})

test('对话框载荷带齐三形态、位置、宽度与头部配置', async () => {
  ui.resetUIForTests()
  mountAll()
  const badge = { content: { kind: 'icon', name: 'common.base:home' } }
  const headerImage = { src: 'https://example.com/banner.png', width: 200 }
  const offsets = { top: 1, right: 2, bottom: 3, left: 4 }
  const pending = ui.confirm('说明正文', {
    title: '标题', icon: 'common.base:info', note: '备注',
    layout: 'joined', position: 'bottom', width: 280,
    closeable: true, maskClosable: true,
    badge, headerImage, offsets, lockExceptions: ['cancel'],
    confirmText: '继续', cancelText: '返回',
  })
  const payload = ui.uiState().overlays.getSnapshot()[0].payload
  assert.deepEqual(payload.content, {
    variant: 'icon', title: '标题', description: '说明正文', note: '备注', icon: 'common.base:info',
  })
  assert.deepEqual(payload.actions.map((action) => [action.key, action.text]), [['cancel', '返回'], ['confirm', '继续']])
  assert.equal(payload.layout, 'joined')
  assert.equal(payload.position, 'bottom')
  assert.equal(payload.width, 280)
  assert.equal(payload.closeable, true)
  assert.equal(payload.maskClosable, true)
  assert.deepEqual(payload.badge, badge)
  assert.deepEqual(payload.headerImage, headerImage)
  assert.deepEqual(payload.offsets, offsets)
  assert.deepEqual(payload.lockExceptions, ['cancel'])
  ui.resetUIForTests()
  assert.equal(await pending, false)
})

test('resetUIForTests settle 挂起的对话框：confirm 解析 false、alert 解析 undefined', async () => {
  ui.resetUIForTests()
  mountAll()
  const yes = ui.confirm('等确认')
  const notice = ui.alert('等提示')
  ui.resetUIForTests()
  assert.equal(await yes, false)
  assert.equal(await notice, undefined)
})

test('Button 的忙碌上报在成功与失败两条路径成对', () => {
  const source = read('../src/ui/actions/Button.tsx')
  assert.match(source, /onBusyChange\?\.\(value\)/)
  assert.equal((source.match(/settleBusy\(false\)/g) ?? []).length, 2, '成功 / 失败都要解锁并上报')
  assert.match(source, /if \(disabled \|\| loading \|\| inFlight\.current \|\| gate\.locked\) return/, '点击短路走统一闸门裁决')
  assert.match(source, /useControlGate\(lockKey\)/, 'Button 从统一协议接入闸门，不自建第二套判定')
  assert.doesNotMatch(source, /isPopupLockExempt|usePopupLock|lockedByPopup/, '不再散写闸门判定')
})

test('resetUIForTests 清空栈、loading 与挂载标记', () => {
  mountAll()
  ui.showLoading()
  ui.confirm('y').catch(() => {})
  ui.resetUIForTests()
  assert.equal(allMounted(), false)
  assert.equal(ui.uiState().overlays.getSnapshot().length, 0)
  assert.equal(ui.uiState().loading.getSnapshot().active, false)
})

test('各 ui 子域出口与样式实体齐全，产物只指向 peer 不打包平台包', () => {
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout', 'form', 'card']) {
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
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout', 'form', 'card']) {
    const css = read(`../dist/ui/${domain}/style/index.css`)
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/)
    assert.doesNotMatch(css, /--mp-/)
  }
})

test('演示站菜单：ready 必指真实展示页，planned 不绑跳转，条目 id 唯一', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const { menu, catalogPages, appPages } = mod.exports

  assert.ok(Array.isArray(menu) && menu.length === 10, '菜单必须是固定十组')
  assert.equal(menu[0].id, 'foundations', '首组必须是基础规范')
  assert.equal(menu[0].title, '基础规范')
  for (const id of ['design-foundation', 'sizing']) {
    const entry = menu[0].entries.find((item) => item.id === id)
    assert.equal(entry?.status, 'ready', `基础规范缺可点条目：${id}`)
    assert.equal(entry?.pageId, id, `基础规范条目没指向自己的展示页：${id}`)
    const page = catalogPages.find((item) => item.id === id)
    assert.ok(page, `缺独立展示页：${id}`)
    assert.equal(page.path, `pages/${id}/index`, `${id} 页路径必须与页 id 一致`)
    assert.equal(page.examples.length, 2, `${id} 页必须有自己的两块内容`)
  }
  assert.equal(
    catalogPages.find((item) => item.id === 'foundations'), undefined,
    '设计基础与尺寸不许并回同一个展示页',
  )
  const pageIds = new Set(catalogPages.map((page) => page.id))
  const ids = new Set()
  let ready = 0
  let planned = 0
  for (const group of menu) {
    assert.ok(group.entries.length > 0, `分组 ${group.id} 不能为空`)
    for (const entry of group.entries) {
      assert.equal(ids.has(entry.id), false, `条目 id 重复：${entry.id}`)
      ids.add(entry.id)
      if (entry.status === 'ready') {
        ready += 1
        assert.ok(entry.pageId, `ready 条目必须带 pageId：${entry.id}`)
        assert.equal(pageIds.has(entry.pageId), true, `ready 条目指向不存在的页：${entry.id}`)
      } else {
        assert.equal(entry.status, 'planned', `未知状态：${entry.id}`)
        assert.equal(entry.pageId, undefined, `planned 条目不应绑跳转：${entry.id}`)
        planned += 1
      }
    }
  }
  assert.ok(ready > 0 && planned > 0, '菜单必须同时包含 ready 与 planned')
  assert.equal(appPages.length, catalogPages.length + 1, '路由必须是索引页 + 全部展示页')
})

test('菜单保留原文，页面标题唯一入口取菜单文字、多入口标 X', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const { menu, catalogPages, pageTitleOf } = mod.exports
  const entries = menu.flatMap((group) => group.entries)
  assert.equal(entries.some((item) => item.label === 'X'), false, '菜单 label 不许改成 X')
  const ready = entries.filter((item) => item.status === 'ready')
  const seen = new Set(ready.map((item) => item.pageId))
  for (const page of catalogPages) {
    assert.equal(seen.has(page.id), true, `${page.id} 没有 ready 入口`)
  }
  let multi = 0
  for (const pageId of seen) {
    const owners = ready.filter((item) => item.pageId === pageId)
    if (owners.length > 1) multi += 1
    const expected = owners.length === 1 ? owners[0].label : 'X'
    assert.equal(pageTitleOf(pageId), expected, `${pageId} 打开后的标题与预期不一致`)
  }
  assert.ok(multi > 0, '应有多入口页面用 X 标出待调整')
})

test('cell 组件级出口与样式出口齐全，子域 barrel 仍导出', () => {
  for (const name of ['index.js', 'index.cjs', 'index.d.ts']) {
    assert.ok(exists(`../dist/ui/display/cell/${name}`), `cell 组件级出口缺 ${name}`)
  }
  assert.ok(exists('../dist/ui/display/cell/style/index.css'), 'cell 组件级样式出口缺失')
  const barrel = read('../dist/ui/display/index.js')
  assert.match(barrel, /Cell/)
  assert.match(barrel, /CellGroup/)
  const css = read('../dist/ui/display/cell/style/index.css')
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/)
  assert.doesNotMatch(css, /--mp-/)
  assert.doesNotMatch(css, /:last-child/, '分隔线不能依赖结构伪类')
  for (const name of [
    'mptk-cell-group--inset',
    'mptk-cell-group--flush',
    'mptk-cell--center',
    'mptk-cell--top',
    'mptk-cell--clickable',
    'mptk-cell__divider',
    'mptk-cell__arrow--down',
    'mptk-cell__value--sm',
  ]) {
    assert.ok(css.includes(`.${name}`), `样式缺 .${name}`)
  }
  assert.match(css, /background-color:\s*var\(--mptk-border\)/)
  const cellSource = read('../dist/ui/display/cell/Cell.js')
  assert.match(cellSource, /state\.clickable/, '点击态必须真的接到 View 的 onClick')
  assert.match(cellSource, /state\.divider/, '分隔线元素必须由状态机条件渲染')
  const groupSource = read('../dist/ui/display/cell/CellGroup.js')
  assert.match(groupSource, /cellDividerVisible\(/, 'CellGroup 必须调用按位置关线逻辑')
  assert.match(groupSource, /cloneElement\(/, 'CellGroup 必须把结果注入子格')
})

test('cell 三轴状态：点击态由 onClick 派生、isLink 纯视觉、disabled 短路', () => {
  assert.equal(cellState.resolveCellState({}).clickable, false)
  assert.equal(cellState.resolveCellState({ isLink: true }).clickable, false, 'isLink 只管箭头')
  const active = cellState.resolveCellState({ onClick: () => {} })
  assert.equal(active.clickable, true)
  assert.equal(active.hoverClassName, 'mptk-cell--clickable')
  const disabled = cellState.resolveCellState({ onClick: () => {}, disabled: true })
  assert.equal(disabled.clickable, false)
  assert.equal(disabled.hoverClassName, 'none')
  assert.match(disabled.className, /mptk-cell--disabled/)
  assert.equal(cellState.resolveCellState({}).arrowClassName, 'mptk-cell__arrow mptk-cell__arrow--right')
  assert.equal(
    cellState.resolveCellState({ arrowDirection: 'down' }).arrowClassName,
    'mptk-cell__arrow mptk-cell__arrow--down',
  )
  assert.match(cellState.resolveCellState({}).className, /mptk-cell--divider/, '有分隔线时根类带修饰符供宿主定制')
  const noBorder = cellState.resolveCellState({ border: false })
  assert.equal(noBorder.divider, false)
  assert.doesNotMatch(noBorder.className, /mptk-cell--divider/)
  const shaped = cellState.resolveCellState({ center: true, size: 'large' })
  assert.match(shaped.className, /mptk-cell--center/)
  assert.match(shaped.className, /mptk-cell--large/)
  const top = cellState.resolveCellState({ center: false })
  assert.match(top.className, /mptk-cell--top/, 'center={false} 派生顶部对齐修饰类')
  assert.doesNotMatch(top.className, /mptk-cell--center/)
  assert.doesNotMatch(cellState.resolveCellState({}).className, /mptk-cell--top/, '不传 center 时不应顶部对齐')
  assert.equal(cellState.resolveCellState({}).valueClassName, 'mptk-cell__value', '右侧值默认不带修饰类（小档）')
  assert.equal(cellState.resolveCellState({ valueSize: 'xs' }).valueClassName, 'mptk-cell__value')
  assert.equal(
    cellState.resolveCellState({ valueSize: 'sm' }).valueClassName,
    'mptk-cell__value mptk-cell__value--sm',
    'valueSize="sm" 才派生放大档',
  )
})

test('cell 右侧值默认与 label 同档（xs），valueSize="sm" 回到标题档', () => {
  const css = read('../dist/ui/display/cell/style/index.css')
  const value = css.match(/(?:^|\n)\.mptk-cell__value\s*\{([^}]*)\}/m)
  assert.ok(value, '缺 .mptk-cell__value 规则')
  assert.match(value[1], /font-size:\s*var\(--mptk-font-xs\)/, '右侧值是说明性文字，默认取 xs')
  assert.match(value[1], /line-height:\s*var\(--mptk-line-xs\)/, '行高同档')
  assert.match(value[1], /display:\s*flex/, '右侧值要用 flex 定位，text-align 管不到块级插槽')
  assert.match(value[1], /justify-content:\s*flex-end/, '插槽内容（含段控件）也要贴右，和箭头前的文字同一口径')
  const sm = css.match(/(?:^|\n)\.mptk-cell__value--sm\s*\{([^}]*)\}/m)
  assert.ok(sm, '缺 .mptk-cell__value--sm 规则')
  assert.match(sm[1], /font-size:\s*var\(--mptk-font-sm\)/, 'sm 档取标题字号')
  assert.match(sm[1], /line-height:\s*var\(--mptk-line-sm\)/, 'sm 档行高同档')
})

test('cell 垂直对齐两态：根容器统一驱动，装饰位不各自写 align-self', () => {
  const css = read('../dist/ui/display/cell/style/index.css')
  const root = css.match(/(?:^|\n)\.mptk-cell\s*\{([^}]*)\}/m)
  assert.ok(root, '缺 .mptk-cell 基础规则')
  assert.match(root[1], /align-items:\s*center/, '默认必须垂直居中')
  const top = css.match(/(?:^|\n)\.mptk-cell--top\s*\{([^}]*)\}/m)
  assert.ok(top, '缺 .mptk-cell--top 规则')
  assert.match(top[1], /align-items:\s*flex-start/, '顶部对齐必须真的改 align-items')
  const center = css.match(/(?:^|\n)\.mptk-cell--center\s*\{([^}]*)\}/m)
  assert.ok(center, '缺 .mptk-cell--center 规则')
  assert.match(center[1], /align-items:\s*center/)
  for (const name of ['mptk-cell__extra', 'mptk-cell__right-icon', 'mptk-cell__arrow']) {
    const rule = css.match(new RegExp(`(?:^|\\n)\\.${name}[\\s,{][^{]*\\{([^}]*)\\}`))
    assert.ok(rule, `缺 .${name} 规则`)
    assert.doesNotMatch(rule[1], /align-self/, `${name} 不许写死 align-self，否则整行对齐会被局部覆盖`)
  }
})

test('cell 分组形态：inset 不画外框，最后一格由位置关掉分隔线', () => {
  const inset = cellState.resolveCellGroupState({ inset: true })
  assert.match(inset.className, /mptk-cell-group--inset/)
  assert.match(inset.bodyClassName, /mptk-cell-group__body--inset/)
  assert.equal(inset.outerBorder, false)
  const flush = cellState.resolveCellGroupState({})
  assert.match(flush.className, /mptk-cell-group--flush/)
  assert.equal(flush.outerBorder, true)
  assert.equal(cellState.resolveCellGroupState({ border: false }).outerBorder, false)
  const inCard = cellState.resolveCellGroupState({ inCard: true })
  assert.equal(inCard.outerBorder, false, '装在 Card 里不画上下外框')
  assert.match(inCard.className, /mptk-cell-group--in-card/, '卡片内形态要派生修饰类')
  assert.equal(cellState.resolveCellGroupState({ inCard: false }).outerBorder, true)
  assert.equal(cellState.cellDividerVisible(true, 0, 2), true)
  assert.equal(cellState.cellDividerVisible(true, 2, 2), false)
  assert.equal(cellState.cellDividerVisible(false, 0, 2), false)
  assert.match(cellState.resolveCellGroupState({ dividerTone: 'match' }).className, /mptk-cell-group--divider-match/)
  assert.doesNotMatch(cellState.resolveCellGroupState({ dividerTone: 'soft' }).className, /--divider-match/)
  assert.match(cellState.resolveCellGroupState({}).className, /mptk-cell-group--divider-inset/, '行间线内缩默认开，要派生可见类名')
  assert.match(cellState.resolveCellGroupState({ dividerInset: true }).className, /mptk-cell-group--divider-inset/)
  assert.match(cellState.resolveCellGroupState({ dividerInset: false }).className, /mptk-cell-group--divider-flush/, '显式关内缩切通底类名')
  assert.doesNotMatch(cellState.resolveCellGroupState({ dividerInset: false }).className, /--divider-inset/)
  assert.match(cellState.resolveCellGroupState({ inset: true, frame: false }).className, /mptk-cell-group--frameless/)
  assert.doesNotMatch(cellState.resolveCellGroupState({ inset: true }).className, /--frameless/)
})

test('cell 契约在宿主真类型环境下可作为 JSX 组件使用', () => {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const probe = resolve(root, 'src/__probe-cell.tsx')
  const entry = JSON.stringify(resolve(root, 'dist/ui/display/cell/index'))
  const source = `import { Cell, CellGroup } from ${entry};
import type { CellProps, CellGroupProps, CellSize, CellArrowDirection, CellDividerTone } from ${entry};
const size: CellSize = 'large';
const direction: CellArrowDirection = 'down';
const tone: CellDividerTone = 'match';
const cellProps: CellProps = { title: '单元格' };
const groupProps: CellGroupProps = { inset: true, dividerTone: tone, dividerInset: false, frame: false };
export const element = (
  <CellGroup {...groupProps} title="分组" border={false}>
    <Cell {...cellProps} label="描述" value="内容" icon="图标" rightIcon="右图标" extra="额外" center border size={size} isLink arrowDirection={direction} disabled onClick={() => {}} className="x">自定义值</Cell>
    <CellGroup title="第二组"><Cell title="独立" center={false} /></CellGroup>
  </CellGroup>
);
`
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

test('cell 菜单翻 ready，展示页覆盖 Vant Weapp 全部形态', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const { menu, catalogPages } = mod.exports
  const cell = menu.flatMap((group) => group.entries).find((entry) => entry.id === 'cell')
  assert.equal(cell.status, 'ready')
  assert.equal(cell.pageId, 'display')
  const display = catalogPages.find((page) => page.id === 'display')
  const expected = [
    'cell-basic',
    'cell-inset',
    'cell-with-card',
    'cell-size',
    'cell-value-size',
    'cell-icon',
    'cell-link',
    'cell-navigate',
    'cell-group-title',
    'cell-slot',
    'cell-center',
    'cell-state',
  ]
  const page = read('../demo/src/pages/display/index.tsx')
  for (const id of expected) {
    assert.ok(display.examples.some((example) => example.id === id), `catalog 缺示例 ${id}`)
    assert.ok(page.includes(`id === '${id}'`), `展示页缺 ${id} 的渲染分支`)
  }
  const home = read('../demo/src/pages/index/index.tsx')
  assert.match(home, /CellGroup/, '首页必须用 CellGroup')
  assert.match(home, /mp-taro-kit\/ui\/display\/cell\/style/, '首页必须引组件级样式')
})

test('Cell 展示页只放 Cell，Badge / Divider 各占一页，外框与分隔线分档且可覆盖', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const { menu, catalogPages } = mod.exports
  const entries = menu.flatMap((group) => group.entries)
  const pageIds = new Set(catalogPages.map((page) => page.id))
  const targets = []
  for (const id of ['cell', 'badge', 'divider']) {
    const entry = entries.find((item) => item.id === id)
    assert.equal(entry?.status, 'ready', `${id} 菜单必须是 ready`)
    assert.ok(pageIds.has(entry.pageId), `${id} 菜单没指向真实展示页`)
    targets.push(entry.pageId)
  }
  assert.equal(new Set(targets).size, 3, 'Cell / Badge / Divider 三条菜单不许指向同一页')

  const display = catalogPages.find((page) => page.id === 'display')
  assert.ok(display.examples.length > 0, 'Cell 展示页不能没有示例')
  assert.ok(display.examples.every((example) => example.id.startsWith('cell-')), 'Cell 展示页不许混入非 Cell 示例')
  const displayPage = read('../demo/src/pages/display/index.tsx')
  assert.doesNotMatch(displayPage, /id === 'badge'|id === 'divider'/, 'Cell 展示页不许再渲染 Badge / Divider')

  for (const [id, component] of [['badge', 'Badge'], ['divider', 'Divider'], ['tag', 'Tag']]) {
    const page = read(`../demo/src/pages/${id}/index.tsx`)
    assert.match(page, new RegExp(`<${component}[\\s>]`), `${id} 页缺 ${component}`)
    assert.match(page, new RegExp(`pageId="${id}"`), `${id} 页没接自己的 catalog 页`)
    assert.ok(exists(`../demo/src/pages/${id}/index.config.ts`), `${id} 页缺 disableScroll 配置`)
    const entry = catalogPages.find((item) => item.id === id)
    assert.ok(entry.examples.some((example) => example.id === id), `${id} 页缺自己的示例块`)
  }

  // 每个展示页都要接自己的页面配置：缺 disableScroll，Skyline 下整页就能跟着手指滚。
  for (const page of catalogPages) {
    assert.ok(exists(`../demo/src/pages/${page.id}/index.config.ts`), `${page.id} 页缺 disableScroll 配置`)
  }

  const dividerCss = read('../dist/ui/display/style/index.css')
  assert.match(dividerCss, /\.mptk-divider--text\s*\{[^}]*background-color:\s*var\(--mptk-s-transparent\)/, '带文字的分隔线要横排')
  assert.match(dividerCss, /\.mptk-divider__text\s*\{[^}]*padding-left:\s*var\(--mptk-divider-content-gap\)/, '文字间距走语义变量')
  assert.match(read('../demo/src/pages/divider/index.tsx'), /contentPosition="left"/, 'divider 页缺带文字形态示例')

  const css = read('../dist/ui/display/cell/style/index.css')
  assert.doesNotMatch(css, /--mptk-border-faint/, '外框不许取 faint 档')
  const titleDivider = css.match(/(?:^|\n)\.mptk-cell-group__title-divider\s*\{([^}]*)\}/m)
  assert.ok(titleDivider, '缺标题线样式')
  assert.match(titleDivider[1], /background-color:\s*var\(--mptk-border\)/, '标题线是列表上边界，取外框色而不是组内浅线')
  assert.doesNotMatch(titleDivider[1], /position:/, '组级线必须是流内元素，不许绝对定位')
  assert.doesNotMatch(titleDivider[1], /margin/, '组级线是结构线，默认形态不许自带左右内缩')
  assert.doesNotMatch(
    css,
    /\.mptk-cell-group--in-card\s+\.mptk-cell-group__(title-divider|border)[^{]*\{[^}]*margin-left:\s*calc\(/,
    'body 已无左右内距，组级线不许再靠负 margin 抵消——那是旧补丁写法',
  )
  assert.match(
    css,
    /\.mptk-cell-group--in-card\s+\.mptk-cell-group__title\s*\{[^}]*padding-left:\s*var\(--mptk-card-spacing\)/,
    '卡片内组标题与列表文字同一左边界',
  )
  assert.doesNotMatch(
    css,
    /\.mptk-cell-group__border\s*\{[^}]*position:/,
    '上下外框线不许绝对定位',
  )
  const inset = css.match(/(?:^|\n)\.mptk-cell-group__body--inset\s*\{([^}]*)\}/m)
  assert.ok(inset, '缺卡片形态样式')
  assert.equal((inset[1].match(/border-(?:top|right|bottom|left)-color:\s*var\(--mptk-border\)/g) ?? []).length, 4, '卡片四边外框都要取 --mptk-border')
  assert.equal((resolveCssVars(inset[1]).match(/border-(?:top|right|bottom|left)-width:\s*1px/g) ?? []).length, 4, '卡片四边外框都要是 1px')
  const divider = css.match(/(?:^|\n)\.mptk-cell__divider\s*\{([^}]*)\}/m)
  assert.ok(divider, '缺分隔线样式')
  assert.match(resolveCssVars(divider[1]), /height:\s*1px/, '分隔线宽度要与外框一致')
  assert.match(divider[1], /background-color:\s*var\(--mptk-cell-divider\)/, '组内分隔线走语义变量')
  assert.match(divider[1], /left:\s*var\(--mptk-space-4\)/, '分隔线默认左右内缩，不通到底')
  assert.match(divider[1], /right:\s*var\(--mptk-space-4\)/)
  assert.match(css, /\.mptk-cell-group--divider-match\s*\{[^}]*--mptk-cell-divider:\s*var\(--mptk-border\)/, 'match 档要把内线切回外框色')
  assert.match(
    css,
    /\.mptk-cell-group--divider-inset \.mptk-cell__divider\s*\{[^}]*left:\s*var\(--mptk-space-4\)[^}]*right:\s*var\(--mptk-space-4\)/,
    '默认内缩：行线端点取内容区边距',
  )
  assert.match(
    resolveCssVars(css),
    /\.mptk-cell-group--divider-flush \.mptk-cell__divider\s*\{[^}]*left:\s*0[^}]*right:\s*0/,
    'dividerInset=false：通栏行线通到屏幕边',
  )
  assert.match(
    css,
    /\.mptk-cell-group--in-card\.mptk-cell-group--divider-inset \.mptk-cell__divider\s*\{[^}]*left:\s*var\(--mptk-card-spacing\)[^}]*right:\s*var\(--mptk-card-spacing\)/,
    '卡片内默认内缩：留白在行上，线缩一档才与文字对齐',
  )
  assert.match(
    resolveCssVars(css),
    /\.mptk-cell-group--in-card\.mptk-cell-group--divider-flush \.mptk-cell__divider\s*\{[^}]*left:\s*0[^}]*right:\s*0/,
    '卡片内通底：body 无内距后归零即到卡片边，不许负 margin',
  )
  assert.match(resolveCssVars(css), /\.mptk-cell-group--frameless\s+\.mptk-cell-group__body--inset\s*\{[^}]*border-top-width:\s*0/, '无边框档要去掉四边描边')

  /* 背景归环境，不归 Cell：组体与行默认透明，环境（页面 / 卡片 / 弹窗面板 / 调用方 className）透上来。
     这样 Cell 才能放进任何底色的容器而不顶出一块异色面。 */
  const body = css.match(/(?:^|\n)\.mptk-cell-group__body\s*\{([^}]*)\}/m)
  const row = css.match(/(?:^|\n)\.mptk-cell\s*\{([^}]*)\}/m)
  assert.ok(body, '缺组体样式')
  assert.ok(row, '缺行样式')
  assert.match(body[1], /background-color:\s*var\(--mptk-s-transparent\)/, '组体默认透明，不铺面')
  assert.match(row[1], /background-color:\s*var\(--mptk-s-transparent\)/, '行默认透明，不铺面')
  assert.doesNotMatch(body[1], /background-color:\s*var\(--mptk-surface/, '组体不许把 surface 当默认底色')
  assert.doesNotMatch(row[1], /background-color:\s*var\(--mptk-surface/, '行不许把 surface 当默认底色')
  /* 按压走半透明叠加层，不换底色：换色会盖掉调用方给的面，反馈与真实底色脱节。 */
  const clickable = css.match(/(?:^|\n)\.mptk-cell--clickable\s*\{([^}]*)\}/m)
  assert.ok(clickable, '缺按压态样式')
  assert.match(clickable[1], /background-image:\s*linear-gradient\(var\(--mptk-cell-press\),\s*var\(--mptk-cell-press\)\)/, '按压态要叠 --mptk-cell-press 半透明层')
  assert.doesNotMatch(clickable[1], /background-color:/, '按压不许换底色')

  for (const mode of ['light', 'dark']) {
    const theme = read(`../dist/styles/theme-${mode}.css`)
    const tone = theme.match(/--mptk-cell-divider:\s*rgba\([^)]*?,\s*([\d.]+)\)/)
    const frame = theme.match(/--mptk-border:\s*rgba\([^)]*?,\s*([\d.]+)\)/)
    const press = theme.match(/--mptk-cell-press:\s*rgba\([^)]*?,\s*([\d.]+)\)/)
    assert.ok(tone, `${mode} 缺 --mptk-cell-divider`)
    assert.ok(frame, `${mode} 缺 --mptk-border`)
    assert.ok(press, `${mode} 缺 --mptk-cell-press`)
    assert.ok(Number(tone[1]) < Number(frame[1]), `${mode} 组内分隔线默认必须比外框浅`)
  }

  const demoStyle = read('../demo/src/app.scss')
  assert.doesNotMatch(demoStyle, /demo-cell-divider-match/, '宿主侧覆盖类已删除，设置统一走 prop')
  assert.match(displayPage, /dividerTone="match"/, '演示站要用枚举 prop')
  assert.match(displayPage, /dividerInset=\{false\}/, '演示站要展示行线通底开关')
  assert.match(displayPage, /frame=\{false\}/, '演示站要展示无边框开关')
  for (const id of ['cell-divider-tone', 'cell-divider-inset', 'cell-card-frame']) {
    assert.ok(display.examples.some((example) => example.id === id), `演示站缺 ${id} 示例`)
  }
})

test('Cell 展示页按五组顺序铺开，分组标题只在组首出现', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const display = mod.exports.catalogPages.find((page) => page.id === 'display')
  const expected = [
    ['一 · 容器形态', ['cell-basic', 'cell-inset', 'cell-group-title']],
    ['二 · 组级外观设置', ['cell-divider-tone', 'cell-divider-inset', 'cell-card-frame']],
    ['三 · 单格内容与排布', ['cell-size', 'cell-value-size', 'cell-icon', 'cell-slot', 'cell-center', 'cell-link']],
    ['四 · 交互与状态', ['cell-navigate', 'cell-state']],
    ['五 · 与 Card 组合', ['cell-with-card']],
  ]
  assert.deepEqual(display.examples.map((example) => example.id), expected.flatMap(([, group]) => group), 'Cell 示例顺序要按五组由大到小铺开')
  assert.deepEqual(display.examples.map((example) => example.section), expected.flatMap(([name, group]) => group.map(() => name)), '分组不许交错')
  for (const other of mod.exports.catalogPages.filter((page) => page.id !== 'display' && page.id !== 'card')) {
    assert.ok(other.examples.every((example) => example.section === undefined), `${other.id} 页不该被分组改动`)
  }
  const card = mod.exports.catalogPages.find((page) => page.id === 'card')
  assert.ok(card, '缺 Card 展示页')
  const cardGroups = [...new Set(card.examples.map((example) => example.section))]
  assert.deepEqual(cardGroups, ['一 · 容器形态', '二 · 外观设置', '三 · 槽位与状态'], 'Card 页也按三组铺开')
  const shell = read('../demo/src/components/DemoBlock.tsx')
  assert.match(shell, /Divider[^>]*contentPosition="left"/, '页壳要用带文字的分隔线渲染分组标题')
  assert.match(shell, /example\.section/, '分组标题要由 catalog 的 section 驱动')
})

test('演示站只演示形态：不渲染代码，通栏示例页裸展示', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
  const display = mod.exports.catalogPages.find((page) => page.id === 'display')
  assert.equal(display.bare, true, '展示页必须裸展示，通栏才不会被演示卡片包住')
  const block = read('../demo/src/components/DemoBlock.tsx')
  assert.doesNotMatch(block, /example\.usage|example\.imports/, '演示站不得再渲染代码')
})

test('演示站组件之间只留一道间距：横排右距 + 纵向容器相邻距，不用 gap', () => {
  const scss = read('../demo/src/app.scss')
  assert.match(scss, /\.demo-item\s*\{[^}]*margin-right:\s*var\(--mptk-space-2\)/, '缺 demo-item 右侧间距（space-2 = 8px）')
  assert.match(
    scss,
    /\.demo-stack > view:not\(:first-child\)/,
    '纵向间距没交给 stack，或写成 wxss 会丢的通配符',
  )
  assert.doesNotMatch(scss.replace(/\/\*[\s\S]*?\*\//g, ''), /\.demo-stack > \*/, 'wxss 会丢掉通配符选择器')
  assert.doesNotMatch(scss, /\.demo-item\s*\{[^}]*margin-bottom:/, '内容项自带垂直外边距会和卡片内边距叠成两份')
  assert.doesNotMatch(scss, /\bgap:/, '不用 gap：老 WebView 内核不支持，两端会不一致')

  for (const [file, component] of [
    ['../demo/src/pages/form/index.tsx', 'Switch'],
    ['../demo/src/pages/segmented/index.tsx', 'Segmented'],
  ]) {
    const page = read(file)
    const tags = page.match(new RegExp(`<${component}[\\s>]`, 'g')) ?? []
    const items = page.match(new RegExp(`<${component}\\s+className="demo-item"`, 'g')) ?? []
    assert.ok(tags.length > 0, `${file} 没有 ${component}`)
    assert.equal(items.length, tags.length, `${file} 里每个 ${component} 都要带 demo-item`)
  }
})

test('演示站除尺寸示例外一律用 md 档摆，形态之间口径一致', () => {
  for (const [file, component] of [
    ['../demo/src/pages/form/index.tsx', 'Switch'],
    ['../demo/src/pages/segmented/index.tsx', 'Segmented'],
  ]) {
    const page = read(file)
    const marks = [...page.matchAll(/if \(id === '([^']+)'\) \{/g)]
    assert.ok(marks.length > 0, `${file} 没解析到示例块`)
    let sizeBlocks = 0
    for (const [index, mark] of marks.entries()) {
      if (mark[1].endsWith('-size')) {
        sizeBlocks += 1
        continue
      }
      const start = mark.index
      const end = index + 1 < marks.length ? marks[index + 1].index : page.length
      for (const tag of page.slice(start, end).match(new RegExp(`<${component}\\b[\\s\\S]*?/>`, 'g')) ?? []) {
        assert.doesNotMatch(
          tag,
          /size="(sm|lg)"/,
          `${file} 的 ${mark[1]} 里写死了档位，应该走默认档：${tag.replace(/\s+/g, ' ').slice(0, 72)}`,
        )
      }
    }
    assert.equal(sizeBlocks, 1, `${file} 必须有且只有一个尺寸示例（逐档铺开的那块）`)
  }
})

test('按压反馈不吃 Taro 的 400ms 默认：带 hoverClass 的组件都显式给 hoverStayTime', () => {
  for (const file of [
    '../src/ui/actions/Button.tsx',
    '../src/ui/card/Card.tsx',
    '../src/ui/display/cell/Cell.tsx',
  ]) {
    const src = read(file)
    assert.match(src, /hoverStayTime=\{PRESS_STAY_TIME\}/, `${file} 没给 hoverStayTime：抬手后按压态会挂 400ms`)
    assert.match(src, /PRESS_STAY_TIME/, `${file} 没接统一常量`)
  }
  const constant = Number(/PRESS_STAY_TIME = (\d+)/.exec(read('../src/ui/infra/press.ts'))?.[1])
  assert.ok(constant > 0 && constant <= 100, `PRESS_STAY_TIME 应贴近原生 70ms，现在是 ${String(constant)}`)
})

test('演示卡片的块底只留壳内边距一份，不叠内容尾距', () => {
  const scss = read('../demo/src/app.scss')
  assert.doesNotMatch(
    scss,
    /\.demo-block:not\(\.demo-block--bare\)\s*\{[^}]*padding-bottom/,
    'demo 不该覆盖 Card 的内边距，块底交给库自己的壳',
  )
  assert.doesNotMatch(scss, /\.demo-item\s*\{[^}]*margin-bottom:/, '内容项自带尾距会和 Card padding 叠成两份')
  assert.doesNotMatch(scss, /\.demo-note\s*\{[^}]*margin-bottom:/, '说明文字的尾距会和 Card padding 叠成两份')
  assert.match(scss, /\.demo-note\s*\{[^}]*display: block/, '说明文字是 inline 时垂直 margin 不生效')

  // 这几种写法都试过，全部会在 Skyline / 小程序 wxss 下失效或跳变，别再回来。
  const rules = scss.replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(rules, /calc\(0px - var\(--mptk-space-3\)\)/, '负外边距会被 Skyline 丢弃，间距反复跳')
  assert.doesNotMatch(rules, /calc\(var\(--mptk-space-3\) \* -1\)/, '禁用 calc 乘法：WebView 内核支持不一致')
  assert.doesNotMatch(rules, /\.demo-row:last-child/, '浮层挂载会让行容器失去 last-child')
  assert.doesNotMatch(rules, /\.demo-row \+ \*/, '小程序 wxss 不支持通配符选择器')
})

test('细分视觉值也走 token：下拉位移与 Segmented 内缩不写死数值', () => {
  const nav = read('../src/ui/navigation/style/index.scss')
  assert.doesNotMatch(nav, /translateY\(-8px\)/, '下拉起始位移写死 8px，改间距档时不会跟随')
  assert.match(nav, /translateY\(calc\(0px - var\(--mptk-space-2\)\)\)/, '下拉位移没走 --mptk-space-2')

  const seg = read('../src/ui/form/segmented/Segmented.tsx')
  assert.doesNotMatch(seg, /\+\s*3px|-\s*6px/, 'Segmented 滑块内缩写死 3px / 6px，与 SCSS 各存一份')
  assert.match(seg, /calc\(\$\{span\.width\} - var\(--mptk-seg-inset\) - var\(--mptk-seg-inset\)\)/, 'Segmented 宽度没读内缩 token')
})

test('常驻浮动按钮：两层契约、组件级与子域出口、层级不写死、演示页接入', () => {
  // 组件级三件套 + 样式出口
  for (const name of ['index.js', 'index.cjs', 'index.d.ts']) {
    assert.ok(exists(`../dist/ui/layout/floating-action/${name}`), `floating-action 组件级出口缺 ${name}`)
  }
  assert.ok(exists('../dist/ui/layout/floating-action/style/index.css'), 'floating-action 组件级样式出口缺失')

  // 子域 barrel 同时导出两层组件与类型
  const barrel = read('../dist/ui/layout/index.js')
  for (const name of ['FloatingAction', 'FloatingActionGroup']) {
    assert.match(barrel, new RegExp(name), `layout barrel 缺 ${name}`)
  }
  assert.match(read('../dist/ui/layout/index.d.ts'), /FloatingActionPosition/, 'layout barrel 缺 FloatingActionPosition 类型')

  // 两层职责：本体只做显隐，不做定位；容器做 flex 列，不渲染 Button 皮肤
  const action = read('../src/ui/layout/floating-action/FloatingAction.tsx')
  assert.match(action, /usePresence/, '本体缺进出场显隐')
  assert.match(action, /<Button\b/, '本体没复用核心 Button')
  assert.match(action, /markCardEdgeOutOfFlow/, '本体缺浮层声明')
  assert.doesNotMatch(action, /position:\s*fixed/, '本体不许自己 fixed，定位归 Group')
  assert.match(action, /export function FloatingActionGroup/, '缺列容器')
  assert.match(action, /size = 'sm'/, '默认尺寸没回归 Button 的 sm')
  assert.match(action, /type = 'default'/, '默认色不是中性灰 default，而是抢眼的品牌色')
  assert.match(action, /variant = 'outline'/, '描边默认不是带描边的 outline')
  assert.match(action, /radius = 'md'/, '圆角默认不是中号 md')
  assert.match(action, /translucent = true/, '缺半透明底默认开关')
  assert.match(action, /'bottom-right' \| 'right-middle' \| 'bottom-left' \| 'left-middle'/, '位置档不是四档')

  // 样式：层级只读 token、不写死 z；进出场节点退让命中；竖排不用 gap；半透明底覆盖实心与描边档底色
  const css = read('../dist/ui/layout/floating-action/style/index.css')
  assert.match(css, /\.mptk-fab-group\s*\{[^}]*position:\s*fixed/, '列容器缺 fixed 定位')
  assert.match(css, /\.mptk-fab-group\s*\{[^}]*flex-direction:\s*column/, '列容器缺竖排')
  for (const pos of ['bottom-right', 'right-middle', 'bottom-left', 'left-middle']) {
    assert.match(css, new RegExp(`\\.mptk-fab-group--${pos}\\b`), `样式缺位置档 ${pos}`)
  }
  assert.match(css, /z-index:\s*var\(--mptk-c-layer-navbar\)/, '列容器层级没走浮层链 token')
  assert.doesNotMatch(css, /z-index:\s*\d/, '层级不许写死数字')
  assert.match(css, /\.mptk-fab\s*\{[^}]*pointer-events:\s*none/, '退场期必须让出命中测试')
  assert.doesNotMatch(css, /\bgap\s*:/, '竖排不许用 gap（老 WebView 内核不支持）')
  // 贴底离边距离取最大不累加：CSS 只留呼吸档，横条真值由 JS 注入写行内覆盖。
  assert.match(css, /\.mptk-fab-group--bottom-right\s*,[\s\S]{0,80}?\{\s*bottom:\s*var\(--mptk-space-4\)/, '贴底档 CSS 该只留呼吸档')
  assert.doesNotMatch(css, /bottom:\s*calc\([^;]*env\(safe-area-inset-bottom\)\)/, '贴底档不该把呼吸与横条相加')
  assert.match(action, /resolveBottomInset\(getSafeAreaSnapshot\(\)\)/, 'FAB 贴底没读注入的横条真值算 max')
  assert.match(css, /\.mptk-fab--translucent \.mptk-btn--solid,\s*\.mptk-fab--translucent \.mptk-btn--outline\s*\{[^}]*--mptk-btn-bg:\s*var\(--mptk-c-fab-bg\)/, '半透明底没覆盖实心与描边档底色变量')
  assert.doesNotMatch(css, /--mptk-btn-border:\s*var\(--mptk-c-fab-bg\)/, '半透明不许盖掉描边变量')
  const config = read('../kit.config.mjs')
  assert.equal((config.match(/--mptk-c-fab-bg/g) || []).length, 2, '--mptk-c-fab-bg 必须明暗各配一份')
  assert.equal((config.match(/"--mptk-c-fab-bg": "var\(--mptk-default-soft\)"/g) || []).length, 2, '浮动按钮底必须跟随中性灰 default-soft，不许写死抢眼的品牌蓝')

  // 演示页：popup 式配置界面（CellGroup + Segmented）、四档、三个真实图标、点按钮不隐藏
  const page = read('../demo/src/pages/layout/index.tsx')
  for (const name of ['FloatingActionGroup', 'FloatingAction', 'CellGroup', 'Segmented']) {
    assert.match(page, new RegExp(`<${name}[\\s>]`), `演示页缺 ${name}`)
  }
  for (const icon of ['common.base:shezhi', 'common.base:xiugai']) {
    assert.ok(page.includes(icon), `演示页缺真实图标 ${icon}`)
  }
  // 回顶图标由 BackToTop 默认提供，不再在 demo 里硬写；这里只查 demo 挂了它
  assert.match(page, /<BackToTop\b/, '演示页没挂 BackToTop')
  assert.doesNotMatch(page, /onClick=\{\(\) => setVisible\(false\)\}/, '点按钮不许连带隐藏整列')
  assert.doesNotMatch(page, /<CellGroup title=/, '演示页分组标题不要')
  assert.doesNotMatch(page, /demo-note/, '演示页底部说明不要')
  for (const label of ['位置', '显隐', '大小', '描边', '圆角', '背景']) {
    assert.ok(page.includes(`title="${label}"`), `演示页缺「${label}」配置 cell`)
  }
  assert.doesNotMatch(page, /title="底色"/, '底色不让选，用默认，想换色自己传 color')
  assert.doesNotMatch(page, /ButtonType/, '演示页不该暴露 type 语义色轴')
  for (const axis of ['variant=', 'size=', 'radius=', 'translucent=']) {
    assert.ok(page.includes(axis), `演示页没透传 Button 轴 ${axis}`)
  }
  assert.match(page, /value: 'pill', label: '纯圆'/, '圆角缺纯圆档')
  assert.match(page, /value: 'xl', label: '大'/, '圆角缺大圆角档')
  assert.match(page, /value: 'md', label: '中'/, '圆角缺中圆角档')
  assert.match(page, /value: 'sm', label: '小'/, '圆角缺小档')
  assert.match(page, /useState<ButtonVariant>\('outline'\)/, '描边默认不是带描边的 outline')
  assert.match(page, /useState<ButtonRadius>\('md'\)/, '圆角默认不是中号 md')
  assert.match(page, /useState<ButtonSize>\('sm'\)/, '尺寸默认不是 sm')
  assert.match(page, /useState\(true\)/, '半透明默认没开')
  assert.match(page, /pageId="layout"/, '演示页没接自己的 catalog 页')
  assert.match(page, /floating=\{floating\}/, '演示页没把浮层挂到滚动区外')
  assert.ok(exists('../demo/src/pages/layout/index.config.ts'), 'layout 页缺 disableScroll 配置')
  const catalog = read('../demo/src/catalog.ts')
  assert.match(catalog, /id: 'layout'[\s\S]{0,80}path: 'pages\/layout\/index'/, 'catalog 缺 layout 页')
  assert.match(catalog, /id: 'layout', label: 'FloatingAction 浮动按钮', status: 'ready', pageId: 'layout'/, 'layout 菜单没翻 ready 或没改成可识别的名字')

  // 文档：API 契约已建，索引已挂
  assert.ok(exists('../docs/api/floating-action.md'), '缺 API 文档')
  assert.match(read('../docs/README.md'), /floating-action\.md/, '文档索引缺 floating-action')
})

test('自动回顶：阈值变化即重算、一次节点命令回顶、无逐帧无受控（不蹦不残影）', () => {
  // 组件级出口与子域 barrel
  const barrel = read('../dist/ui/layout/index.js')
  for (const name of ['BackToTop', 'useBackToTop', 'scrollViewToTop']) {
    assert.match(barrel, new RegExp(name), `layout barrel 缺 ${name}`)
  }
  assert.match(read('../dist/ui/layout/index.d.ts'), /BackToTopProps/, 'layout barrel 缺 BackToTopProps 类型')
  assert.match(read('../dist/ui/layout/index.d.ts'), /UseBackToTopOptions/, 'layout barrel 缺 UseBackToTopOptions 类型')
  assert.doesNotMatch(read('../dist/ui/layout/index.js'), /useBackTopScroll/, '逐帧钩子 useBackTopScroll 应删除（会来回蹦）')
  assert.doesNotMatch(read('../dist/ui/layout/index.js'), /BACK_TO_TOP_DURATION/, '旧导出 BACK_TO_TOP_DURATION 应删除')
  assert.match(read('../dist/ui/layout/floating-action/index.js'), /scrollViewToTop/, '组件级出口缺 scrollViewToTop')

  const src = read('../src/ui/layout/floating-action/BackToTop.tsx')
  assert.match(src, /<FloatingAction\b/, '没复用 FloatingAction 壳')
  assert.doesNotMatch(src, /from ['"].*Button/, '不许直接 import Button，要走壳')
  assert.match(src, /icon="common\.base:huidingbu"/, '回顶默认图标丢了')
  // 阈值钩子：翻转短路 + 阈值变化时用 lastTop 立即重算
  assert.match(src, /top >= visibilityHeight/, '阈值显隐判断缺失')
  assert.match(src, /visibilityHeight = 300/, '阈值默认不是 300')
  assert.match(src, /if \(next === reached\.current\) return/, '缺阈值翻转短路，会每帧 setState')
  assert.match(src, /lastTop\.current = top/, '没记录最后滚动位置')
  assert.match(src, /lastTop\.current >= visibilityHeight/, '阈值变化没用最后位置重算 —— 配置改了不生效')
  assert.match(src, /\[visibilityHeight\]/, '重算 effect 没依赖 visibilityHeight')
  // 一次命令，无逐帧无受控；瞬间档 animated:false、动画档 animated:true+duration
  assert.match(src, /function scrollViewToTop/, '缺一次回顶命令')
  assert.match(src, /duration <= 0/, '缺瞬间档分支')
  assert.match(src, /scrollTo\?\.\(\{ top: 0, animated: false \}\)/, '瞬间档没关动画 —— 安卓会照播默认动画')
  assert.match(src, /scrollTo\?\.\(\{ top: 0, animated: true, duration \}\)/, '动画档不是一次命令')
  assert.doesNotMatch(src, /setTimeout|setInterval|requestAnimationFrame/, '不许逐帧 —— 逐帧命令会让视图层来回蹦')
  assert.doesNotMatch(src, /driveTop|setDriveTop/, '不许有 driveTop state —— 受控 scrollTop 会回弹过山车')
  assert.doesNotMatch(src, /from ['"]@tarojs\/taro['"]/, '不许 import Taro')
  assert.doesNotMatch(src, /createSelectorQuery|pageScrollTo/, '不许自己查节点')
  assert.doesNotMatch(src, /onScrollTopChange/, '旧逐帧回调还在')

  // 演示页：点一次发一次命令，节点缓存，零逐帧零受控
  const page = read('../demo/src/pages/layout/index.tsx')
  assert.match(page, /<BackToTop\b/, '演示页没挂 BackToTop')
  assert.match(page, /useBackToTop\(/, '演示页没用阈值钩子')
  assert.match(page, /scrollViewToTop\(node, Number\(backDuration\)\)/, '没用一次回顶命令接时长配置')
  assert.match(page, /nodeRef\.current/, '节点没缓存')
  assert.doesNotMatch(page, /useBackTopScroll|setTimeout|animateToTop/, '演示页残留逐帧逻辑 —— 会来回蹦')
  assert.doesNotMatch(page, /scrollTop=\{/, '演示页不能把任何值绑到 scrollTop —— 会回弹过山车')
  for (const label of ['回顶阈值', '回顶动画']) {
    assert.ok(page.includes(`title="${label}"`), `演示页缺「${label}」配置 cell`)
  }
  const shell = read('../demo/src/components/DemoShell.tsx')
  assert.doesNotMatch(shell, /scrollTop=\{scrollTop\}/, '外壳不能受控 scrollTop —— 回弹根因')
  assert.match(shell, /onScrollTop\?\.\(event\.detail\.scrollTop\)/, '外壳没只读回传滚动位置')
  assert.match(shell, /enhanced/, '滚动区没开 enhanced，节点 scrollTo 不生效')

  // 文档与索引
  const doc = read('../docs/api/back-to-top.md')
  assert.ok(exists('../docs/api/back-to-top.md'), '缺 API 文档')
  assert.match(read('../docs/README.md'), /back-to-top\.md/, '文档索引缺 back-to-top')
  assert.match(doc, /onScrollTopChange/, '文档没交代旧 API 废弃原因')
  assert.match(doc, /仅 iOS|安卓/, '文档没交代平台 scrollTo duration 的限制')
  assert.match(doc, /来回蹦|过山车/, '文档没交代逐帧方案废弃原因')
  assert.match(doc, /scrollViewToTop/, '文档示例缺一次回顶命令')
})

test('Dialog 独立展示页用 alert / confirm，并沿用 Popup 页的配置驱动写法', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)

  const page = mod.exports.catalogPages.find((item) => item.id === 'dialog')
  assert.ok(page, '缺 Dialog 独立展示页')
  assert.equal(page.path, 'pages/dialog/index')
  assert.deepEqual(page.examples.map((item) => item.id), [
    'config', 'alert', 'confirm', 'custom-actions', 'busy',
  ])
  const entries = mod.exports.menu.flatMap((group) => group.entries)
  assert.equal(entries.find((item) => item.id === 'dialog')?.pageId, 'dialog', 'Dialog 菜单没指向自己的页')
  const actionSheet = entries.find((item) => item.id === 'action-sheet')
  assert.equal(actionSheet?.status, 'planned', 'ActionSheet 仍是未实现占位')
  assert.equal(actionSheet?.pageId, undefined, 'planned 条目不应绑跳转')

  const demo = read('../demo/src/pages/dialog/index.tsx')
  assert.match(demo, /from 'mp-taro-kit\/ui\/commands\/dialog'/, 'Dialog 页没从对话框子入口引命令')
  assert.match(demo, /\balert\(/, 'Dialog 页没演 alert')
  assert.match(demo, /\bconfirm\(/, 'Dialog 页没演 confirm')
  assert.match(demo, /<CellGroup>\s*<Cell\s+title="宽度"/, '配置页应是两个无标题 Cell')
  assert.doesNotMatch(demo, /<CellGroup title="几何"|title="按钮形态"/, '配置页不该有分组标题或形态滑块')
  assert.doesNotMatch(demo, /id === 'actions'/, '合并实验已撤回，不该再有聚合示例块')
  for (const id of ['alert', 'confirm', 'custom-actions', 'busy']) {
    assert.ok(demo.includes(`id === '${id}'`), `缺独立示例分支 ${id}`)
  }
  assert.match(demo, /<DemoBlock example=\{config\}>/, '顶部配置仍单独成卡')
  assert.match(demo, /cases\.map\(\(example\) => \([\s\S]*<DemoBlock key=\{example\.id\}/, '四个示例各自独立成卡')
  assert.doesNotMatch(demo, /<Card className="demo-block">|<CardHead/, '不该再把示例合成一张多标题卡')
  assert.match(demo, /onConfirm:/, 'Dialog 页缺异步闸门演示')
  assert.match(demo, /lockExceptions:/, 'Dialog 页缺按钮例外演示')
  const widths = demo.match(/const WIDTHS = \[([\s\S]*?)\] as const/)
  assert.ok(widths, 'Dialog 页缺宽度档')
  assert.deepEqual(
    [...widths[1].matchAll(/value: '([^']+)'/g)].map((item) => item[1]),
    ['560rpx', '640rpx', '720rpx'],
    '宽度档按 560 / 640 / 720 排，640 居中',
  )
  assert.doesNotMatch(demo, /title="头部"|const HEADERS|HeaderMode|headerOptions/, '顶部配置区不该再有头部滑块')
  assert.match(demo, /popup-header-rise-up\.png/, '图片头没用上延伸示例图')
  assert.doesNotMatch(demo, /headerImage:\s*\{\s*src:\s*HEADER_IMAGE,\s*width:/, '图片头不该写死宽度，应与 Popup 一样铺满')
  assert.doesNotMatch(demo, /已关闭|Promise 解析|demo-note/, '演示站只展示效果，不展示调用结果文案')
  assert.doesNotMatch(demo, /id === 'layout'|openShape/, '不该再有独立形态示例块')
  assert.doesNotMatch(demo, /openAlert\(|openTyped\(/, 'alert 旧按钮已由配置区替代，不该残留')
  for (const type of ['success', 'error', 'warning', 'info']) {
    assert.ok(demo.includes(`value: '${type}'`), `alert 缺固定类型 ${type}`)
  }
  assert.match(demo, /title="按钮"/, '配置区缺按钮形态 cell')
  assert.match(demo, /title="内置 icon"/, '配置区缺内置 icon cell')
  assert.equal((demo.match(/title="按钮"/g) ?? []).length, 1, '配置区应抽成一份共用，不重复写三遍')
  assert.equal((demo.match(/title="内置 icon"/g) ?? []).length, 1, '内置 icon 配置应抽成一份共用')
  assert.equal((demo.match(/useState<ButtonLayout>\('spaced'\)/g) ?? []).length, 2, 'alert 与自定义按钮默认横排')
  assert.match(demo, /useState<ButtonLayout>\('joined'\)/, 'confirm 默认竖线，与库不传参口径一致')
  assert.equal((demo.match(/useState<DialogType>\('info'\)/g) ?? []).length, 3, '三块内置 icon 各自独立，默认信息')
  for (const label of ['默认', 'icon外伸', '信息头', '图片头']) {
    assert.ok(demo.includes(`>${label}</Button>`), `配置区缺 ${label} 按钮`)
  }
  assert.match(demo, /headerImage: \{ src: HEADER_IMAGE, offset: \{ top: -30 \}, naturalWidth: 1080, naturalHeight: 587 \}/, '图片头按钮该带延伸示例图与原始尺寸')
  assert.doesNotMatch(demo, /size="xs"\s+onClick=\{\(\) => open\(/, '配置区按钮走默认型号，不用 XS')
  for (const kind of ['alert', 'confirm', 'custom']) {
    assert.ok(demo.includes(`openVariant('${kind}'`), `${kind} 未接共用配置区`)
  }
  assert.match(demo, /confirmText: '完成'/, 'alert 默认样式不该有正确/不正确语义')
  assert.match(demo, /mode === 'default' \? null : \{ type \}/, '默认样式是纯标题+内容+按钮，不带图标')
  assert.doesNotMatch(demo, /layoutRow\(|openConfirm\(|openCustomActions\(/, '旧形态按钮行不该残留')
  assert.doesNotMatch(demo, /compact/, '页面按钮不该再有尺寸差异标记')
  assert.match(demo, /onClick=\{openBusy\}>异步<\/Button>/, '第一个按钮是异步')
  assert.match(demo, /onClick=\{openBusyBlock\}>异步屏蔽<\/Button>/, '第二个按钮是异步屏蔽')
  assert.match(demo, /onClick=\{openBusyExempt\}>异步例外<\/Button>/, '第三个按钮是异步例外')
  assert.equal((demo.match(/demo-item" onClick=\{openBusy/g) ?? []).length, 3, '三个异步按钮并排在同一个 demo-row')
  assert.doesNotMatch(demo, /size="xs"\s+onClick=\{openBusy/, '异步按钮走默认型号')
  assert.doesNotMatch(demo, /confirmText: '知道了'|confirmText: '继续'|cancelText: '取消'/, '演示页不该自造按钮文案，走配置默认')
  assert.match(demo, /onAction: \(\) => true/, '稍后按钮点击后应直接关闭')
  assert.doesNotMatch(demo, /title="关闭路径"|title="四向偏移"/, '关闭与偏移不该进演示配置区')
  assert.doesNotMatch(demo, /showToast/, '演示页不再依赖 Toast 命令')
  assert.match(demo, /lockExceptions: \[\]/, '异步屏蔽显式清空默认例外，连取消一起锁')
  assert.match(demo, /lockExceptions: \['later'\]/, '异步例外按 key 放行')
  assert.match(demo, /onAction: \(key\) => key === 'submit'/, '异步例外按动作 key 触发')
  assert.doesNotMatch(demo, /id === 'busy-exempt'/, '白名单例外不该单独成卡，已并入异步块')
  const catalogSource = read('../demo/src/catalog.ts')
  assert.match(catalogSource, /id: 'alert',\s*title: '提示 alert'/, 'alert 示例标题缺英文')
  assert.match(catalogSource, /id: 'confirm',\s*title: '确认 confirm'/, 'confirm 示例标题缺英文')
  const commands = read('../src/ui/commands.ts')
  const dialogHost = read('../src/ui/infra/DialogHost.tsx')
  assert.match(commands, /getKitConfig\(\)\.runtime\.dialog/, '对话框默认按钮没从统一配置读取')
  assert.match(commands, /dialogConfig\.confirmText|dialogConfig\.cancelText/, '默认文案没走配置')
  assert.match(commands, /layout === 'stack' \? \[confirmAction, cancelAction\]/, '竖排没把确定排在取消上面')
  assert.match(commands, /options\.actions === undefined && kind === 'confirm' \? 'joined' : 'spaced'/, 'confirm 默认竖线、自定义按钮默认横排的口径丢了')
  assert.match(commands, /options\.actions\.map\(\(\{ key, text, color \}\)/, 'joined 档自定义按钮没过滤样式轴')
  assert.match(commands, /size: 'md'/, '对话框按钮没跟 Popup 底栏同型号 md')
  assert.match(dialogHost, /size: action\.size/, 'Dialog 按钮尺寸没透传给 ContentPopup 底栏')
  const kitConfig = read('../kit.config.mjs')
  assert.match(kitConfig, /"dialog": \{/, '统一配置缺 dialog 默认按钮段')
  assert.match(kitConfig, /"confirmText": "确定"/, '确定文案默认不是「确定」')
  assert.match(kitConfig, /"cancel": \{[\s\S]*?"variant": "soft"/, '取消按钮默认不是 Button 的 soft 浅底档')
  assert.match(demo, /variant: 'soft'/, '稍后按钮没走 soft 浅底档')
  assert.match(commands, /layout === 'joined' \? undefined : variant/, 'joined 档被配置 variant 覆盖，丢了原有 ghost 外观')
  assert.doesNotMatch(demo, /POSITIONS|setPosition|title="位置"/, '演示站只支持中部，不提供位置选择')
  assert.match(commands, /position\?: ContentPopupPosition/, 'API 仍保留 position 给需要自己折腾的调用方')
  assert.doesNotMatch(demo, /<Dialog\b/, 'Dialog 页不该再演声明式 Dialog')
  assert.equal(exists('../demo/src/pages/dialog/index.config.ts'), true, '缺新页的 disableScroll 配置')
})
