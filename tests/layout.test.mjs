import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveCssVars } from './helpers/kit-config.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

const LAYOUT_CSS = 'dist/ui/layout/style/index.css'
const NAV_CSS = 'dist/ui/navigation/style/index.css'
const INFRA_CSS = 'dist/ui/infra/style/index.css'

function declOf(rule, prop) {
  const hit = new RegExp(`(?:^|[;{\\s])${prop}:\\s*([^;]+);`).exec(rule)
  return hit === null ? null : hit[1].trim()
}

/** 收集源码与文档，用来断言旧命名没有残留（dist / node_modules 不算）。 */
function collectFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) collectFiles(full, out)
    else if (/\.(?:tsx?|scss|mjs|md|json)$/.test(name)) out.push(full)
  }
  return out
}

test('浮层层级是一条链：导航栏 < 遮罩 < 面板 < 浮窗 < 挂载点，严格递增', () => {
  const css = resolveCssVars(read('dist/styles/theme-light.css'))
  const chain = ['navbar', 'overlay', 'panel', 'popover', 'host'].map((step) => {
    const hit = new RegExp(`--mptk-c-layer-${step}:\\s*(\\d+);`).exec(css)
    assert.ok(hit, `缺层级 token --mptk-c-layer-${step}`)
    return Number(hit[1])
  })
  for (let i = 1; i < chain.length; i += 1) {
    assert.ok(chain[i] > chain[i - 1], `层级没递增：第 ${String(i)} 档 ${String(chain[i])} 不大于前一档`)
  }
  for (const gone of ['mask-z', 'overlay-z', 'popup-z', 'overlay-host-z', 'navbar-z', 'layer-mask']) {
    assert.equal(
      new RegExp(`--mptk-c-${gone}:`).test(css),
      false,
      `旧的散装层级 token --mptk-c-${gone} 又回来了，层级必须只有一条链`,
    )
  }
})

test('每个浮层只读层级 token：样式里不许出现写死的 z-index 数字', () => {
  for (const file of [LAYOUT_CSS, NAV_CSS, INFRA_CSS]) {
    const css = read(file)
    const hits = [...css.matchAll(/z-index:\s*([^;]+);/g)]
    assert.ok(hits.length > 0, `${file} 里没有 z-index，说明浮层没接层级链`)
    for (const hit of hits) {
      assert.match(hit[1].trim(), /^var\(--mptk-c-layer-[a-z]+\)$/, `${file} 写死了层级：${hit[1]}`)
    }
  }
})

test('遮罩只有一份实现：Drawer / Dropdown 不再自绘遮罩，Dialog 也挂上同一份', () => {
  assert.doesNotMatch(
    read('src/ui/navigation/style/index.scss'),
    /mptk-(?:drawer|dropdown)__(?:mask|overlay)/,
    '导航侧又自绘遮罩了，遮罩只许有一份',
  )
  for (const file of ['src/ui/navigation/Drawer.tsx', 'src/ui/navigation/Dropdown.tsx']) {
    assert.match(read(file), /<Overlay\b/, `${file} 没用 layout 的 Overlay`)
  }
  assert.match(read('src/ui/infra/OverlayHost.tsx'), /<Overlay\s+closable=\{false\}/, '命令式 Dialog 没挂遮罩')
})

test('遮罩组件只剩 Overlay 一个：旧的纯定位容器已删，不许再冒出来', () => {
  assert.equal(existsSync(join(root, 'src/ui/layout/Overlay.tsx')), true, '缺遮罩实现 src/ui/layout/Overlay.tsx')
  assert.equal(existsSync(join(root, 'src/ui/layout/Mask.tsx')), false, 'Mask.tsx 又回来了：遮罩只能叫 Overlay')
  const entry = read('src/ui/layout/index.ts')
  assert.match(entry, /export \{ Overlay, type OverlayOpacity, type OverlayProps, type OverlayTone \}/, 'layout 出口没导出 Overlay 组件')
  assert.equal((entry.match(/export \{ Overlay\b/g) ?? []).length, 1, 'layout 出口导出了两个 Overlay，定位容器和遮罩混了')
})

test('遮罩命名全库统一：src / demo / docs / 配置里不再残留 Mask 与 mptk-mask', () => {
  const files = [
    ...collectFiles(join(root, 'src')),
    ...collectFiles(join(root, 'demo/src')),
    ...collectFiles(join(root, 'docs')),
    join(root, 'kit.config.mjs'),
  ]
  const stale = /mptk-mask|<Mask\b|MaskProps|MaskTone|MaskOpacity|--mptk-c-mask|pages\/mask/
  // 更新日志要记「原名 → 新名」，属于历史记录，不算残留。
  const body = (file) => {
    const text = readFileSync(file, 'utf8')
    const cut = text.indexOf('## 更新日志')
    return cut < 0 ? text : text.slice(0, cut)
  }
  const hits = files
    .filter((file) => stale.test(body(file)))
    .map((file) => file.replace(`${root}/`, ''))
  assert.deepEqual(hits, [], `这些文件还留着旧的遮罩命名：\n  - ${hits.join('\n  - ')}`)
})

test('遮罩底色不取字色：暗色下 --mptk-fg 是浅灰，会把遮罩变成白蒙版', () => {
  const css = read(LAYOUT_CSS)
  const overlay = /\.mptk-overlay\s*\{([^}]*)\}/.exec(css)
  assert.ok(overlay, '缺 .mptk-overlay 根规则')
  assert.equal(declOf(overlay[1], 'background-color'), 'var(--mptk-c-overlay-color)', '遮罩底色必须走遮罩自己的 token')
  assert.doesNotMatch(overlay[1], /--mptk-fg/, '遮罩底色取了字色 token')
})

test('遮罩两轴可配：底色深/浅各一个 token，浓度三档各一个 token', () => {
  for (const mode of ['theme-light', 'theme-dark']) {
    const css = resolveCssVars(read(`dist/styles/${mode}.css`))
    assert.match(css, /--mptk-c-overlay-color:\s*#000/, `${mode} 缺深色遮罩底色`)
    assert.match(css, /--mptk-c-overlay-color-light:\s*#fff/, `${mode} 缺浅色遮罩底色`)
    assert.match(css, /--mptk-c-overlay-opacity-thin:\s*\.35/, `${mode} 缺薄档浓度`)
    assert.match(css, /--mptk-c-overlay-opacity:\s*\.55/, `${mode} 缺默认浓度`)
    assert.match(css, /--mptk-c-overlay-opacity-thick:\s*\.75/, `${mode} 缺厚档浓度`)
  }

  const css = read(LAYOUT_CSS)
  assert.match(css, /\.mptk-overlay--light\s*\{[^}]*background-color:\s*var\(--mptk-c-overlay-color-light\)/, '浅色档没接 token')
  for (const tier of ['thin', 'thick']) {
    assert.match(
      css,
      new RegExp(`\\.mptk-overlay--${tier}\\s*\\{[^}]*--mptk-overlay-alpha:\\s*var\\(--mptk-c-overlay-opacity-${tier}\\)`),
      `${tier} 档没改成对应浓度`,
    )
  }
  assert.match(css, /\.mptk-overlay--open\s*\{[^}]*opacity:\s*var\(--mptk-overlay-alpha\)/, '展开态没吃浓度变量')
})

test('遮罩的「点击关闭」与「点击回调」是两件事，穿透另有开关', () => {
  const src = read('src/ui/layout/Overlay.tsx')
  assert.match(src, /closable\s*=\s*true/, '缺 closable 默认值')
  assert.match(src, /onClick\?\.\(\)/, '缺独立的点击回调')
  assert.match(src, /if \(closable\) onClose\?\.\(\)/, 'closable 没和 onClose 绑定')
  assert.match(src, /catchMove=\{lockScroll\}/, '缺滚动穿透开关')
  assert.match(src, /backgroundColor: color/, '缺自定义底色通道')
})

test('浮层的遮罩开关跟遮罩同名：Popup / Drawer / Dropdown 暴露 overlay，不是 mask', () => {
  for (const file of [
    'src/ui/layout/Popup.tsx',
    'src/ui/navigation/Drawer.tsx',
    'src/ui/navigation/Dropdown.tsx',
  ]) {
    const src = read(file)
    assert.match(src, /overlay\?: boolean/, `${file} 没把遮罩开关叫 overlay`)
    assert.match(src, /overlay = true/, `${file} 的 overlay 缺默认值`)
    assert.doesNotMatch(src, /\bmask\b/, `${file} 还留着 mask 命名`)
  }
})

test('关掉不立即卸载：五个浮层都走 presence，并且有进出场过渡', () => {
  for (const file of [
    'src/ui/layout/Overlay.tsx',
    'src/ui/layout/Popup.tsx',
    'src/ui/navigation/Drawer.tsx',
    'src/ui/navigation/Dropdown.tsx',
  ]) {
    const src = read(file)
    assert.match(src, /usePresence\(/, `${file} 没走 presence`)
    assert.doesNotMatch(src, /if \(!open\) return null/, `${file} 关掉就卸载，动画播不出来`)
  }

  const css = read(LAYOUT_CSS)
  const panel = /\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1]
  assert.equal(declOf(panel, 'transition-duration'), 'var(--mptk-c-motion-duration)', '面板缺进出场时长')
  assert.match(css, /\.mptk-popup__panel--bottom\s*\{[^}]*transform:\s*translateY\(100%\)/, '贴底档没做起点的位移')
  assert.match(
    css,
    /\.mptk-popup--open \.mptk-popup__panel--bottom\s*\{[^}]*transform:\s*translateY\(0\)/,
    '展开态没归位',
  )
})

test('进出场时长只有一个真源：JS 毫秒值与配置 token 必须同值', () => {
  const source = read('src/ui/layout/presence.ts')
  const constant = Number(/MOTION_DURATION = (\d+)/.exec(source)?.[1])
  assert.ok(Number.isFinite(constant), 'presence.ts 缺 MOTION_DURATION 常量')
  const css = resolveCssVars(read('dist/styles/theme-light.css'))
  const raw = /--mptk-c-motion-duration:\s*([^;]+);/.exec(css)?.[1]
  assert.match(raw ?? '', /^\d+ms$/, `CSS 时长必须带 ms 单位，裸数字会被当无效声明丢弃、动画失效；实际 ${String(raw)}`)
  assert.equal(constant, Number.parseInt(raw, 10), 'JS 卸载延时与 CSS 过渡时长对不上，动画会被截断或多挂一会儿')
})

test('遮罩退场期让出命中测试：底层不接收点击，展开态才恢复', () => {
  const css = read(LAYOUT_CSS)
  const baseRule = /\.mptk-overlay\s*\{([^}]+)\}/.exec(css)?.[1] ?? ''
  const openRule = /\.mptk-overlay--open\s*\{([^}]+)\}/.exec(css)?.[1] ?? ''
  assert.equal(declOf(baseRule, 'pointer-events'), 'none', '遮罩底层必须 pointer-events:none，否则退场期透明节点吞掉底下按钮点击')
  assert.equal(declOf(openRule, 'pointer-events'), 'auto', '展开态必须恢复 pointer-events:auto，否则遮罩自身点不动、关不掉')
})

test('面板限高、内部自己滚，贴底贴顶避让安全区', () => {
  const css = read(LAYOUT_CSS)
  assert.equal(
    declOf(/\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1], 'max-height'),
    'var(--mptk-c-popup-max-h)',
    '面板没限高，长内容会顶出屏幕',
  )
  const body = /\.mptk-popup__body\s*\{([^}]*)\}/.exec(css)
  assert.ok(body, '缺弹层内容区规则')
  assert.equal(declOf(body[1], 'min-height'), '0', '内容区不给 min-height: 0，flex 压不进限高')
  assert.match(read('src/ui/layout/Popup.tsx'), /<ScrollView scrollY className="mptk-popup__body">/, '内容区没换 scroll-view')

  assert.match(
    css,
    /\.mptk-popup__panel--bottom\s*\{[^}]*padding-bottom:\s*calc\(var\(--mptk-space-4\) \+ env\(safe-area-inset-bottom\)\)/,
    '贴底面板没避让底部安全区',
  )
  assert.match(
    read(NAV_CSS),
    /\.mptk-drawer__panel\s*\{[^}]*padding-bottom:\s*calc\([^;]*env\(safe-area-inset-bottom\)\)/,
    '抽屉没避让底部安全区',
  )

  // Skyline 下 fixed 的 top:0 落在页面内容区起点，状态栏那一条会露白。
  assert.match(read(LAYOUT_CSS), /\.mptk-overlay\s*\{[^}]*top:\s*calc\(0px - env\(safe-area-inset-top\)\)/, '遮罩没盖到状态栏')
  assert.match(read(LAYOUT_CSS), /\.mptk-popup__panel--top\s*\{[^}]*top:\s*calc\(0px - env\(safe-area-inset-top\)\)/, '贴顶面板没盖到状态栏')
  assert.match(read(NAV_CSS), /\.mptk-drawer__panel\s*\{[^}]*top:\s*calc\(0px - env\(safe-area-inset-top\)\)/, '抽屉没盖到状态栏')
})

test('居中档补上位移补偿，抽屉给出宽度（不然滑入滑出算不出来）', () => {
  const css = read(LAYOUT_CSS)
  assert.match(
    css,
    /\.mptk-popup__panel--center\s*\{[^}]*transform:\s*translateY\(-50%\)/,
    '居中档只有 top: 50%，面板顶边会压在中线上',
  )
  const nav = read(NAV_CSS)
  const panel = /\.mptk-drawer__panel\s*\{([^}]*)\}/.exec(nav)[1]
  assert.equal(declOf(panel, 'width'), 'var(--mptk-c-drawer-w)', '抽屉没宽度，translateX 百分比没有参照')
})

test('演示站按使用者分页：遮罩页只演遮罩，弹出层的戏归弹出层页', () => {
  const overlayPage = read('demo/src/pages/overlay/index.tsx')
  const popupPage = read('demo/src/pages/popup/index.tsx')
  const catalog = read('demo/src/catalog.ts')

  assert.doesNotMatch(overlayPage, /<Popup|<Drawer|<Dialog/, '遮罩页不许出现使用者：遮罩不知道谁在用')
  assert.doesNotMatch(overlayPage, /showToast|Open|open=\{/, '遮罩页只演示压暗与点击，不演别人的行为')
  assert.match(overlayPage, /<Overlay\b/, '遮罩页缺遮罩本体')
  assert.match(overlayPage, /'默认'/, '遮罩四个按钮里默认档要排在最前')

  for (const id of ['layers', 'scroll']) {
    assert.match(popupPage, new RegExp(`id === '${id}'`), `弹出层页缺 ${id} 示例`)
    assert.match(catalog, new RegExp(`id: '${id}'`), `目录缺 ${id} 条目`)
  }
  assert.match(popupPage, /showToast\(/, '叠加顺序示例要真的弹一条 Toast')
  assert.match(popupPage, /length: 30/, '内滚示例要给足一屏放不下的内容')

  assert.match(catalog, /id: 'overlay', label: 'Overlay 遮罩', status: 'ready', pageId: 'overlay'/, '菜单缺遮罩条目')
  assert.match(catalog, /path: 'pages\/overlay\/index'/, '遮罩页路径没跟上改名')
  assert.match(catalog, /id: 'popup', label: 'Popup 弹出层', status: 'ready', pageId: 'popup'/, 'Popup 条目没指向自己的页')
})
