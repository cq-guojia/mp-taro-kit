import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as ui from '../dist/ui/index.js'
import * as cellState from '../dist/ui/display/cell/state.js'

const require = createRequire(import.meta.url)
const cjs = require('../dist/ui/index.cjs')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

test('图标基础类不写死 font-size，生成物与发布产物都遵守', () => {
  for (const relative of [
    '../src/ui/icon/base/style/index.scss',
    '../dist/ui/icon/base/style/index.css',
    '../dist/ui/icon/style/index.css',
  ]) {
    const rule = read(relative).match(/\.mptk-icons-base\s*\{([^}]*)\}/)
    assert.ok(rule, `${relative} 找不到图标基础类规则`)
    assert.match(rule[1], /font-family/, `${relative} 基础类必须保留 font-family`)
    assert.doesNotMatch(rule[1], /font-size/, `${relative} 基础类不应写死 font-size`)
  }
  assert.match(read('../scripts/icons.mjs'), /stripBaseFontSize/, '生成器必须剥离平台产物的基础类字号')
})

test('图标分包：base 包有独立三件套，旧出口只做转发', () => {
  for (const relative of [
    '../src/ui/icon/base/index.ts',
    '../src/ui/icon/base/names.ts',
    '../src/ui/icon/base/style/index.scss',
  ]) {
    assert.ok(exists(relative), `${relative} 缺失`)
  }
  assert.match(read('../scripts/icons.mjs'), /const SOURCES = \[/, '生成器必须按包列表生成')
  assert.match(read('../src/ui/icon/index.ts'), /base\/index\.js/, '旧 JS 出口须转发到 base')
  assert.match(read('../src/ui/icon/style/index.scss'), /@use '\.\.\/base\/style\/index'/, '旧样式出口须转发到 base')
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
    /--mptk-surface-base:\s*#fff|@media \(prefers-color-scheme: dark\)/,
    '固定暗不得铺明色值，也不得跟系统走',
  )
  assert.match(dark, /--mptk-fg:\s*#e6e8eb/, '固定暗必须含暗色值')
  assert.match(auto, /--mptk-surface-base:\s*#fff/, '跟随系统默认明')
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

test('七个子域出口与样式实体齐全，产物只指向 peer 不打包平台包', () => {
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout', 'form']) {
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
  for (const domain of ['infra', 'actions', 'feedback', 'display', 'navigation', 'layout', 'form']) {
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
  new Function('exports', 'module', outputText)(mod.exports, mod)
  const { menu, catalogPages, appPages } = mod.exports

  assert.ok(Array.isArray(menu) && menu.length === 9, '菜单必须是固定九组')
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
    'mptk-cell--clickable',
    'mptk-cell__divider',
    'mptk-cell__arrow--down',
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
  assert.equal(cellState.cellDividerVisible(true, 0, 2), true)
  assert.equal(cellState.cellDividerVisible(true, 2, 2), false)
  assert.equal(cellState.cellDividerVisible(false, 0, 2), false)
})

test('cell 契约在宿主真类型环境下可作为 JSX 组件使用', () => {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const probe = resolve(root, 'src/__probe-cell.tsx')
  const entry = JSON.stringify(resolve(root, 'dist/ui/display/cell/index'))
  const source = `import { Cell, CellGroup } from ${entry};
import type { CellProps, CellGroupProps, CellSize, CellArrowDirection } from ${entry};
const size: CellSize = 'large';
const direction: CellArrowDirection = 'down';
const cellProps: CellProps = { title: '单元格' };
const groupProps: CellGroupProps = { inset: true };
export const element = (
  <CellGroup {...groupProps} title="分组" border={false}>
    <Cell {...cellProps} label="描述" value="内容" icon="图标" rightIcon="右图标" extra="额外" center border size={size} isLink arrowDirection={direction} disabled onClick={() => {}} className="x">自定义值</Cell>
    <CellGroup title="第二组"><Cell title="独立" /></CellGroup>
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
  new Function('exports', 'module', outputText)(mod.exports, mod)
  const { menu, catalogPages } = mod.exports
  const cell = menu.flatMap((group) => group.entries).find((entry) => entry.id === 'cell')
  assert.equal(cell.status, 'ready')
  assert.equal(cell.pageId, 'display')
  const display = catalogPages.find((page) => page.id === 'display')
  const expected = [
    'cell-basic',
    'cell-inset',
    'cell-size',
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

test('演示站只演示形态：不渲染代码，通栏示例页裸展示', () => {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', outputText)(mod.exports, mod)
  const display = mod.exports.catalogPages.find((page) => page.id === 'display')
  assert.equal(display.bare, true, '展示页必须裸展示，通栏才不会被演示卡片包住')
  const block = read('../demo/src/components/DemoBlock.tsx')
  assert.doesNotMatch(block, /example\.usage|example\.imports/, '演示站不得再渲染代码')
})

test('演示站组件之间必须留空隙：每个组件都带 demo-item，且不用 gap', () => {
  const scss = read('../demo/src/app.scss')
  assert.match(scss, /\.demo-item\s*\{[^}]*margin-right:\s*var\(--mptk-space-3\)/, '缺 demo-item 右侧间距')
  assert.match(scss, /\.demo-item\s*\{[^}]*margin-bottom:\s*var\(--mptk-space-3\)/, '缺 demo-item 下方间距')
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
