import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolveCssVars, tokensOf } from './helpers/kit-config.mjs'

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
  assert.match(read('src/ui/infra/DialogHost.tsx'), /<Overlay\s+closable=\{false\}/, '命令式 Dialog 没挂遮罩')
  assert.doesNotMatch(read('src/ui/infra/ToastHost.tsx'), /<Overlay\b/, 'Toast 不许带遮罩')
  assert.doesNotMatch(read('src/ui/infra/LoadingHost.tsx'), /<Overlay\b/, 'Loading 不许带遮罩')
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

test('遮罩两轴可配：底色深/浅各一个 token，浓度三档按主题各配一套', () => {
  // 同一张黑遮罩压在浅底上更显淡：明档必须比暗档深，两套主题拉出来观感才接近。
  const opacity = {
    'theme-light': ['\\.5', '\\.75', '\\.85'],
    'theme-dark': ['\\.35', '\\.55', '\\.75'],
  }
  for (const [mode, [thin, base, thick]] of Object.entries(opacity)) {
    const css = resolveCssVars(read(`dist/styles/${mode}.css`))
    assert.match(css, /--mptk-c-overlay-color:\s*#000/, `${mode} 缺深色遮罩底色`)
    assert.match(css, /--mptk-c-overlay-color-light:\s*#fff/, `${mode} 缺浅色遮罩底色`)
    assert.match(css, new RegExp(`--mptk-c-overlay-opacity-thin:\\s*${thin}`), `${mode} 薄档浓度不对`)
    assert.match(css, new RegExp(`--mptk-c-overlay-opacity:\\s*${base}`), `${mode} 默认浓度不对`)
    assert.match(css, new RegExp(`--mptk-c-overlay-opacity-thick:\\s*${thick}`), `${mode} 厚档浓度不对`)
  }
  const alpha = (mode, tier = '') => {
    const css = resolveCssVars(read(`dist/styles/${mode}.css`))
    return Number(new RegExp(`--mptk-c-overlay-opacity${tier}:\\s*([\\d.]+)`).exec(css)?.[1])
  }
  for (const tier of ['-thin', '', '-thick']) {
    assert.ok(alpha('theme-light', tier) > alpha('theme-dark', tier), `${tier || '默认'}档明色遮罩必须比暗色更深`)
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

test('浮层开合不回顶：靠节点层级隔离，不记位置、不切 scroll-y、不写受控 scrollTop', () => {
  const overlay = read('src/ui/layout/Overlay.tsx')
  assert.match(overlay, /catchMove=\{lockScroll\}/, '遮罩只管吞事件冒泡')
  assert.doesNotMatch(overlay, /getScrollTop|scrollTo\(saved\)|acquireScrollLock|useScrollLocked/, '遮罩不许记位置跳回或切 scroll-y')
  assert.doesNotMatch(overlay, /scrollTop=/, '不许把滚动位置写成受控属性')

  // 三套无效方案（ScrollKeeper 记录跳回 / 全局锁切 scroll-y）全部删净，不留兼容残渣。
  for (const file of [
    'src/ui/infra/index.ts', 'src/app/KitPage.tsx',
    'src/ui/layout/Overlay.tsx', 'src/app/scroll-inject.ts',
  ]) {
    assert.doesNotMatch(read(file), /ScrollKeeper|useScrollKeeper|useScrollLocked|acquireScrollLock|scroll-lock/,
      `${file} 仍引用已废弃的滚动方案`)
  }
  for (const gone of [
    'src/ui/infra/scroll-keeper.ts', 'src/runtime/scroll-lock.ts', 'src/ui/infra/use-scroll-lock.ts',
    'dist/runtime/scroll-lock.js', 'dist/ui/infra/use-scroll-lock.js',
  ]) {
    assert.equal(existsSync(join(root, gone)), false, `${gone} 应删除`)
  }

  // 真修法：浮层放进恒定存在的隔离容器，绝不与 ScrollView 同级增删；滚动区给稳定 key。
  const shell = read('demo/src/components/DemoShell.tsx')
  assert.match(shell, /<View className="demo-shell__overlays">[\s\S]*<DemoSettings[\s\S]*<\/View>/,
    '设置浮层必须包在恒定存在的隔离容器里')
  assert.match(shell, /key="demo-main-scroll"/, '滚动区需要稳定 key')
  assert.match(shell, /scrollY(?![={])/, '滚动区 scroll-y 恒开，不随浮层状态切换')
  assert.doesNotMatch(shell, /locked|useScrollLocked|scrollY=\{!/, 'demo 不该再按锁状态切 scroll-y')
  const appScss = read('demo/src/app.scss')
  assert.doesNotMatch(appScss, /\.demo-shell__overlays\s*\{[^}]*display:\s*contents/,
    '隔离容器不能是 display:contents（会抹掉节点、失去隔离作用）')
})

test('弹窗面板用抬升面 token，暗档按 iOS 分层比页面底更亮', () => {
  const css = read('dist/ui/layout/style/index.css')
  assert.match(css, /\.mptk-popup__panel\s*\{[^}]*background-color:\s*var\(--mptk-surface-elevated\)/, '面板底色没走抬升面')
  const config = read('kit.config.mjs')
  assert.match(config, /"--mptk-surface-elevated":\s*"@white"/, '明档抬升面缺失')
  assert.match(config, /"--mptk-surface-elevated":\s*"@gray-3"/, '暗档抬升面没比页面底亮')
  assert.match(read('src/design/_tokens.scss'), /--mptk-surface-elevated:/, '生成物没带上抬升面 token')
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
  assert.match(
    read('src/ui/layout/close-position.ts'),
    /PopupPosition = 'top' \| 'center' \| 'bottom' \| 'left' \| 'right'/,
    '位置类型没补左右',
  )
  for (const side of ['left', 'right']) {
    const sideRule = new RegExp(`\\.mptk-popup__panel--${side}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
    assert.equal(declOf(sideRule, 'width'), 'var(--mptk-c-drawer-w)', `${side} 档没宽度，translateX 没有百分比参照`)
    assert.equal(declOf(sideRule, 'top'), 'var(--mptk-s-zero)', `${side} 档不是贴边全高抽屉`)
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

test('Popup 新三轴：遮罩底色 / 浓度由 props 透传，圆角尺寸由档位类名切变量', () => {
  const src = read('src/ui/layout/Popup.tsx')
  const entry = read('src/ui/layout/index.ts')
  const css = read(LAYOUT_CSS)

  // 类型与出口齐全，宿主能拿到档位名，不必自己写圆角样式。
  assert.match(src, /import \{ Overlay, type OverlayOpacity, type OverlayTone \}/, 'Popup 没引遮罩两轴类型')
  assert.match(src, /export type PopupRoundSize = 'none' \| 'sm' \| 'md' \| 'lg'/, '圆角尺寸档类型缺档')
  assert.match(src, /overlayTone\?: OverlayTone/, 'Popup 没暴露遮罩底色轴')
  assert.match(src, /overlayOpacity\?: OverlayOpacity/, 'Popup 没暴露遮罩浓度轴')
  assert.match(src, /roundSize\?: PopupRoundSize/, 'Popup 没暴露圆角尺寸轴')
  assert.match(entry, /type PopupRoundSize/, 'layout 出口没导出 PopupRoundSize')

  // 透传要真到 Overlay，不是只收下 props 就丢掉。
  assert.match(src, /tone=\{overlayTone\}/, '遮罩底色没透传给 Overlay')
  assert.match(src, /opacity=\{overlayOpacity\}/, '遮罩浓度没透传给 Overlay')
  assert.match(src, /roundSize = 'md'/, '圆角尺寸默认中档')
  assert.match(src, /mptk-popup--radius-\$\{roundSize\}/, '圆角尺寸没派生出档位类名')

  // 四档都落到 --mptk-c-popup-radius，各档 panel 声明不重复写死。
  for (const tier of ['none', 'sm', 'md', 'lg']) {
    assert.match(
      css,
      new RegExp(`\\.mptk-popup--radius-${tier}\\s*\\{[^}]*--mptk-c-popup-radius:\\s*var\\(--mptk-radius-${tier}\\)`),
      `${tier} 档没切到 radius ${tier} token`,
    )
  }
  const tokens = tokensOf()
  assert.equal(tokens['--mptk-radius-none'], '0', '平档 token 丢了')
  assert.equal(tokens['--mptk-radius-md'], '12px', '中档 token 变了，要同步文档')
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
    /isTopAnchored\(position\) \? insetTop \?\? 'nav-bar' : 'none'/,
    '先按位置判定：top/left/right 才让位，bottom/center 即使传了 insetTop 也强制 none',
  )
  assert.match(src, /getSafeAreaSnapshot\(\)/, 'Popup 必须读 runtime 注入的真值')
  assert.doesNotMatch(src, /top: `\$\{/, '面板不许写内联 top 探出：Skyline 下会整块顶出可视区')
  assert.match(
    src,
    /paddingTop: `\$\{inset\.paddingTop\}px`/,
    '让位只加在内容 padding 上，面板贴边定位（微信官方做法）',
  )

  // 几何行为：给一组真机值（状态栏 54、胶囊 top 58 / height 32），内容起点正好落在目标位置。
  const { resolveTopInset, isTopAnchored, resolveBottomInset, BOTTOM_BREATH_PX } = await import(
    pathToFileURL(join(root, 'dist/ui/layout/safe-inset.js')).href
  )
  // 底部留白：呼吸与横条取最大，不累加。横条 34 > 呼吸 16 时只留 34；非全面屏横条 0 时留 16。
  assert.equal(BOTTOM_BREATH_PX, 16, '呼吸间距常量必须是 16，与 --mptk-space-4 同值')
  assert.deepEqual(
    resolveBottomInset({ statusBar: 0, navbar: 0, top: 0, bottom: 34, configured: true }),
    { paddingBottom: 34 },
    '横条 34px 已盖过呼吸 16px，取 34，不许相加成 50',
  )
  assert.deepEqual(
    resolveBottomInset({ statusBar: 0, navbar: 0, top: 0, bottom: 0, configured: true }),
    { paddingBottom: 16 },
    '非全面屏横条 0 时用呼吸 16px',
  )
  assert.deepEqual(
    resolveBottomInset({ statusBar: 0, navbar: 0, top: 0, bottom: 8, configured: true }),
    { paddingBottom: 16 },
    '横条小于呼吸时取呼吸，不累加',
  )
  assert.deepEqual(
    resolveBottomInset({ statusBar: 0, navbar: 0, top: 0, bottom: 0, configured: false }),
    { paddingBottom: 0 },
    '未注入时不猜，交 CSS 兜底',
  )
  assert.equal(
    /--mptk-space-4:\s*([^;]+);/.exec(resolveCssVars(read('dist/styles/theme-light.css')))?.[1] ?? '',
    '16px',
    '呼吸常量必须与 token --mptk-space-4 同值，改 token 要同步 BOTTOM_BREATH_PX',
  )

  const device = { statusBar: 54, navbar: 40, top: 94, configured: true }
  assert.deepEqual(resolveTopInset('status-bar', device), { paddingTop: 54 }, 'status-bar 档让到状态栏底')
  assert.deepEqual(resolveTopInset('nav-bar', device), { paddingTop: 94 }, 'nav-bar 档让到胶囊下沿')
  assert.deepEqual(resolveTopInset('none', device), { paddingTop: 0 }, 'none 档不让')
  assert.deepEqual(
    resolveTopInset('nav-bar', { statusBar: 0, navbar: 0, top: 0, configured: false }),
    { paddingTop: 0 },
    '未注入时不许在这里猜，交 CSS env() 兜底',
  )
  assert.equal(
    isTopAnchored('top') && isTopAnchored('left') && isTopAnchored('right'),
    true,
    '贴顶锚定的三档默认让导航栏',
  )
  assert.equal(isTopAnchored('bottom') || isTopAnchored('center'), false, '贴底 / 居中默认不让')

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

  // demo 是 custom 导航栏，入口一条 createKitApp 注入真值；真值取数收在库的 app 出口里。
  assert.match(read('demo/src/app.tsx'), /createKitApp\(/, 'demo 入口必须用 createKitApp 一条接入')
  assert.match(
    read('src/app/create-kit-app.tsx'),
    /configureSafeArea\(\{[\s\S]*statusBarHeight: windowInfo\.statusBarHeight \?\? 0/,
    'createKitApp 必须注入状态栏真值',
  )

  // CSS 兜底：面板贴边，env() 只作为「未注入时」的状态栏近似值。
  assert.match(
    css,
    /\.mptk-popup--inset-status-bar \.mptk-popup__body\s*\{[^}]*padding-top:\s*env\(safe-area-inset-top\)/,
    '只让状态栏的兜底丢了',
  )
  assert.match(
    css,
    /\.mptk-popup--inset-nav-bar \.mptk-popup__body\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \+ var\(--mptk-c-navbar-h\)\)/,
    '状态栏+导航栏的兜底丢了',
  )
  assert.doesNotMatch(
    css,
    /top:\s*calc\(0px - env\(safe-area-inset-top\)\)/,
    '任何层级都不许用负 top 把面板/遮罩探出屏外：Skyline 下会整块被裁掉',
  )
  assert.doesNotMatch(
    /\.mptk-popup__panel--top\s*\{([^}]*)\}/.exec(css)?.[1] ?? '',
    /padding-top/,
    'top 档面板不许再写 padding-top 让位，避免与 body 注入叠加',
  )
  assert.doesNotMatch(
    css,
    /\.mptk-popup--inset-(?:status-bar|nav-bar) \.mptk-popup__panel\s*\{[^}]*padding-top:\s*var\(--mptk-s-zero\)/,
    '旧「让位档面板 padding-top 归零」规则已撤：预留内边距要留给 contentPadding 覆盖并与让位相加',
  )
  // contentPadding：数字四边统一 / 对象按边给，写行内覆盖面板预留 16px；让位仍走 body 独立相加。
  assert.match(src, /export type PopupContentPadding = number \| Partial<Record<.*number>>/, '内容内边距类型支持数字与四边对象')
  assert.match(src, /contentPadding\?: PopupContentPadding/, 'Popup 暴露 contentPadding')
  assert.match(src, /style=\{padStyle === undefined \? panelStyle : \{ \.\.\.padStyle, \.\.\.panelStyle \}\}/, '面板内边距与传入 panelStyle 合并挂行内')
  assert.match(src, /panelStyle\?: CSSProperties/, 'Popup 暴露 panelStyle 供 ImagePopup 贴合图片宽')
  assert.match(src, /paddingTop: `\$\{pad\.top\}px`/, 'top 边距写行内 px')
  assert.match(src, /bodyStyle/, '让位仍走 body 的 bodyStyle，与面板 padding 各占一层')
  const entry = read('src/ui/layout/index.ts')
  assert.match(entry, /type PopupContentPadding/, 'layout 出口没导出 PopupContentPadding')
  // ImagePopup 与尺寸模型的类型都要从出口可达：消费者配置 slides 时要能标注类型。
  for (const name of ['ImagePopup', 'ImagePopupSlide', 'ImagePopupAction', 'ImagePopupActionsAlign', 'ImageSizeInput', 'ImageWidthSpec', 'ImageHeightSpec', 'ImageFitMode', 'ImageNaturalSize']) {
    assert.match(entry, new RegExp(name), `layout 出口没导出 ${name}`)
  }
})

test('抽屉顶部让位：与 Popup 左右档同一口径', () => {
  const css = read(NAV_CSS)
  const src = read('src/ui/navigation/Drawer.tsx')
  assert.match(src, /resolveTopInset\('nav-bar', snapshot\)/, '抽屉读同一份真值，让到导航栏下')
  assert.match(src, /getSafeAreaSnapshot\(\)/, '抽屉快照取自 runtime 注入')
  assert.doesNotMatch(src, /top: `\$\{/, '抽屉面板同样不许用内联 top 探出')
  assert.match(
    css,
    /\.mptk-drawer__body\s*\{[^}]*padding-top:\s*calc\(env\(safe-area-inset-top\) \+ var\(--mptk-c-navbar-h\)\)/,
    '抽屉内容同样只加在 padding 上，避开胶囊',
  )
  assert.doesNotMatch(css, /top:\s*calc\(0px - env\(safe-area-inset-top\)\)/, '抽屉面板不许负 top 探出')
  assert.equal(
    declOf(/\.mptk-drawer__panel\s*\{([^}]*)\}/.exec(css)?.[1] ?? '', 'padding-top'),
    'var(--mptk-s-zero)',
    '抽屉面板顶部内边距归零，避免与让位叠加',
  )
})

test('关闭按钮：自绘几何居中的叉 + 三种底形 + 按形态分档的位置', async () => {
  const src = read('src/ui/layout/Popup.tsx')
  assert.match(src, /resolveClosePosition\(position, closePosition\)/, '关闭按钮位置必须按面板形态解析')
  assert.match(src, /isOutsideClosePosition\(resolvedClosePosition\)/, '跨边 / 外置档必须给面板放开 overflow')
  assert.match(src, /CloseGlyph/, '叉改成自绘几何居中的 CloseGlyph，不再用字体字形')
  assert.match(src, /<Button\b/, '关闭按钮复用核心 Button，不另写一套按钮皮肤')
  assert.match(src, /glyph=\{<CloseGlyph size="12\.8px" \/>\}/, '叉走 Button 的自绘 glyph 槽位，边长 12.8px')
  assert.doesNotMatch(src, /common\.base:guanbi/, '不许再用字体叉：字形墨迹偏上且各端基线不一')
  assert.match(src, /size="xs"/, '按钮仍走 xs 档：叉尺寸单独给，外框走私有 token，两轴分开')
  assert.match(src, /variant=\{closeStyle\.variant\}/, '底色形态由 resolveCloseStyle 派生')
  assert.match(src, /radius=\{closeStyle\.radius\}/, '圆角档由 resolveCloseStyle 派生')
  assert.match(src, /closeBorder = true/, '描边轴默认开')
  assert.match(src, /closeBackground = false/, '背景轴默认半透明（不是实底）')
  assert.match(
    read('src/ui/layout/ImagePopup.tsx'),
    /closeBackground = false/,
    'ImagePopup 背景默认同 Popup：半透明',
  )

  assert.match(src, /closeStyle\.translucent/, '背景「否」的半透明标志接到 class 上')
  // 真跑视觉解析器：描边定 variant、背景轴只翻 translucent——切背景时叉色（fg）不变。
  const { resolveCloseStyle } = await import(pathToFileURL(join(root, 'dist/ui/layout/close-style.js')).href)
  assert.deepEqual(resolveCloseStyle('circle', true, true), { variant: 'soft', radius: 'pill', translucent: false })
  assert.deepEqual(resolveCloseStyle('circle', false, true), { variant: 'solid', radius: 'pill', translucent: false })
  assert.deepEqual(resolveCloseStyle('rounded', true, false), { variant: 'soft', radius: 'sm', translucent: true })
  assert.deepEqual(resolveCloseStyle('rounded', false, false), { variant: 'solid', radius: 'sm', translucent: true })
  assert.doesNotMatch(src, /<Icon name=/, '叉不许走字体 Icon，按钮反馈要靠 Button')
  // 外框 26px 走 popup 私有 token，只覆盖高度轴；叉边长单独给 12.8px，两轴分开。
  assert.equal(tokensOf()['--mptk-c-popup-close-size'], '26px', '关闭按钮外框 30 → 26px（缩 4px）')
  // 自绘叉：SVG path 几何居中，token + 组件出口 + 按钮槽位取色齐全。
  const closeMask = tokensOf()['--mptk-c-close-mask']
  assert.ok(closeMask?.includes('data:image/svg+xml'), '叉遮罩走 SVG data URI（Skyline 的 mask 只认 url()）')
  assert.match(closeMask ?? '', /path d='M22 22L78 78M78 22L22 78'/, '叉两条线关于中心对称，几何中心 = viewBox 中心')
  assert.match(closeMask ?? '', /viewBox='0 0 100 100'/, 'viewBox 正方形，缩放不变形')
  for (const file of [
    'dist/ui/feedback/close/index.js',
    'dist/ui/feedback/close/index.d.ts',
    'dist/ui/feedback/close/CloseGlyph.js',
    'dist/ui/feedback/close/style/index.css',
  ]) {
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `缺自绘叉产物 ${file}`)
  }
  const closeCss = resolveCssVars(read('dist/ui/feedback/close/style/index.css'))
  assert.match(closeCss, /background-color:\s*currentColor/, '叉色取 currentColor，由按钮字色注入')
  assert.match(closeCss, /mask-image:\s*url\(/, 'Skyline 的 mask 只认 url()，叉遮罩必须有')
  assert.match(closeCss, /mask-size:\s*100% 100%/, '叉遮罩铺满组件')
  assert.doesNotMatch(closeCss, /#[0-9a-fA-F]{3,8}\b/, '自绘叉不许硬编码色值')
  const glyphSrc = read('src/ui/feedback/close/CloseGlyph.tsx')
  assert.match(glyphSrc, /size \?\? '1em'/, '叉默认边长 1em，跟随按钮字号')
  assert.match(
    read('src/ui/actions/Button.tsx'),
    /glyph !== undefined \? \(\s*<View className="mptk-btn__glyph">\{glyph\}<\/View>/,
    'Button 图标位优先渲染自绘 glyph 槽位',
  )
  assert.match(
    read('dist/ui/actions/style/index.css'),
    /\.mptk-btn__glyph\s*\{[^}]*color:\s*var\(--mptk-btn-fg\)/,
    '按钮把字色喂给自绘图标槽位',
  )
  // 背景「否」= 非实底：只换 --mptk-btn-bg，不碰 --mptk-btn-fg（叉色）。
  // 遮罩加深后底色没有补偿作用，明暗都透明；底色若是纯色会把「透明」变成另一层实底。
  const closeBg = (mode) => /--mptk-c-popup-close-bg-translucent:\s*([^;]+);/.exec(resolveCssVars(read(`dist/styles/theme-${mode}.css`)))?.[1]?.trim()
  assert.equal(closeBg('light'), 'transparent', '明色关闭按钮非实底档透明')
  assert.equal(closeBg('dark'), 'transparent', '暗色关闭按钮非实底档也透明')
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-popup__close--translucent\s*\{[^}]*--mptk-btn-bg:\s*var\(--mptk-c-popup-close-bg-translucent\)/,
    '半透明档只覆盖底色变量',
  )
  assert.doesNotMatch(
    /\.mptk-btn\.mptk-popup__close\.mptk-popup__close--translucent\s*\{([^}]*)\}/.exec(read(LAYOUT_CSS))?.[1] ?? '',
    /--mptk-btn-fg/,
    '半透明档不许改叉色',
  )
  // 描边与叉同色：default soft 档原本 fg=fg-2、border=gray-5 两色分叉，是「描边和叉不是同一色」的根因。
  const actionsCss = read('dist/ui/actions/style/index.css')
  const defaultSoft = /\.mptk-btn--default\.mptk-btn--soft\s*\{([^}]*)\}/.exec(actionsCss)?.[1] ?? ''
  assert.equal(declOf(defaultSoft, '--mptk-btn-fg'), 'var(--mptk-fg-2)', 'default soft 叉色取 fg-2')
  assert.equal(declOf(defaultSoft, '--mptk-btn-border'), 'var(--mptk-gray-5)', 'default soft 描边取 gray-5，与叉不同色')
  const theme = resolveCssVars(read('dist/styles/theme-light.css'))
  assert.notStrictEqual(
    /--mptk-fg-2:\s*([^;]+);/.exec(theme)?.[1],
    /--mptk-gray-5:\s*([^;]+);/.exec(theme)?.[1],
    'fg-2 与 gray-5 解析后确实是两个色值，归一不是无的放矢',
  )
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-btn--soft\s*\{[^}]*--mptk-btn-border:\s*var\(--mptk-btn-fg\)/,
    '关闭按钮 soft 档描边跟随叉色，三类名压过 default soft 双类名，与库内 tone 档 soft 的 fg/border 同色约定一致',
  )
  // 叉与描边走组件私有 token：明色比 gray-6 深一档（白底看得清），暗色仍是 gray-6（不动）。
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-btn--default\s*\{[^}]*--mptk-btn-fg:\s*var\(--mptk-c-popup-close-fg\)/,
    '关闭按钮叉色取组件私有 token，明暗各自配档',
  )
  const themeDark = resolveCssVars(read('dist/styles/theme-dark.css'))
  const lum = (hex) => {
    const n = Number.parseInt(hex.replace('#', ''), 16)
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
  }
  const fg2Light = /--mptk-fg-2:\s*([^;]+);/.exec(theme)?.[1]?.trim()
  const fg3Light = /--mptk-fg-3:\s*([^;]+);/.exec(theme)?.[1]?.trim()
  const fg2Dark = /--mptk-fg-2:\s*([^;]+);/.exec(themeDark)?.[1]?.trim()
  const fg3Dark = /--mptk-fg-3:\s*([^;]+);/.exec(themeDark)?.[1]?.trim()
  assert.ok(lum(fg3Light) > lum(fg2Light), '明色下 fg-3 比 fg-2 浅（不再偏深）')
  assert.ok(lum(fg3Dark) < lum(fg2Dark), '暗色下 fg-3 比 fg-2 暗（不再偏白）')
  // 面板内与跨半档的叉/描边按主题取对称的亮暗档：明色白面板取 gray-8，暗色深面板取主文字亮档。
  const closeFg = (mode) => /--mptk-c-popup-close-fg:\s*([^;]+);/.exec(resolveCssVars(read(`dist/styles/theme-${mode}.css`), mode))?.[1]?.trim()
  const gray8Light = /--mptk-gray-8:\s*([^;]+);/.exec(theme)?.[1]?.trim()
  const gray7Light = /--mptk-gray-7:\s*([^;]+);/.exec(theme)?.[1]?.trim()
  const gray6DarkResolved = /--mptk-gray-6:\s*([^;]+);/.exec(resolveCssVars(read('dist/styles/theme-dark.css'), 'dark'))?.[1]?.trim()
  const fgDark = /--mptk-fg:\s*([^;]+);/.exec(resolveCssVars(read('dist/styles/theme-dark.css'), 'dark'))?.[1]?.trim()
  assert.equal(closeFg('light'), gray8Light, '明色面板内叉色取 gray-8，浅底上才看得清')
  assert.equal(closeFg('dark'), fgDark, '暗色面板内与跨半档取主文字亮档，白边白叉与浅色主题对称')
  assert.ok(lum(fgDark) > lum(gray6DarkResolved) * 2, '暗色叉色明显比旧 gray-6 亮，不再是灰的')
  assert.ok(lum(gray8Light) < lum(gray7Light), '明色叉色比 gray-7 更深，对比度足够')
  // 外置档完全落在黑遮罩上：明暗统一亮灰（白 82%、非纯白），不吃面板内档的深色 token。
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-popup__close--on-overlay\.mptk-btn--default\s*\{[^}]*--mptk-btn-fg:\s*var\(--mptk-c-popup-close-fg-on-overlay\)/,
    '遮罩上的关闭按钮四类名取独立亮灰 token，压过面板内档',
  )
  const overlayFg = (mode) => /--mptk-c-popup-close-fg-on-overlay:\s*([^;]+);/.exec(resolveCssVars(read(`dist/styles/theme-${mode}.css`), mode))?.[1]?.trim()
  assert.match(overlayFg('light') ?? '', /^rgba\(255, 255, 255, 0?\.82\)$/, '遮罩上的叉是白 82%，不是纯白')
  assert.equal(overlayFg('dark'), overlayFg('light'), '遮罩在明暗下同为黑色，叉色不分主题')
  // 「有背景」档的底色同样按落点走：外置档在黑遮罩上必须换深底，
  // 否则明色主题的近白实底 (#f7f8fa) 配亮灰叉只有 1.29:1，叉直接消失。
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-popup__close--solid-bg\.mptk-popup__close--on-overlay\s*\{[^}]*--mptk-btn-bg:\s*var\(--mptk-c-popup-close-bg-solid-on-overlay\)/,
    '实底档落在外置档时取独立深底 token，四类名压过 Button 与 translucent 规则',
  )
  const overlayBg = (mode) => /--mptk-c-popup-close-bg-solid-on-overlay:\s*([^;]+);/.exec(resolveCssVars(read(`dist/styles/theme-${mode}.css`), mode))?.[1]?.trim()
  assert.equal(overlayBg('light'), '#262b32', '明色主题下外置实底也取深色，不跟页面主题的近白灰')
  assert.equal(overlayBg('dark'), overlayBg('light'), '外置实底明暗同值：容器同为黑遮罩')
  const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  const relLum = (channels) => channels.reduce((sum, v, i) => {
    const x = v / 255
    const linear = x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    return sum + linear * [0.2126, 0.7152, 0.0722][i]
  }, 0)
  const solidBgRgb = rgb(overlayBg('light'))
  const solidFgRgb = solidBgRgb.map((v) => Math.round(255 * 0.82 + v * 0.18))
  const solidRatio = (Math.max(relLum(solidFgRgb), relLum(solidBgRgb)) + 0.05) /
    (Math.min(relLum(solidFgRgb), relLum(solidBgRgb)) + 0.05)
  assert.ok(solidRatio >= 4.5, `外置有背景档叉/底对比度只有 ${solidRatio.toFixed(2)}，亮灰叉会消失`)
  assert.doesNotMatch(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\.mptk-popup__close--solid-bg\s*\{/,
    '面板内有背景档仍走 Button 主题实底，不许被外置深底覆盖',
  )
  assert.match(
    read('src/ui/layout/close-position.ts'),
    /export function isOnOverlayClosePosition\([^)]*\): boolean\s*\{[^}]*above-right[^}]*above-center[^}]*below-center[^}]*below-right/s,
    '只有面板上方 / 下方的外置档算「完全落在遮罩上」，跨半档不算',
  )
  assert.match(
    read(LAYOUT_CSS),
    /\.mptk-btn\.mptk-popup__close\s*\{[^}]*--mptk-btn-h:\s*var\(--mptk-c-popup-close-size\)[^}]*height:\s*var\(--mptk-c-popup-close-size\)/,
    '双类选择器只覆盖外框高度轴，不碰 --mptk-btn-font（叉尺寸单独给，不吃字号档）',
  )
  assert.doesNotMatch(
    /\.mptk-btn\.mptk-popup__close\s*\{([^}]*)\}/.exec(read(LAYOUT_CSS))?.[1] ?? '',
    /--mptk-btn-font/,
    '叉字号不许跟着放大',
  )
  assert.equal(tokensOf()['--mptk-control-h-xs'], '24px', 'Button xs 档仍是 24px，字号与按钮高度解耦')
  // 半跨左右距比其它档再往内收一档：12 → 16（space-3 → space-4），更远离面板圆角。
  for (const name of ['edge-top-left', 'edge-top-right']) {
    const rule = new RegExp(`\\.mptk-popup__close--${name}\\s*\\{([^}]*)\\}`).exec(read(LAYOUT_CSS))?.[1] ?? ''
    assert.match(rule, /(?:left|right):\s*var\(--mptk-space-4\)/, `${name} 左右距要收到 space-4（16px）`)
  }
  assert.match(
    read('src/ui/actions/Button.tsx'),
    /hoverClass=\{disabled \|\| loading \? 'none' : 'mptk-btn--pressed'\}/,
    'Button 要在可点时挂按压态',
  )
  assert.match(
    read('dist/ui/actions/style/index.css'),
    /\.mptk-btn--pressed\s*\{[^}]*opacity:\s*var\(--mptk-c-btn-pressed-opacity\)/,
    '按压态要吃配置里的变色 token',
  )
  assert.match(src, /closeShape = 'circle'/, '形状轴默认圆形')
  assert.match(src, /closeable = false/, '关闭按钮默认不显示')
  assert.ok(
    src.indexOf('mptk-popup__close') > src.indexOf('mptk-popup__body'),
    '关闭按钮必须排在内容容器之后：Skyline 下原生 scroll-view 绘制在后，放前面会盖住叉导致点不到',
  )
  assert.match(
    src,
    /closeable && onClose && resolvedClosePosition !== null/,
    '解析为 null 的形态（左右抽屉）不许渲染关闭按钮，设置无效',
  )

  // 行为断言：真跑一遍产物里的解析器，验证按形态收口、默认值与「设置无效」。
  const { resolveClosePosition, isOutsideClosePosition } = await import(
    pathToFileURL(join(root, 'dist/ui/layout/close-position.js')).href
  )
  const bottom = ['top-left', 'edge-top-left', 'top-right', 'edge-top-right', 'above-right', 'above-center']
  const center = ['top-right', 'edge-top-right', 'above-right', 'below-center', 'below-right']
  const top = ['below-center', 'below-right']
  for (const pos of bottom) assert.equal(resolveClosePosition('bottom', pos), pos, `底部应支持 ${pos}`)
  for (const pos of center) assert.equal(resolveClosePosition('center', pos), pos, `中部应支持 ${pos}`)
  for (const pos of top) assert.equal(resolveClosePosition('top', pos), pos, `顶部应支持 ${pos}`)
  assert.equal(resolveClosePosition('bottom', undefined), 'above-right', '底部默认外右上')
  assert.equal(resolveClosePosition('center', undefined), 'above-right', '中部默认外右上')
  assert.equal(resolveClosePosition('top', undefined), 'below-right', '顶部默认面板下方外置右侧')
  assert.equal(resolveClosePosition('bottom', 'below-center'), 'above-right', '底部不支持下方档，应回落默认外右上')
  assert.equal(resolveClosePosition('center', 'above-center'), 'above-right', '中部不支持上方居中，应回落默认外右上')
  assert.equal(resolveClosePosition('top', 'top-right'), 'below-right', '顶部不支持面板内档，应回落默认外置右侧')
  for (const panel of ['left', 'right']) {
    assert.equal(resolveClosePosition(panel, 'top-right'), null, `${panel} 档不该有关闭按钮，传什么都不生效`)
  }
  assert.equal(isOutsideClosePosition('top-left'), false, '内部左上不算外置')
  assert.equal(isOutsideClosePosition('top-right'), false, '内部右上不算外置')
  for (const pos of ['edge-top-left', 'edge-top-right', 'above-right', 'above-center', 'below-center', 'below-right']) {
    assert.equal(isOutsideClosePosition(pos), true, `${pos} 要放开面板 overflow，否则按钮被裁掉`)
  }

  const css = read(LAYOUT_CSS)
  assert.doesNotMatch(
    css,
    /\.mptk-popup__close--(?:plain|circle|rounded)\s*\{/,
    '底形不写在 popup 样式里，交给 Button 的 variant / radius',
  )
  const rule = (name) => new RegExp(`\\.mptk-popup__close--${name}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  assert.equal(declOf(rule('top-left'), 'top'), 'var(--mptk-space-3)', '内部左上离上边 12px，与离左边相等')
  assert.equal(declOf(rule('top-left'), 'left'), 'var(--mptk-space-3)', '内部左上离左边 12px')
  assert.equal(declOf(rule('top-right'), 'top'), 'var(--mptk-space-3)', '内部右上离上边 12px，与离右边相等')
  assert.equal(declOf(rule('top-right'), 'right'), 'var(--mptk-space-3)', '内部右上离右边 12px')
  for (const pos of ['edge-top-left', 'edge-top-right']) {
    assert.equal(declOf(rule(pos), 'top'), 'var(--mptk-s-zero)', `${pos} 顶边贴面板上沿`)
    assert.match(rule(pos), /transform:\s*translateY\(var\(--mptk-s-half-neg\)\)/, `${pos} 只垂直跨半`)
  }
  assert.equal(declOf(rule('edge-top-left'), 'left'), 'var(--mptk-space-4)', '跨半左上左侧留距 16px，比其它档再往内收一档，避开圆角')
  assert.equal(declOf(rule('edge-top-right'), 'right'), 'var(--mptk-space-4)', '跨半右上右侧留距 16px，比其它档再往内收一档，避开圆角')
  // 根因防回归：关闭按钮 absolute 必须写在双类上，权重压过 .mptk-btn{position:relative}。
  // 单类 .mptk-popup__close{position:absolute} 会被后加载的同权重 .mptk-btn 覆盖 → 按钮退回
  // 文档流、right 丢失、各档位置全部错乱（实测截图 × 落到左侧中部）。
  const btnCloseRule = /\.mptk-btn\.mptk-popup__close\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.match(btnCloseRule, /position:\s*absolute/, 'absolute 必须写在双类 .mptk-btn.mptk-popup__close 上压过 Button')
  assert.match(btnCloseRule, /z-index:\s*var\(--mptk-c-layer-popover\)/, '层级同样写在双类上')

  // 外置档：锚在面板边缘内侧（top/bottom: 0），用 transform 按按钮自身高度移出面板。
  // translateY 百分比参照按钮自身（确定量），不参照面板高度；前提是上面的 absolute 真生效。
  assert.equal(declOf(rule('above-right'), 'top'), 'var(--mptk-s-zero)', '上方靠右锚在面板顶边内侧')
  assert.match(rule('above-right'), /transform:\s*translateY\(calc\(var\(--mptk-s-full-neg\) - var\(--mptk-space-3\)\)\)/, '上方靠右按自身高度上移一个间距档')
  assert.equal(declOf(rule('above-center'), 'top'), 'var(--mptk-s-zero)', '上方居中锚在面板顶边内侧')
  assert.match(rule('above-center'), /transform:\s*translate\(var\(--mptk-s-half-neg\), calc\(var\(--mptk-s-full-neg\) - var\(--mptk-space-3\)\)\)/, '上方居中按自身高度上移并水平居中')
  assert.equal(declOf(rule('below-center'), 'bottom'), 'var(--mptk-s-zero)', '下方居中锚在面板底边内侧')
  assert.match(rule('below-center'), /transform:\s*translate\(var\(--mptk-s-half-neg\), calc\(var\(--mptk-s-full\) \+ var\(--mptk-space-3\)\)\)/, '下方居中按自身高度下移并水平居中')
  assert.equal(declOf(rule('below-right'), 'bottom'), 'var(--mptk-s-zero)', '下方靠右锚在面板底边内侧')
  assert.match(rule('below-right'), /transform:\s*translateY\(calc\(var\(--mptk-s-full\) \+ var\(--mptk-space-3\)\)\)/, '下方靠右按自身高度下移一个间距档')
  assert.match(rule('above-right'), /right:\s*var\(--mptk-space-3\)/, '上方靠右档右边距 1.5 倍（12px）')
  assert.match(rule('below-right'), /right:\s*var\(--mptk-space-3\)/, '下方靠右档右边距 1.5 倍（12px）')
  assert.match(rule('above-center'), /left:\s*var\(--mptk-s-half\)/, '上方居中档水平居中')
  assert.match(rule('below-center'), /left:\s*var\(--mptk-s-half\)/, '下方居中档水平居中')
  assert.equal(tokensOf()['--mptk-s-full-neg'], '-100%', '负满幅 token 丢了，外置关闭按钮上移会失效')

  // 图片弹窗专用覆盖：裸壳面板已内联贴合图片，左右档关闭按钮不再留内侧间距、与图片左右缘齐平。
  // 基础 Popup 各档间距（上面已断言）不动——覆盖只在 mptk-image-popup__panel 作用域内。
  const imagePanelRule = (name) =>
    new RegExp(`\\.mptk-image-popup__panel\\s+\\.mptk-popup__close--${name}\\s*(?:,[^}]*?)?\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  for (const pos of ['top-right', 'edge-top-right', 'above-right', 'below-right']) {
    assert.equal(declOf(imagePanelRule(pos), 'right'), 'var(--mptk-s-zero)', `${pos} 在图片弹窗里右缘贴图片，不留内侧间距`)
  }
  for (const pos of ['top-left', 'edge-top-left']) {
    assert.equal(declOf(imagePanelRule(pos), 'left'), 'var(--mptk-s-zero)', `${pos} 在图片弹窗里左缘贴图片，不留内侧间距`)
  }
  assert.match(
    css,
    /\.mptk-popup--close-outside \.mptk-popup__panel\s*\{[^}]*overflow:\s*visible/,
    '外置档面板必须放开 overflow，否则按钮被裁掉',
  )
  const actionCss = read('dist/ui/actions/style/index.css')
  assert.match(
    actionCss,
    /\.mptk-btn--radius-pill\s*\{[^}]*border-radius:\s*var\(--mptk-radius-pill\)/,
    '纯圆走 Button 的 pill 圆角档',
  )
  assert.match(
    actionCss,
    /\.mptk-btn--radius-md\s*\{[^}]*border-radius:\s*var\(--mptk-radius-md\)/,
    '圆角方走 Button 的 md 圆角档',
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

test('面板不限高、内容撑开，贴底贴顶避让安全区', () => {
  const css = read(LAYOUT_CSS)
  // max-height 不再写进面板：Skyline 下它会参与 fixed 面板高度计算，把内容撑高型面板顶成上限高，
  // 造成底部空白 + 外置关闭按钮参照错乱。高度纯由 children 决定；内容超高由调用方包 scroll-view 滚。
  assert.equal(
    declOf(/\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1], 'max-height'),
    null,
    '面板不该再写 max-height，否则内容撑高型弹窗会被顶成上限高、留一截空白',
  )
  assert.equal(
    declOf(/\.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)[1], 'min-height'),
    'var(--mptk-c-popup-min-h)',
    '面板没最小高度，内容少时会塌成一小溜',
  )
  // 高度模型：面板高度由 children 撑开，贴顶/贴底不写死 35vh；sheet-h token 删除。
  // surface 只差底色 / 内边距 / 圆角，两档 body 都是 View 直出、内容撑高（不抢剩余空间）。
  assert.equal(
    /--mptk-c-popup-min-h:\s*([^;]+);/.exec(read('dist/styles/theme-light.css'))?.[1],
    '0',
    '面板最小高度必须是 0，否则内容少时仍留空一截',
  )
  assert.doesNotMatch(read('dist/styles/theme-light.css'), /--mptk-c-popup-sheet-h/, '35vh 固定高 token 应删除')
  for (const pos of ['top', 'bottom']) {
    assert.doesNotMatch(
      new RegExp(`\\.mptk-popup__panel--${pos}\\s*\\{[^}]*\\}`).exec(css)?.[0] ?? '',
      /height:/,
      `${pos} 档不该写死 height，内容多高就多高`,
    )
  }
  const body = /\.mptk-popup__body\s*\{([^}]*)\}/.exec(css)
  assert.ok(body, '缺弹层内容区规则')
  assert.equal(declOf(body[1], 'flex'), '0 0 auto', 'body 要按内容撑高，不抢剩余空间')
  assert.equal(declOf(body[1], 'min-height'), 'var(--mptk-s-zero)', 'body 最小高归零')
  const barePanel = /\.mptk-popup--surface-none \.mptk-popup__panel\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.equal(declOf(barePanel, 'max-height'), 'none', '裸壳面板不该限高，内容自己决定')
  assert.equal(declOf(barePanel, 'overflow'), 'visible', '裸壳面板不该裁切内容')
  const popupSrc = read('src/ui/layout/Popup.tsx')
  assert.match(
    popupSrc,
    /<View className="mptk-popup__body" style=\{bodyStyle\}>/,
    '两档内容都必须是 View 直出（不是 scroll-view），且注入让位真值',
  )
  assert.doesNotMatch(popupSrc, /<ScrollView/, 'Popup 不该再套 scroll-view，滚动交给调用方')
  assert.doesNotMatch(popupSrc, /from '@tarojs\/components'[\s\S]{0,40}ScrollView/, 'Popup 不该 import ScrollView')

  // 底部避让改为注入真值 + max(呼吸, 横条)：CSS 只留呼吸档，不写 calc(呼吸 + env) 叠加。
  assert.match(
    css,
    /\.mptk-popup__panel--bottom\s*\{[^}]*padding-bottom:\s*var\(--mptk-space-4\)/,
    '贴底面板 CSS 该只留一个呼吸档，横条由 JS 注入覆盖',
  )
  assert.doesNotMatch(css, /padding-bottom:\s*calc\([^;]*env\(safe-area-inset-bottom\)\)/, 'CSS 不该再叠加 env 底部安全区')
  // 抽屉与 demo 同口径：安全区是滚动内容末尾的尾距（随内容滚、能滑上去），
  // 不写在面板/外壳自身上——否则全高抽屉/外壳的滚动可视区被截短、滚不到底。
  const drawerCss = read(NAV_CSS)
  assert.equal(
    declOf(/\.mptk-drawer__panel\s*\{([^}]*)\}/.exec(drawerCss)?.[1] ?? '', 'padding-bottom'),
    'var(--mptk-s-zero)',
    '抽屉面板不给底部 padding，否则全高抽屉的滚动可视区被截短',
  )
  assert.match(
    drawerCss,
    /\.mptk-drawer__tail\s*\{[^}]*padding-bottom:\s*var\(--mptk-space-4\)/,
    '呼吸兜底该在滚动内容末尾的尾距上，不在面板上',
  )
  const drawerSrc = read('src/ui/navigation/Drawer.tsx')
  assert.match(
    drawerSrc,
    /<View className="mptk-drawer__tail" style=\{tailStyle\} \/>/,
    '底部横条真值必须写在滚动内容末尾的尾距上（随内容滚、能滑上去）',
  )
  assert.doesNotMatch(drawerSrc, /panelStyle/, '不该再把底部留白写回面板，面板 padding 会截短可视区')
  const demoCss = read('demo/src/app.scss')
  assert.equal(
    declOf(/\.demo-shell\s*\{([^}]*)\}/.exec(demoCss)?.[1] ?? '', 'padding-bottom'),
    null,
    'demo 外壳不该加底部安全区 padding，否则全站滚动区被截短',
  )
  assert.equal(
    declOf(/\.demo-page\s*\{([^}]*)\}/.exec(demoCss)?.[1] ?? '', 'padding-bottom'),
    'env(safe-area-inset-bottom)',
    'demo 底部安全区该作为滚动内容 .demo-page 的尾距',
  )
  assert.match(
    read('demo/src/components/DemoShell.tsx'),
    /<View className="demo-page">\{children\}<\/View>/,
    '.demo-page 必须是滚动区里的内容节点，尾距才随滚动滑上去',
  )
  assert.match(popupSrc, /resolveBottomInset\(getSafeAreaSnapshot\(\)\)/, 'Popup 没读注入的底部真值')
  assert.match(read('src/ui/navigation/Drawer.tsx'), /resolveBottomInset\(snapshot\)/, 'Drawer 没读注入的底部真值')

  // 贴边定位：负 top 会把浮层整块顶出 Skyline 的可视区，三处都必须贴边。
  assert.match(read(LAYOUT_CSS), /\.mptk-overlay\s*\{[^}]*top:\s*var\(--mptk-s-zero\)/, '遮罩没贴边')
  assert.match(read(LAYOUT_CSS), /\.mptk-popup__panel--top\s*\{[^}]*top:\s*var\(--mptk-s-zero\)/, '贴顶面板没贴边')
  assert.match(read(NAV_CSS), /\.mptk-drawer__panel\s*\{[^}]*top:\s*var\(--mptk-s-zero\)/, '抽屉没贴边')
})

test('图片弹窗多图：每屏容器垂直居中，swiper 高度由 JS 注入确定值', () => {
  const css = read(LAYOUT_CSS)
  const slide = /\.mptk-image-popup__slide\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.ok(slide.length > 0, '缺多图每屏容器 .mptk-image-popup__slide')
  assert.equal(declOf(slide, 'justify-content'), 'center', '每屏图片要垂直居中，不能贴顶被裁')
  assert.equal(declOf(slide, 'align-items'), 'center', '每屏图片要水平居中')
  assert.equal(declOf(slide, 'height'), '100%', '每屏容器要撑满 Swiper 注入的高度')

  // 切页高度动画：JS 改内联 height + CSS 过渡 height，平滑矮图/高图切换的上下跳动（移植自笔记浏览页）。
  const swiperRule = /\.mptk-image-popup__swiper\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.ok(swiperRule.length > 0, '缺多图 Swiper 容器 .mptk-image-popup__swiper')
  assert.equal(declOf(swiperRule, 'transition-property'), 'height', '只过渡 height，不牵动其它属性')
  assert.equal(declOf(swiperRule, 'transition-duration'), 'var(--mptk-dur)', '高度动画时长走库通用 token')
  assert.equal(declOf(swiperRule, 'transition-timing-function'), 'var(--mptk-ease)', '高度动画缓动走库通用 token')

  const src = read('src/ui/layout/ImagePopup.tsx')
  assert.match(src, /height: typeof swiperHeight === 'number'/, 'Swiper 必须挂确定高度：像素值转 px，px / vh 交给 CSS')
  assert.match(src, /const swiperHeight = multi \? viewportOf\(size\) : 0/, 'Swiper 高度跟随当前页，不取全局最大值')
  assert.doesNotMatch(src, /Math\.max\(\.\.\.sized\.map/, '不能再取所有页最大高度，否则切页框高不随图片变')
  assert.match(src, /renderPicture\(item, sized\[itemIndex\]/, '多图每屏按自己的尺寸渲染')
  // 面板贴合图片：用 widthPx（确定像素宽）驱动 panelStyle，不再用 typeof==='number' 判 CSS 字符串。
  assert.match(src, /panelStyle =\s*\n?\s*size\.widthPx !== null/, '面板宽度基于解析出的像素宽')
  assert.match(src, /className="mptk-image-popup__panel"\s+panelStyle=\{panelStyle\}/, 'panelStyle 传给 Popup 贴合图片')
  assert.doesNotMatch(src, /typeof size\.width === 'number'/, 'width 已是 CSS 字符串，不能用 typeof number 判断')
  // 长图滚动视口只开 scroll-y，绝不开 X —— 全局只有 Y 轴滚动。
  assert.match(src, /scrollY\s+scrollX=\{false\}/, '滚动视口只开 scroll-y、显式关 scroll-x')
  assert.doesNotMatch(src, /scrollX=\{true\}/, '任何地方都不开放 X 轴滚动')

  // 回归①：Image 上绝不写 maxWidth / maxHeight / 固定 height——长图压细条的根因。
  const slideImage = /function renderSlideImage\([\s\S]*?\n\}/.exec(src)?.[0] ?? ''
  assert.ok(slideImage.length > 0, '找不到 renderSlideImage')
  assert.doesNotMatch(slideImage, /maxHeight: size\.maxHeight/, '不给 Image 写 maxHeight')
  // 加载失败 / 0×0 要「定论」后显示，不能因为 needsNatural 一直挂着 opacity:0
  assert.match(src, /onError=\{handleError\}/, 'Image 要接 onError')
  assert.match(src, /settle\(width > 0 && height > 0 \? \{ width, height \} : null\)/, '非法尺寸按失败定论')
  assert.equal((slideImage.match(/height: `\$\{String\(size\.height\)\}px`/g) ?? []).length, 1, 'Image 只在定高档写一次 height')
  // 图片与滚动视口 flex 不收缩，避免被 flex 压变形。
  assert.equal(declOf(/\.mptk-image-popup__image\s*\{([^}]*)\}/.exec(css)?.[1] ?? '', 'flex'), 'none', '图片 flex:none 不被压')
  assert.equal(declOf(/\.mptk-image-popup__scroll\s*\{([^}]*)\}/.exec(css)?.[1] ?? '', 'flex'), 'none', '滚动视口 flex:none 不被压')
  // 按钮行：能换行 + 两轴间距同源，图片按钮与文字按钮混排不挤成一条。
  const actionsRule = /\.mptk-image-popup__actions\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  assert.ok(actionsRule.length > 0, '缺按钮行 .mptk-image-popup__actions')
  assert.equal(declOf(actionsRule, 'flex-wrap'), 'wrap', '按钮行要能换行，避免图片按钮占满时挤掉文字按钮')
  assert.match(declOf(actionsRule, 'column-gap') ?? '', /--mptk-image-popup-action-gap/, '按钮横向间距走 token')
  assert.match(declOf(actionsRule, 'row-gap') ?? '', /--mptk-image-popup-action-gap/, '换行后的行间距走同一 token')

  // 回归②：尺寸引擎区分显示宽 / 显示高，定高 widthPx 用 height×ratio。
  const resolver = read('src/ui/layout/image-size.ts')
  assert.match(resolver, /displayHeight: number \| null/, '解析结果含显示高，供视口定高')
  assert.match(resolver, /widthPx: ratio === null \? null : Math\.round\(heightPx \* ratio\)/, '定高显示宽 = 最终高度 × 比例（maxHeight 折算后）')
  assert.doesNotMatch(resolver, /mode: 'aspectFit'/, '不再用 aspectFit 压盒子')
})

test('居中档补上位移补偿，抽屉给出宽度（不然滑入滑出算不出来）', () => {
  const css = read(LAYOUT_CSS)
  assert.match(
    css,
    /\.mptk-popup__panel--center\s*\{[^}]*transform:\s*translateY\(calc\(var\(--mptk-s-half-neg\) \+ var\(--mptk-c-popup-center-rise\)\)\)/,
    '居中档进场起点必须是 -50% 再往下 48px，往上浮入',
  )
  assert.match(
    css,
    /\.mptk-popup--open \.mptk-popup__panel--center\s*\{[^}]*transform:\s*translateY\(var\(--mptk-s-half-neg\)\)/,
    '居中档展开态必须回到 -50%，否则上浮后不停在正中',
  )
  const tokens = tokensOf()
  assert.equal(tokens['--mptk-c-popup-center-rise'], '48px', '上浮距离 token 丢了')
  assert.equal(tokens['--mptk-s-half-neg'], '-50%', '负半幅 token 丢了')
  const nav = read(NAV_CSS)
  const panel = /\.mptk-drawer__panel\s*\{([^}]*)\}/.exec(nav)[1]
  assert.equal(declOf(panel, 'width'), 'var(--mptk-c-drawer-w)', '抽屉没宽度，translateX 百分比没有参照')
})

test('演示站按使用者分页：遮罩页只演遮罩，弹出层页只留配置 + 位置档 + 关闭按钮位置', () => {
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

  // 遮罩 / 弹出层两页的配置与列表走 Vant 风格 CellGroup + Cell；
  // 弹出层的位置档按用户要求改成横排按钮，遮罩页仍不许出现 Button。
  for (const [page, file] of [
    [overlayPage, '遮罩页'],
    [popupPage, '弹出层页'],
  ]) {
    assert.match(page, /<CellGroup[\s>]/, `${file} 缺 CellGroup`)
    assert.match(page, /<Cell[\s>]/, `${file} 缺 Cell 列表项`)
  }
  assert.doesNotMatch(overlayPage, /<Button\b/, '遮罩页不该出现按钮，只演遮罩')
  // 位置按钮按用户要求降到 xs 档（24px）：垂直 / 侧面 / 关闭按钮位置各一处 + 图片弹窗三类
  // （图片单图/多图两处 + 带按钮库按钮/图片按钮两处 + 图片尺寸 map 一处，运行时 3 个）+ 内容弹窗十三处入口。
  assert.equal((popupPage.match(/\bsize="xs"/g) ?? []).length, 21, '位置三处 + 图片弹窗五个 + 内容弹窗十三处入口都显式降一档到 xs')

  // 三块结构：顶部统一配置 + 位置档 + 关闭按钮位置；旧的六块全部撤掉。
  // catalog 只取 popup 页自己的 examples 段，popup / overlay 是合法的页与菜单 id，不能整篇搜。
  const popupCatalog = /id: 'popup',[\s\S]*?path: 'pages\/popup\/index',[\s\S]*?examples:\s*\[([\s\S]*?)\n {4}\],/.exec(catalog)?.[1] ?? ''
  assert.ok(popupCatalog.length > 0, 'catalog 里找不到 popup 页的 examples 段')
  for (const id of ['config', 'positions', 'close-position', 'content-popup']) {
    assert.match(popupPage, new RegExp(`id === '${id}'`), `弹出层页缺 ${id} 示例`)
    assert.match(popupCatalog, new RegExp(`id: '${id}'`), `目录缺 ${id} 条目`)
  }
  for (const id of ['popup', 'inset', 'close', 'layers', 'scroll']) {
    assert.doesNotMatch(popupPage, new RegExp(`id === '${id}'`), `旧的 ${id} 示例没撤掉`)
    assert.doesNotMatch(popupCatalog, new RegExp(`id: '${id}'`), `目录还留着旧的 ${id} 条目`)
  }

  // 配置区七个 Segmented：形状 / 描边 / 背景 / 圆角尺寸 / 遮罩 / 点遮罩 / 不让位。
  assert.equal(
    (popupPage.match(/<Segmented\b/g) ?? []).length,
    7,
    '配置区七个 Segmented，下面两块演示不再各配一套滑块',
  )
  assert.equal(
    (popupPage.match(/items=\{YES_NO\}/g) ?? []).length,
    2,
    '描边 / 点遮罩各一个 YES_NO；背景档改走 BG_OPTIONS',
  )
  assert.match(popupPage, /items=\{BG_OPTIONS\}/, '背景档用 BG_OPTIONS 单独选')
  assert.match(popupPage, /const BG_OPTIONS[\s\S]*?label: '半透明'/, '背景「否」档文案改为半透明')
  assert.match(popupPage, /items=\{SHAPES\}/, '关闭按钮形状用 Segmented 选')
  assert.match(popupPage, /items=\{ROUND_SIZES\}/, '圆角尺寸用 Segmented 选')
  assert.match(popupPage, /items=\{MASKS\}/, '遮罩三档用 Segmented 选')
  assert.match(popupPage, /items=\{INSETS\}/, '不让位用 Segmented 选')
  assert.doesNotMatch(popupPage, /items=\{SHOW_HIDE\}/, '显隐档已撤，不再单独演示开关按钮')
  assert.match(popupPage, /<CellGroup title="关闭按钮">/, '样式要用 CellGroup 分组，不套第二层卡片')
  assert.match(popupPage, /<CellGroup title="面板">/, '面板配置单独一组')
  assert.doesNotMatch(popupPage, /<Card\b/, '演示块已由 DemoBlock 套壳，页内不能再写 Card')

  // 配置经 shared 一次派生，两个 Popup 各展开一次；圆角 / 遮罩走库 API，不再靠 demo hack。
  assert.match(popupPage, /const shared = \{/, '缺统一配置对象')
  assert.equal((popupPage.match(/\{\.\.\.shared\}/g) ?? []).length, 2, '两个演示 Popup 都要吃同一份配置')
  for (const key of ['roundSize', 'overlayTone', 'overlayOpacity', 'closable', 'insetTop', 'closeShape', 'closeBorder', 'closeBackground']) {
    assert.match(popupPage, new RegExp(`\\b${key}[:,]`), `shared 没带 ${key}`)
  }
  assert.match(popupPage, /round: roundSize !== 'none'/, '平档不开 round，尺寸档只作用于开了圆角的面板')
  assert.match(popupPage, /MASK_VALUES: Record<MaskLevel/, '遮罩三档要有 tone + opacity 映射')
  assert.match(popupPage, /light: \{ tone: 'dark', opacity: 'thin' \}/, '浅档是深色薄遮罩')
  assert.match(popupPage, /dark: \{ tone: 'dark', opacity: 'default' \}/, '深档是深色标准遮罩')
  assert.match(popupPage, /pale: \{ tone: 'light', opacity: 'default' \}/, '泛白档是浅色遮罩')
  assert.match(popupPage, /useState<MaskLevel>\('dark'\)/, '遮罩默认深档')
  assert.match(popupPage, /useState<PopupRoundSize>\('md'\)/, '圆角默认中档')
  assert.match(popupPage, /useState<PopupInsetTop>\('nav-bar'\)/, '不让位默认让到导航栏')
  assert.match(popupPage, /useState\(true\)/, '点遮罩关闭默认开')
  assert.match(popupPage, /value: 'none', label: '平'/, '圆角要有平档')
  assert.match(popupPage, /title="让位"/, '让位配置标题按用户要求叫让位')
  assert.match(popupPage, /label: '不让位'/, '让位档文案简化为不让位')
  assert.match(popupPage, /label: '状态栏'/, '让位档文案简化为状态栏')
  assert.match(popupPage, /label: '导航栏'/, '让位档文案简化为导航栏，不再写「状态栏 + 导航栏」')
  assert.doesNotMatch(popupPage, /状态栏 \+ 导航栏/, '长文案不许回来')
  assert.doesNotMatch(popupPage, /title="顶部让位"|title="不让位"/, '旧标题不许回来')

  // 两块演示：位置档是两个 Cell 行（垂直 / 侧面），按钮在 value 位居右；关闭按钮位置按形态分档。
  assert.match(popupPage, /title="垂直"/, '位置档第一行叫垂直')
  assert.match(popupPage, /title="侧面"/, '位置档第二行叫侧面')
  assert.doesNotMatch(popupPage, /<CellGroup title="垂直"|<CellGroup title="侧面"/, '不再用 CellGroup 标题分组，直接两个 Cell')
  assert.match(popupPage, /const VERTICAL_POSITIONS/, '垂直档按钮数据源')
  assert.match(popupPage, /const SIDE_POSITIONS/, '侧面档按钮数据源')
  assert.match(popupPage, /label: '顶部'/, '垂直档叫顶部')
  assert.match(popupPage, /label: '中部'/, '垂直档叫中部')
  assert.match(popupPage, /label: '底部'/, '垂直档叫底部')
  assert.match(popupPage, /label: '左侧'/, '侧面档叫左侧')
  assert.match(popupPage, /label: '右侧'/, '侧面档叫右侧')
  // 源码里按钮 JSX：位置三处 + 图片弹窗五处 + 内容弹窗十三处 = 二十一处。
  assert.equal((popupPage.match(/<Button\b/g) ?? []).length, 21, '按钮二十一处 JSX：位置三处 + 图片弹窗五处 + 内容弹窗十三处')
  assert.equal((popupPage.match(/VERTICAL_POSITIONS\.map/g) ?? []).length, 1, '垂直档按钮走一份数据源')
  assert.equal((popupPage.match(/SIDE_POSITIONS\.map/g) ?? []).length, 1, '侧面档按钮走一份数据源')
  assert.equal((popupPage.match(/CLOSE_GROUPS\.map/g) ?? []).length, 1, '关闭按钮位置三组走一份数据源')
  assert.equal(
    (popupPage.match(/\{ value: '(?:top|center|bottom|left|right)', label: '(?:顶部|中部|底部|左侧|右侧)' \}/g) ?? []).length,
    5,
    '位置档共 5 个按钮：垂直 3 + 侧面 2',
  )
  assert.equal((popupPage.match(/className="demo-item"/g) ?? []).length, 21, '按钮横排用 demo-item 控制间距（位置三处 + 图片弹窗五处 + 内容弹窗十三处）')
  assert.match(popupPage, /size="xs"/, '按钮降到 xs 档')
  assert.match(popupPage, /position=\{position\}/, '位置档要真的切 position')
  assert.match(popupPage, /closePosition=\{closePosition\}/, '关闭按钮位置要真的切位置')
  assert.match(popupPage, /position=\{closePanel\}/, '关闭按钮位置要按形态切换弹窗')
  // 弹窗内长文本容器必须 stretch：demo-stack 默认 align-items:flex-start、按内容宽收拢，
  // 长文本不换行会从面板右侧溢出。两处弹窗都要显式 --fill（close-position 曾漏用过一次）。
  for (const tag of ['Popup', 'ContentPopup']) {
    const blocks = [...popupPage.matchAll(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, 'g'))].map((m) => m[0])
    assert.ok(blocks.length > 0, `${tag} 内容块没抓到，护栏失效`)
    for (const [index, block] of blocks.entries()) {
      assert.doesNotMatch(
        block,
        /<View className="demo-stack">/,
        `${tag} 第 ${index + 1} 处漏了 demo-stack--fill：长文本会按内容宽收拢并溢出面板`,
      )
    }
  }
  // 演示区只留代表位置：底部 4 + 中部 4 + 顶部 2（去重后 6 个 API 值）。
  for (const pos of ['above-center', 'above-right', 'top-right', 'edge-top-right', 'below-right', 'below-center']) {
    assert.ok(popupPage.includes(`value: '${pos}'`), `关闭按钮位置 demo 缺 ${pos} 档`)
  }
  assert.equal(
    (popupPage.match(/title: '(?:底部|中部|顶部)'/g) ?? []).length,
    3,
    '关闭按钮位置 demo 合并成底部 / 中部 / 顶部三个 Cell 行',
  )
  // 图片弹窗示例固定三类三个 Cell：图片 / 带按钮 / 图片尺寸。
  assert.equal(
    (popupPage.match(/title="(?:图片|带按钮|图片尺寸)"/g) ?? []).length,
    3,
    '图片弹窗 demo 应是图片 / 带按钮 / 图片尺寸三个 Cell',
  )
  for (const label of ['单图', '多图翻页', '库按钮', '图片按钮']) {
    assert.ok(popupPage.includes(`>${label}</Button>`), `图片弹窗 demo 缺按钮 ${label}`)
  }
  for (const label of ['定宽', '定高', '长图滚动']) {
    assert.ok(popupPage.includes(`label: '${label}'`), `图片尺寸 demo 缺档 ${label}`)
  }
  // 带按钮两类：库按钮走 text、图片按钮走专用图 src（lottery-center 图）。
  assert.match(popupPage, /text: '查看详情'/, '库按钮示例用内置 Button 的文字按钮')
  // 回归：库按钮示例不用只有边框的 soft/outline（白底太透看不清），用实心档。
  assert.match(popupPage, /\{ text: '取消', type: 'default', onClick:/, '库按钮示例用实心 default，不用 soft/outline')
  assert.doesNotMatch(popupPage, /\{ text: '取消', variant: '(?:soft|outline|ghost)'/, '库按钮示例不得用只有边框的透底档')
  assert.match(popupPage, /ACTION_BTN_IMAGE = 'https:\/\/t-cdn-oss\.qswnet\.com\/file\/zuche\/lottery-center\/image\//, '图片按钮用指定的 lottery-center 图')
  assert.match(popupPage, /\{ src: ACTION_BTN_IMAGE, height: 36,/, '图片按钮项传 src + 定高')
  // 单图 / 多图翻页用两张正常高度图，长图不参与翻页、只用于长图滚动档。
  // 回归：每屏给确定宽、不锁高——高度随各图比例变，矮图矮高图高、不压变形；宽统一 320 减半两边留白。
  assert.match(popupPage, /const GALLERY_SLIDES: ImagePopupSlide\[\] = \[\s*\{ src: IMAGE_A, width: 320 \},\s*\{ src: IMAGE_B, width: 320 \},?\s*\]/, '多图翻页用 IMAGE_A + IMAGE_B，每屏给确定宽不锁高')
  assert.match(popupPage, /slides=\{imageMulti \? GALLERY_SLIDES : GALLERY_SLIDES\.slice\(0, 1\)\}/, '单图 / 多图翻页共用两张正常高度图，长图不参与')
  assert.match(popupPage, /return \{ src: LONG_IMAGE, width: 320, maxHeight: 320, fit: 'scroll' \}/, '长图档宽 320 + maxHeight 320，视口贴合图片且不太高')
  // 关闭位：定宽 / 长图滚动用默认外下中，定高档演示外下右。
  assert.match(popupPage, /const SIZE_CLOSE_POSITION: Record<ImageSizeMode, PopupClosePosition>/, '尺寸档到关闭位的映射表缺失')
  assert.match(popupPage, /width: 'below-center'/, '定宽档关闭位应是外下中')
  assert.match(popupPage, /height: 'below-right'/, '定高档关闭位应是外下右')
  assert.match(popupPage, /scroll: 'below-center'/, '长图滚动档关闭位应回到默认外下中')
  assert.match(popupPage, /closePosition=\{SIZE_CLOSE_POSITION\[sizeMode\]\}/, '尺寸演示弹窗没按模式派生关闭位')
  assert.match(popupPage, /cdn-oss\.qswnet\.com/, '图片 demo 用真实运营图 URL')
  assert.doesNotMatch(
    popupPage,
    /outside-top-right|outside-bottom|outside-right|'bottom-left'|'bottom-right'/,
    '旧七档位置不该还留在 demo 里',
  )
  assert.doesNotMatch(popupPage, /关闭按钮底形/, '不再单独演示底形，样式由上方配置决定')
  assert.doesNotMatch(popupPage, /showToast\(/, '叠加顺序示例已撤')
  assert.doesNotMatch(popupPage, /length: 30/, '内滚示例已撤')
  assert.doesNotMatch(popupPage, /demo-diag/, '诊断对照块是一次性定位手段，修好后不许留在演示页')
  assert.doesNotMatch(popupPage, /demo-cell-seg/, '定宽槽类不回收')
  assert.doesNotMatch(popupPage, /width="equal"/, '值位里的段控件保持默认 fit')
  assert.doesNotMatch(read('demo/src/app.scss'), /\.demo-cell-seg\s*\{/, '定宽槽类已经删掉，不许回收')

  assert.match(catalog, /id: 'overlay', label: 'Overlay 遮罩', status: 'ready', pageId: 'overlay'/, '菜单缺遮罩条目')
  assert.match(catalog, /path: 'pages\/overlay\/index'/, '遮罩页路径没跟上改名')
  assert.match(catalog, /id: 'popup', label: 'Popup 弹出层', status: 'ready', pageId: 'popup'/, 'Popup 条目没指向自己的页')
})

test('ContentPopup 源码与出口契约', () => {
  const source = read('src/ui/layout/content-popup/ContentPopup.tsx')
  const index = read('src/ui/layout/content-popup/index.ts')
  assert.match(source, /export type ContentPopupVariant = 'title' \| 'image' \| 'badge'/, '头部只能三档')
  assert.match(source, /export type ContentPopupPosition = 'center' \| 'bottom'/, '位置只做中部与底部')
  assert.match(source, /markCardEdgeOutOfFlow\(ContentPopup\)/, '浮层必须声明脱流，否则 Card 会误补边线')
  assert.doesNotMatch(source, /badgeShape/, '形状已收进 badgeRadius，不许复活枚举')
  assert.match(source, /translateY\(-\$\{overlap\}\)/, '徽标外伸必须走 transform')
  assert.doesNotMatch(source, /badgeIcon\??:|badgeGlyph\??:|badgeBorderWidth\??:/, '旧 badge 平铺字段必须删净')
  assert.match(source, /badge\??:\s*ContentPopupBadge/, '徽标收进单一对象')
  assert.match(source, /kind:\s*'icon'\s*\|\s*\{ kind:\s*'iconClass'|kind: 'iconClass'/, '第三方类名有独立内容形态')
  assert.match(index, /type ContentPopupBadge(?:Radius|,|\n)/, '徽标类型没导出')
  assert.match(read('src/ui/layout/index.ts'), /from '\.\/content-popup\/index\.js'/, 'layout 出口没转发 ContentPopup')
})

test('ContentPopup 样式不踩 Skyline 禁用写法，token 由真源生成', () => {
  const own = read('dist/ui/layout/content-popup/style/index.css')
  assert.match(own, /\.mptk-popup__panel\.mptk-content-popup__panel/, '外伸徽标需要双类放开面板 overflow')
  assert.match(own, /--mptk-c-content-popup-badge-size/, '徽标尺寸必须读 token')
  assert.match(own, /\.mptk-content-popup__badge\s*\{[^}]*overflow:\s*hidden/, '徽标要裁圆图片')
  assert.match(own, /\.mptk-content-popup__badge\s*\{[^}]*border-width:\s*var\(--mptk-c-content-popup-badge-border-w\)/, '徽标外圈描边默认开')
  assert.match(own, /border-color:\s*var\(--mptk-surface-elevated\)/, '徽标描边默认色跟面板底色，暗档才同色')
  assert.match(own, /\.mptk-content-popup__badge--tone-blue\s*\{[^}]*background-image:\s*var\(--mptk-c-content-popup-badge-bg-blue\)/, '默认色调走主题感知渐变 token')
  assert.match(own, /\.mptk-content-popup__header--divided\s*\{[^}]*border-bottom-width:\s*var\(--mptk-c-border-w\)[^}]*border-bottom-color:\s*var\(--mptk-border\)/, '分割线归 header 的下边框，随渐变铺到线')
  assert.match(own, /\.mptk-popup__panel--center\s+\.mptk-content-popup__header\s*\{[^}]*border-top-left-radius:\s*var\(--mptk-c-popup-radius\)/, '头部按面板圆角自裁上两角，渐变不溢出')
  assert.doesNotMatch(own, /\.mptk-content-popup__divider\s*\{/, '独立 divider 节点已移除，别留孤儿规则')
  assert.match(own, /\.mptk-content-popup__title\s*\{[^}]*font-size:\s*var\(--mptk-font-lg\)/, '主标题用大字档')
  assert.match(own, /\.mptk-content-popup__subtitle\s*\{[^}]*font-size:\s*var\(--mptk-font-xs\)[^}]*color:\s*var\(--mptk-c-content-popup-head-ink-2\)/, '副标题用更小字号，字色走头字 token')
  assert.match(read('kit.config.mjs'), /--mptk-c-content-popup-head-ink/, '头部字色缺 token 真源')
  assert.doesNotMatch(own, /mptk-content-popup__head(?!er)/, '__head 外层应已合并进 __header')
  assert.match(own, /\.mptk-content-popup__lead-slot\s*\{[^}]*font-size:\s*var\(--mptk-c-content-popup-title-icon-size\)/, '文字头图标尺寸走组件 token')
  assert.match(own, /\.mptk-content-popup__lead-icon,\s*\.mptk-content-popup__lead-glyph/, '四形态图标收进统一 __lead-* 类族')
  assert.match(own, /\.mptk-content-popup__title-text--raised\s*\{[^}]*margin-top:\s*var\(--mptk-space-3\)/, '外伸档标题与图标留间距')
  assert.doesNotMatch(own, /mptk-content-popup__badge-title|mptk-content-popup__badge-icon|mptk-content-popup__badge-image/, 'badge 专属标题/图标类已并入 __lead-*，不许复活')
  assert.match(read('src/ui/layout/content-popup/index.ts'), /type ContentPopupHeaderIcon/, '统一图标类型没导出')
  assert.match(own, /\.mptk-content-popup__title-text\s*\{[^}]*min-width:\s*0/, '长文案换行需要 min-width:0')
  assert.match(own, /\.mptk-content-popup__title,\s*\.mptk-content-popup__subtitle\s*\{[^}]*white-space:\s*normal/, '标题与副标题必须允许换行')
  assert.match(own, /\.mptk-content-popup__header--title\s*\{[^}]*column-gap:\s*var\(--mptk-space-4\)/, '图标与文字的左右间距加大')
  assert.match(read('kit.config.mjs'), /--mptk-c-content-popup-title-icon-size/, '图标尺寸缺 token 真源')
  assert.doesNotMatch(own, /margin-top:-\d/, 'Skyline 不支持负外边距')
  assert.doesNotMatch(own, /(^|[;{\s])gap:/, 'Skyline 不支持 gap 简写')
  assert.match(read('kit.config.mjs'), /--mptk-c-content-popup-badge-border-w/, '描边宽度缺 token 真源')
  assert.match(read('src/design/_tokens.scss'), /--mptk-c-content-popup-badge-size/, '生成物没带上徽标尺寸 token')
  assert.match(read('kit.config.mjs'), /--mptk-c-content-popup-badge-icon-size/, '徽标图标尺寸缺 token 真源')
  assert.match(own, /\.mptk-content-popup__badge \.mptk-content-popup__lead-icon[^{]*\{[^}]*font-size:\s*var\(--mptk-c-content-popup-badge-icon-size\)/, '徽标图标尺寸走专属 token')

  const toneBg = (mode, tone) => new RegExp(`--mptk-c-content-popup-badge-bg-${tone}:\\s*([^;]+);`)
    .exec(resolveCssVars(read(`dist/styles/theme-${mode}.css`)))?.[1]?.trim()
  for (const tone of ['blue', 'green', 'red', 'yellow']) {
    const lightBg = toneBg('light', tone)
    const darkBg = toneBg('dark', tone)
    assert.match(lightBg ?? '', /^linear-gradient\(/, `${tone} 明档必须是渐变，不许纯色死板`)
    assert.match(darkBg ?? '', /^linear-gradient\(/, `${tone} 暗档必须是渐变`)
    assert.notEqual(lightBg, darkBg, `${tone} 明暗必须反色，不能同一套色值`)
  }
})

test('演示页与文档同步 ContentPopup 三档', () => {
  const page = read('demo/src/pages/popup/index.tsx')
  const catalog = read('demo/src/catalog.ts')
  assert.match(page, /from 'mp-taro-kit\/ui\/layout\/content-popup'/, '演示页没走组件级细路径')
  for (const title of ['文字头', '图片头', '外伸icon']) {
    assert.match(page, new RegExp(`title="${title}"`), `演示页缺 ${title} 的 Cell`)
  }
  assert.doesNotMatch(page, /title="外伸徽标"/, '徽标 Cell 标题已拆行，不许复活旧标题')
  assert.doesNotMatch(page, /title="徽标配色"/, '不单独加配色 Cell，按形态各展示一档')
  assert.doesNotMatch(page, /badgeBackground/, 'demo 不再写死徽标纯色，配色统一走库 token')
  assert.match(page, /tone: contentMode === 'square' \? 'green'/, 'demo 按形态给 tone 色名，不写色值')
  assert.match(catalog, /id: 'content-popup'/, '演示站目录没登记内容弹窗')
  assert.match(read('docs/api/content-popup.md'), /## 不做什么/, '契约文档缺边界小节')
  assert.match(read('docs/README.md'), /content-popup\.md/, '文档索引缺条目')
})
