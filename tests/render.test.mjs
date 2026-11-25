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

/** Taro 运行时桩：SSR 里 useEffect 不执行，这里只需让静态 import 通过；量宽/事件 API 不会被调用。 */
const taroStub = `
const noop = () => {}
export default {
  createSelectorQuery: () => ({ select: () => ({ boundingClientRect: () => {} }), exec: (cb) => cb([null]) }),
  onWindowResize: noop,
  offWindowResize: noop,
}
`


registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@tarojs/components') return { url: 'mptk-test:components', shortCircuit: true }
    if (specifier === '@tarojs/taro') return { url: 'mptk-test:taro', shortCircuit: true }
    if (PRE_RESOLVED.has(specifier)) return { url: PRE_RESOLVED.get(specifier), shortCircuit: true }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url === 'mptk-test:components') {
      return { format: 'module', shortCircuit: true, source: componentsStub }
    }
    if (url === 'mptk-test:taro') {
      return { format: 'module', shortCircuit: true, source: taroStub }
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
const { ContentPopup } = await import('../dist/ui/layout/content-popup/index.js')
const { resolveImageSize } = await import('../dist/ui/layout/image-size.js')
const { closeOffsetVars } = await import('../dist/ui/layout/edge-offset.js')
const { Drawer, Dropdown } = await import('../dist/ui/navigation/index.js')
const { Dialog, Loading, Toast } = await import('../dist/ui/feedback/index.js')
const { DialogHost } = await import('../dist/ui/infra/DialogHost.js')
const { KitPageKeyContext } = await import('../dist/ui/infra/page-key-context.js')
const { setPageKeyProvider } = await import('../dist/runtime/page-route.js')
const commands = await import('../dist/ui/index.js')
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

  /* 默认 circle + 描边 + 非实底 → soft（边）+ translucent class + pill 圆角。 */
  const soft = render(h(Popup, base, h('div', null, '内容')))
  assert.match(soft, /mptk-btn--soft/, '默认档有描边，落在 soft')
  assert.match(soft, /mptk-popup__close--translucent/, '默认底色就是非实底：不传 closeBackground 也要挂 translucent class')
  assert.doesNotMatch(soft, /mptk-popup__close--solid-bg/, '非实底档不能同时挂实底上下文类')
  assert.match(soft, /mptk-btn--radius-pill/, 'circle 形状走 pill 圆角')
  assert.match(soft, /mptk-popup__close--above-center/, '底部面板默认关闭按钮在面板外上中')
  assert.match(soft, /mptk-popup__close--on-overlay/, '外上中完全落在遮罩上，挂亮灰上下文类')
  const inside = render(h(Popup, { ...base, closePosition: 'top-left' }, h('div', null, '内容')))
  assert.doesNotMatch(inside, /mptk-popup__close--on-overlay/, '面板内的按钮不能吃遮罩上的亮灰，否则白面板上看不见')
  const half = render(h(Popup, { ...base, closePosition: 'edge-top-right' }, h('div', null, '内容')))
  assert.doesNotMatch(half, /mptk-popup__close--on-overlay/, '跨半档一半压着面板，不按全在遮罩上取色')

  /* 显式传 true 才走实底：translucent 必须消失、solid-bg 必须挂上，否则底色上下文取不到。 */
  const solid = render(h(Popup, { ...base, closeBackground: true }, h('div', null, '内容')))
  assert.doesNotMatch(solid, /mptk-popup__close--translucent/, 'closeBackground=true 是实底，不该带 translucent class')
  assert.match(solid, /mptk-popup__close--solid-bg/, '实底档挂 solid-bg，供遮罩上覆盖底色')
  assert.match(solid, /mptk-popup__close--on-overlay/, '实底档同样保留落点上下文类')
  const solidInside = render(h(Popup, { ...base, closeBackground: true, closePosition: 'top-left' }, h('div', null, '内容')))
  assert.match(solidInside, /mptk-popup__close--solid-bg/, '面板内实底档也挂 solid-bg')
  assert.doesNotMatch(solidInside, /mptk-popup__close--on-overlay/, '面板内实底档不吃遮罩上的深底')

  /* 关掉底色与描边、换圆角方 → solid + 半透明 class；叉色不受背景轴影响。 */
  const ghost = render(h(Popup, { ...base, closeShape: 'rounded', closeBorder: false, closeBackground: false }, h('div', null, '内容')))
  assert.match(ghost, /mptk-btn--solid/, '描边关 → solid，variant 只由描边轴决定')
  assert.match(ghost, /mptk-popup__close--translucent/, '背景「否」走非实底 class，不再是空底')
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
  assert.match(top, /mptk-popup__close--on-overlay/, '面板下方外置档也完全落在遮罩上')
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
  assert.match(bare, /mptk-popup__close--above-center/, '裸壳档关闭按钮仍渲染且落在默认外上中')
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

test('ContentPopup 文字头把小图标、标题、副标题渲染成一体并带分割线', () => {
  const html = render(
    h(ContentPopup, { open: true, variant: 'title', title: 'T', subtitle: 'S', glyph: h('span', null, 'i'), actions: [{ text: 'OK' }], onClose: () => {} }),
    h('span', null, 'body'),
  )
  assert.match(html, /mptk-content-popup__header--title/)
  assert.match(html, /mptk-content-popup__lead-slot/)
  assert.match(html, /mptk-content-popup__lead-glyph/)
  assert.match(html, /mptk-content-popup__title-text/)
  assert.match(html, /class="mptk-content-popup__title"/)
  assert.match(html, /class="mptk-content-popup__subtitle"/)
  assert.match(html, /mptk-content-popup__header--title[^"]*mptk-content-popup__header--divided|mptk-content-popup__header--divided/, '分割线归 header 的 border-bottom，不再独立成节点')
  assert.doesNotMatch(html, /mptk-content-popup__divider/, '旧的独立 divider 节点已移除')
  assert.match(html, /mptk-popup__close--below-center/, '中部弹窗默认关闭叉在外下中')
  assert.match(html, /mptk-content-popup__actions/)
})

test('ContentPopup 底部弹窗默认关闭叉在外上中', () => {
  const html = render(h(ContentPopup, { open: true, position: 'bottom', variant: 'title', title: 'T', onClose: () => {} }))
  assert.match(html, /mptk-popup__close--above-center/)
  assert.doesNotMatch(html, /mptk-popup__close--top-right/)
  assert.doesNotMatch(html, /mptk-popup__close--above-right/)
})

test('ContentPopup 底部徽标头默认隐藏关闭叉，显式 closeable 可覆盖', () => {
  const badge = { content: { kind: 'icon', name: 'common.base:AIdamoxing' } }
  const cases = [
    { radius: 'circle', anchor: 'center' },
    { radius: 'md', anchor: 'left' },
    { radius: 'sm', anchor: 'right' },
    { radius: 999, anchor: 'right' },
  ]
  for (const { radius, anchor } of cases) {
    const props = {
      open: true, position: 'bottom', variant: 'badge', onClose: () => {},
      badge: { ...badge, radius, offset: { anchor } },
    }
    const html = render(h(ContentPopup, props))
    assert.doesNotMatch(html, /mptk-popup__close/, `底部徽标 ${String(radius)}/${anchor} 默认不显示关闭叉`)
    const forced = render(h(ContentPopup, { ...props, closeable: true }))
    assert.match(forced, /mptk-popup__close--above-center/, '显式 closeable=true 仍可显示')
  }
  const center = render(h(ContentPopup, {
    open: true, position: 'center', variant: 'badge', badge, onClose: () => {},
  }))
  assert.match(center, /mptk-popup__close--below-center/, '中部徽标头不受影响')
})

test('ContentPopup 图片头渲染原生 Image，默认无分割线，背景走内联', () => {
  const transparent = render(h(ContentPopup, {
    open: true, variant: 'image', image: { src: 'x.png' }, headerBackground: 'transparent', onClose: () => {},
  }))
  assert.match(transparent, /mptk-content-popup__panel--transparent-header/, 'transparent 字面量给面板打透明头标记')
  assert.match(transparent, /background-color:transparent/, 'header 自身底色为透明')
  const normal = render(h(ContentPopup, { open: true, variant: 'image', image: { src: 'x.png' }, onClose: () => {} }))
  assert.doesNotMatch(normal, /mptk-content-popup__panel--transparent-header/, '未指定时面板保持原底色')

  const html = render(h(ContentPopup, { open: true, variant: 'image', image: { src: 'x.png', width: 320 }, headerBackground: '#fff' }))
  assert.match(html, /mptk-content-popup__header--image/)
  assert.match(html, /<image/)
  assert.match(html, /mode="widthFix"/)
  assert.doesNotMatch(html, /mptk-content-popup__header--divided/, '图片头默认无分割线')
  assert.match(html, /background-color:#fff/)
})

test('图片头几何：默认铺满、超宽原样透传、对齐与四向偏移落到实际节点', () => {
  const base = { open: true, variant: 'image', onClose: () => {} }
  const full = render(h(ContentPopup, { ...base, image: { src: 'x.png' } }))
  assert.match(full, /class="mptk-content-popup__image"[^>]*style="width:100%/, '图片头默认铺满头部，不是写死 320px')
  assert.doesNotMatch(full, /class="mptk-content-popup__image"[^>]*width:320px/, '默认不再落容器确定宽')

  const wide = render(h(ContentPopup, {
    ...base,
    image: { src: 'x.png', width: 400, align: 'right', offset: { top: -40, left: 24 } },
  }))
  assert.match(wide, /class="mptk-content-popup__image"[^>]*width:400px/, '超宽原样透传，不被压回容器')
  assert.match(wide, /align-self:flex-end/, 'align=right 落到 flex 交叉轴')
  assert.match(wide, /top:-40px/, '负向上偏移=向外伸')
  assert.match(wide, /left:24px/, '正向左偏移=向内收')

})

test('关闭按钮偏移：四向值作为 CSS 变量落到真实按钮节点，定位仍由档位 CSS 计算', () => {
  const html = render(h(ContentPopup, {
    open: true, position: 'bottom', variant: 'title', title: 'T',
    closePosition: 'top-right', closeOffset: { top: -10, right: 12 }, onClose: () => {},
  }))
  assert.match(html, /--mptk-popup-close-shift-top:-10px/, '调用方数值原样写成 CSS 变量')
  assert.match(html, /--mptk-popup-close-shift-right:12px/, '右向同理')
  assert.match(html, /--mptk-popup-close-shift-bottom:0px/, '未给的轴显式给 0px 零值')
  assert.doesNotMatch(html, /(?:top|right|bottom|left):calc\(var\(--mptk-popup-close-base-/, 'JS 不内联定位属性，定位只在 CSS 档位里')
  assert.match(html, /mptk-popup__close--top-right/, '原档位类不变')
  assert.ok(html.indexOf('mptk-popup__close') > html.indexOf('mptk-popup__body'), '按钮仍在内容之后，层级不被图片盖住')
  assert.deepEqual(closeOffsetVars(undefined), {
    '--mptk-popup-close-shift-top': '0px',
    '--mptk-popup-close-shift-right': '0px',
    '--mptk-popup-close-shift-bottom': '0px',
    '--mptk-popup-close-shift-left': '0px',
  }, '未给偏移时四个变量都是 0px，原档位位置一字不变')

  // center + 默认 below-center：四向变量由档位自己的 calc 消费，JS 不猜锚点。
  const shifted = render(h(ContentPopup, {
    open: true, position: 'center', variant: 'image', image: { src: 'a.png' },
    closeOffset: { top: -10, right: 12 }, onClose: () => {},
  }))
  assert.match(shifted, /mptk-popup__close--below-center/, '默认档位为下方居中')
  assert.match(shifted, /--mptk-popup-close-shift-top:-10px/, '偏移原样落到按钮节点')
  assert.match(shifted, /--mptk-popup-close-shift-right:12px/, '右向同理')
  assert.doesNotMatch(shifted, /(?:top|right|bottom|left):calc\(var\(--mptk-popup-close-base-/, '不在 JS 里算定位')

  const viaImage = render(h(ImagePopup, {
    open: true, slides: [{ src: 'a.png', width: 200 }], closeOffset: { bottom: 20 }, onClose: () => {},
  }))
  assert.match(viaImage, /--mptk-popup-close-shift-bottom:20px/, 'ImagePopup 同样透传底座偏移')

  const demoPage = readFileSync(join(root, 'demo/src/pages/popup/index.tsx'), 'utf8')
  assert.doesNotMatch(demoPage, /叉偏移|closeOffset=/, '演示站不再展示关闭叉偏移')
  assert.match(demoPage, />上延伸</, '新增上延伸入口')
  assert.match(demoPage, /imageGeom === 'rise'\s*\n?\s*\? \{ src: HEADER_RISE_UP, offset: \{ top: -30 \} \}/, '上延伸：默认头部背景 + 上伸 30')
  assert.match(demoPage, /imageGeom === 'both'\s*\n?\s*\? \{ src: HEADER_RISE_BOTH, offset: \{ top: -30, bottom: -50 \} \}/, '上下双伸：上 30 下 50')
  assert.match(demoPage, /popup-header-rise-up\.png/, '上延伸图片走仓库 raw 地址')
  assert.match(demoPage, /popup-header-rise-both\.png/, '上下双伸图片走仓库 raw 地址')
  for (const name of ['popup-header-rise-up.png', 'popup-header-rise-both.png']) {
    assert.ok(existsSync(join(root, 'assets/popup', name)), `${name} 必须落在 assets/popup`)
  }
})

test('ContentPopup 徽标对象：四形态、描边开关、有符号偏移与关闭位避让', () => {
  const base = {
    open: true,
    variant: 'badge',
    title: 'Hi',
    closePosition: 'top-right',
    onClose: () => {},
  }
  const glyph = render(h(ContentPopup, {
    ...base,
    badge: {
      size: 72,
      overlap: '40%',
      offset: { anchor: 'left', x: 20, y: -8 },
      border: { width: 3, color: '#fff' },
      content: { kind: 'glyph', node: h('span', null, 'b') },
    },
  }))
  assert.match(glyph, /mptk-content-popup__header--badge/)
  assert.match(glyph, /mptk-content-popup__badge\b/)
  assert.match(glyph, /mptk-content-popup__lead-glyph/)
  assert.match(glyph, /translateY\(-40%\)/)
  assert.match(glyph, /width:72px/)
  assert.match(glyph, /border-width:3px/)
  assert.match(glyph, /border-color:\s*#fff/)
  assert.match(glyph, /left:20px/, '靠左档有符号 x 生效')
  assert.match(glyph, /top:-8px/, '有符号 y 走 top，不拼进 translateY')
  assert.match(glyph, /mptk-popup__close--below-center/)
  assert.doesNotMatch(glyph, /mptk-popup__close--top-right/)
  assert.doesNotMatch(glyph, /translateY\(--/, '不能拼出 --8px 非法值')

  // 内置 icon：name 直接透给 Icon；size 数字档。
  const icon = render(h(ContentPopup, { ...base, badge: { content: { kind: 'icon', name: 'common.base:AIdamoxing', size: 28 } } }))
  assert.match(icon, /mptk-content-popup__lead-icon/, '内置 icon 形态')
  assert.match(icon, /font-size:\s*28px/, '图标尺寸可覆盖')

  // 第三方类名：两个类名一起落到 Text 的 class，不经过 Icon 的 name 解析。
  const iconClass = render(h(ContentPopup, { ...base, badge: { content: { kind: 'iconClass', className: 'fa fa-star', size: '20px' } } }))
  assert.match(iconClass, /mptk-content-popup__lead-iconclass fa fa-star/, '第三方两类名原样透传')
  assert.match(iconClass, /font-size:\s*20px/)

  // 图片：aspectFill + 可设宽高，空宽度时由 CSS 100% 撑满容器。
  const image = render(h(ContentPopup, { ...base, badge: { content: { kind: 'image', src: 'a.png', width: 40, height: 40 } } }))
  assert.match(image, /mptk-content-popup__lead-image/)
  assert.match(image, /<image/)
  assert.match(image, /aspectFill/)
  assert.match(image, /width:40px/)

  // 描边关闭 + 居中档自定义 x 用 calc 叠加百分比。
  const noBorder = render(h(ContentPopup, { ...base, badge: { border: false, offset: { x: '10%' }, content: { kind: 'glyph', node: h('span') } } }))
  assert.match(noBorder, /border-width:\s*0/)
  assert.match(noBorder, /left:\s*calc\(50% \+ 10%\)/)

  // 徽标外圈描边默认开（与 header 横向分割线是两回事）；默认 blue tone。
  const plain = render(h(ContentPopup, { ...base, badge: { content: { kind: 'glyph', node: h('span') } } }))
  assert.match(plain, /mptk-content-popup__badge--tone-blue/, '默认 blue 预设色')
  assert.match(plain, /border-width:\s*var\(--mptk-c-content-popup-badge-border-w\)/, '徽标外圈描边默认开')
  assert.doesNotMatch(plain, /mptk-content-popup__header--divided/, '徽标头默认没有 header 横向分割线')
  const green = render(h(ContentPopup, { ...base, badge: { tone: 'green', content: { kind: 'glyph', node: h('span') } } }))
  assert.match(green, /mptk-content-popup__badge--tone-green/, 'tone 可切色')
  const solid = render(h(ContentPopup, { ...base, badge: { background: '#fff', content: { kind: 'glyph', node: h('span') } } }))
  assert.match(solid, /background-color:\s*#fff/, '显式纯色生效')
  assert.match(solid, /background-image:\s*none/, '显式纯色盖掉 tone 预设渐变')
})

test('ContentPopup headerImage 与 headerIcon 正交，iconColor 落到图标，两档标题同一类', () => {
  // 图片背景与纯色/渐变同层叠加；不裁切外伸图标，故给 header 而非 overflow:hidden。
  const withImage = render(h(ContentPopup, {
    open: true,
    title: 'T',
    headerBackground: '#fff',
    headerImage: { src: 'head.png', mode: 'contain', position: 'left', repeat: true },
  }))
  assert.match(withImage, /mptk-content-popup__header[^>]*background-color:\s*#fff/, '纯色背景仍在 header 层')
  assert.match(withImage, /mptk-content-popup__header[^>]*background-image:\s*url\(/, '图片背景与纯色同层')
  assert.match(withImage, /head\.png/, '图片地址落到 header')
  assert.match(withImage, /background-size:contain/, 'mode 落到 background-size')
  assert.match(withImage, /background-position:left/, 'position 可配')
  assert.match(withImage, /background-repeat:repeat/, 'repeat 可配')

  // title 档走与 badge 档同一份四形态渲染，iconColor 优先于 tone 字色，content.color 又优先于 iconColor。
  const colored = render(h(ContentPopup, {
    open: true,
    title: 'T',
    headerIcon: { kind: 'icon', name: 'common.base:AIdamoxing' },
    iconColor: '#f00',
  }))
  assert.match(colored, /mptk-content-popup__lead-icon/, 'title 档图标并入 __lead-* 类族')
  assert.match(colored, /color:\s*#f00/, 'iconColor 落到图标节点')

  const own = render(h(ContentPopup, {
    open: true,
    title: 'T',
    headerIcon: { kind: 'icon', name: 'common.base:AIdamoxing', color: '#0f0' },
    iconColor: '#f00',
  }))
  assert.match(own, /color:\s*#0f0/, 'content.color 优先于 iconColor')
  assert.doesNotMatch(own, /color:\s*#f00/, '被覆盖的 iconColor 不残留')

  // 两档主标题共用 __title 类，字号同档；外伸档不出副标题，只有居中档出标题。
  const titleHtml = render(h(ContentPopup, { open: true, title: '同一个标题' }))
  const badgeHtml = render(h(ContentPopup, {
    open: true,
    variant: 'badge',
    title: '同一个标题',
    subtitle: '顶层副标题',
    badge: { content: { kind: 'glyph', node: h('span') } },
  }))
  assert.match(titleHtml, /<text class="mptk-content-popup__title">同一个标题<\/text>/)
  assert.match(badgeHtml, /<text class="mptk-content-popup__title">同一个标题<\/text>/, '两档标题同一类，字号同档')
  assert.match(badgeHtml, /mptk-content-popup__title-text--raised/, '外伸档文案块加间距修饰类')
  assert.doesNotMatch(badgeHtml, /顶层副标题/, '外伸档不显示副标题')

  const left = render(h(ContentPopup, {
    open: true,
    variant: 'badge',
    title: '不该出现',
    badge: { content: { kind: 'glyph', node: h('span') }, offset: { anchor: 'left' } },
  }))
  assert.doesNotMatch(left, /mptk-content-popup__title-text/, '靠左档不出文案块')
  assert.doesNotMatch(left, /不该出现/, '靠左档不出标题')
})

test('ContentPopup 徽标空内容不渲染空容器：只传 title 不再造空徽标', () => {
  const html = render(h(ContentPopup, { open: true, variant: 'badge', title: '只有标题' }))
  assert.doesNotMatch(html, /mptk-content-popup__header--badge/, '没有 content 连头部都不渲染')
  assert.doesNotMatch(html, /mptk-content-popup__badge(?![-\w])/, '没有 content 就不渲染徽标容器')
})

test('ContentPopup 背景渐变：默认 165deg、fadeFrom/fadeTo 把颜色收在分割线之前', () => {
  const grad = (value, extra = {}) =>
    render(h(ContentPopup, { open: true, title: 'T', ...extra, headerBackground: value }))
  const has = (html, pattern, why) => assert.match(html, pattern, why)

  has(grad({ from: '#a', to: '#b' }), /linear-gradient\(165deg,\s*#a,\s*#b\)/, '双色渐变默认 165deg（偏左起色）')
  has(grad({ from: '#a' }), /linear-gradient\(165deg,\s*#a,\s*var\(--mptk-surface-elevated\)\)/, 'to 缺省淡出到面板底色')
  has(grad({ from: '#a', direction: 45, to: '#b' }), /linear-gradient\(45deg,\s*#a,\s*#b\)/, '数字角度直接落成 deg')
  has(grad({ from: '#a', to: '#b', direction: 'to-bottom' }), /linear-gradient\(180deg,\s*#a,\s*#b\)/, '方位枚举仍照旧映射')

  // 只有 fadeFrom：起始色保持到 8% 才开始过渡，到末端（100%）才淡出到底色。
  has(grad({ from: '#a', fadeFrom: 8 }), /linear-gradient\(165deg,\s*#a 0%,\s*#a 8%,\s*var\(--mptk-surface-elevated\) 100%\)/, 'fadeFrom 单独用：终点在 100%')
  // fadeFrom + fadeTo：顶部 5% 纯色，到 70% 已淡出到底色，70%→线（100%）整段保持底色。
  has(grad({ from: '#a', fadeFrom: 5, fadeTo: 70 }), /linear-gradient\(165deg,\s*#a 0%,\s*#a 5%,\s*var\(--mptk-surface-elevated\) 70%\)/, 'fadeTo 让淡出在 70% 就结束，到线前收干净')
  has(grad({ from: '#a', fadeTo: 70 }), /linear-gradient\(165deg,\s*#a 0%,\s*#a 0%,\s*var\(--mptk-surface-elevated\) 70%\)/, '只给 fadeTo 则从 0% 就过渡')

  const twoTone = grad({ from: '#a', to: '#b', fadeFrom: 5, fadeTo: 70 })
  has(twoTone, /linear-gradient\(165deg,\s*#a,\s*#b\)/, '双色渐变忽略 fadeFrom/fadeTo')

  const panel = render(h(ContentPopup, { open: true, panelBackground: { from: '#a', to: '#b' } }))
  has(panel, /linear-gradient\(165deg,\s*#a,\s*#b\)/, '整面板渐变走同一套解析')
})

test('ContentPopup headerTone 按头部底色明暗反色是库内能力，消费方不写私有类名', () => {
  const onLight = render(h(ContentPopup, { open: true, title: 'T', headerTone: 'on-light' }))
  assert.match(onLight, /mptk-content-popup__header--on-light/, '浅底头生成 on-light 修饰类')
  const onDark = render(h(ContentPopup, { open: true, title: 'T', headerTone: 'on-dark' }))
  assert.match(onDark, /mptk-content-popup__header--on-dark/, '深底头生成 on-dark 修饰类')
  const normal = render(h(ContentPopup, { open: true, title: 'T' }))
  assert.doesNotMatch(normal, /mptk-content-popup__header--on-(light|dark)/, '默认 normal 不带反色类')

  const css = readFileSync(join(root, 'src/ui/layout/content-popup/style/index.scss'), 'utf8')
  assert.match(css, /\.mptk-content-popup__header--on-light\s*\{[^}]*--mptk-c-content-popup-head-ink:\s*var\(--mptk-c-content-popup-head-ink-on-light\)/, '浅底头切固定深字 token')
  assert.match(css, /\.mptk-content-popup__header--on-light\.mptk-content-popup__header--divided\s*\{[^}]*border-bottom-color:\s*var\(--mptk-c-content-popup-head-divider-on-light\)/, '浅底头切深线')
  assert.match(css, /\.mptk-content-popup__header--on-dark\s*\{[^}]*--mptk-c-content-popup-head-ink:\s*var\(--mptk-fg-on-accent\)/, '深底头切浅字 token')
  assert.match(css, /\.mptk-content-popup__header--on-dark\.mptk-content-popup__header--divided\s*\{[^}]*border-bottom-color:\s*var\(--mptk-fg-on-accent\)/, '深底头切浅线')

  const popupPage = readFileSync(join(root, 'demo/src/pages/popup/index.tsx'), 'utf8')
  assert.match(popupPage, /useThemeSnapshot/, '整体渐变按主题切明暗配色')
  assert.match(popupPage, /contentMode === 'head-light' \? 'on-light'/, '浅底头按底色给 on-light')
  assert.match(popupPage, /contentMode === 'head-dark' \? 'on-dark'/, '深底头按底色给 on-dark')
  assert.match(popupPage, /headerTone=\{headerTone\}/, '演示用语义化 prop')
  assert.doesNotMatch(popupPage, /demo-content-popup--deep-head/, '演示不再传私有类名')
  assert.doesNotMatch(popupPage, /headerDividerColor/, '线色由 headerTone 带出，不单独传')
  const appScss = readFileSync(join(root, 'demo/src/app.scss'), 'utf8')
  assert.doesNotMatch(appScss, /demo-content-popup--deep-head/, 'demo 不再写私有覆盖类')

  // 演示按钮拆成「头部渐变」与「整体渐变」两组 Cell，各两个按钮。
  assert.match(popupPage, /title="头部渐变"/, '有头部渐变 Cell')
  assert.match(popupPage, /title="整体渐变"/, '有整体渐变 Cell')
  assert.doesNotMatch(popupPage, /title="渐变背景"/, '旧的合并 Cell 已拆掉')
  const headCell = popupPage.slice(popupPage.indexOf('title="头部渐变"'), popupPage.indexOf('title="整体渐变"'))
  assert.equal((headCell.match(/>头部[浅深]</g) ?? []).length, 2, '头部渐变 Cell 只放浅/深两个按钮')
  const wholeCell = popupPage.slice(popupPage.indexOf('title="整体渐变"'), popupPage.indexOf('title="图片头"'))
  assert.match(wholeCell, />渐隐</, '整体渐变有渐隐')
  assert.match(wholeCell, />渐变</, '整体渐变有渐变')

  // 渐隐走 panelBackground（铺满整面板含头部），明暗各一支深蓝系色，不再限于 header。
  const palette = popupPage.slice(popupPage.indexOf('const panelBackground'), popupPage.indexOf('const headerTone'))
  assert.match(palette, /panel-fade[\s\S]*fadeFrom: 0, fadeTo: 45/, '渐隐自顶部即渐变、到 45% 已完全收净')
  assert.match(palette, /dark[\s\S]*rgba\(107, 138, 253, \.18\)/, '暗档渐隐用淡蓝，左上一点即收')
  assert.match(palette, /#1E3A8A[\s\S]*#0F172A/, '暗档整体渐变用深蓝系')
  assert.doesNotMatch(popupPage, /#FFF3E0|#FFCC80|#FFE8CC|3A2E1E/, '没有浅橙/屎黄旧配色')
  const headerBg = popupPage.slice(popupPage.indexOf('const headerBackground'), popupPage.indexOf('const panelBackground'))
  assert.match(headerBg, /imageGeom === 'transparent' \? 'transparent'/, '只有透明档由几何档决定头部透明')
  assert.doesNotMatch(headerBg, /imageGeom === '(rise|both|wide)'/, '上延伸/双伸/超宽档仍走默认头部底色')
  assert.doesNotMatch(headerBg, /fadeFrom/, '渐隐不再放在 headerBackground')
  assert.doesNotMatch(popupPage, /head-fade/, '不再有旧的 head-fade 模式名')
})

test('ContentPopup 分割线颜色可配，线下间距归 body 上间距恒给', () => {
  const lineColor = render(h(ContentPopup, { open: true, title: 'T', headerDividerColor: 'var(--mptk-danger)' }))
  assert.match(lineColor, /mptk-content-popup__header[^>]*style="[^"]*border-bottom-color:\s*var\(--mptk-danger\)/, '线色可覆盖')
  const noColor = render(h(ContentPopup, { open: true, title: 'T' }))
  assert.doesNotMatch(noColor, /mptk-content-popup__header[^>]*style="[^"]*border-bottom-color:/, '不传则不内联，走默认 token')

  for (const divider of [true, false]) {
    const html = render(h(ContentPopup, { open: true, title: 'T', headerDivider: divider }))
    assert.match(html, /mptk-content-popup__content--top-gap/, `headerDivider=${String(divider)} 时 body 上间距都要在`)
  }
})

test('ContentPopup 头部只有一层，背景与留白同层，字色走 token', () => {
  const html = render(h(ContentPopup, { open: true, variant: 'title', title: 'T', headerBackground: { from: '#a', to: '#b' } }))
  assert.equal((html.match(/mptk-content-popup__header(?!--)/g) ?? []).length, 1, '头部壳只能一层，别再套 __head')
  assert.doesNotMatch(html, /mptk-content-popup__head(?!er)/, '__head 外层应已删除')
  assert.match(html, /mptk-content-popup__header--title[^>]*background-image:/, '背景与 title 留白在同一层')
  assert.doesNotMatch(html, /mptk-content-popup__header[^>]*style="[^"]*padding-top:/, '文字头不该带徽标预留的 padding-top')

  // 徽标预留只属于 badge 档：传了 badge 的文字头也不能被误加顶部留白。
  const titleWithBadge = render(h(ContentPopup, { open: true, variant: 'title', title: 'T', badge: { size: 72, content: { kind: 'glyph', node: h('span') } } }))
  assert.doesNotMatch(titleWithBadge, /mptk-content-popup__header[^>]*style="[^"]*padding-top:/, 'badge 不该污染文字头')

  const badge = render(h(ContentPopup, { open: true, variant: 'badge', badge: { size: 72, overlap: '40%', content: { kind: 'glyph', node: h('span', null, 'b') } } }))
  assert.match(badge, /mptk-content-popup__header[^>]*style="[^"]*padding-top:/, '徽标档才保留预留高度')

  const css = readFileSync(join(root, 'src/ui/layout/content-popup/style/index.scss'), 'utf8')
  assert.match(css, /\.mptk-content-popup__title\s*\{[^}]*color:\s*var\(--mptk-c-content-popup-head-ink\)/, '主字色走 token')
  assert.match(css, /\.mptk-content-popup__subtitle\s*\{[^}]*color:\s*var\(--mptk-c-content-popup-head-ink-2\)/, '副字色走 token')
})

test('ContentPopup 按钮横纵两轴生效，槽位覆盖配置', () => {
  const column = render(h(ContentPopup, { open: true, actions: [{ text: 'A' }, { text: 'B' }], actionsLayout: 'column' }))
  assert.match(column, /mptk-content-popup__actions--column/)
  const row = render(h(ContentPopup, { open: true, actions: [{ text: 'A' }], actionsAlign: 'left' }))
  assert.match(row, /justify-content:flex-start/)
  const slots = render(h(ContentPopup, {
    open: true,
    variant: 'title',
    title: '配置标题',
    actions: [{ text: '配置按钮' }],
    header: h('span', null, '自定义头'),
    footer: h('span', null, '自定义脚'),
  }))
  assert.match(slots, /自定义头/)
  assert.doesNotMatch(slots, /class="mptk-content-popup__title"/)
  assert.match(slots, /自定义脚/)
  assert.doesNotMatch(slots, /配置按钮/)
})

test('ContentPopup footer 四档：stack 拉通、row 按比例、joined 竖线、上边线与槽位覆盖', () => {
  const stack = render(h(ContentPopup, {
    open: true,
    actions: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
    footerConfig: { layout: 'stack', divider: true, dividerColor: '#123456' },
  }))
  assert.match(stack, /mptk-content-popup__actions--stack/)
  assert.match(stack, /mptk-content-popup__actions--column/)
  assert.doesNotMatch(stack, /mptk-content-popup__action--divided/)
  assert.match(stack, /mptk-content-popup__foot--divided/)
  assert.match(stack, /border-top-color:\s*#123456/)
  assert.match(stack, /mptk-content-popup__content--divider-gap/)

  const row = render(h(ContentPopup, {
    open: true,
    actions: [{ text: '取消' }, { text: '确定' }],
    footerConfig: { layout: 'row', ratios: [1, 2] },
  }))
  assert.match(row, /mptk-content-popup__actions--row/)
  assert.match(row, /flex-grow:\s*1/)
  assert.match(row, /flex-grow:\s*2/)
  assert.doesNotMatch(row, /mptk-content-popup__foot--divided/)

  const joined = render(h(ContentPopup, {
    open: true,
    actions: [{ text: '复制', icon: 'common.base:fuzhi' }, { text: '删除' }],
    footerConfig: { layout: 'row', separation: 'joined' },
  }))
  assert.match(joined, /mptk-content-popup__actions--joined/)
  assert.match(joined, /mptk-content-popup__foot--divided/)
  // foot 必须真的挂 joined 类，否则 SCSS 的四边 padding:0 不生效，竖线上下仍留白。
  assert.match(joined, /mptk-content-popup__foot--joined/, 'joined 底栏必须挂 foot--joined，不能只靠 SCSS 规则')
  assert.doesNotMatch(row, /mptk-content-popup__foot--joined/, 'spaced 档不许挂 joined 类')
  // joined = 与面板融合的透明文字按钮栏：ghost 皮肤 + 格子类，第二项才带分隔线。
  assert.match(joined, /mptk-btn--ghost/)
  assert.match(joined, /mptk-content-popup__action-cell/)
  assert.equal((joined.match(/mptk-content-popup__action--divided/g) ?? []).length, 1)
  assert.doesNotMatch(joined, /border-radius/)
  assert.match(joined, /koc-i-common-base-fuzhi/)

  // 调用方显式 variant 优先：joined 档传 solid 不被强制改回 ghost。
  const solid = render(h(ContentPopup, {
    open: true,
    actions: [{ text: '确定', variant: 'solid' }],
    footerConfig: { layout: 'row', separation: 'joined' },
  }))
  assert.match(solid, /mptk-btn--solid/)
  assert.doesNotMatch(solid, /mptk-btn--ghost/)

  // 槽位覆盖：footer 存在时 footerConfig / actions 都不渲染。
  const slot = render(h(ContentPopup, {
    open: true,
    actions: [{ text: '配置按钮' }],
    footerConfig: { layout: 'joined' },
    footer: h('span', null, '自定义脚'),
  }))
  assert.match(slot, /自定义脚/)
  assert.doesNotMatch(slot, /mptk-content-popup__actions/)
  assert.doesNotMatch(slot, /配置按钮/)
})

test('ContentPopup 三档位置生效，左右越界回落到中部', () => {
  const top = render(h(ContentPopup, { open: true, position: 'top' }))
  assert.match(top, /mptk-popup__panel--top/)
  const left = render(h(ContentPopup, { open: true, position: 'left' }))
  assert.match(left, /mptk-popup__panel--center/)
  assert.doesNotMatch(left, /mptk-popup__panel--left/)
})

test('宽度与整框锁在渲染节点上生效，只有例外按钮保留可点', () => {
  const html = render(h(ContentPopup, {
    open: true,
    width: 280,
    locked: true,
    lockExceptions: ['cancel'],
    actions: [
      { text: '仍可点', lockKey: 'cancel' },
      { text: '被锁住', lockKey: 'confirm' },
    ],
  }))
  assert.match(html, /mptk-popup--blocked/)
  assert.match(html, /width:\s*280px/)
  const buttons = [...html.matchAll(/<view class="(mptk-btn[^"]*)"[^>]*><text[^>]*>([^<]*)<\/text>/g)]
    .map((match) => ({ className: match[1], text: match[2] }))
  const exempt = buttons.filter((button) => button.className.includes('mptk-btn--lock-exempt'))
  assert.equal(exempt.length, 1, '只有一个例外按钮恢复可点')
  assert.equal(exempt[0].text, '仍可点')
  assert.deepEqual(
    buttons.filter((button) => !button.className.includes('mptk-btn--lock-exempt')).map((button) => button.text),
    ['被锁住'],
  )
})

test('命令式对话框三形态共用 ContentPopup 视觉，默认无叉且宽度可配', async () => {
  commands.resetUIForTests()
  commands.markHostMounted('dialog')
  const pending = [
    commands.confirm('横排', { layout: 'spaced' }),
    commands.confirm('竖排', { layout: 'stack', position: 'bottom', width: 260 }),
    commands.alert('竖线', { layout: 'joined' }),
  ]
  const html = render(h(DialogHost))
  for (const name of ['spaced', 'stack', 'joined']) {
    assert.match(html, new RegExp(`mptk-content-popup__actions--${name}`), `${name} 形态没渲染`)
  }
  assert.match(html, /mptk-popup__panel--bottom/)
  assert.match(html, /width:\s*260px/)
  assert.doesNotMatch(html, /mptk-popup__close/, '命令式对话框默认不该有关闭叉')
  commands.resetUIForTests()
  await Promise.allSettled(pending)
})

test('声明式 Dialog 与命令式共用 ContentPopup 面板与底栏', () => {
  const html = render(h(Dialog, { open: true, title: '声明式', layout: 'joined' }))
  assert.match(html, /mptk-content-popup__panel/)
  assert.match(html, /mptk-content-popup__actions--joined/)
  assert.match(html, /声明式/)
  assert.doesNotMatch(html, /mptk-fb-dialog__panel|mptk-fb-dialog__action--confirm/, '旧自绘面板还在')
})

test('Taro 保留上一页页面树时，弹窗只由发起页的宿主认领', async () => {
  commands.resetUIForTests()
  commands.markHostMounted('dialog')
  commands.markHostMounted('dialog')
  setPageKeyProvider(() => 'key-current')
  const pending = commands.confirm('归属于当前页')
  const renderHost = (key) => render(h(KitPageKeyContext.Provider, { value: key }, h(DialogHost)))
  assert.doesNotMatch(renderHost('key-stale'), /mptk-dialog__description/, '上一页宿主抢到了弹窗')
  assert.doesNotMatch(renderHost(null), /mptk-dialog__description/, '拿不到页面身份的宿主不该认领')
  assert.match(renderHost('key-current'), /mptk-dialog__description/, '当前页宿主没拿到弹窗')
  commands.resetUIForTests()
  await Promise.allSettled([pending])

  // 手动挂载的全局宿主（context 未给值）只认领没有发起页身份的载荷。
  commands.markHostMounted('dialog')
  setPageKeyProvider(() => '')
  const manual = commands.alert('全局弹窗')
  assert.match(render(h(DialogHost)), /mptk-dialog__description/, '手动宿主没认领无页面身份的弹窗')
  commands.resetUIForTests()
  await Promise.allSettled([manual])
  setPageKeyProvider(() => '')
})
