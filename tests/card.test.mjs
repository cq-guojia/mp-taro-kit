import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import * as cardState from '../dist/ui/card/state.js'
import * as cellState from '../dist/ui/display/cell/state.js'
import {
  cardStartsWithSectionHead,
  decorateCardEdgeChildren,
  hasCardEdgeContent,
  hasCardSectionHead,
  isCardEdgeElement,
} from '../dist/ui/card/edge.js'
import {
  CARD_EDGE_CONTENT,
  CARD_EDGE_LINES_PROP,
  markCardEdgeContent,
  markCardSectionHead,
} from '../dist/ui/infra/card-edge.js'
import { resolveCssVars, catalogModuleStub } from './helpers/kit-config.mjs'

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
  const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)
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
  new Function('exports', 'module', 'require', outputText)(mod.exports, mod, catalogModuleStub)
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

  for (const radius of ['none', 'xs', 'sm', 'md', 'lg', 'xl']) {
    assert.match(
      css,
      new RegExp(`\\.mptk-card--radius-${radius}\\s*\\{[^}]*--mptk-card-radius:\\s*var\\(--mptk-radius-${radius}\\)`),
      `radius=${radius} 修饰类必须只换档位指向`,
    )
  }
  for (const size of ['sm', 'md', 'lg']) {
    assert.ok(css.includes(`.mptk-card--size-${size}`), `缺 size=${size} 修饰类`)
  }

  /* 形态一轴四种组合：面与边各自开合，不再靠 frame 布尔开关拼。 */
  assert.equal(
    resolveCssVars(declOf(ruleOf(css, '.mptk-card--filled'), 'border-top-width')),
    '0',
    'filled 只有面，四边描边要归零',
  )
  assert.equal(
    declOf(ruleOf(css, '.mptk-card--filled'), 'background-color'),
    '',
    'filled 不该自己画面，底色仍由 --mptk-card-bg 决定',
  )
  const outline = ruleOf(css, '.mptk-card--outline')
  assert.equal(declOf(outline, 'background-color'), 'transparent', 'outline 只有边，底要透给页面')
  assert.equal(declOf(outline, 'border-top-color'), 'var(--mptk-card-accent)', 'outline 的边色取 accent，色值才有处落')
  const plain = ruleOf(css, '.mptk-card--plain')
  assert.equal(declOf(plain, 'background-color'), 'transparent', 'plain 没有面')
  assert.equal(resolveCssVars(declOf(plain, 'border-top-width')), '0', 'plain 也没有边')
  assert.doesNotMatch(css, /mptk-card--frameless/, 'frame 布尔开关已由 variant 取代，不留双口径')

  assert.doesNotMatch(css, /mptk-card--flush/, 'Card 不该再暴露 flush 形态参数')
  const types = read('../dist/ui/card/index.d.ts')
  assert.doesNotMatch(types, /\b(title|subtitle|extra|headerDivider)\??:/, 'CardProps 不再支持老标题槽位与头部线，老写法必须报错')
  const cellCss = read('../dist/ui/display/cell/style/index.css')
  assert.doesNotMatch(cellCss, /margin-(?:top|bottom):\s*(?:calc\(|-)/, '不许再用负 margin 反抵消父级 padding')
  assert.match(css, /\.mptk-card--edge-top\s*\{/, '贴边归零要按端提供，规则归 Card')
  assert.match(css, /\.mptk-card--edge-bottom\s*\{/, '贴边归零要按端提供，规则归 Card')
  assert.match(resolveCssVars(css), /\.mptk-card--cover\s*\{[^}]*padding-top:\s*0/, '有封面时顶部不留白')

  /* 色名两处落点：底色走软色，边色走同色相实色；两条路都只换变量。 */
  const blue = ruleOf(css, '.mptk-card--blue')
  assert.equal(declOf(blue, '--mptk-card-bg'), 'var(--mptk-blue-soft)', '内置色走已有的淡色面')
  assert.equal(declOf(blue, '--mptk-card-accent'), 'var(--mptk-blue)', '只有边的形态要拿到同色相实色')

  assert.doesNotMatch(css, /\.mptk-card__header/, 'Card 不再提供 header 结构类名')
  assert.doesNotMatch(css, /mptk-card--header-divider/, 'Card 不再派生头部线')
  const footerRule = ruleOf(css, '.mptk-card--footer-divider .mptk-card__footer')
  assert.equal(declOf(footerRule, 'border-top-color'), 'var(--mptk-border)', '底部分隔线与段间线同档深色')
  assert.equal(declOf(footerRule, 'padding-top'), 'var(--mptk-space-2)', '线到内容一档小间距，与段头对称')

  const heading = ruleOf(css, '.mptk-card__title')
  assert.equal(declOf(heading, 'font-size'), 'var(--mptk-font-lg)', '标题取字号档 lg')
  const subtitle = ruleOf(css, '.mptk-card__subtitle')
  assert.equal(declOf(subtitle, 'font-size'), 'var(--mptk-font-xs)', '说明比正文低一档，取字号档 xs')
  assert.equal(declOf(subtitle, 'line-height'), 'var(--mptk-line-xs)', '说明行高同档')

  /* 标题块就是原来的头部：左右缩进与下边框一处不少；上下间距归上下两条线。 */
  assert.match(css, /\.mptk-card-head\s*\{/, '标题块要有独立块')
  assert.equal(declOf(ruleOf(css, '.mptk-card-head'), 'margin-bottom'), '', '基础标题块不自带下间距，归下线')
  assert.equal(declOf(ruleOf(css, '.mptk-card-head'), 'margin-top'), '', '基础标题块不自带上间距，归上线')
  assert.equal(declOf(ruleOf(css, '.mptk-card-head'), 'padding-bottom'), 'var(--mptk-space-2)', '标题与下线之间一档小间距')
  assert.equal(declOf(ruleOf(css, '.mptk-card-head'), 'padding-left'), 'var(--mptk-card-spacing)', '标题文字自己缩进，横线不跟着缩')
  const edgeHead = ruleOf(css, '.mptk-card--edge-content .mptk-card-head')
  assert.equal(declOf(edgeHead, 'margin-bottom'), 'var(--mptk-s-zero)', '贴边列表的首行自带上留白，标题不再叠 margin')
  assert.equal(declOf(edgeHead, 'padding-left'), '', '贴边时标题不再靠覆盖 padding 找缩进')
  assert.equal(declOf(ruleOf(css, '.mptk-card__body'), 'padding-left'), 'var(--mptk-s-zero)', 'body 恒满宽，不随内容类型变')
  assert.equal(declOf(ruleOf(css, '.mptk-card__content'), 'padding-left'), 'var(--mptk-card-spacing)', '普通内容单独缩进一档')
  assert.doesNotMatch(css, /\.mptk-card--edge-content \.mptk-card__body/, 'body 不再有随内容切换的留白规则')
  const topLine = ruleOf(css, '.mptk-card-head--divider-top')
  assert.equal(declOf(topLine, 'border-top-color'), 'var(--mptk-border)', '上线与下线同色')
  assert.equal(declOf(topLine, 'border-top-width'), 'var(--mptk-c-border-w)', '上线与下线同宽')
  assert.equal(declOf(topLine, 'padding-top'), 'var(--mptk-space-2)', '上线到标题一档小间距')
  assert.equal(declOf(topLine, 'margin-top'), 'var(--mptk-card-spacing)', '上一段内容到上线一档卡片间距')
  const headLine = ruleOf(css, '.mptk-card-head--divider')
  assert.equal(declOf(headLine, 'border-bottom-color'), 'var(--mptk-border)', '标题下的横线与原来头部同色')
  assert.equal(declOf(headLine, 'border-bottom-width'), 'var(--mptk-c-border-w)', '标题下的横线与原来头部同宽')
  assert.equal(declOf(headLine, 'margin-bottom'), 'var(--mptk-card-spacing)', '下线到正文一档卡片间距')
  assert.doesNotMatch(css, /\.mptk-card-head\s+\.mptk-card__header/, '标题块不许复用已删除的 header 选择器')

  /* 按压态必须叠在自有底色之上：自定义色值走内联 backgroundColor，换底色会被内联样式压住。 */
  const pressed = ruleOf(css, '.mptk-card--pressed')
  assert.match(
    declOf(pressed, 'background-image'),
    /^linear-gradient\(var\(--mptk-card-press\), var\(--mptk-card-press\)\)$/,
    '按压反馈要叠半透明层，不能换 background-color',
  )
  assert.equal(declOf(pressed, 'background-color'), '', '按压不改底色，否则自定义色值的反馈会失效')

  const tokens = read('../src/design/_tokens.scss')
  assert.match(tokens, /--mptk-card-radius:\s*var\(--mptk-radius-md\)/, '默认圆角与控件同档（md）')
  assert.match(tokens, /--mptk-card-spacing:\s*var\(--mptk-space-3\)/, '分区间距只写一次')
  for (const mode of ['light', 'dark', 'runtime']) {
    const theme = read(`../dist/styles/theme-${mode}.css`)
    assert.match(theme, /--mptk-card-bg:\s*var\(--mptk-surface-1\)/, `${mode} 缺卡片面色键`)
    assert.match(theme, /--mptk-card-border:\s*var\(--mptk-border\)/, `${mode} 缺卡片描边键`)
  }
  const darkPress = read('../dist/styles/theme-dark.css').match(/--mptk-card-press:\s*([^;]+);/)
  assert.ok(darkPress && /rgba\(255, 255, 255/.test(darkPress[1]), '暗色下按压层改为提亮')
})

test('Card 状态：形态派生、颜色双路、点击与等待态', () => {
  const base = cardState.resolveCardState({})
  assert.match(base.className, /mptk-card--surface/, '默认形态是面 + 边')
  assert.match(base.className, /mptk-card--size-md/, '默认 md 档')
  assert.doesNotMatch(base.className, /mptk-card--radius-/, '不给 radius 就走默认语义键')
  assert.equal(base.clickable, false)
  assert.equal(base.hoverClassName, 'none')
  assert.equal(base.busy, false)
  assert.equal(base.inlineStyle, undefined)

  for (const variant of ['surface', 'filled', 'outline', 'plain']) {
    assert.match(
      cardState.resolveCardState({ variant }).className,
      new RegExp(`mptk-card--${variant}(?:\\s|$)`),
      `形态 ${variant} 必须派生自己的类`,
    )
  }

  const shaped = cardState.resolveCardState({
    variant: 'filled', radius: 'none', size: 'lg', footerDivider: true,
    color: 'blue', hasCover: true, onClick: () => {}, loading: true,
  })
  for (const name of [
    'mptk-card--filled', 'mptk-card--radius-none', 'mptk-card--size-lg',
    'mptk-card--footer-divider', 'mptk-card--cover',
    'mptk-card--blue', 'mptk-card--busy', 'mptk-card--clickable',
  ]) {
    assert.ok(shaped.className.includes(name), `派生类缺 ${name}`)
  }
  assert.equal(shaped.clickable, true)
  assert.equal(shaped.hoverClassName, 'mptk-card--pressed')
  assert.equal(shaped.busy, true)
  assert.equal(shaped.inlineStyle, undefined, '内置色名不产生内联样式')

  assert.deepEqual(cardState.resolveCardColor('teal'), {
    className: 'mptk-card--teal', inlineColor: undefined,
  })
  assert.deepEqual(cardState.resolveCardColor('#f0e6ff'), {
    className: '', inlineColor: '#f0e6ff',
  }, '自定义色值必须走内联，口子不能关')
  assert.deepEqual(cardState.resolveCardColor(undefined), { className: '', inlineColor: undefined })

  /* 色值落到该形态真正可见的通道：有面染底、只有边染线、plain 无处可落。 */
  assert.deepEqual(
    cardState.resolveCardState({ color: '#f0e6ff' }).inlineStyle,
    { backgroundColor: '#f0e6ff' },
  )
  assert.deepEqual(
    cardState.resolveCardState({ variant: 'filled', color: '#f0e6ff' }).inlineStyle,
    { backgroundColor: '#f0e6ff' },
  )
  assert.deepEqual(
    cardState.resolveCardState({ variant: 'outline', color: '#f0e6ff' }).inlineStyle,
    { borderColor: '#f0e6ff' },
    'only-edge 形态的色值落到边线上',
  )
  assert.equal(
    cardState.resolveCardState({ variant: 'plain', color: '#f0e6ff' }).inlineStyle,
    undefined,
    'plain 没有面也没有边，不装作生效',
  )
  assert.doesNotMatch(
    cardState.resolveCardState({ variant: 'plain', color: 'blue' }).className,
    /mptk-card--blue/,
    'plain 的内置色名同样不派生',
  )

  assert.doesNotMatch(
    cardState.resolveCardState({}).className,
    /mptk-card--header-divider/,
    '标题线已迁到 CardHead，Card 不再派生头部线',
  )
  assert.match(
    cardState.resolveCardState({ hasFooter: true }).className,
    /mptk-card--footer-divider/,
    '有底部同口径：默认画线',
  )
  assert.doesNotMatch(
    cardState.resolveCardState({ hasFooter: true, footerDivider: false }).className,
    /mptk-card--footer-divider/,
    '底部线同样显式 false 才关',
  )

  const disabled = cardState.resolveCardState({ onClick: () => {}, disabled: true })
  assert.equal(disabled.clickable, false, 'disabled 要短路回调')
  assert.match(disabled.className, /mptk-card--disabled/)

  assert.deepEqual(cardState.CARD_VARIANTS, ['surface', 'filled', 'outline', 'plain'])
  assert.deepEqual(cardState.CARD_RADII, ['none', 'xs', 'sm', 'md', 'lg', 'xl'])
  assert.deepEqual(cardState.CARD_SIZES, ['sm', 'md', 'lg'])
  assert.ok(cardState.CARD_COLORS.includes('neutral'))
  assert.equal(cardState.CARD_COLORS.length, 9, 'neutral + 8 支色相')
})

test('CellGroup 边框全景矩阵：边界提示 × 标题 × 显式 border 的线数与位置', () => {
  /* [上边界提示, 下边界提示, 有无标题, 显式 border, 顶线, 底线, 标题线] —— 逐格钉死，改了任何一格都会红。
     卡片内「有标题」的组：提示给顶线时它落在标题与列表之间（排在标题之后），标题线让位；
     提示不给顶线（紧跟标题栏 / 上一分组）时由标题线补上——两者恒好一条，不会叠成两条。 */
  const grid = [
    [false, false, false, undefined, false, false, false],
    [true, false, false, undefined, true, false, false],
    [false, true, false, undefined, false, true, false],
    [true, true, false, undefined, true, true, false],
    [false, false, true, undefined, false, false, true],
    [true, true, true, undefined, true, true, false],
    [true, false, true, 'top', true, false, false],
    [true, true, true, 'both', true, true, false],
    [true, true, true, 'none', false, false, true],
    [true, true, false, false, false, false, false],
    [true, true, false, 'both', true, true, false],
  ]
  for (const [topHint, bottomHint, hasTitle, border, top, bottom, titleDivider] of grid) {
    const label = `hint=${String(topHint)}/${String(bottomHint)} title=${String(hasTitle)} border=${String(border)}`
    const state = cellState.resolveCellGroupState({
      inCard: true,
      edgeLines: { top: topHint, bottom: bottomHint },
      hasTitle,
      border,
    })
    assert.equal(state.borderTop, top, `${label} 顶线不对`)
    assert.equal(state.borderBottom, bottom, `${label} 底线不对`)
    assert.equal(state.titleDivider, titleDivider, `${label} 标题线不对`)
  }
  /* 通栏：整块自带上下框；显式关掉顶线时，标题与列表之间那条线由标题线补上，不许一起消失。 */
  for (const [border, top, bottom, titleDivider] of [
    [undefined, true, true, false],
    ['none', false, false, true],
    [false, false, false, true],
    ['top', true, false, false],
    ['bottom', false, true, true],
    ['both', true, true, false],
  ]) {
    const state = cellState.resolveCellGroupState({ hasTitle: true, border })
    assert.equal(state.borderTop, top, `通栏 border=${String(border)} 顶线不对`)
    assert.equal(state.borderBottom, bottom, `通栏 border=${String(border)} 底线不对`)
    assert.equal(state.titleDivider, titleDivider, `通栏 border=${String(border)} 标题线不对`)
  }
  /* 不变量：标题上下永远只有一条线——顶线与标题线互斥，任何形态任何组合下都不许同时为真。 */
  for (const inCard of [true, false]) {
    for (const border of [undefined, 'none', 'top', 'bottom', 'both', true, false]) {
      for (const hasTitle of [true, false]) {
        for (const hint of [{ top: true, bottom: true }, { top: false, bottom: false }]) {
          const state = cellState.resolveCellGroupState({ inCard, edgeLines: hint, hasTitle, border })
          assert.notEqual(
            state.borderTop && state.titleDivider,
            true,
            `inCard=${String(inCard)} border=${String(border)} title=${String(hasTitle)} 顶线与标题线同时画了`,
          )
        }
      }
    }
  }
  /* 显式 border 永远压过边界提示：提示只决定「不给 border 时画不画这条边」。 */
  assert.equal(
    cellState.resolveCellGroupState({ inCard: true, edgeLines: { top: false, bottom: false }, border: 'both' }).borderBottom,
    true,
  )
  assert.equal(
    cellState.resolveCellGroupState({ inCard: true, edgeLines: { top: true, bottom: true }, border: false }).borderBottom,
    false,
  )
})

test('Card 与 CellGroup 组合：上下文自动收敛，消费方零参数', () => {
  const inside = cellState.resolveCellGroupState({ inCard: true })
  assert.equal(inside.outerBorder, false, '没收到边界提示时上下都不画，靠卡片边界收口')
  assert.match(inside.className, /mptk-cell-group--in-card/)

  /* 无标题的组：提示说哪条画哪条，组自己一条不多一条不少。 */
  for (const [hint, top, bottom] of [
    [{ top: true, bottom: false }, true, false],
    [{ top: false, bottom: true }, false, true],
    [{ top: true, bottom: true }, true, true],
    [{ top: false, bottom: false }, false, false],
  ]) {
    const state = cellState.resolveCellGroupState({ inCard: true, edgeLines: hint })
    assert.equal(state.borderTop, top, `hint=${JSON.stringify(hint)} 的上边线不对`)
    assert.equal(state.borderBottom, bottom, `hint=${JSON.stringify(hint)} 的下边线不对`)
  }
  /* 卡片内有标题的组：标题与列表之间恒好一条线——顶线画了就落在标题与列表之间（它排在标题之后），
     没画就由标题线补上；两者互斥但必有其一，不许同时画也不许一起消失。 */
  for (const hint of [{ top: true, bottom: false }, { top: false, bottom: false }, { top: true, bottom: true }]) {
    const titled = cellState.resolveCellGroupState({ inCard: true, edgeLines: hint, hasTitle: true })
    assert.equal(
      titled.titleDivider || titled.borderTop,
      true,
      `hint=${JSON.stringify(hint)} 有标题时标题与列表之间必须有一条线`,
    )
    assert.notEqual(titled.titleDivider && titled.borderTop, true, '标题线与顶线互斥，不许同时画')
  }
  assert.equal(cellState.resolveCellGroupState({ inCard: true, hasTitle: false }).titleDivider, false, '无标题不画')
  assert.equal(cellState.resolveCellGroupState({ hasTitle: true }).titleDivider, false, '通栏形态列表自己画上边线')
  assert.equal(
    cellState.resolveCellGroupState({ inCard: true, inset: true, hasTitle: true }).titleDivider,
    false,
    'inset 列表自带四边描边，标题不重复画',
  )

  /* 显式 border 优先于边界提示：手动打开 / 关闭仍生效。 */
  assert.deepEqual(
    cellState.resolveCellGroupState({ inCard: true, edgeLines: { top: false, bottom: false }, border: 'both' }),
    cellState.resolveCellGroupState({ inCard: true, border: 'both' }),
    '显式 border=both 要盖过提示',
  )
  assert.equal(
    cellState.resolveCellGroupState({ inCard: true, edgeLines: { top: true, bottom: true }, border: false }).outerBorder,
    false,
    '显式 border=false 要盖过提示',
  )

  /* 边界提示是真跑的装饰器：Card 拿它注入，Node 自检直接验证每个贴边节点拿到哪条边界。 */
  const Group = markCardEdgeContent(() => null)
  const el = (type, children) => (children === undefined ? { type, props: {} } : { type, props: { children } })
  const group = () => el(Group)
  const plain = () => el('View')
  const linesOf = (nodes) => decorateCardEdgeChildren(nodes).map((node) => node.props?.[CARD_EDGE_LINES_PROP])
  const box = (top, bottom) => ({ top, bottom })
  assert.deepEqual(linesOf([group()]), [box(false, false)], '卡片里只一组：贴上下边界，两头都不画')
  assert.deepEqual(linesOf([group(), plain()]), [box(false, true), undefined], '后面还有普通内容：底线照画封口')
  assert.deepEqual(linesOf([plain(), group()]), [undefined, box(true, false)], '前面有普通内容时画上边界')
  assert.deepEqual(linesOf([group(), group()]), [box(false, true), box(false, false)], '两组相邻：前一组的底线封口，后一组上边界让位')
  assert.deepEqual(
    linesOf([group(), plain(), group()]),
    [box(false, true), undefined, box(true, false)],
    '夹着普通内容时，两条边界分属前后两组',
  )
  assert.deepEqual(
    linesOf([group(), group(), group()]),
    [box(false, true), box(false, true), box(false, false)],
    '三组：每组的底线都是封口线，接缝各恰好一条',
  )
  /* 穿透包装层：demo 的 demo-block__content 与用户自己的布局 View 都会包一层，
     提示必须打到里面的 CellGroup 上，不能只看 body 顶层（否则全部落回不画）。 */
  const wrapped = decorateCardEdgeChildren([el('View', [group(), plain(), group()])])
  assert.deepEqual(
    wrapped[0].props.children.map((node) => node.props?.[CARD_EDGE_LINES_PROP]),
    [box(false, true), undefined, box(true, false)],
    '包装层里的贴边内容也要按文档顺序注入边界',
  )
  const deep = decorateCardEdgeChildren([el('View', [el('View', [group(), group()])])])
  assert.deepEqual(
    deep[0].props.children[0].props.children.map((node) => node.props?.[CARD_EDGE_LINES_PROP]),
    [box(false, true), box(false, false)],
    '嵌套多层也要穿透',
  )
  /* 页面最常见的写法：`{list.map(…)}` 会把组塞进一个数组，`{cond && <CellGroup/>}` 会留下 false。
     数组与空节点必须摊平/丢掉，否则数组里的组拿不到提示、前一组的底线归属也算错。 */
  const mapped = decorateCardEdgeChildren([group(), el('View', [group(), group()])])
  assert.deepEqual(
    mapped[1].props.children.map((node) => node.props?.[CARD_EDGE_LINES_PROP]),
    [box(false, true), box(false, false)],
    '数组里的组也要按文档顺序拿提示',
  )
  assert.deepEqual(
    linesOf([group(), el('View', [group(), group()])]),
    [box(false, true), undefined],
    '后面跟的是数组（里面还是组）时，前一组的底线照画封口',
  )
  const conditional = decorateCardEdgeChildren([el('View', [false, group(), null, group()])])
  assert.deepEqual(
    conditional[0].props.children
      .filter((node) => node !== null && node !== false)
      .map((node) => node.props?.[CARD_EDGE_LINES_PROP]),
    [box(false, true), box(false, false)],
    '条件渲染留下的 false / null 不许算内容',
  )
  assert.deepEqual(
    linesOf([group(), el('View', [false]), group()]),
    [box(false, true), undefined, box(false, false)],
    '只装着空节点的包装层不算内容',
  )
  /* 同一个 element 对象当两个兄弟用：提示按顺序消费，不许互相覆盖。 */
  const reused = group()
  assert.deepEqual(linesOf([reused, reused]), [box(false, true), box(false, false)], '同一个元素复用两次也要各拿各的提示')

  /* 段头与贴边内容共用同一套边界算法，但不触发 edge-content：正文是段头的兄弟节点，
     Card 的 body 留白必须留着，否则正文会贴到卡片边框上。 */
  const Head = markCardSectionHead(() => null)
  const head = () => el(Head)
  assert.deepEqual(linesOf([head()]), [box(false, false)], '单段头：上下都不画，卡片边界接管')
  assert.deepEqual(
    linesOf([head(), plain(), head(), plain(), head()]),
    [box(false, true), undefined, box(true, true), undefined, box(true, false)],
    '三段头：首段只有下线，中段上下都有线，末段只有上线',
  )
  assert.deepEqual(
    linesOf([head(), plain(), head(), plain(), head(), plain()]),
    [box(false, true), undefined, box(true, true), undefined, box(true, true), undefined],
    '最后一段标题后面还有正文时，下线照旧画',
  )
  assert.deepEqual(
    linesOf([plain(), head()]),
    [undefined, box(true, false)],
    '标题是卡片最后一个元素：只有上线、没有下线',
  )
  assert.deepEqual(
    linesOf([head(), head(), head()]),
    [box(false, false), box(true, false), box(true, false)],
    '段头紧跟段头：后一段头自己画上线，前一段头不再画下线，接缝一条',
  )
  assert.deepEqual(
    linesOf([head(), group()]),
    [box(false, true), box(false, false)],
    '标题后面是列表时画下线，列表不画顶线',
  )
  assert.deepEqual(
    linesOf([group(), head()]),
    [box(false, false), box(true, false)],
    '列表后面紧跟标题：列表让位，标题画上线',
  )
  assert.deepEqual(
    linesOf([head(), group(), head(), group()]),
    [box(false, true), box(false, false), box(true, true), box(false, false)],
    '两段列表：各标题画自己的下线，接缝由后一段标题的上线承担',
  )
  const [, firstGroupHint] = linesOf([head(), group()])
  assert.equal(
    cellState.resolveCellGroupState({ inCard: true, edgeLines: firstGroupHint }).borderTop,
    false,
    '标题后的 CellGroup 不会再画一条叠在标题横线上的顶线',
  )
  assert.equal(cardStartsWithSectionHead([head(), group()]), true, '正文第一块是标题')
  assert.equal(cardStartsWithSectionHead([group(), head()]), false, '第一块不是标题就不算')
  assert.doesNotMatch(
    cardState.resolveCardState({ hasEdgeContent: true, hasSectionHead: true }).className,
    /mptk-card--edge-top/,
    '有标题时保留卡片顶部留白，跟换写法之前一样',
  )
  assert.deepEqual(
    linesOf([group(), plain(), head(), plain()]),
    [box(false, true), undefined, box(true, true), undefined],
    'CellGroup 与 CardHead 混排时按文档顺序分线',
  )
  assert.equal(hasCardEdgeContent(head()), false, '段头不算贴边内容，Card 的 body 留白不能被关掉')
  assert.equal(hasCardEdgeContent([head(), plain()]), false, '段头 + 普通正文也不能算贴边内容')
  assert.equal(isCardEdgeElement(head()), false, '段头不是贴边内容，身份不混')
  assert.equal(hasCardSectionHead(head()), true, '标题节点走满宽通道')
  assert.equal(hasCardSectionHead(['View', [group(), head()]]), true, '包装层里的标题也要识别')
  assert.equal(hasCardSectionHead(group()), false, '列表走满宽通道但不是标题')

  const single = decorateCardEdgeChildren([el('View', group())])
  assert.deepEqual(
    single[0].props.children.props[CARD_EDGE_LINES_PROP],
    box(false, false),
    '单个子节点（children 非数组）也要注入',
  )
  assert.match(read('../src/ui/card/Card.tsx'), /decorateCardEdgeChildren\(bodyChildren\)/, 'Card 要用穿透式装饰器')
  assert.match(read('../src/ui/card/Card.tsx'), /cardStartsWithSectionHead\(bodyChildren\)/, 'Card 要识别开头标题以保留顶部留白')
  assert.match(read('../src/ui/display/cell/CellGroup.tsx'), /CARD_EDGE_LINES_PROP/, 'CellGroup 要读注入的边界提示')
  const outside = cellState.resolveCellGroupState({})
  assert.equal(outside.outerBorder, true, '单独使用仍画上下外框')
  assert.doesNotMatch(outside.className, /--in-card/)
  assert.equal(cellState.resolveCellGroupState({ inCard: true, inset: true }).outerBorder, false)

  /* 上下两条边按边给：CSS 本身就是 border-top / border-bottom 两个独立属性。 */
  for (const [border, top, bottom] of [
    [true, true, true], [false, false, false],
    ['none', false, false], ['top', true, false],
    ['bottom', false, true], ['both', true, true],
  ]) {
    const state = cellState.resolveCellGroupState({ inCard: true, border })
    assert.equal(state.borderTop, top, `border=${String(border)} 的上边线不对`)
    assert.equal(state.borderBottom, bottom, `border=${String(border)} 的下边线不对`)
    assert.equal(state.outerBorder, top || bottom, `border=${String(border)} 的 outerBorder 要与两条边一致`)
  }
  assert.equal(
    cellState.resolveCellGroupState({ inset: true, border: 'top' }).borderTop,
    false,
    '卡片形态的四边归 frame 管，border 不掺',
  )
  const groupSource = read('../src/ui/display/cell/CellGroup.tsx')
  assert.match(groupSource, /state\.borderTop/, '上边线要单独渲染')
  assert.match(groupSource, /state\.borderBottom/, '下边线要单独渲染')

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

  /* 贴边只作用在真正贴边的那一端：标题已迁到 CardHead，顶部恒归零；有底部则保留下留白。 */
  const bare = cardState.resolveCardState({ hasEdgeContent: true })
  assert.match(bare.className, /mptk-card--edge-top/, '没有头部，顶部恒贴边')
  assert.match(bare.className, /mptk-card--edge-bottom/, '没有底部时底部才贴边')
  assert.doesNotMatch(
    cardState.resolveCardState({ hasEdgeContent: true, hasFooter: true }).className,
    /mptk-card--edge-bottom/,
    '有底部操作区时下留白归壳',
  )

  const cardCss = read('../dist/ui/card/style/index.css')
  const cellCss = read('../dist/ui/display/cell/style/index.css')
  assert.equal(declOf(ruleOf(cardCss, '.mptk-card'), 'padding-top'), 'var(--mptk-card-spacing)', '普通内容仍由壳给留白')
  assert.equal(resolveCssVars(declOf(ruleOf(cardCss, '.mptk-card--edge-top'), 'padding-top')), '0', '贴边时壳顶部必须解析成 0')
  assert.equal(resolveCssVars(declOf(ruleOf(cardCss, '.mptk-card--edge-bottom'), 'padding-bottom')), '0', '贴边时壳底部必须解析成 0')
  assert.equal(
    declOf(ruleOf(cellCss, '.mptk-cell'), 'min-height'),
    'calc(var(--mptk-line-sm) + var(--mptk-space-1) + var(--mptk-space-0) + var(--mptk-space-1) + var(--mptk-space-0))',
    '最小高 = 内容区净高 20 + 上下 padding 各 6 = 32',
  )
  assert.equal(declOf(ruleOf(cellCss, '.mptk-cell'), 'padding-top'), 'calc(var(--mptk-space-1) + var(--mptk-space-0))', '上留白 6px，内容超出最小高时上下各多撑 2px')
  assert.equal(declOf(ruleOf(cellCss, '.mptk-cell'), 'padding-bottom'), 'calc(var(--mptk-space-1) + var(--mptk-space-0))')
  assert.doesNotMatch(cellCss, /margin-(?:top|bottom):\s*calc\(/, '子级不再反抵消')

  /* 卡片内列表的左右留白归可点击的 Cell 行：hoverClass 画在行根节点上，热区必须与视觉行宽同源。 */
  assert.equal(
    resolveCssVars(declOf(ruleOf(cellCss, '.mptk-cell-group--in-card .mptk-cell-group__body'), 'padding-left')),
    '0',
    'CellGroup body 不再吃左右留白，否则按压底色比行窄一档',
  )
  assert.equal(
    resolveCssVars(declOf(ruleOf(cellCss, '.mptk-cell-group--in-card .mptk-cell'), 'padding-left')),
    resolveCssVars(declOf(ruleOf(cardCss, '.mptk-card__content'), 'padding-left')),
    '列表文字与普通内容都按同一档缩进，不留 4px 错位',
  )
  assert.match(
    cellCss,
    /\.mptk-cell-group--in-card \.mptk-cell\s*\{[^}]*padding-left:\s*var\(--mptk-card-spacing\)/,
    '留白落在可点击的行上，hover 热区才通到卡片边',
  )
  assert.equal(
    resolveCssVars(declOf(ruleOf(cardCss, '.mptk-card__body'), 'padding-left')),
    '0',
    '卡片 body 恒满宽，标题横线才能通到卡片边',
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
  const source = `import { Card, CardHead } from ${entry};
import type { CardProps, CardHeadProps, CardVariant, CardRadius, CardSize, CardColor, BuiltinCardColor } from ${entry};
const variant: CardVariant = 'outline';
const radius: CardRadius = 'none';
const size: CardSize = 'lg';
const builtin: BuiltinCardColor = 'teal';
const custom: CardColor = '#f0e6ff';
const props: CardProps = { variant, radius, size, color: custom, footerDivider: false, onClick: () => {} };
const headProps: CardHeadProps = { className: 'my-head' };
export const element = (
  <Card {...props} cover="封面" footer="底部" color={builtin} loading loadingContent="加载中">主体</Card>
);
export const sections = (
  <Card><CardHead {...headProps}>标题</CardHead>内容<CardHead>标题 2</CardHead>内容 2</Card>
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
  for (const hit of scss.matchAll(/border-radius:\s*([^;]+);/g)) {
    /* 档位，或指向档位的语义变量（控件默认圆角）：演示站示意条要与控件同形。 */
    assert.match(hit[1], /var\(--mptk-(radius|control-radius)/, `演示站圆角必须取档位：${hit[1]}`)
  }
  assert.match(scss, /font-size:\s*var\(--mptk-font-display\)/, '展示级字号要取档位')
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
  assert.match(source, /variant="outline" color="teal"/, '只有边的形态也要能染边，不能只演示有面的形态')
  assert.match(source, /radius=\{radius\}/, '圆角档位要逐档铺开')
  assert.ok(source.includes("'none'"), 'radius 枚举要含直角档')
  assert.doesNotMatch(source, /ui\/display\/cell/, 'Card 页不许向下引用 Cell 子域')
  const headExample = page.examples.find((example) => example.id === 'card-head')
  assert.equal(headExample?.section, '三 · 槽位与状态', '多段标题示例归槽位组')
  assert.match(headExample.usage, /<CardHead>/, '示例要展示 CardHead 组合写法')
  assert.match(headExample.usage, /mptk-card__title/, '标题类名要明确给宿主')
  assert.match(headExample.imports.join(' '), /ui\/card\/style/, '段头样式跟 Card 同一条出口')
  assert.match(source, /<CardHead>/, 'Card 页要真的渲染段头')
  assert.match(source, /className="mptk-card__title"/, '标题由宿主写 View 挂类名')
  assert.match(source, /<Icon name=/, '标题里塞图标的口子要有演示')
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
  assert.match(page, /<Card[\s>]/, '组合示例要真的渲染')
  assert.doesNotMatch(page, /<Card flush>|<Card variant/, '组合示例不许再传形态参数')
  assert.match(page, /<CellGroup inset>/, '旧 inset 兼容形态不能悄悄消失')
})
