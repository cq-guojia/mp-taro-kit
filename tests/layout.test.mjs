import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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

test('面板自带 panel 层，遮罩压不住它（否则点了没反应）', () => {
  const css = resolveCssVars(read(LAYOUT_CSS))
  const panel = /\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1]
  const overlay = /\.mptk-overlay\s*\{([^}]*)\}/.exec(css)[1]
  const panelZ = declOf(panel, 'z-index')
  const overlayZ = declOf(overlay, 'z-index')
  assert.ok(panelZ, '面板没自带 z-index，会被遮罩盖住')
  const layer = Number(/\d+/.exec(panelZ)[0])
  const maskLayer = Number(/\d+/.exec(overlayZ)[0])
  assert.ok(layer > maskLayer, '面板层级必须高于遮罩，否则面板藏在遮罩底下点不到')
  assert.match(read('src/ui/layout/style/index.scss'), /\.mptk-popup__panel\s*\{[^}]*z-index:\s*var\(--mptk-c-layer-panel\)/, '面板层级必须读 token，不写死数字')
})

test('五档位置齐全：上/中/下/左/右各有起点与展开态', () => {
  const css = read(LAYOUT_CSS)
  for (const pos of ['top', 'center', 'bottom', 'left', 'right']) {
    assert.match(css, new RegExp(`\\.mptk-popup__panel--${pos}\\s*\\{`), `缺 ${pos} 档样式`)
    assert.match(css, new RegExp(`\\.mptk-popup--open \\.mptk-popup__panel--${pos}\\s*\\{`), `${pos} 档缺展开态`)
  }
  const src = read('src/ui/layout/Popup.tsx')
  assert.match(src, /PopupPosition = 'top' \| 'center' \| 'bottom' \| 'left' \| 'right'/, '位置类型没补左右')
  for (const side of ['left', 'right']) {
    const sideRule = new RegExp(`\\.mptk-popup__panel--${side}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    assert.equal(declOf(sideRule, 'width'), 'var(--mptk-c-drawer-w)', `${side} 档没宽度，translateX 没有百分比参照`)
    assert.match(sideRule, /top:\s*calc\(0px - env\(safe-area-inset-top\)\)/, `${side} 档不是全高抽屉，顶部没盖到状态栏`)
    assert.match(sideRule, /bottom:\s*var\(--mptk-s-zero\)/, `${side} 档不是全高抽屉，底部没到屏幕边`)
    assert.equal(declOf(sideRule, 'max-height'), '100%', `${side} 档被 80vh 限高，底下会留一截`)
  }
  const centerRule = /\.mptk-popup__panel--center\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.equal(declOf(centerRule, 'width'), 'var(--mptk-c-popup-center-w)', '居中档必须有默认宽，不能通栏 100%')
  assert.equal(declOf(centerRule, 'margin-left'), 'auto', '居中档缺 margin auto，默认宽不会居中')
})

test('圆角默认：居中四角全圆，贴边平角；round 开启才圆贴边内侧两角', () => {
  const css = read(LAYOUT_CSS)
  const base = /\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.doesNotMatch(base, /border-(top|bottom)-(left|right)-radius/, '基础类不许写圆角，圆角按档归属')

  const centerRule = /\.mptk-popup__panel--center\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    assert.match(centerRule, new RegExp(`border-${corner}-radius:\\s*var\\(--mptk-c-popup-radius\\)`), `居中档默认缺 ${corner} 圆角`)
  }

  const rule = (name) =>
    new RegExp(`\\.mptk-popup--round \\.mptk-popup__panel--${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  const token = 'var(--mptk-c-popup-radius)'
  assert.match(rule('bottom'), new RegExp(`border-top-left-radius:\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '贴底该只圆上两角')
  assert.match(rule('bottom'), new RegExp(`border-top-right-radius:\\s*${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '贴底该只圆上两角')
  assert.doesNotMatch(rule('bottom'), /border-bottom-(left|right)-radius/, '贴底两角必须直角')
  assert.match(rule('top'), /border-bottom-left-radius:/, '贴顶该只圆下两角')
  assert.doesNotMatch(rule('top'), /border-top-(left|right)-radius/, '贴顶两角必须直角')
  assert.match(rule('left'), /border-top-right-radius:/, '贴左该只圆右两角')
  assert.doesNotMatch(rule('left'), /border-(top|bottom)-left-radius/, '贴左两角必须直角')
  assert.match(rule('right'), /border-top-left-radius:/, '贴右该只圆左两角')
  assert.doesNotMatch(rule('right'), /border-(top|bottom)-right-radius/, '贴右两角必须直角')
  assert.doesNotMatch(
    css,
    /\.mptk-popup--round \.mptk-popup__panel--center\s*\{/,
    '居中档默认已带圆角，不需要再靠 round 补',
  )
})

test('顶部让位：三档保留，真值靠 runtime 注入（Skyline 下 env() 不可靠），公式对齐 NavBar', async () => {
  const css = read(LAYOUT_CSS)
  const src = read('src/ui/layout/Popup.tsx')
  const insetSrc = read('src/ui/layout/safe-inset.ts')
  const runtime = read('src/runtime/safe-area.ts')
  const theme = resolveCssVars(read('dist/styles/theme-light.css'))
  assert.equal(
    /--mptk-c-navbar-h:\s*([^;]+);/.exec(theme)?.[1],
    '44px',
    '导航栏基准高度要对齐微信默认 44px',
  )

  // 三档必须保留：用户可只让状态栏，也可状态栏+导航栏一块让。
  assert.match(insetSrc, /TopInsetLevel = 'none' \| 'status-bar' \| 'nav-bar'/, '让位三档不许删')
  assert.match(
    src,
    /insetTop \?\? \(isTopAnchored\(position\) \? 'nav-bar' : 'none'\)/,
    'top/left/right 默认让出导航栏，bottom/center 默认不让',
  )
  assert.match(src, /getSafeAreaSnapshot\(\)/, 'Popup 必须读 runtime 注入的真值')
  assert.match(src, /top: `\$\{-inset\.overhang\}px`/, '面板上探高度必须与兜底同一基准')
  assert.match(
    src,
    /paddingTop: `\$\{inset\.bodyPaddingTop\}px`/,
    '内容让位必须是「探出量 + 目标位置」，只写目标位置会少让一个状态栏',
  )

  // 几何行为：给一组真机值（状态栏 54、胶囊 top 58 / height 32），落点必须正好落在目标位置。
  const { resolveTopInset, isTopAnchored } = await import(
    pathToFileURL(join(root, 'dist/ui/layout/safe-inset.js')).href
  )
  const device = { statusBar: 54, navbar: 40, top: 94, configured: true }
  const landing = (level) => {
    const result = resolveTopInset(level, device)
    return result.bodyPaddingTop - result.overhang
  }
  assert.deepEqual(
    resolveTopInset('status-bar', device),
    { overhang: 54, bodyPaddingTop: 108 },
    'status-bar 档：探出 54 再补回 54',
  )
  assert.deepEqual(
    resolveTopInset('nav-bar', device),
    { overhang: 54, bodyPaddingTop: 148 },
    'nav-bar 档：探出 54 再补回 54 + 40',
  )
  assert.equal(landing('status-bar'), 54, '状态栏档内容落点必须等于状态栏高度')
  assert.equal(landing('nav-bar'), 94, '导航栏档内容落点必须等于状态栏 + 导航栏')
  assert.deepEqual(resolveTopInset('none', device), { overhang: 0, bodyPaddingTop: 0 }, 'none 档不让')
  assert.deepEqual(
    resolveTopInset('nav-bar', { statusBar: 0, navbar: 0, top: 0, configured: false }),
    { overhang: 0, bodyPaddingTop: 0 },
    '未注入时不许在这里猜，交 CSS env() 兜底',
  )
  assert.equal(
    isTopAnchored('top') && isTopAnchored('left') && isTopAnchored('right'),
    true,
    '贴顶锚定的三档要探出',
  )
  assert.equal(isTopAnchored('bottom') || isTopAnchored('center'), false, '贴底 / 居中不探出')

  // 真值公式必须与 NavBar 同口径：内容高 = 胶囊高 + 上下对称留白，不许把胶囊高也乘 2。
  assert.match(
    runtime,
    /menu\.height \+ Math\.max\(menu\.top - statusBar, 0\) \* 2/,
    'nav-bar 让位高度必须等于 NavBar 的 contentHeight 算法',
  )
  assert.doesNotMatch(
    runtime,
    /\(menu\.top - statusBar \+ menu\.height\) \* 2/,
    '不许把胶囊高度也塞进乘 2：那正是之前真机让位偏多的原因',
  )
  assert.doesNotMatch(runtime, /@tarojs\/taro/, 'runtime 不许 import Taro，平台能力靠宿主注入')

  // demo 是 custom 导航栏，入口必须注入真值。
  assert.match(
    read('demo/src/app.tsx'),
    /configureSafeArea\(\{[\s\S]*statusBarHeight: windowInfo\.statusBarHeight \?\? 0/,
    'demo 入口必须注入状态栏真值',
  )

  // CSS 两档兜底仍在（未注入真值时用），且必须把面板探出的那一段一起算进去。
  assert.match(
    css,
    /\.mptk-popup--inset-status-bar \.mptk-popup__body\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \* 2\)/,
    '只让状态栏的兜底必须是 2 倍 env()：一份补面板探出，一份是状态栏本身',
  )
  assert.match(
    css,
    /\.mptk-popup--inset-nav-bar \.mptk-popup__body\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \* 2 \+ var\(--mptk-c-navbar-h\)\)/,
    '状态栏+导航栏的兜底同样要 2 倍 env()，再加导航栏高',
  )
  assert.doesNotMatch(
    /\.mptk-popup__panel--top\s*\{([^}]*)\}/.exec(css)?.[1] ?? '',
    /padding-top/,
    'top 档面板不许再写 padding-top 让位，避免与 body 注入叠加',
  )
})

test('抽屉顶部让位：与 Popup 左右档同一口径', () => {
  const css = read(NAV_CSS)
  const src = read('src/ui/navigation/Drawer.tsx')
  assert.match(src, /resolveTopInset\('nav-bar', getSafeAreaSnapshot\(\)\)/, '抽屉读同一份真值，让到导航栏下')
  assert.match(src, /top: `\$\{-inset\.overhang\}px`/, '抽屉面板同样上探，底色才盖到屏顶')
  assert.match(
    css,
    /\.mptk-drawer__body\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \* 2 \+ var\(--mptk-c-navbar-h\)\)/,
    '抽屉内容要补回探出量并避开胶囊',
  )
})

test('关闭按钮：图标库的叉 + 三种底形 + 四角位置', () => {
  const src = read('src/ui/layout/Popup.tsx')
  assert.match(src, /common\.base:guanbi/, '关闭按钮必须取图标库的叉图标')
  assert.match(src, /<Icon name="common\.base:guanbi" size="xs" \/>/, '叉图标用小一号 xs，别用 sm')
  assert.equal(
    /--mptk-popup-close-size:\s*var\((--mptk-[\w-]+)\)/.exec(read(LAYOUT_CSS))?.[1],
    '--mptk-control-h-sm',
    '关闭按钮尺寸必须回原 sm 档，不靠放大热区换命中；点得着靠 DOM 顺序',
  )
  assert.match(src, /closeShape = 'plain'/, '关闭按钮底形默认只有叉')
  assert.match(src, /closePosition = 'top-right'/, '关闭按钮位置默认右上')
  assert.ok(
    src.indexOf('mptk-popup__close') > src.indexOf('<ScrollView scrollY className="mptk-popup__body">'),
    '关闭按钮必须排在 scroll-view 后面：Skyline 下原生 scroll-view 绘制在后，放前面会盖住叉导致点不到',
  )

  const css = read(LAYOUT_CSS)
  for (const shape of ['plain', 'circle', 'rounded']) {
    assert.match(css, new RegExp(`\\.mptk-popup__close--${shape}\\s*\\{`), `缺 ${shape} 底形样式`)
  }
  for (const pos of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    assert.match(css, new RegExp(`\\.mptk-popup__close--${pos}\\s*\\{`), `缺 ${pos} 位置样式`)
  }
  assert.match(
    css,
    /\.mptk-popup__close--circle\s*\{[^}]*border-radius:\s*var\(--mptk-radius-pill\)/,
    '纯圆底必须是正圆',
  )
  assert.match(
    css,
    /\.mptk-popup__close--rounded\s*\{[^}]*border-radius:\s*var\(--mptk-radius-md\)/,
    '圆角方底必须走圆角档',
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
  assert.equal(
    declOf(/\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1], 'min-height'),
    'var(--mptk-c-popup-min-h)',
    '面板没最小高度，内容少时会塌成一小溜',
  )
  assert.equal(
    /--mptk-c-popup-sheet-h:\s*([^;]+);/.exec(read('dist/styles/theme-light.css'))?.[1],
    '35vh',
    '贴顶/贴底档确定高度要取 35vh（原 70vh 太长）',
  )
  for (const pos of ['top', 'bottom']) {
    assert.equal(
      declOf(new RegExp(`\\.mptk-popup__panel--${pos}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '', 'height'),
      'var(--mptk-c-popup-sheet-h)',
      `${pos} 档没有确定 height，Skyline 下 scroll-view 滚不起来、会被内容撑满屏`,
    )
  }
  const body = /\.mptk-popup__body\s*\{([^}]*)\}/.exec(css)
  assert.ok(body, '缺弹层内容区规则')
  assert.equal(declOf(body[1], 'min-height'), '0', '内容区不给 min-height: 0，flex 压不进限高')
  assert.match(
    read('src/ui/layout/Popup.tsx'),
    /<ScrollView scrollY className="mptk-popup__body" style=\{bodyStyle\}>/,
    '内容区没换 scroll-view，或没注入让位真值',
  )

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
  assert.match(overlayPage, /'默认'/, '遮罩四档里默认档要排在最前')
  assert.match(
    overlayPage,
    /title=\{item\.label\}\s+value=\{item\.note\}/,
    '遮罩的备注文字要放 Cell 右侧 value（默认 xs + fg-2，左主右次），不是标题下方的 label',
  )

  // 遮罩 / 弹出层两页统一走 Vant 风格：CellGroup 列表点整行，不再堆一排 Button。
  for (const [page, file] of [
    [overlayPage, '遮罩页'],
    [popupPage, '弹出层页'],
  ]) {
    assert.match(page, /<CellGroup[\s>]/, `${file} 缺 CellGroup`)
    assert.match(page, /<Cell[\s>]/, `${file} 缺 Cell 列表项`)
    assert.doesNotMatch(page, /<Button\b/, `${file} 不该再用一排按钮，改用 Cell 列表`)
  }

  for (const id of ['layers', 'scroll', 'close', 'inset']) {
    assert.match(popupPage, new RegExp(`id === '${id}'`), `弹出层页缺 ${id} 示例`)
    assert.match(catalog, new RegExp(`id: '${id}'`), `目录缺 ${id} 条目`)
  }
  assert.match(popupPage, /closeShape=\{closeShape\}/, '关闭按钮示例要真的切底形')
  assert.match(popupPage, /insetTop=\{insetTop\}/, '顶部让位示例要真的切 insetTop')
  assert.match(popupPage, /只让状态栏/, '顶部让位示例必须保留「只让状态栏」档')
  assert.match(popupPage, /状态栏 \+ 导航栏/, '顶部让位示例必须保留「状态栏 + 导航栏」档')
  assert.doesNotMatch(popupPage, /closePosition=/, '关闭按钮默认就在右上角，demo 不再堆四个位置按钮')
  assert.doesNotMatch(
    popupPage,
    /insetTop=\{insetTop\}[\s\S]{0,80}closeable/,
    '顶部让位示例默认不带关闭按钮：顶部弹层没人点右上角叉',
  )
  assert.match(popupPage, /showToast\(/, '叠加顺序示例要真的弹一条 Toast')
  assert.match(popupPage, /length: 30/, '内滚示例要给足一屏放不下的内容')

  assert.match(catalog, /id: 'overlay', label: 'Overlay 遮罩', status: 'ready', pageId: 'overlay'/, '菜单缺遮罩条目')
  assert.match(catalog, /path: 'pages\/overlay\/index'/, '遮罩页路径没跟上改名')
  assert.match(catalog, /id: 'popup', label: 'Popup 弹出层', status: 'ready', pageId: 'popup'/, 'Popup 条目没指向自己的页')
})
