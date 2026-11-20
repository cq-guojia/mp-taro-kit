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
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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
  const { className, style, id, children, scrollY, scrollX, indicatorDots, mode } = props
  return createElement(tag, {
    className, id, style, ref,
    ...(scrollY === true ? { 'scroll-y': '' } : {}),
    ...(scrollX === true ? { 'scroll-x': '' } : {}),
    ...(indicatorDots === true ? { 'indicator-dots': '' } : {}),
    ...(mode === undefined ? {} : { mode }),
  }, children)
})
export const View = make('view')
export const Text = make('text')
export const ScrollView = make('scroll-view')
export const Image = make('image')
export const Swiper = make('swiper')
export const SwiperItem = make('swiper-item')
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
const { Overlay, Popup, ImagePopup } = await import('../dist/ui/layout/index.js')
const { resolveImageSize } = await import('../dist/ui/layout/image-size.js')
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
  assert.match(soft, /mptk-popup__close--above-right/, '底部面板默认关闭按钮在面板外右上')

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

  /* 贴顶档支持面板下方外置位置，默认落面板下方靠右。 */
  const top = render(h(Popup, { ...base, position: 'top' }, h('div', null, '内容')))
  assert.match(top, /mptk-popup__close--below-right/, '贴顶档默认关闭按钮落在面板下方靠右')
  assert.match(top, /mptk-popup--close-outside/, '贴顶档下方按钮要放开面板裁剪')
  const topRight = render(h(Popup, { ...base, position: 'top', closePosition: 'below-right' }, h('div', null, '内容')))
  assert.match(topRight, /mptk-popup__close--below-right/, '贴顶档可切到面板下方靠右')

  /* 外置档要放开面板裁剪，否则按钮被 overflow 裁掉；默认外右上即外置档。 */
  assert.match(soft, /mptk-popup--close-outside/, '默认外右上按钮需要根节点放开裁剪')
  const outside = render(h(Popup, { ...base, closePosition: 'above-center' }, h('div', null, '内容')))
  assert.match(outside, /mptk-popup--close-outside/, '面板上方的按钮需要根节点放开裁剪')

  /* 裸壳档：面板 class 带 surface-none，浮层能力（遮罩 / 关闭按钮）仍在。 */
  const bare = render(h(Popup, { ...base, surface: 'none' }, h('div', null, '自画内容')))
  assert.match(bare, /mptk-popup--surface-none/, 'surface=none 要落裸壳 class')
  assert.match(bare, /mptk-popup__close--above-right/, '裸壳档关闭按钮仍渲染且落在默认外右上')
  assert.match(bare, /mptk-overlay/, '裸壳档遮罩仍在')
  assert.doesNotMatch(bare, /<scroll-view/, '面板内容不该套 scroll-view，高度由 children 撑开')
  const panel = render(h(Popup, base, h('div', null, 'x')))
  assert.doesNotMatch(panel, /mptk-popup--surface-none/, '默认档不能带裸壳 class')
  assert.doesNotMatch(panel, /<scroll-view/, '默认档内容也走 View 按内容撑高，滚动交给调用方')
})

test('ImagePopup 尺寸模型：宽/高/比例/原图/上界/滚动/不放大', () => {
  const ctx = { containerWidth: 240 }
  const r = (input) => resolveImageSize(input, ctx)
  // 定宽 + 比例 → 只锁宽走 widthFix，displayHeight 供视口定高；height 恒 null 由原生按比例撑
  assert.deepEqual(r({ width: 200, ratio: 0.75 }), {
    width: '200px', widthPx: 200, height: null, displayHeight: 267, mode: 'widthFix', scroll: false,
    needsNatural: false,
  }, '定宽 × 比例(宽/高) 只锁宽，显示高 267 供视口，不压盒子')
  // 定高 → heightFix，宽度自适应；显示宽由 height×ratio 得，供面板贴合（不是原图像素宽）
  assert.deepEqual(r({ height: 150 }), {
    width: 'auto', widthPx: null, height: 150, displayHeight: 150, mode: 'heightFix', scroll: false,
    needsNatural: true,
  }, '定高走 heightFix，比例未知首帧 widthPx=null')
  assert.equal(
    resolveImageSize({ height: 200 }, { containerWidth: 240, natural: { width: 100, height: 400 } }).widthPx,
    50, '定高 200 × 比例(100/400=0.25) → 显示宽 50，面板贴合的是显示宽而非原图宽 100',
  )
  // 原图比例（口径宽/高）
  assert.equal(r({ width: 240, naturalWidth: 750, naturalHeight: 1000 }).displayHeight, 320, '原图比例用宽/高，240 → 显示高 320')
  // width:auto 不放大：按 onLoad 真实宽
  assert.equal(resolveImageSize({ width: 'auto' }, { containerWidth: 240, natural: { width: 120, height: 80 } }).width, '120px', 'auto 走真实尺寸不放大')
  // 未给 width：默认取容器内容宽的确定像素，不再走 '100%' 拉满（面板贴合需要确定宽）
  const defaulted = r({})
  assert.equal(defaulted.width, '240px', '未给宽时默认取 containerWidth 的确定像素宽')
  assert.equal(defaulted.widthPx, 240, '默认宽有确定像素值，外层面板才能贴合')
  // 上界全档生效：maxWidth 是纯宽度上界，不依赖比例
  assert.equal(r({ width: 400, maxWidth: 300 }).widthPx, 300, 'maxWidth 无比例时也要生效')
  assert.equal(r({ height: 400, maxHeight: 200, ratio: 1 }).height, 200, '定高档 maxHeight 压高度')
  assert.equal(r({ height: 400, maxWidth: 100, ratio: 1 }).height, 100, '定高档 maxWidth 按比例反推最大高度')
  assert.equal(
    resolveImageSize({ width: 400, maxWidth: 300, fit: 'scroll' }, { containerWidth: 320 }).widthPx,
    300,
    'scroll 档 maxWidth 约束视口宽',
  )
  // '100%' 档比例已知时按内容区宽折算显示高，多图 Swiper 才能定高
  assert.equal(r({ width: '100%', ratio: 2 }).displayHeight, 120, "'100%' 按内容区宽折算显示高（240/2）")
  // auto 按原图宽，但不放大也不超内容区
  assert.equal(
    resolveImageSize({ width: 'auto' }, { containerWidth: 240, natural: { width: 800, height: 400 } }).widthPx,
    240,
    'auto 不放大也不超内容区，宽图不出面板',
  )
  // '100%'：宽度由容器决定、widthPx=null，保持 widthFix，不写死高度
  const pct = r({ width: '100%', fit: 'scroll' })
  assert.equal(pct.widthPx, null, "'100%' 无确定像素宽")
  assert.equal(pct.mode, 'widthFix', "'100%' 保持 widthFix")
  assert.equal(pct.height, null, "'100%' 不锁高")
  // 上界：scroll 档 maxHeight 只给视口、不写 Image；contain 档折算进 width
  const bounded = r({ width: 240, maxHeight: '320px', fit: 'scroll' })
  assert.equal(bounded.maxHeight, '320px', 'maxHeight 的 px 值只作滚动视口高')
  assert.equal(bounded.scroll, true, 'fit=scroll 打开 Y 滚动视口')
  assert.equal(bounded.height, null, 'scroll 档不锁图片高，长图不压扁')
  const capped = resolveImageSize({ width: 400, maxHeight: 200 }, { containerWidth: 240, natural: { width: 400, height: 200 } })
  assert.equal(capped.widthPx, 400, 'contain 的 maxHeight 折算进宽度上限：400 宽 2:1 图在 200 高内仍是 400 宽')
  const capped2 = resolveImageSize({ width: 400, maxHeight: 100 }, { containerWidth: 240, natural: { width: 400, height: 200 } })
  assert.equal(capped2.widthPx, 200, 'maxHeight 100 把 2:1 图的宽压到 200（仍 widthFix 不拉伸）')
  // 定宽无比例首帧 → widthFix + needsNatural，等 onLoad 回灌
  assert.deepEqual(
    (({ width, widthPx, height, mode, needsNatural }) => ({ width, widthPx, height, mode, needsNatural }))(r({ width: 240 })),
    { width: '240px', widthPx: 240, height: null, mode: 'widthFix', needsNatural: true },
    '定宽无比例首帧交 widthFix，等 onLoad 回灌',
  )
  // 定宽 + onLoad 回灌真实尺寸后算出显示高
  const loaded = resolveImageSize({ width: 240 }, { containerWidth: 240, natural: { width: 600, height: 300 } })
  assert.equal(loaded.displayHeight, 120, '回灌 2:1 真实比例后 240 宽 → 显示高 120')
  assert.equal(loaded.needsNatural, false, '回灌后不再是待定几何')
})

test('ImagePopup：单图直出、多图走 Swiper + 红点，两类按钮、长图只 Y 滚动', () => {
  const single = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      slides: [{ src: 'a.png', width: 240, ratio: 0.75 }],
    }),
  )
  assert.match(single, /mptk-popup--surface-none/, '图片弹窗底层是裸壳 Popup')
  assert.match(single, /mptk-popup__close--below-center/, '默认关闭按钮落在图片下方')
  assert.match(single, /mptk-image-popup__single/, '单图直出，不走 Swiper')
  assert.doesNotMatch(single, /<swiper/, '单图不该出 Swiper')
  assert.match(single, /mptk-image-popup__panel/, '面板 class 用于把宽度贴合图片')
  assert.doesNotMatch(single, /scaleToFill/, '任何档都不拉伸')

  // 未给 width：图片按面板默认宽 320px 显示，面板同步贴合 320px（不再 '100%' 拉满）
  const defaultedSlide = render(
    h(ImagePopup, { open: true, onClose: () => {}, slides: [{ src: 'a.png' }] }),
  )
  assert.match(defaultedSlide, /<image[^>]*style="[^"]*width:320px/, '未给宽的图片默认 320px')
  assert.match(defaultedSlide, /mptk-image-popup__panel[^>]*style="[^"]*width:320px/, '面板贴合默认图宽 320px')

  // 图片按钮未给宽：按原图尺寸（auto → 容器宽 200 兜底），不再撑满按钮行把文字按钮挤走
  const autoButton = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      slides: [{ src: 'a.png', width: 320, actions: [{ src: 'btn.png' }] }],
    }),
  )
  assert.match(autoButton, /mptk-image-popup__action-image[^>]*width:200px/, '图片按钮默认按容器宽兜底，不撑满')

  // 比例未知的首帧先隐藏，等 onLoad 回灌 / onError 定论后再显示
  const pending = render(
    h(ImagePopup, { open: true, onClose: () => {}, slides: [{ src: 'a.png', height: 240 }] }),
  )
  assert.match(pending, /<image[^>]*style="[^"]*opacity:0/, '比例未知首帧先隐藏，避免跳变')

  // 空 slides 不渲染任何东西，也不抛
  assert.equal(render(h(ImagePopup, { open: true, onClose: () => {}, slides: [] })), '', '空 slides 静默不渲染')

  // 红点可关
  const noDots = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      showIndicators: false,
      slides: [{ src: 'a.png', width: 320 }, { src: 'b.png', width: 320 }],
    }),
  )
  assert.doesNotMatch(noDots, /indicator-dots/, 'showIndicators=false 不渲染原生红点')

  const withActions = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      slides: [{
        src: 'a.png',
        width: 240,
        ratio: 0.75,
        actionsAlign: 'right',
        actions: [
          { text: '查看详情', type: 'primary', variant: 'solid', size: 'lg' },
          { src: 'btn.png', height: 36 },
        ],
      }],
    }),
  )
  assert.match(withActions, /mptk-btn/, '文字按钮用现成 Button')
  assert.match(withActions, /查看详情/, '按钮文字落在 children')
  assert.match(withActions, /mptk-btn--lg/, '文字按钮 size 透传，消费端可配')
  assert.match(withActions, /justify-content:flex-end/, 'align=right 落到 flex-end')
  assert.match(withActions, /mptk-image-popup__action-image/, '图片按钮独立渲染')
  assert.match(withActions, /height:36px/, '图片按钮定高、宽按原图自适应')

  // 长图：scroll 档套 scroll-view，只开 scroll-y，视口高取 maxHeight，绝不 X 滚动。
  const longImage = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      slides: [{ src: 'long.png', width: '100%', maxHeight: 500, fit: 'scroll' }],
    }),
  )
  assert.match(longImage, /mptk-image-popup__scroll/, '长图套滚动视口')
  assert.match(longImage, /<scroll-view[^>]*scroll-y/, '滚动视口开 scroll-y')
  assert.doesNotMatch(longImage, /scroll-x="true"/, '绝不开放 X 轴滚动')
  assert.match(longImage, /height:500px/, '视口高取 maxHeight')
  // 回归：Image 只锁宽走 widthFix，绝不写死 height / max-height——否则长图被压成细条。
  assert.match(longImage, /mode="widthFix"/, '长图图片走 widthFix，按真实比例撑高')
  assert.doesNotMatch(longImage, /<image[^>]*style="[^"]*max-height/, 'Image 上不得写 max-height，长图不能被压扁')
  assert.doesNotMatch(longImage, /<image[^>]*style="[^"]*height:/, 'Image 上不得写固定 height，只在滚动视口定高')

  const multi = render(
    h(ImagePopup, {
      open: true,
      onClose: () => {},
      slides: [
        { src: 'a.png', width: 240, ratio: 0.75 },
        { src: 'b.png', width: 200, height: 400 },
        { src: 'long.png', width: '100%', maxHeight: 300, fit: 'scroll' },
      ],
    }),
  )
  assert.match(multi, /mptk-image-popup__slider/, '多图走 slider 容器')
  assert.match(multi, /<swiper/, '多图出 Swiper')
  assert.match(multi, /indicator-dots/, '多图保留微信原生红点')
  assert.equal((multi.match(/<swiper-item/g) ?? []).length, 3, '每张图一个 SwiperItem')
  assert.equal((multi.match(/mptk-image-popup__slide\b/g) ?? []).length, 3, '每屏一个居中容器')
  // Swiper 高度跟随当前页（第 1 屏 240/0.75=320），不取全局最大值——切到高图才变高、叉随之下移。
  assert.match(multi, /<swiper[^>]*style="height:320px"/, 'Swiper 高度等于当前页图片高度')
  assert.doesNotMatch(multi, /<swiper[^>]*style="height:400px"/, '不再取所有页最大高度')
  // 每图独立尺寸：定高图走 heightFix，宽度自适应、不锁死，而不是统一兜底宽。
  assert.match(multi, /width:auto;height:400px/, '定高图按自己的高度渲染，宽交 heightFix 自适应')
  // 面板贴合当前图片宽：定宽 240 → 面板内联 width:240px，叉按面板右缘即贴图片右缘。
  assert.match(single, /mptk-image-popup__panel"\s+style="width:240px;max-width:100vw"/, '单图面板内联宽度贴合图片，不再左右留白')
  assert.match(multi, /mptk-image-popup__panel"\s+style="width:240px;max-width:100vw"/, '多图面板同样贴合当前页图片宽')

  // 单图索引钳制：slides 长度变化后越界的 current 必须被归零，否则组件 return null 打不开。
  const imageSrc = readFileSync(new URL('../src/ui/layout/ImagePopup.tsx', import.meta.url), 'utf8')
  assert.match(
    imageSrc,
    /const index = slides\.length === 0 \? 0 : Math\.min\(Math\.max\(current, 0\), slides\.length - 1\)/,
    '索引必须无条件钳到 [0, slides.length-1]，多图滑到末页后切单图也要归零',
  )
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
