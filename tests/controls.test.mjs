import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolveControlColor, CONTROL_COLORS } from '../dist/ui/form/control-color.js'
import { resolveCssVars } from './helpers/kit-config.mjs'

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

const TIERS = [['sm', 32], ['md', 40], ['lg', 48]]

test('控件高度只写一处，四份主题产物都是官方 WeUI 的 32 / 40 / 48', () => {
  for (const mode of ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']) {
    const css = read(`../dist/styles/${mode}.css`)
    for (const [tier, px] of TIERS) {
      const hit = new RegExp(`--mptk-control-h-${tier}:\\s*(\\d+)px`).exec(css)
      assert.ok(hit, `${mode} 缺 --mptk-control-h-${tier}`)
      assert.equal(Number(hit[1]), px, `${mode} 的 ${tier} 档不是 ${String(px)}px`)
    }
  }
  const source = read('../src/design/_tokens.scss')
  for (const [tier] of TIERS) {
    assert.equal(
      (source.match(new RegExp(`--mptk-control-h-${tier}:`, 'g')) ?? []).length,
      1,
      `${tier} 档不得在组件样式里另写一份`,
    )
  }
})

test('Switch 与 Segmented 三档总高逐档等于 token，根规则不叠加上下内边距', () => {
  for (const [dir, base] of [['switch', 'mptk-switch'], ['segmented', 'mptk-seg']]) {
    const css = read(`../dist/ui/form/${dir}/style/index.css`)
    const root = new RegExp(`\\.${base}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(root, `${dir} 缺根规则`)
    assert.match(root[1], /height:\s*var\(--mptk-control-h-md\)/, `${dir} 默认档必须是 md（40）`)
    assert.doesNotMatch(css, /padding-(top|bottom):/, `${dir} 总高不许由上下内边距叠加`)
    for (const [tier] of TIERS) {
      const rule = new RegExp(`\\.${base}--${tier}\\s*\\{([^}]*)\\}`).exec(css)
      assert.ok(rule, `${dir} 缺 ${tier} 档规则`)
      assert.match(rule[1], new RegExp(`height:\\s*var\\(--mptk-control-h-${tier}\\)`), `${dir} ${tier} 档没吃对应 token`)
    }
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${dir} 不许硬编码颜色`)
    assert.doesNotMatch(css, /--mp-/, `${dir} 变量前缀必须是 --mptk-`)
  }
})

test('控件圆角统一走语义变量，容器统一降一号', () => {
  for (const mode of ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']) {
    assert.match(
      read(`../dist/styles/${mode}.css`),
      /--mptk-control-radius:\s*var\(--mptk-radius-sm\)/,
      `${mode} 缺控件圆角语义变量`,
    )
  }
  const btn = read('../dist/ui/actions/style/index.css')
  const btnRoot = /\.mptk-btn\s*\{([^}]*)\}/.exec(btn)
  assert.ok(btnRoot, '缺 .mptk-btn 根规则')
  assert.match(btnRoot[1], /border-radius:\s*var\(--mptk-control-radius\)/, 'Button 圆角必须引用语义变量')
  assert.doesNotMatch(btnRoot[1], /border-radius:\s*var\(--mptk-radius-(xs|sm|md|lg|xl)\)/, 'Button 不许自己写档位')
  const seg = read('../dist/ui/form/segmented/style/index.css')
  const segRoot = /\.mptk-seg\s*\{([^}]*)\}/.exec(seg)
  assert.ok(segRoot, '缺 .mptk-seg 根规则')
  assert.match(segRoot[1], /border-radius:\s*var\(--mptk-control-radius\)/, 'Segmented 容器圆角必须引用语义变量')
  assert.match(seg, /\.mptk-seg__thumb\s*\{[^}]*border-radius:\s*var\(--mptk-radius-xs\)/, '滑块比容器小一号')
  const cell = read('../dist/ui/display/cell/style/index.css')
  assert.match(cell, /border-top-left-radius:\s*var\(--mptk-radius-sm\)/, 'Cell 四角降到 sm')
  assert.doesNotMatch(cell, /border-(top|bottom)-(left|right)-radius:\s*var\(--mptk-radius-md\)/, 'Cell 不许留在 md')
})

test('Button 三档总高逐档等于 token，靠 height 不靠上下内边距', () => {
  const css = read('../dist/ui/actions/style/index.css')
  const root = /\.mptk-btn\s*\{([^}]*)\}/.exec(css)
  assert.ok(root, '缺 .mptk-btn 根规则')
  assert.match(root[1], /box-sizing:\s*border-box/, '固定高度必须盒模型含边框')
  assert.match(root[1], /height:\s*var\(--mptk-control-h-md\)/, '默认档必须是 md（40）')
  assert.doesNotMatch(root[1], /padding-(top|bottom)/, '总高不许由上下内边距叠加')
  for (const tier of ['sm', 'md', 'lg']) {
    const rule = new RegExp(`\\.mptk-btn--${tier}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 .mptk-btn--${tier}`)
    assert.match(rule[1], new RegExp(`height:\\s*var\\(--mptk-control-h-${tier}\\)`), `${tier} 档没吃对应 token`)
  }
})

test('半圆形态用 pill token，不许写 50%', () => {
  const btn = read('../dist/ui/actions/style/index.css')
  assert.match(
    btn,
    /\.mptk-btn--radius-pill\s*\{[^}]*border-radius:\s*var\(--mptk-radius-pill\)/,
    'Button 缺 pill 圆角',
  )
  const seg = read('../dist/ui/form/segmented/style/index.css')
  assert.match(
    seg,
    /\.mptk-seg--radius-pill\s*\{[^}]*border-radius:\s*var\(--mptk-radius-pill\)/,
    'Segmented 缺 pill 圆角',
  )
  for (const file of ['../dist/ui/actions/style/index.css', '../dist/ui/form/segmented/style/index.css']) {
    assert.doesNotMatch(read(file), /border-radius:\s*50%/, '长方形上 50% 会变椭圆，必须用 pill token')
  }
  assert.match(read('../dist/ui/actions/Button.js'), /mptk-btn--radius-/, 'Button 要把 radius 翻成类名')
  assert.match(read('../dist/ui/form/segmented/Segmented.js'), /mptk-seg--radius-/, 'Segmented 要把 radius 翻成类名')
  assert.match(read('../dist/ui/actions/Button.d.ts'), /ButtonRadius/, 'd.ts 缺 ButtonRadius')
  assert.match(read('../dist/ui/form/segmented/Segmented.d.ts'), /SegmentedRadius/, 'd.ts 缺 SegmentedRadius')
})

test('控件主色与业务色解耦：默认蓝、色板齐全；明色滑轨与滑块不是一片白', () => {
  for (const mode of ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']) {
    const css = read(`../dist/styles/${mode}.css`)
    assert.match(css, /--mptk-control-active:/, `${mode} 缺控件主色`)
    assert.match(css, /--mptk-control-track:/, `${mode} 缺滑轨色`)
    assert.match(css, /--mptk-control-thumb:/, `${mode} 缺滑块色`)
    for (const name of CONTROL_COLORS) {
      assert.match(css, new RegExp(`--mptk-control-${name}:`), `${mode} 缺内置色 ${name}`)
    }
  }
  const light = read('../dist/styles/theme-light.css')
  assert.match(light, /--mptk-control-blue:\s*#3b5bdb/, '默认主色必须是蓝，不是绿')
  assert.match(light, /--mptk-control-active:\s*var\(--mptk-control-blue\)/)
  const track = /--mptk-control-track:\s*([^;]+);/.exec(light)?.[1]?.trim()
  assert.ok(track && track.toLowerCase() !== '#fff', '明色滑轨不能是纯白，否则与页面底色无对比')

  for (const [dir, prefix] of [['switch', 'mptk-switch'], ['segmented', 'mptk-seg']]) {
    const css = read(`../dist/ui/form/${dir}/style/index.css`)
    assert.doesNotMatch(css, /var\(--mptk-business\)/, `${dir} 不许蹭宿主会定制的业务色`)
    for (const name of CONTROL_COLORS) {
      assert.match(
        css,
        new RegExp(`\\.${prefix}--${name}\\s*\\{[^}]*--mptk-control-${name}`),
        `${dir} 缺内置色 ${name} 的类名`,
      )
    }
  }
})

test('两端不贴边：Segmented 滑动块左右各留 3px，Switch 方形滑块四边同一个留边', () => {
  const segJs = read('../dist/ui/form/segmented/Segmented.js')
  assert.match(segJs, /calc\(.*- 6px\)/, '滑动块宽度要减掉左右边距')
  assert.match(segJs, /calc\(.*\+ 3px\)/, '滑动块起点要让出左边距')
  const switchCss = read('../dist/ui/form/switch/style/index.css')
  const block = /\.mptk-switch--block \.mptk-switch__thumb\s*\{([^}]*)\}/.exec(switchCss)
  assert.ok(block, '缺方形滑块规则')
  for (const edge of ['top', 'bottom', 'left']) {
    assert.match(
      block[1],
      new RegExp(`${edge}:\\s*var\\(--mptk-switch-cell-inset\\)`),
      `${edge} 必须与其余边取同一个留边`,
    )
  }
  assert.match(
    block[1],
    /width:\s*calc\(50% - var\(--mptk-switch-cell-inset\) - var\(--mptk-switch-cell-inset\)\)/,
    '宽度要减掉左右两个留边，两端才对称',
  )
  const onRule = /\.mptk-switch--block\.mptk-switch--on \.mptk-switch__thumb\s*\{([^}]*)\}/.exec(switchCss)
  assert.ok(onRule, '缺方形滑块开启态规则')
  assert.match(
    onRule[1],
    /translateX\(calc\(100% \+ var\(--mptk-switch-cell-inset\) \+ var\(--mptk-switch-cell-inset\)\)\)/,
    '位移要补回右半区的留边，且与左边同一个值',
  )
})

test('方形开关每侧是正方形：四边同一个内边距，边长 = 1em + 2 × 内边距', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const side = /\.mptk-switch__side\s*\{([^}]*)\}/.exec(css)
  assert.ok(side, '缺 side 规则')
  assert.match(side[1], /box-sizing:\s*border-box/, '最小宽要含内边距，否则撑不到正方形')
  assert.match(side[1], /padding:\s*var\(--mptk-switch-cell-pad\)/, '上下左右必须是同一个内边距')
  assert.doesNotMatch(side[1], /padding-(top|bottom|left|right)/, '不许拆成四边分别写，拆了必有一边掉队')
  assert.match(side[1], /min-width:\s*var\(--mptk-switch-cell\)/, '窄内容（数字 / 半角符号）要用格子边长兜成正方形')
  assert.match(side[1], /font-size:\s*var\(--mptk-switch-cell-content\)/, '字符字号必须独立于格子，sm 档才能只缩图标')
  assert.match(resolveCssVars(side[1]), /line-height:\s*1/, '内容盒要压成字符字号，否则单个字是竖长方形')
  assert.doesNotMatch(side[1], /min-width:\s*\d+px/, '不许再写死固定宽')

  const block = /\.mptk-switch--block\s*\{([^}]*)\}/.exec(css)
  assert.ok(block, '缺方形态变量块')
  const cell = /--mptk-switch-cell:\s*([^;]+);/.exec(block[1])
  assert.ok(cell, '缺格子边长变量')
  assert.match(cell[1], /var\(--mptk-switch-cell-box\)/, '边长基准必须是内容盒 token，不是使用处的字号')
  assert.equal(
    (cell[1].match(/var\(--mptk-switch-cell-pad\)/g) ?? []).length,
    2,
    '边长要把左右两个内边距都加上',
  )
  assert.doesNotMatch(cell[1], /\d+px/, '边长不许出现固定像素')
  assert.doesNotMatch(cell[1], /\*/, '小程序 WebView 不保证支持 calc 乘法，只许相加')
  const track = /\.mptk-switch--block \.mptk-switch__track\s*\{([^}]*)\}/.exec(css)
  assert.ok(track, '缺方形轨道规则')
  assert.match(track[1], /min-height:\s*var\(--mptk-switch-cell\)/, '轨道高度要跟着格子走，内容变大不会被裁')
  assert.doesNotMatch(track[1], /--mptk-switch-track-h/, '方形态不许再吃圆形开关的 52:32 定高')
})

test('方形态三档只换内边距与字号两个 token，格子按档递增且不超档位根高', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const pick = (selector) => {
    const hit = new RegExp(`${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(hit, `缺 ${selector}`)
    return hit[1]
  }
  const tiers = [
    ['sm', '.mptk-switch--block.mptk-switch--sm', 'space-1', 'font-xs', 32],
    ['md', '.mptk-switch--block.mptk-switch--md', 'space-2', 'font-sm', 40],
    ['lg', '.mptk-switch--block', 'space-3', 'font-md', 48],
  ]
  const tokens = read('../dist/styles/theme-light.css')
  const px = (name) => {
    const hit = new RegExp(`--mptk-${name}:\\s*(\\d+)px`).exec(tokens)
    assert.ok(hit, `缺 token --mptk-${name}`)
    return Number(hit[1])
  }
  const cells = []
  for (const [tier, selector, pad, font, root] of tiers) {
    const rule = pick(selector)
    assert.match(rule, new RegExp(`--mptk-switch-cell-pad:\\s*var\\(--mptk-${pad}\\)`), `${tier} 档内边距没吃 ${pad}`)
    assert.match(rule, new RegExp(`--mptk-switch-cell-box:\\s*var\\(--mptk-${font}\\)`), `${tier} 档内容盒没吃 ${font}`)
    const cell = px(font) + px(pad) * 2
    assert.ok(cell < root, `${tier} 档格子 ${String(cell)}px 超出根高 ${String(root)}px`)
    cells.push(cell)
  }
  assert.deepEqual(cells, [...cells].sort((a, b) => a - b), '格子必须随档递增')
  assert.equal(new Set(cells).size, cells.length, '三档格子不许一样大，否则档位没区分')
})

test('最小号图标比内容盒小一号，格子不跟着缩', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const sm = /\.mptk-switch--block\.mptk-switch--sm\s*\{([^}]*)\}/.exec(css)
  assert.ok(sm, '缺 sm 档覆盖')
  assert.match(sm[1], /--mptk-switch-cell-box:\s*var\(--mptk-font-xs\)/, 'sm 内容盒取 font-xs')
  assert.match(
    sm[1],
    /--mptk-switch-cell-content:\s*calc\(var\(--mptk-switch-cell-box\) - 2px\)/,
    'sm 字符字号要比内容盒小一号，且写成差值（宿主改 token 时跟着走）',
  )
  const tokens = read('../dist/styles/theme-light.css')
  const px = (name) => Number(new RegExp(`--mptk-${name}:\\s*(\\d+)px`).exec(tokens)[1])
  const box = px('font-xs')
  const pad = px('space-1')
  const content = box - 2
  assert.ok(content < box, '缩号后字符必须真的更小')
  assert.ok(box + pad * 2 > content + pad * 2, '格子由内容盒撑住：缩字号只缩内容，格子高度不变')
  const md = /\.mptk-switch--block\.mptk-switch--md\s*\{([^}]*)\}/.exec(css)
  assert.ok(md, '缺 md 档规则')
  assert.doesNotMatch(md[1], /--mptk-switch-cell-content:/, 'md 档不许单独缩字符，字符字号默认跟随内容盒')
  const lg = /\.mptk-switch--block\s*\{([^}]*)\}/.exec(css)
  assert.ok(lg, '缺 lg 档规则')
  assert.match(
    lg[1],
    /--mptk-switch-cell-content:\s*var\(--mptk-switch-cell-box\)/,
    '默认档字符字号必须等于内容盒，别处不许再发明字号',
  )
})

test('方形开关圆角落到最小档，轨道、遮罩、滑块三处一致', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const track = /\.mptk-switch--block \.mptk-switch__track\s*\{([^}]*)\}/.exec(css)
  assert.ok(track, '缺方形轨道规则')
  assert.match(track[1], /border-radius:\s*var\(--mptk-radius-xs\)/, '方形轨道取最小档 xs')
  assert.doesNotMatch(track[1], /--mptk-radius-(sm|md|lg|xl)/, '方形轨道不许回到更大档')
  const veil = /\.mptk-switch--block \.mptk-switch__veil\s*\{([^}]*)\}/.exec(css)
  assert.ok(veil, '缺方形遮罩规则')
  assert.match(veil[1], /border-radius:\s*var\(--mptk-radius-xs\)/, '遮罩圆角必须跟轨道一致')
  const thumb = /\.mptk-switch--block \.mptk-switch__thumb\s*\{([^}]*)\}/.exec(css)
  assert.ok(thumb, '缺方形滑块规则')
  assert.match(thumb[1], /border-radius:\s*var\(--mptk-radius-xs\)/, '滑块内角同取 xs')
})

test('圆形开关的图标进滑块，字号按轨道高走', () => {
  const js = read('../dist/ui/form/switch/Switch.js')
  assert.match(js, /mptk-switch__icon/, '圆形形态要有滑块内图标容器')
  assert.match(js, /shape === 'round'/, '图标只进圆形形态，方形走两侧')
  const css = read('../dist/ui/form/switch/style/index.css')
  const icon = /\.mptk-switch__icon\s*\{([^}]*)\}/.exec(css)
  assert.ok(icon, '缺滑块内图标样式')
  assert.match(icon[1], /font-size:\s*calc\(var\(--mptk-switch-track-h\)/, '图标字号按轨道高比例走')
})

test('压在白滑块上的内容恒取深色，轨道侧按底色取对比色', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const rule = (selector) => {
    const hit = new RegExp(`\n${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(hit, `缺规则 ${selector}`)
    return hit[1]
  }
  assert.match(rule('.mptk-switch__side--off'), /color:\s*var\(--mptk-control-thumb-fg\)/, '关态左半压在滑块上，取深色')
  assert.match(rule('.mptk-switch.mptk-switch--on .mptk-switch__side--on'), /color:\s*var\(--mptk-control-thumb-fg\)/, '开态右半压在滑块上，取深色')
  assert.match(rule('.mptk-switch__side--on'), /color:\s*var\(--mptk-fg\)/, '关态右半在 track 灰上，取前景色')
  assert.match(rule('.mptk-switch.mptk-switch--on .mptk-switch__side--off'), /color:\s*var\(--mptk-control-on\)/, '开态左半在主色上，取反白')
  assert.match(rule('.mptk-switch--keep-color .mptk-switch__side--on'), /color:\s*var\(--mptk-control-on\)/, '不变色关态右半也在主色上')
  assert.match(rule('.mptk-switch__icon'), /color:\s*var\(--mptk-control-thumb-fg\)/, '滑块内图标取深色')
  assert.doesNotMatch(css, /var\(--mptk-fg-3\)/, '滑块 / 轨道上的内容不许再用 fg-3 这种低对比前景')
  assert.doesNotMatch(
    css,
    /\n\.mptk-switch--on \.mptk-switch__side--on\s*\{/,
    '开态必须用 3 类选择器：2 类会和 keepColor 同特异性，靠顺序决定谁赢（曾经把白滑块上的图标刷成白色）',
  )
})

test('滑块明暗同取白，滑块上的内容明暗同取深色', () => {
  for (const mode of ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']) {
    const css = read(`../dist/styles/${mode}.css`)
    assert.match(css, /--mptk-control-thumb:\s*#fff/, `${mode} 的滑块必须是白`)
    assert.match(css, /--mptk-control-thumb-fg:\s*#1f2328/, `${mode} 缺滑块前景深色`)
  }
})

test('不变色模式：底色恒为主色、内衬不收缩，只有滑块移动', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const track = /\.mptk-switch\.mptk-switch--keep-color \.mptk-switch__track\s*\{([^}]*)\}/.exec(css)
  assert.ok(track, '缺 keep-color 轨道规则')
  assert.match(track[1], /background-color:\s*var\(--mptk-control-active\)/, '不变色时底色恒为主色')
  const veil = /\.mptk-switch\.mptk-switch--keep-color \.mptk-switch__veil\s*\{([^}]*)\}/.exec(css)
  assert.ok(veil, '缺 keep-color 内衬规则')
  assert.match(resolveCssVars(veil[1]), /transform:\s*scale\(0\)/, '不变色时内衬始终收起')
  assert.match(
    css,
    /\.mptk-switch\.mptk-switch--keep-color \.mptk-switch__track/,
    'keep-color 轨道规则必须用 3 类特异性，不许靠声明顺序压过基础规则',
  )
  assert.match(
    css,
    /\.mptk-switch\.mptk-switch--keep-color \.mptk-switch__veil/,
    'keep-color 内衬规则必须用 3 类特异性',
  )
  const js = read('../dist/ui/form/switch/Switch.js')
  assert.match(js, /mptk-switch--keep-color/, '组件必须挂 keep-color 类名')
  assert.match(js, /on \|\| keepColor/, '不变色模式下自定义色值要一直挂着')
  assert.match(read('../dist/ui/form/switch/Switch.d.ts'), /keepColor/, 'd.ts 缺 keepColor')
})

test('异步示例不许先改值再返回 Promise，否则就是"点过去再 loading"', () => {
  for (const file of ['../demo/src/pages/form/index.tsx', '../demo/src/pages/segmented/index.tsx']) {
    const page = read(file)
    assert.doesNotMatch(page, /return wait\(/, `${file} 在 onChange 里先改值再返回 Promise`)
    assert.match(page, /wait\((true|false)\)\.then\(/, `${file} 必须等成功后再由 then 改值`)
  }
})

test('切换是内衬往回收，轨道底色自己随状态变，不靠遮罩盖错的底色', () => {
  const css = read('../dist/ui/form/switch/style/index.css')

  for (const shape of ['round', 'block']) {
    const off = new RegExp(`\\.mptk-switch--${shape} \\.mptk-switch__track\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(off, `缺 ${shape} 轨道规则`)
    assert.match(off[1], /background-color:\s*var\(--mptk-control-track\)/, `${shape} 关态轨道必须是 track 灰`)
    const on = new RegExp(`\\.mptk-switch--${shape}\\.mptk-switch--on \\.mptk-switch__track\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(on, `缺 ${shape} 轨道选中态规则`)
    assert.match(on[1], /background-color:\s*var\(--mptk-control-active\)/, `${shape} 选中态轨道才是主色`)
    assert.doesNotMatch(on[1], /transition/, '底色不做过场：切换瞬间被内衬盖着，露不出突变')
  }

  const veil = /\.mptk-switch__veil\s*\{([^}]*)\}/.exec(css)
  assert.ok(veil, '缺关态内衬规则')
  const settledVeil = resolveCssVars(veil[1])
  assert.match(settledVeil, /top:\s*2px/, '内衬要比轨道内缩 2px，圆角处露出的是轨道自己的颜色')
  assert.match(settledVeil, /left:\s*2px/)
  assert.match(settledVeil, /width:\s*calc\(100% - 4px\)/, '内衬必须写 width')
  assert.match(settledVeil, /height:\s*calc\(100% - 4px\)/, '内衬必须写 height')
  assert.match(veil[1], /background-color:\s*var\(--mptk-surface-base\)/, '内衬取页面底色，不取轨道色')
  assert.match(settledVeil, /transform:\s*scale\(1\)/)
  assert.match(veil[1], /transition-property:\s*transform/, '内衬的过渡只做缩放')
  assert.doesNotMatch(
    veil[1],
    /(right|bottom):/,
    '别用四条边定位：构建会把它们合并成 inset，Skyline 不认，内衬塌成 0×0 就没动画了',
  )
  assert.match(resolveCssVars(css), /\.mptk-switch--on \.mptk-switch__veil\s*\{[^}]*transform:\s*scale\(0\)/, '选中时内衬收缩到 0')
  assert.match(read('../dist/ui/form/switch/Switch.js'), /mptk-switch__veil/, '组件必须渲染内衬节点')
})

test('内置色走类名、自定义色值走显式内联，组件产物真的把色值写进去', () => {
  assert.deepEqual(resolveControlColor('mptk-switch'), { className: '', inlineColor: undefined })
  for (const name of CONTROL_COLORS) {
    assert.deepEqual(
      resolveControlColor('mptk-seg', name),
      { className: `mptk-seg--${name}`, inlineColor: undefined },
      `内置色 ${name} 必须走类名`,
    )
  }
  assert.deepEqual(resolveControlColor('mptk-switch', '#8b5cf6'), {
    className: '', inlineColor: '#8b5cf6',
  })
  assert.deepEqual(resolveControlColor('mptk-seg', 'rgb(1, 2, 3)'), {
    className: '', inlineColor: 'rgb(1, 2, 3)',
  })
  for (const [dir, file] of [['switch', 'Switch.js'], ['segmented', 'Segmented.js']]) {
    const js = read(`../dist/ui/form/${dir}/${file}`)
    assert.match(js, /inlineColor/, `${dir} 必须消费解析后的色值`)
    assert.match(js, /backgroundColor/, `${dir} 必须把自定义色值显式写到元素上`)
  }
})

test('两个组件各自独立：出口、样式齐全，互不引用也不内联对方样式', () => {
  for (const dir of ['switch', 'segmented']) {
    for (const name of ['index.js', 'index.cjs', 'index.d.ts']) {
      assert.ok(exists(`../dist/ui/form/${dir}/${name}`), `${dir} 组件级出口缺 ${name}`)
    }
    assert.ok(exists(`../dist/ui/form/${dir}/style/index.css`), `${dir} 组件级样式出口缺失`)
  }
  const switchJs = read('../dist/ui/form/switch/Switch.js')
  const segmentedJs = read('../dist/ui/form/segmented/Segmented.js')
  assert.doesNotMatch(switchJs, /Segmented|mptk-seg/, 'Switch 不得引用 Segmented')
  assert.doesNotMatch(segmentedJs, /Switch|mptk-switch/, 'Segmented 不得引用 Switch')
  assert.doesNotMatch(read('../src/ui/form/switch/style/index.scss'), /@use.*segmented/)
  assert.doesNotMatch(read('../src/ui/form/segmented/style/index.scss'), /@use.*switch/)
  const barrel = read('../dist/ui/form/style/index.css')
  assert.match(barrel, /mptk-switch/, 'form 子域样式兼容出口要含 Switch')
  assert.match(barrel, /mptk-seg/, 'form 子域样式兼容出口要含 Segmented')
})

test('异步切换：点了先转圈、位置不动，成功后由宿主把新值传回来', () => {
  const hook = read('../dist/ui/form/useAsyncChange.js')
  assert.match(hook, /setBusy\(true\)/, '发起时立刻进等待态')
  assert.doesNotMatch(hook, /pending/, '不再预拨到新值')
  for (const file of ['../dist/ui/form/switch/Switch.js', '../dist/ui/form/segmented/Segmented.js']) {
    const js = read(file)
    assert.doesNotMatch(js, /pending|displayValue|settleChange/, `${file} 还在用临时的显示值`)
    assert.match(js, /busy/, `${file} 没接等待态`)
  }
  assert.equal(exists('../dist/ui/form/change-state.js'), false, 'change-state 状态机应已删除')
})

test('组件契约类型在宿主真类型环境下可作为 JSX 使用', () => {
  const switchDecl = read('../dist/ui/form/switch/Switch.d.ts')
  for (const name of ['SwitchProps', 'SwitchSize', 'SwitchShape', 'onFailed', 'onChange', 'color', 'ControlColor']) {
    assert.ok(switchDecl.includes(name), `Switch.d.ts 缺 ${name}`)
  }
  const segmentedDecl = read('../dist/ui/form/segmented/Segmented.d.ts')
  for (const name of ['SegmentedProps', 'SegmentedItem', 'SegmentedIndicator', 'count', 'description', 'color', 'ControlColor']) {
    assert.ok(segmentedDecl.includes(name), `Segmented.d.ts 缺 ${name}`)
  }
})
