/**
 * 真实渲染自检：用 React SSR 把 dist 的组件渲染成节点树，断言「最终生效的节点」。
 *
 * 为什么需要这一层：`tests/*.test.mjs` 里大量断言停在「产物里有这段字符串」或「源码里有这行调用」，
 * 分支、条件、跨组件契约一变就可能失效而测试仍然全绿。边界提示（Card → CellGroup）与关闭按钮形态
 * （Popup → Button）都是跨组件契约，只有看渲染结果才算验到。
 *
 * Taro 运行时不能在 Node 里跑（@tarojs/runtime 依赖编译期常量 ENABLE_INNER_HTML），
 * 所以把 @tarojs/components 换成极薄的 View / Text / ScrollView 直通组件；
 * 组件本身仍是 dist 原样导入，不重新实现任何逻辑。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire, registerHooks } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

/** 库把 react 当 peer（不直接依赖），测试从 root / demo 的 node_modules 再退到 pnpm store 解析同一份实例。 */
function makeResolver() {
  const reqs = [join(root, 'package.json'), join(root, 'demo/package.json')]
    .filter((file) => existsSync(file))
    .map((file) => createRequire(file))
  return (specifier) => {
    for (const req of reqs) {
      try {
        return req.resolve(specifier)
      } catch {
        /* 换下一个解析基准 */
      }
    }
    const pnpm = join(root, 'node_modules/.pnpm')
    if (existsSync(pnpm)) {
      const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
      const sub = specifier.slice(name.length)
      const hit = readdirSync(pnpm).find((entry) => entry === name || entry.startsWith(`${name}@`))
      if (hit !== undefined) {
        const dir = join(pnpm, hit, 'node_modules', name)
        const file = sub === '' ? join(dir, 'index.js') : sub === '/server' ? join(dir, 'server.node.js') : join(dir, sub.slice(1))
        if (existsSync(file)) return file
      }
    }
    throw new Error(`测试环境解析不到 ${specifier}：请先 pnpm install`)
  }
}

const resolveFrom = makeResolver()

/* 必须在注册 hook 之前解析完：hook 里再调 createRequire().resolve() 会重新进入 hook，
   ESM loader 直接死锁（进程不退出、日志空白）。hook 内只查这张表。 */
const PRE_RESOLVED = new Map()
for (const specifier of ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/server']) {
  PRE_RESOLVED.set(specifier, pathToFileURL(resolveFrom(specifier)).href)
}

/** 直通组件：丢掉小程序专有属性（hoverClass / catchMove 等），只留结构、class、id、style，便于断言。 */
const componentsStub = `
import { forwardRef, createElement } from ${JSON.stringify(PRE_RESOLVED.get('react'))}
const make = (tag) => forwardRef((props, ref) => {
  const { className, style, id, children } = props
  return createElement(tag, { className, id, style, ref }, children)
})
export const View = make('view')
export const Text = make('text')
export const ScrollView = make('scroll-view')
export const Image = make('image')
`

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@tarojs/components') return { url: 'mptk-test:components', shortCircuit: true }
    if (PRE_RESOLVED.has(specifier)) return { url: PRE_RESOLVED.get(specifier), shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === 'mptk-test:components') {
      return { format: 'module', shortCircuit: true, source: componentsStub }
    }
    return next(url, context)
  },
})

const React = await import('react')
const server = await import('react-dom/server')
const renderToStaticMarkup = server.renderToStaticMarkup ?? server.default.renderToStaticMarkup
const h = React.createElement

const { Card } = await import('../dist/ui/card/index.js')
const { CellGroup, Cell } = await import('../dist/ui/display/cell/index.js')
const { Overlay, Popup } = await import('../dist/ui/layout/index.js')
const { Drawer, Dropdown } = await import('../dist/ui/navigation/index.js')
const { Dialog, Loading, Toast } = await import('../dist/ui/feedback/index.js')
const { CARD_EDGE_OUT_OF_FLOW } = await import('../dist/ui/infra/card-edge.js')

/** 渲染成一行 HTML，方便按 class 切片。 */
function render(element) {
  return renderToStaticMarkup(element).replace(/\n/g, '')
}

/** 每个 CellGroup 渲染块里实际画了哪几条外框线：按组根节点切段，避免把别处的 border 算进来。 */
function groupBorders(html) {
  return html
    .split('<view class="mptk-cell-group ')
    .slice(1)
    .map((chunk) => ({
      top: chunk.includes('mptk-cell-group__border--top'),
      bottom: chunk.includes('mptk-cell-group__border--bottom'),
    }))
}

const group = (title) => h(CellGroup, { key: title }, h(Cell, { title }, '内容'))

test('Card 里的 CellGroup 收到边界提示，渲染出的外框线和提示一致', () => {
  /* 无 header 的单组：两头都贴卡片边界，两条线都不画。 */
  const single = render(h(Card, null, group('one')))
  assert.deepEqual(groupBorders(single), [{ top: false, bottom: false }], '单组必须两头收口')
  assert.match(single, /mptk-card--edge-top/, '无头部时卡片顶部要贴边')
  assert.match(single, /mptk-card--edge-bottom/, '无底部时卡片底部要贴边')

  /* 三组（无标题）：每组底线都是自己的封口线，接缝各恰好一条，画在前一组的下边界。 */
  const three = render(h(Card, { title: '分组' }, group('a'), group('b'), group('c')))
  assert.deepEqual(
    groupBorders(three),
    [
      { top: false, bottom: true },
      { top: false, bottom: true },
      { top: false, bottom: false },
    ],
    '三组只能有两条组间线，都画在前一组的下边界（封口）',
  )

  /* 显式 border 盖过边界提示。 */
  const manual = render(
    h(Card, { title: '分组' }, h(CellGroup, null, h(Cell, { title: 'x' }, '内容')), h(CellGroup, { border: 'both' }, h(Cell, { title: 'y' }, '内容'))),
  )
  assert.deepEqual(groupBorders(manual), [{ top: false, bottom: true }, { top: true, bottom: true }], '显式 border 优先')

  /* 内部 prop 是渲染期契约，不能漏进节点。 */
  assert.doesNotMatch(three, /__mptkCardEdge/, '边界提示不许落到渲染节点上')
})

test('Card 穿透包装层：CellGroup 不在 body 顶层时边界提示照样生效', () => {
  const wrapped = render(
    h(Card, { title: '分组' }, h('div', { key: 'wrap' }, h(CellGroup, null, h(Cell, { title: 'a' }, '内容')), h(CellGroup, null, h(Cell, { title: 'b' }, '内容')))),
  )
  assert.deepEqual(groupBorders(wrapped), [{ top: false, bottom: true }, { top: false, bottom: false }], '包装层里的组也要拿到边界提示')
})

/** 渲染树里所有「看起来是一条线」的类名。 */
const LINE_CLASSES = [
  'mptk-cell-group__border--top',
  'mptk-cell-group__border--bottom',
  'mptk-cell-group__title-divider',
  'mptk-cell__divider',
]

/** 把线 / 标题 / 行按文档顺序拉成一维序列：两条线相邻就是视觉上的一条粗线或双线。 */
function lineSequence(html) {
  const seq = []
  for (const token of html.split(/(?=<)|(?<=>)/)) {
    if (!token.trim()) continue
    const cls = /class="([^"]*)"/.exec(token)?.[1] ?? ''
    if (cls === '') continue
    const line = LINE_CLASSES.find((name) => cls.includes(name))
    if (line !== undefined) seq.push({ kind: 'line', name: line })
    else if (cls.includes('mptk-cell-group__title')) seq.push({ kind: 'title' })
    else if (cls.includes('mptk-cell__title')) seq.push({ kind: 'cell' })
    else if (/^mptk-cell-group( |$)/.test(cls)) seq.push({ kind: 'group' })
  }
  return seq
}

test('边框矩阵：组数 × 标题分布 × 浮层 × 尾部内容，逐格断言每条边界的线与归属', () => {
  const titleModes = {
    全无标题: () => undefined,
    全有标题: (index) => `组${String(index + 1)}`,
    交替: (index) => (index % 2 === 0 ? `组${String(index + 1)}` : undefined),
    首尾有中间无: (index, total) => (index === 0 || index === total - 1 ? `组${String(index + 1)}` : undefined),
  }
  let checked = 0

  for (const [modeName, titleOf] of Object.entries(titleModes)) {
    for (const count of [1, 2, 3, 4, 5]) {
      for (const withPopup of [false, true]) {
        for (const withTail of [false, true]) {
          const titles = Array.from({ length: count }, (_, index) => titleOf(index, count))
          const groups = titles.map((title, index) => {
            const rows = [h(Cell, { key: 'a', title: '行A' }, 'v'), h(Cell, { key: 'b', title: '行B' }, 'v')]
            return title === undefined
              ? h(CellGroup, { key: String(index) }, ...rows)
              : h(CellGroup, { key: String(index), title }, ...rows)
          })
          const extras = []
          if (withPopup) extras.push(h(Popup, { key: 'popup', open: false, onClose: () => undefined }, h('div', null, '面板内容')))
          if (withTail) extras.push(h('div', { key: 'tail', className: 'plain' }, '普通文字'))

          const html = render(h(Card, { title: '卡' }, h('div', null, [...groups, ...extras])))
          const label = `${modeName} / ${String(count)} 组 / 浮层=${String(withPopup)} / 尾部=${String(withTail)}`
          const seq = lineSequence(html)

          /* 1. 任何两条线都不许相邻 —— 相邻即视觉双线或叠粗，这是所有 border 问题的总闸。 */
          for (let i = 1; i < seq.length; i += 1) {
            assert.notEqual(
              seq[i].kind === 'line' && seq[i - 1].kind === 'line',
              true,
              `${label}：${seq[i - 1].name} 与 ${seq[i].name} 相邻`,
            )
          }

          /* 2. 标题后面必须紧跟一条线：标题与列表之间恒好一条，且线在标题之后。
                标题上面那条线只许是前一分组的封口底线（相邻双线由第 1 条把关）。 */
          seq.forEach((item, index) => {
            if (item.kind !== 'title') return
            assert.equal(seq[index + 1]?.kind, 'line', `${label}：标题后面没有跟线`)
          })

          /* 3. 逐组断言边界归属：底线归前一块画——除最后一组外每组的底线都画（封口），
                最后一条只有后面跟普通内容时才画（贴卡片底不画）；
                上边界在矩阵里永不出现（前面不是分组就是卡片头，都让位），标题线由标题侧补。 */
          const blocks = html.split('<view class="mptk-cell-group ').slice(1)
          assert.equal(blocks.length, count, `${label}：组块数量不对`)
          blocks.forEach((chunk, index) => {
            const titled = titles[index] !== undefined
            const where = `${label}：第 ${String(index + 1)} 组`
            assert.equal(chunk.includes('mptk-cell-group__title-divider'), titled, `${where} 标题线不对`)
            assert.equal(chunk.includes('mptk-cell-group__border--top'), false, `${where} 上边界不对（前面是分组或卡片头，都要让位）`)
            assert.equal(
              chunk.includes('mptk-cell-group__border--bottom'),
              index < count - 1 || withTail,
              `${where} 下边界不对`,
            )
          })

          /* 4. 行分隔线：每组最后一行不画，其余行各一条。 */
          assert.equal(
            (html.match(/mptk-cell__divider/g) ?? []).length,
            count * 2 - count,
            `${label}：行分隔线数量不对`,
          )

          checked += 1
        }
      }
    }
  }

  assert.equal(checked, 80, '矩阵应覆盖 4 种标题分布 × 5 种组数 × 浮层 × 尾部 = 80 格')
})

test('通栏形态与 inset 形态：单组各自成立，且不与标题线叠成两条', () => {
  /* 通栏单组：上下外框都画，标题线由顶线承担，所以不会出现两条相邻线。 */
  const flush = render(h('div', null, h(CellGroup, { title: '组' }, h(Cell, { title: '行A' }, 'v'), h(Cell, { title: '行B' }, 'v'))))
  assert.equal((flush.match(/mptk-cell-group__border--top/g) ?? []).length, 1, '通栏要有顶线')
  assert.equal((flush.match(/mptk-cell-group__border--bottom/g) ?? []).length, 1, '通栏要有底线')
  assert.equal((flush.match(/mptk-cell-group__title-divider/g) ?? []).length, 0, '顶线承担标题线，不再叠一条 title-divider')
  const seq = lineSequence(flush)
  const titleAt = seq.findIndex((item) => item.kind === 'title')
  assert.notEqual(titleAt, -1, '通栏带标题必须渲染标题')
  /* 顶线标的是列表上边界：必须排在标题之后、紧挨列表，排在标题之前就成了悬在标题上方的一条线。 */
  assert.equal(seq[titleAt + 1]?.name, 'mptk-cell-group__border--top', '顶线必须紧跟在标题之后（标题与列表之间）')
  for (let i = 1; i < seq.length; i += 1) {
    assert.notEqual(seq[i].kind === 'line' && seq[i - 1].kind === 'line', true, `通栏：${seq[i - 1].name} 与 ${seq[i].name} 相邻`)
  }

  /* 通栏 + 显式关掉顶线：标题与列表之间那条线由标题线补上，不许跟顶线一起消失。 */
  const bare = render(h('div', null, h(CellGroup, { title: '组', border: 'none' }, h(Cell, { title: '行A' }, 'v'))))
  assert.equal((bare.match(/mptk-cell-group__border/g) ?? []).length, 0, 'border=none 不许画外框')
  assert.equal((bare.match(/mptk-cell-group__title-divider/g) ?? []).length, 1, 'border=none 时标题下仍要有线')
  const bareSeq = lineSequence(bare)
  const bareTitleAt = bareSeq.findIndex((item) => item.kind === 'title')
  assert.equal(bareSeq[bareTitleAt + 1]?.name, 'mptk-cell-group__title-divider', '补的线要落在标题之后')

  /* inset：四边由 body 的边框负责，组级别的线一条都不该有。 */
  const inset = render(h('div', null, h(CellGroup, { inset: true, title: '组' }, h(Cell, { title: '行A' }, 'v'))))
  assert.equal((inset.match(/mptk-cell-group__border/g) ?? []).length, 0, 'inset 不许再画组级线')
  assert.equal((inset.match(/mptk-cell-group__title-divider/g) ?? []).length, 0, 'inset 的 body 自带边框，标题线不重复')
  assert.match(inset, /mptk-cell-group__body--inset/, 'inset 的 body 形态丢了')
})

test('有组标题时标题与列表之间恒有一条分隔线，且不在标题上方多一条', () => {
  /* 用户实际场景：卡片里唯一一组 + 组标题。贴着卡片头 / 卡片底，两条外框都不画，
     标题下那条线必须由标题侧补上，不能一起消失。 */
  const single = render(
    h(Card, { title: '顶部让位' }, h(CellGroup, { title: '顶部让位（真值取状态栏 + 胶囊）' }, h(Cell, { title: '不让位' }, 'insetTop="none"'))),
  )
  assert.equal(
    (single.match(/mptk-cell-group__title-divider/g) ?? []).length,
    1,
    '单组有标题：标题下要有一条线',
  )
  assert.deepEqual(groupBorders(single), [{ top: false, bottom: false }], '列表本身仍旧两头收口，线只在标题下')

  /* 三组都有标题：每组标题下恰好一条标题分隔线；组与组之间由前一组的底线封口（画在前一组的下边界）。 */
  const three = render(
    h(Card, { title: 't' },
      h(CellGroup, { title: 'a' }, h(Cell, { title: '1' }, 'x')),
      h(CellGroup, { title: 'b' }, h(Cell, { title: '2' }, 'x')),
      h(CellGroup, { title: 'c' }, h(Cell, { title: '3' }, 'x')),
    ),
  )
  assert.equal((three.match(/mptk-cell-group__title-divider/g) ?? []).length, 3, '每个带标题的组都恰好一条标题分隔线')
  assert.deepEqual(
    groupBorders(three),
    [{ top: false, bottom: true }, { top: false, bottom: true }, { top: false, bottom: false }],
    '三组都有标题：前两组的底线封口（落在下一组标题上方），末组贴卡片底不画',
  )

  /* 前面是普通内容 + 后面是有标题的组：顶线画了就落在标题与列表之间（它排在标题之后），标题线让位。 */
  const afterPlain = render(
    h(Card, { title: 't' },
      h('div', { key: 'p', className: 'plain' }, '普通文字'),
      h(CellGroup, { title: 'a' }, h(Cell, { title: '1' }, 'x')),
    ),
  )
  assert.deepEqual(groupBorders(afterPlain), [{ top: true, bottom: false }], '前面是普通内容：封口顶线要画')
  assert.equal(
    (afterPlain.match(/mptk-cell-group__title-divider/g) ?? []).length,
    0,
    '顶线已经承担标题与列表之间的线，标题线不再重复',
  )

  /* 没有标题就不该凭空多出这条线；无标题的组靠自己的上边界与上一组分隔。 */
  const noTitle = render(h(Card, { title: 't' }, h(CellGroup, null, h(Cell, { title: '1' }, 'x'))))
  assert.doesNotMatch(noTitle, /mptk-cell-group__title-divider/, '无标题不许画标题分隔线')
  const untitledPair = render(
    h(Card, { title: 't' },
      h(CellGroup, null, h(Cell, { title: '1' }, 'x')),
      h(CellGroup, null, h(Cell, { title: '2' }, 'x')),
    ),
  )
  assert.deepEqual(
    groupBorders(untitledPair),
    [{ top: false, bottom: true }, { top: false, bottom: false }],
    '无标题的两组：分界只由前一组的底线画一条',
  )
})

test('Card 里的浮层不占内容流：Popup 关着时边界提示不被它的子树带歪', () => {
  const closed = { open: false, onClose: () => {} }

  /* 单组 + 关着的 Popup：Popup 渲染 null，CellGroup 仍必须两头收口（曾经多画一条下线）。 */
  const one = render(
    h(Card, { title: '顶部让位' },
      h('div', { key: 'wrap', className: 'demo-block__content' },
        h(CellGroup, { title: '顶部让位' }, h(Cell, { title: '不让位' }, 'insetTop="none"')),
        h(Popup, closed, h('div', null, '面板第 1 行'), h('div', null, '面板第 2 行')),
      ),
    ),
  )
  assert.deepEqual(groupBorders(one), [{ top: false, bottom: false }], '关着的 Popup 不该给单组补上下边界')

  /* 两组 + 关着的 Popup：末组仍贴卡片底，不许因为浮层子树多画底线。 */
  const two = render(
    h(Card, { title: 't' },
      h('div', { key: 'wrap' },
        h(CellGroup, { title: 'a' }, h(Cell, { title: '1' }, 'x')),
        h(CellGroup, { title: 'b' }, h(Cell, { title: '2' }, 'x')),
        h(Popup, closed, h('div', null, '面板内容')),
      ),
    ),
  )
  assert.deepEqual(
    groupBorders(two),
    [{ top: false, bottom: true }, { top: false, bottom: false }],
    '浮层不算内容：前一组的底线照画封口，末组贴卡片底不画',
  )
})

test('Popup 关闭按钮复用核心 Button：形状 / 描边 / 底色三轴落到真实 Button 类名', () => {
  const base = { open: true, onClose: () => {}, closeable: true, position: 'bottom' }

  /* 默认 circle + 描边 + 底色 → soft（浅底 + 边）+ pill 圆角。 */
  const soft = render(h(Popup, base, h('div', null, '内容')))
  assert.match(soft, /mptk-btn--soft/, '默认档要有底色又有描边，落在 soft')
  assert.match(soft, /mptk-btn--radius-pill/, 'circle 形状走 pill 圆角')
  assert.match(soft, /mptk-popup__close--top-left/, '底部面板默认关闭按钮在面板内左上')

  /* 关掉底色与描边、换圆角方 → solid + 半透明 class；叉色不受背景轴影响。 */
  const ghost = render(h(Popup, { ...base, closeShape: 'rounded', closeBorder: false, closeBackground: false }, h('div', null, '内容')))
  assert.match(ghost, /mptk-btn--solid/, '描边关 → solid，variant 只由描边轴决定')
  assert.match(ghost, /mptk-popup__close--translucent/, '背景「否」走半透明 class，不再是空底')
  assert.match(ghost, /mptk-btn--radius-sm/, 'rounded 形状走 sm 小方角（8px），不用看成正圆的 md、也不用在方块上过小的 xs')
  assert.doesNotMatch(ghost, /mptk-btn--ghost|mptk-btn--outline/, '背景「否」不能再派生 ghost / outline')

  /* 没开 closeable 就没有按钮；左右抽屉无论传什么都不渲染。 */
  assert.doesNotMatch(render(h(Popup, { ...base, closeable: false }, h('div', null, '内容'))), /mptk-popup__close/)
  for (const panel of ['left', 'right']) {
    assert.doesNotMatch(render(h(Popup, { ...base, position: panel }, h('div', null, '内容'))), /mptk-popup__close/, `${panel} 抽屉不支持关闭按钮`)
  }

  /* 贴顶档支持面板下方外置位置，默认落面板下方居中。 */
  const top = render(h(Popup, { ...base, position: 'top' }, h('div', null, '内容')))
  assert.match(top, /mptk-popup__close--below-center/, '贴顶档默认关闭按钮落在面板下方居中')
  assert.match(top, /mptk-popup--close-outside/, '贴顶档下方按钮要放开面板裁剪')
  const topRight = render(h(Popup, { ...base, position: 'top', closePosition: 'below-right' }, h('div', null, '内容')))
  assert.match(topRight, /mptk-popup__close--below-right/, '贴顶档可切到面板下方靠右')

  /* 外置档要放开面板裁剪，否则按钮被 overflow 裁掉。 */
  const outside = render(h(Popup, { ...base, closePosition: 'above-center' }, h('div', null, '内容')))
  assert.match(outside, /mptk-popup--close-outside/, '面板上方的按钮需要根节点放开裁剪')
})

test('浮层类组件都声明了「脱离文档流」：关闭时渲染 null 也不污染 Card 的边界判定', () => {
  /* 边界判定是渲染期静态遍历，看不见运行时的 null；浮层必须自己声明，
     否则它的 children 会被当成排在组后面的可见内容，贴着卡片边界的那条线就多画出来。 */
  for (const [name, component] of Object.entries({ Popup, Overlay, Drawer, Dropdown, Dialog })) {
    assert.equal(component[CARD_EDGE_OUT_OF_FLOW], true, `${name} 没声明脱离文档流`)
  }
  /* Toast / Loading 是行内组件，可见时确实占内容流，不该被跳过。 */
  for (const [name, component] of Object.entries({ Toast, Loading })) {
    assert.equal(component[CARD_EDGE_OUT_OF_FLOW], undefined, `${name} 是行内组件，不该声明脱离文档流`)
  }
})

test('页面常见写法（map 数组 / 条件渲染）不改变边界归属', () => {
  const row = (t) => h(Cell, { title: t }, 'v')
  const mapped = [
    h(CellGroup, { key: '1' }, row('A')),
    h(CellGroup, { key: '2' }, row('B')),
  ]
  /* 组写在 {list.map(…)} 里、外面还包一层 View：以前数组被当成「普通内容」，
     前一组多补一条底线，数组里的组一个提示都拿不到。 */
  const html = render(h(Card, { title: 't' }, h('div', null, [h(CellGroup, { key: 'x' }, row('X')), mapped])))
  assert.deepEqual(
    groupBorders(html),
    [
      { top: false, bottom: true },
      { top: false, bottom: true },
      { top: false, bottom: false },
    ],
    '数组里的组也要按文档顺序拿到提示，接缝由前一组的底线封口',
  )

  /* 条件渲染留下的 false 不许被当成内容，否则贴着卡片头的第一组会多画一条上边界。 */
  const conditional = render(
    h(Card, { title: 't' }, h('div', null, [false, h(CellGroup, { key: 'a' }, row('A'))])),
  )
  assert.deepEqual(groupBorders(conditional), [{ top: false, bottom: false }], 'false 不算内容')

  /* 空标题不算有标题：不许凭空多出一条标题线。 */
  for (const title of ['', null]) {
    const empty = render(h(Card, { title: 't' }, h(CellGroup, { title }, row('A'))))
    assert.doesNotMatch(empty, /mptk-cell-group__title/, `title=${String(title)} 不该渲染标题块`)
    assert.doesNotMatch(empty, /mptk-cell-group__title-divider/, `title=${String(title)} 不该画标题线`)
  }
})
