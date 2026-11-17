/**
 * 真实渲染自检：用 React SSR 把 dist 的组件渲染成节点树，断言「最终生效的节点」。
 *
 * 为什么需要这一层：`tests/*.test.mjs` 里大量断言停在「产物里有这段字符串」或「源码里有这行调用」，
 * 分支、条件、跨组件契约一变就可能失效而测试仍然全绿。位置档（Card → CellGroup）与关闭按钮形态
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
const { Popup } = await import('../dist/ui/layout/index.js')

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

test('Card 里的 CellGroup 按位置收到首尾档，渲染出的外框线和档位一致', () => {
  /* 无 header 的单组：两头都贴卡片边界，两条线都不画。 */
  const single = render(h(Card, null, group('one')))
  assert.deepEqual(groupBorders(single), [{ top: false, bottom: false }], '单组必须两头收口')
  assert.match(single, /mptk-card--edge-top/, '无头部时卡片顶部要贴边')
  assert.match(single, /mptk-card--edge-bottom/, '无底部时卡片底部要贴边')

  /* 三组：组间分隔只由前一组的底线提供，后一组不再画顶线（否则两条紧挨成双线）。 */
  const three = render(h(Card, { title: '分组' }, group('a'), group('b'), group('c')))
  assert.deepEqual(
    groupBorders(three),
    [
      { top: false, bottom: true },
      { top: false, bottom: true },
      { top: false, bottom: false },
    ],
    '三组只能有两条组间线，且都不许有顶线',
  )

  /* 显式 border 盖过位置推导。 */
  const manual = render(
    h(Card, { title: '分组' }, h(CellGroup, null, h(Cell, { title: 'x' }, '内容')), h(CellGroup, { border: 'both' }, h(Cell, { title: 'y' }, '内容'))),
  )
  assert.deepEqual(groupBorders(manual), [{ top: false, bottom: true }, { top: true, bottom: true }], '显式 border 优先')

  /* 内部 prop 是渲染期契约，不能漏进节点。 */
  assert.doesNotMatch(three, /__mptkCardEdgePosition/, '位置档不许落到渲染节点上')
})

test('Card 穿透包装层：CellGroup 不在 body 顶层时位置档照样生效', () => {
  const wrapped = render(
    h(Card, { title: '分组' }, h('div', { key: 'wrap' }, h(CellGroup, null, h(Cell, { title: 'a' }, '内容')), h(CellGroup, null, h(Cell, { title: 'b' }, '内容')))),
  )
  assert.deepEqual(groupBorders(wrapped), [{ top: false, bottom: true }, { top: false, bottom: false }], '包装层里的组也要拿到 first / last')
})

test('组间线数量矩阵：n 个组只有 n-1 条组间线，带标题的组每组恰好一条标题线', () => {
  for (const withTitle of [false, true]) {
    for (const count of [1, 2, 3, 4]) {
      const groups = Array.from({ length: count }, (_, index) =>
        withTitle
          ? h(CellGroup, { key: index, title: `组${String(index)}` }, h(Cell, { title: '行' }, 'v'))
          : h(CellGroup, { key: index }, h(Cell, { title: '行' }, 'v')),
      )
      const html = render(h(Card, { title: '卡' }, h('div', null, groups)))
      const label = `${String(count)} 组 / ${withTitle ? '有标题' : '无标题'}`
      assert.equal((html.match(/mptk-cell-group__border--top/g) ?? []).length, 0, `${label}：不许出现组顶线`)
      assert.equal(
        (html.match(/mptk-cell-group__border--bottom/g) ?? []).length,
        count - 1,
        `${label}：组间线必须恰好 n-1 条`,
      )
      assert.equal(
        (html.match(/mptk-cell-group__title-divider/g) ?? []).length,
        withTitle ? count : 0,
        `${label}：标题线数量不对`,
      )
    }
  }
})

test('有组标题时标题与列表之间恒有一条分隔线，不随位置档丢失', () => {
  /* 用户实际场景：卡片里唯一一组 + 组标题。位置档是 single（不画列表上下边线），
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

  /* 三组都有标题：每组标题下都恰好有一条（first 走标题线，middle / last 走列表上边线）。 */
  const three = render(
    h(Card, { title: 't' },
      h(CellGroup, { title: 'a' }, h(Cell, { title: '1' }, 'x')),
      h(CellGroup, { title: 'b' }, h(Cell, { title: '2' }, 'x')),
      h(CellGroup, { title: 'c' }, h(Cell, { title: '3' }, 'x')),
    ),
  )
  assert.equal((three.match(/mptk-cell-group__title-divider/g) ?? []).length, 3, '每个带标题的组都恰好一条标题分隔线')
  assert.doesNotMatch(three, /mptk-cell-group__border--top/, '位置档不许再产生顶线，否则与上一组底线成双线')

  /* 没有标题就不该凭空多出这条线。 */
  const noTitle = render(h(Card, { title: 't' }, h(CellGroup, null, h(Cell, { title: '1' }, 'x'))))
  assert.doesNotMatch(noTitle, /mptk-cell-group__title-divider/, '无标题不许画标题分隔线')
})

test('Card 里的浮层不占内容流：Popup 关着时首尾档不被它的子树带歪', () => {
  const closed = { open: false, onClose: () => {} }

  /* 单组 + 关着的 Popup：Popup 渲染 null，CellGroup 仍必须两头收口（曾经退化成 first 多画一条下线）。 */
  const one = render(
    h(Card, { title: '顶部让位' },
      h('div', { key: 'wrap', className: 'demo-block__content' },
        h(CellGroup, { title: '顶部让位' }, h(Cell, { title: '不让位' }, 'insetTop="none"')),
        h(Popup, closed, h('div', null, '面板第 1 行'), h('div', null, '面板第 2 行')),
      ),
    ),
  )
  assert.deepEqual(groupBorders(one), [{ top: false, bottom: false }], '关着的 Popup 不该让单组退化成 first')

  /* 两组 + 关着的 Popup：末组仍要认作 last，只画上线（曾经退化成 middle 多画一条下线）。 */
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
    '浮层后面的组仍是末组',
  )
})

test('Popup 关闭按钮复用核心 Button：形状 / 描边 / 底色三轴落到真实 Button 类名', () => {
  const base = { open: true, onClose: () => {}, closeable: true, position: 'bottom' }

  /* 默认 circle + 描边 + 底色 → soft（浅底 + 边）+ pill 圆角。 */
  const soft = render(h(Popup, base, h('div', null, '内容')))
  assert.match(soft, /mptk-btn--soft/, '默认档要有底色又有描边，落在 soft')
  assert.match(soft, /mptk-btn--radius-pill/, 'circle 形状走 pill 圆角')
  assert.match(soft, /mptk-popup__close--top-left/, '底部面板默认关闭按钮在面板内左上')

  /* 关掉底色与描边、换圆角方 → ghost + md。 */
  const ghost = render(h(Popup, { ...base, closeShape: 'rounded', closeBorder: false, closeBackground: false }, h('div', null, '内容')))
  assert.match(ghost, /mptk-btn--ghost/, '无底无边只剩叉')
  assert.match(ghost, /mptk-btn--radius-md/, 'rounded 形状走 md 圆角')
  assert.doesNotMatch(ghost, /mptk-btn--soft|mptk-btn--solid|mptk-btn--outline/, '三轴组合只许派生出一种形态')

  /* 没开 closeable 就没有按钮；贴顶档无论传什么都不渲染。 */
  assert.doesNotMatch(render(h(Popup, { ...base, closeable: false }, h('div', null, '内容'))), /mptk-popup__close/)
  assert.doesNotMatch(render(h(Popup, { ...base, position: 'top' }, h('div', null, '内容'))), /mptk-popup__close/, '贴顶档不支持关闭按钮')

  /* 外置档要放开面板裁剪，否则按钮被 overflow 裁掉。 */
  const outside = render(h(Popup, { ...base, closePosition: 'above-center' }, h('div', null, '内容')))
  assert.match(outside, /mptk-popup--close-outside/, '面板上方的按钮需要根节点放开裁剪')
})
