import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as cardState from '../dist/ui/card/state.js'
import * as cellState from '../dist/ui/display/cell/state.js'
import { hasCardEdgeContent } from '../dist/ui/card/edge.js'
import { CARD_EDGE_CONTENT, markCardEdgeContent } from '../dist/ui/infra/card-edge.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

/** 从编译产物里取一条规则与某条声明，核对布局数值，而不是只查字符串出现过。 */
function ruleOf(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match ? match[1] : ''
}

function declOf(rule, property) {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`).exec(rule)
  return match ? match[1].trim() : ''
}

/** 把 catalog.ts 转成 CJS 求值，拿到运行时真源而不是文本猜测。 */
function catalog() {
  const source = readFileSync(new URL('../demo/src/catalog.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const mod = { exports: {} }
  new Function('exports', 'module', outputText)(mod.exports, mod)
  return mod.exports
}

test('Card 组件级出口、样式出口与卡片族语义键齐全', () => {
  for (const name of ['index.js', 'index.cjs', 'index.d.ts']) {
    assert.ok(exists(`../dist/ui/card/${name}`), `card 组件级出口缺 ${name}`)
  }
  assert.ok(exists('../dist/ui/card/style/index.css'), 'card 组件级样式出口缺失')
  const css = read('../dist/ui/card/style/index.css')
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, '组件 CSS 不许硬编码颜色')
  assert.doesNotMatch(css, /--mp-/, '不许出现旧前缀')
  assert.match(css, /border-top-left-radius:\s*var\(--mptk-card-radius\)/, '四角圆角走语义键')

  for (const radius of ['xs', 'sm', 'md', 'lg', 'xl']) {
    assert.match(
      css,
      new RegExp(`\\.mptk-card--radius-${radius}\\s*\\{[^}]*--mptk-card-radius:\\s*var\\(--mptk-radius-${radius}\\)`),
      `radius=${radius} 修饰类必须只换档位指向`,
    )
  }
  for (const size of ['sm', 'md', 'lg']) {
    assert.ok(css.includes(`.mptk-card--size-${size}`), `缺 size=${size} 修饰类`)
  }
  assert.match(css, /\.mptk-card--frameless\s*\{[^}]*border-top-width:\s*0/, '无边框档要去掉描边')
  assert.doesNotMatch(css, /mptk-card--flush/, 'Card 不该再暴露 flush 形态参数')
  const cellCss = read('../dist/ui/display/cell/style/index.css')
  assert.match(cellCss, /background-color:\s*transparent/, '卡片内组与行底色要透明')
  assert.doesNotMatch(cellCss, /margin-(?:top|bottom):\s*(?:calc\(|-)/, '不许再用负 margin 反抵消父级 padding')
  assert.match(css, /\.mptk-card--edge-content\s*\{/, '贴边形态规则要由 Card 自己提供')
  assert.match(css, /\.mptk-card--cover\s*\{[^}]*padding-top:\s*0/, '有封面时顶部不留白')
  assert.match(css, /\.mptk-card--blue\s*\{[^}]*--mptk-card-bg:\s*var\(--mptk-blue-soft\)/, '内置色走已有的淡色面')
  assert.match(css, /\.mptk-card--header-divider\s+\.mptk-card__header/, '头部分隔线要有规则')
  assert.match(css, /\.mptk-card--pressed\s*\{[^}]*background-color:\s*var\(--mptk-surface-2\)/, '按压态要有反馈')

  const tokens = read('../src/design/_tokens.scss')
  assert.match(tokens, /--mptk-card-radius:\s*var\(--mptk-radius-lg\)/, '默认圆角取容器级最大常规档')
  assert.match(tokens, /--mptk-card-spacing:\s*var\(--mptk-space-3\)/, '分区间距只写一次')
  for (const mode of ['light', 'dark', 'runtime']) {
    const theme = read(`../dist/styles/theme-${mode}.css`)
    assert.match(theme, /--mptk-card-bg:\s*var\(--mptk-surface-1\)/, `${mode} 缺卡片面色键`)
    assert.match(theme, /--mptk-card-border:\s*var\(--mptk-border\)/, `${mode} 缺卡片描边键`)
  }
})

test('Card 状态：枚举派生、颜色双路、点击与等待态', () => {
  const base = cardState.resolveCardState({})
  assert.match(base.className, /mptk-card--size-md/, '默认 md 档')
  assert.doesNotMatch(base.className, /mptk-card--radius-/, '不给 radius 就走默认语义键')
  assert.equal(base.clickable, false)
  assert.equal(base.hoverClassName, 'none')
  assert.equal(base.busy, false)
  assert.equal(base.inlineColor, undefined)

  const shaped = cardState.resolveCardState({
    radius: 'xl', size: 'lg', frame: false, headerDivider: true,
    color: 'blue', hasCover: true, onClick: () => {}, loading: true,
  })
  for (const name of [
    'mptk-card--radius-xl', 'mptk-card--size-lg', 'mptk-card--frameless',
    'mptk-card--header-divider', 'mptk-card--cover', 'mptk-card--blue', 'mptk-card--busy',
    'mptk-card--clickable',
  ]) {
    assert.ok(shaped.className.includes(name), `派生类缺 ${name}`)
  }
  assert.equal(shaped.clickable, true)
  assert.equal(shaped.hoverClassName, 'mptk-card--pressed')
  assert.equal(shaped.busy, true)
  assert.equal(shaped.inlineColor, undefined, '内置色名不产生内联色值')

  assert.deepEqual(cardState.resolveCardColor('teal'), {
    className: 'mptk-card--teal', inlineColor: undefined,
  })
  assert.deepEqual(cardState.resolveCardColor('#f0e6ff'), {
    className: '', inlineColor: '#f0e6ff',
  }, '自定义色值必须走内联，口子不能关')
  assert.deepEqual(cardState.resolveCardColor(undefined), { className: '', inlineColor: undefined })

  const disabled = cardState.resolveCardState({ onClick: () => {}, disabled: true })
  assert.equal(disabled.clickable, false, 'disabled 要短路回调')
  assert.match(disabled.className, /mptk-card--disabled/)

  assert.deepEqual(cardState.CARD_RADII, ['xs', 'sm', 'md', 'lg', 'xl'])
  assert.deepEqual(cardState.CARD_SIZES, ['sm', 'md', 'lg'])
  assert.ok(cardState.CARD_COLORS.includes('neutral'))
  assert.equal(cardState.CARD_COLORS.length, 9, 'neutral + 8 支色相')
})

test('Card 与 CellGroup 组合：上下文自动收敛，消费方零参数', () => {
  const inside = cellState.resolveCellGroupState({ inCard: true })
  assert.equal(inside.outerBorder, false, '装在卡片里不画上下外框')
  assert.match(inside.className, /mptk-cell-group--in-card/)
  const outside = cellState.resolveCellGroupState({})
  assert.equal(outside.outerBorder, true, '单独使用仍画上下外框')
  assert.doesNotMatch(outside.className, /--in-card/)
  assert.equal(cellState.resolveCellGroupState({ inCard: true, inset: true }).outerBorder, false)

  const context = read('../src/ui/infra/card-context.ts')
  assert.match(context, /createContext/, '上下文真源要用 createContext')
  assert.match(context, /inCard/, '上下文只表达「在卡片里」')
  assert.match(read('../src/ui/card/Card.tsx'), /CardSurfaceContext\.Provider/, 'Card 要提供上下文')
  assert.match(read('../src/ui/display/cell/CellGroup.tsx'), /useCardSurface\(\)/, 'CellGroup 要消费上下文')
  assert.doesNotMatch(
    read('../src/ui/card/Card.tsx'),
    /flush/,
    'Card 不该再把形态参数推给消费方',
  )
  assert.match(
    read('../src/ui/card/Card.tsx'),
    /hasCardEdgeContent\(body\)/,
    'Card 要在渲染期识别贴边内容',
  )
  assert.match(
    read('../src/ui/display/cell/CellGroup.tsx'),
    /markCardEdgeContent\(CellGroup\)/,
    'CellGroup 要声明自己是贴边内容',
  )
})

test('贴边留白由 Card 侧决定：渲染期识别 + 纯 CSS 归零，不靠子级抵消', () => {
  const Edge = markCardEdgeContent(() => null)
  assert.equal(Edge[CARD_EDGE_CONTENT], true, '声明要落在组件本身')
  assert.equal(markCardEdgeContent(Edge), Edge, '声明不能包一层改变组件身份')
  assert.equal(hasCardEdgeContent({ type: Edge, props: {} }), true, '直接子要识别')
  assert.equal(
    hasCardEdgeContent({ type: 'div', props: { children: [{ type: Edge, props: {} }] } }),
    true,
    '嵌套一层 View 也要识别',
  )
  assert.equal(hasCardEdgeContent({ type: 'div', props: {} }), false, '普通内容不贴边')
  assert.equal(hasCardEdgeContent('文字'), false)
  assert.equal(hasCardEdgeContent(null), false)

  assert.doesNotMatch(
    cardState.resolveCardState({}).className,
    /mptk-card--edge-content/,
    '普通内容保留默认留白',
  )
  assert.match(
    cardState.resolveCardState({ hasEdgeContent: true }).className,
    /mptk-card--edge-content/,
    '贴边内容要让壳关掉留白',
  )

  const cardCss = read('../dist/ui/card/style/index.css')
  const cellCss = read('../dist/ui/display/cell/style/index.css')
  assert.equal(declOf(ruleOf(cardCss, '.mptk-card'), 'padding-top'), 'var(--mptk-card-spacing)', '普通内容仍由壳给留白')
  assert.equal(declOf(ruleOf(cardCss, '.mptk-card--edge-content'), 'padding-top'), '0', '贴边时壳顶部必须是字面量 0，不吃渲染端支持度')
  assert.equal(declOf(ruleOf(cardCss, '.mptk-card--edge-content'), 'padding-bottom'), '0', '贴边时壳底部必须是字面量 0')
  assert.equal(declOf(ruleOf(cellCss, '.mptk-cell'), 'padding-top'), 'var(--mptk-space-3)', '行自己的上留白仍是唯一一份')
  assert.equal(declOf(ruleOf(cellCss, '.mptk-cell'), 'padding-bottom'), 'var(--mptk-space-3)')
  assert.doesNotMatch(cellCss, /margin-(?:top|bottom):\s*calc\(/, '子级不再反抵消')

  /* 卡片内列表默认左右不到头：组给一档留白、行归零，卡片 body 不再叠一道。 */
  assert.equal(
    declOf(ruleOf(cellCss, '.mptk-cell-group--in-card .mptk-cell-group__body'), 'padding-left'),
    'var(--mptk-space-4)',
    '卡片内列表的左右留白由组统一给',
  )
  assert.match(
    cellCss,
    /\.mptk-cell-group--in-card \.mptk-cell\s*\{[^}]*padding-left:\s*0/,
    '卡片内的行不再自己留左右白',
  )
  assert.equal(
    declOf(ruleOf(cardCss, '.mptk-card--edge-content .mptk-card__body'), 'padding-left'),
    '0',
    '贴边时卡片 body 不再叠一道左右留白',
  )

  const tokens = read('../src/design/_tokens.scss')
  assert.match(tokens, /--mptk-card-spacing:\s*var\(--mptk-space-3\)/)
  assert.match(tokens, /--mptk-space-3:\s*12px/, '贴边后顶部只剩这一份 12px，不再叠成 24px')
})

test('Card 契约在宿主真类型环境下可作为 JSX 组件使用', () => {
  const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const probe = resolve(root, 'src/__probe-card.tsx')
  const entry = JSON.stringify(resolve(root, 'dist/ui/card/index'))
  const source = `import { Card } from ${entry};
import type { CardProps, CardRadius, CardSize, CardColor, BuiltinCardColor } from ${entry};
const radius: CardRadius = 'xl';
const size: CardSize = 'lg';
const builtin: BuiltinCardColor = 'teal';
const custom: CardColor = '#f0e6ff';
const props: CardProps = { radius, size, color: custom, frame: false, headerDivider: true, onClick: () => {} };
export const element = (
  <Card {...props} cover="封面" title="标题" subtitle="描述" extra="更多" footer="底部" color={builtin} loading loadingContent="加载中">主体</Card>
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

test('演示站圆角与字号全走抽象档位，不手写值', () => {
  const scss = read('../demo/src/app.scss')
  assert.doesNotMatch(scss, /font-size:\s*\d+px/, '演示站不许手写 font-size')
  assert.doesNotMatch(scss, /\bline-height:\s*1\s*;/, '演示站不许手写 line-height: 1')
  assert.doesNotMatch(scss, /border-radius:\s*0\s*;/, '演示站不许手写 border-radius: 0')
  assert.match(scss, /font-size:\s*var\(--mptk-font-display\)/, '展示级字号要取档位')
  assert.match(scss, /border-radius:\s*var\(--mptk-radius-none\)/, '零圆角也要取档位')
  const tokens = read('../src/design/_tokens.scss')
  assert.match(tokens, /--mptk-font-display:\s*96px/, '96px 只在 design 层写一次')
  assert.match(tokens, /--mptk-radius-none:\s*0/, '零圆角档位只在 design 层写一次')
})

test('Card 菜单指向自己的展示页，业务占位让出通用容器名', () => {
  const { menu, catalogPages, appPages } = catalog()
  const entries = menu.flatMap((group) => group.entries)
  const card = entries.find((entry) => entry.id === 'card')
  assert.equal(card?.status, 'ready')
  assert.equal(card.pageId, 'card')
  const product = entries.find((entry) => entry.id === 'product-card')
  assert.equal(product?.status, 'planned', '业务向商品卡片仍占位，不与通用容器撞名')
  assert.ok(catalogPages.some((page) => page.id === 'card'), '缺 Card 展示页')
  assert.equal(appPages.length, catalogPages.length + 1, '路由要含新增的展示页')

  const page = catalogPages.find((item) => item.id === 'card')
  const source = read('../demo/src/pages/card/index.tsx')
  for (const example of page.examples) {
    assert.ok(source.includes(`id === '${example.id}'`), `Card 页缺 ${example.id} 的渲染分支`)
  }
  assert.match(source, /color="#f0e6ff"/, '自定义色值口子要有演示')
  assert.doesNotMatch(source, /ui\/display\/cell/, 'Card 页不许向下引用 Cell 子域')
  assert.doesNotMatch(source, /<Card\s+flush|<Card\s+variant/, '组合不许让消费方传形态参数')
  assert.ok(
    page.examples.every((example) => example.imports.every((path) => !path.includes('display/cell'))),
    'Card 页示例不许把 Cell 列进 imports',
  )
  assert.ok(exists('../demo/src/pages/card/index.config.ts'), 'Card 页缺 disableScroll 配置')
  assert.deepEqual(
    [...new Set(page.examples.map((example) => example.section))],
    ['一 · 容器形态', '二 · 外观设置', '三 · 槽位与状态'],
    'Card 页按三组顺序铺开',
  )
})

test('Cell 展示页演示与 Card 的零参数组合，CellGroup 兼容形态仍在', () => {
  const { catalogPages } = catalog()
  const display = catalogPages.find((page) => page.id === 'display')
  const combo = display.examples.find((example) => example.id === 'cell-with-card')
  assert.equal(combo?.section, '五 · 与 Card 组合', '组合示例归引用方、放在该页最后一组')
  assert.match(combo.usage, /<Card>/, '组合示例要零参数')
  const cardPage = catalogPages.find((item) => item.id === 'card')
  assert.equal(cardPage.examples.some((example) => example.id === 'card-cell'), false, 'Card 页不列举与 Cell 的组合')
  assert.doesNotMatch(combo.usage, /flush|variant/, '组合示例不许带形态参数')
  const page = read('../demo/src/pages/display/index.tsx')
  assert.match(page, /<Card>/, '组合示例要真的渲染')
  assert.doesNotMatch(page, /<Card flush>/, '组合示例不许再传 flush')
  assert.match(page, /<CellGroup inset>/, '旧 inset 兼容形态不能悄悄消失')
})
