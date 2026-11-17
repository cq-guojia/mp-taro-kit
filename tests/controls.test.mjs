import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveControlColor, CONTROL_COLORS } from '../dist/ui/form/control-color.js'
import { resolveButtonColor } from '../dist/ui/actions/button-color.js'
import { resolveCssVars } from './helpers/kit-config.mjs'

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

/* 高度刻度七档：中三档是 WeUI 的 32 / 40 / 48，两端逐档外扩 16 / 20 / 24 / 56。
   3xs / xxs 只对展示类标签开放，可点控件从 xs 起（低于最小可点目标）。 */
const TIERS = [['3xs', 16], ['xxs', 20], ['xs', 24], ['sm', 32], ['md', 40], ['lg', 48], ['xl', 56]]
const CLICKABLE = TIERS.filter(([tier]) => tier !== '3xs' && tier !== 'xxs')

test('高度刻度只写一处，四份主题产物是 16 / 20 / 24 / 32 / 40 / 48 / 56', () => {
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

test('Switch 与 Segmented 五档总高逐档等于 token，根规则不叠加上下内边距', () => {
  for (const [dir, base] of [['switch', 'mptk-switch'], ['segmented', 'mptk-seg']]) {
    const css = read(`../dist/ui/form/${dir}/style/index.css`)
    const root = new RegExp(`\\.${base}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(root, `${dir} 缺根规则`)
    assert.match(root[1], /height:\s*var\(--mptk-control-h-sm\)/, `${dir} 默认档必须是 sm（32）`)
    assert.doesNotMatch(css, /padding-(top|bottom):/, `${dir} 总高不许由上下内边距叠加`)
    for (const [tier] of CLICKABLE) {
      const rule = new RegExp(`\\.${base}--${tier}\\s*\\{([^}]*)\\}`).exec(css)
      assert.ok(rule, `${dir} 缺 ${tier} 档规则`)
      assert.match(rule[1], new RegExp(`height:\\s*var\\(--mptk-control-h-${tier}\\)`), `${dir} ${tier} 档没吃对应 token`)
    }
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${dir} 不许硬编码颜色`)
    assert.doesNotMatch(css, /--mp-/, `${dir} 变量前缀必须是 --mptk-`)
  }
})

test('控件圆角统一走语义变量，容器统一降一号', () => {
  /* 期望值由真源递归解析成最终像素，改默认档时测试自己跟随，不写死档位名。 */
  const expected = resolveCssVars('--mptk-control-radius: var(--mptk-control-radius)')
  for (const mode of ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']) {
    assert.ok(
      resolveCssVars(read(`../dist/styles/${mode}.css`)).includes(expected),
      `${mode} 的控件圆角没跟随配置真源`,
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

test('Button 五档总高逐档等于 token，靠 height 不靠上下内边距', () => {
  const css = read('../dist/ui/actions/style/index.css')
  const root = /\.mptk-btn\s*\{([^}]*)\}/.exec(css)
  assert.ok(root, '缺 .mptk-btn 根规则')
  assert.match(root[1], /box-sizing:\s*border-box/, '固定高度必须盒模型含边框')
  assert.match(root[1], /height:\s*var\(--mptk-control-h-sm\)/, '默认档必须是 sm（32）')
  assert.doesNotMatch(root[1], /padding-(top|bottom)/, '总高不许由上下内边距叠加')
  for (const [tier] of CLICKABLE) {
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

test('Segmented 测量按独立 id 逐个查：缺项即不画滑块，不把指示器画在错位置', () => {
  const src = read('../src/ui/form/segmented/Segmented.tsx')
  assert.doesNotMatch(src, /select\([^)]*#\$\{uid\}[^)]*\.mptk-seg/, '段位几何按 index 对应，不许用组合选择器批量取')
  assert.doesNotMatch(src, /selectAll\([^)]*\.mptk-seg__item/, '每段按独立 id 逐个查，不用 selectAll + class')
  assert.match(src, /id=\{`\$\{uid\}-track`\}/, 'track 要挂独立 id 供测量')
  assert.match(src, /query\.select\(`#\$\{uid\}-track`\)/, 'track 按独立 id 单选')
  assert.match(src, /query\.select\(`#\$\{uid\}-i\$\{String\(index\)\}`\)/, '每段按已有独立 id 逐个查')
  assert.match(src, /list\.some\(\(item\) => item === null\)/, '任一段量不到要整体放弃，不画错位置的滑块')
  const dist = read('../dist/ui/form/segmented/Segmented.js')
  assert.doesNotMatch(dist, /\.mptk-seg__track['"`]\s*\)/, '产物里不许残留组合选择器查询')
})

test('两端不贴边：Segmented 滑动块左右各让一个内缩 token，Switch 方形滑块四边同一个留边', () => {
  const segJs = read('../dist/ui/form/segmented/Segmented.js')
  assert.match(
    segJs,
    /calc\(\$\{span\.width\} - var\(--mptk-seg-inset\) - var\(--mptk-seg-inset\)\)/,
    '滑动块宽度要按两次相减扣掉左右内缩，不能写死 6px',
  )
  assert.match(segJs, /calc\(\$\{span\.left\} \+ var\(--mptk-seg-inset\)\)/, '滑动块起点要让出左边距，不能写死 3px')
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

test('方形态五档只换内边距与字号两个 token，格子按档递增且不超档位根高', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  const pick = (selector) => {
    const hit = new RegExp(`${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(hit, `缺 ${selector}`)
    return hit[1]
  }
  const tiers = [
    ['xs', '.mptk-switch--block.mptk-switch--xs', 'space-0', 'font-xs', 24],
    ['sm', '.mptk-switch--block.mptk-switch--sm', 'space-1', 'font-xs', 32],
    ['md', '.mptk-switch--block.mptk-switch--md', 'space-2', 'font-sm', 40],
    ['lg', '.mptk-switch--block', 'space-3', 'font-md', 48],
    ['xl', '.mptk-switch--block.mptk-switch--xl', 'space-4', 'font-md', 56],
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
  assert.equal(new Set(cells).size, cells.length, '五档格子不许一样大，否则档位没区分')
})

test('最小两档的图标比内容盒小一号，格子不跟着缩', () => {
  const css = read('../dist/ui/form/switch/style/index.css')
  for (const tier of ['xs', 'sm']) {
    const rule = new RegExp(`\\.mptk-switch--block\\.mptk-switch--${tier}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 ${tier} 档覆盖`)
    assert.match(rule[1], /--mptk-switch-cell-box:\s*var\(--mptk-font-xs\)/, `${tier} 内容盒取 font-xs`)
    assert.match(
      rule[1],
      /--mptk-switch-cell-content:\s*calc\(var\(--mptk-switch-cell-box\) - 2px\)/,
      `${tier} 字符字号要比内容盒小一号，且写成差值（宿主改 token 时跟着走）`,
    )
  }
  const tokens = read('../dist/styles/theme-light.css')
  const px = (name) => Number(new RegExp(`--mptk-${name}:\\s*(\\d+)px`).exec(tokens)[1])
  const box = px('font-xs')
  const pad = px('space-1')
  const content = box - 2
  assert.ok(content < box, '缩号后字符必须真的更小')
  assert.ok(box + pad * 2 > content + pad * 2, '格子由内容盒撑住：缩字号只缩内容，格子高度不变')
  for (const tier of ['md', 'xl']) {
    const rule = new RegExp(`\\.mptk-switch--block\\.mptk-switch--${tier}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 ${tier} 档规则`)
    assert.doesNotMatch(rule[1], /--mptk-switch-cell-content:/, `${tier} 档不许单独缩字符，字符字号默认跟随内容盒`)
  }
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

test('Tag 高度吃同一套刻度：3xs / xxs / xs / sm / md 逐档等于 token', () => {
  const css = read('../dist/ui/display/style/index.css')
  const root = /\.mptk-tag\s*\{([^}]*)\}/.exec(css)
  assert.ok(root, '缺 .mptk-tag 根规则')
  assert.match(root[1], /--mptk-tag-h:\s*var\(--mptk-control-h-xs\)/, '标签默认档必须是 xs（24）')
  assert.match(root[1], /min-height:\s*var\(--mptk-tag-h\)/, '高度统一从 --mptk-tag-h 出，别再各处直接引刻度')
  assert.match(root[1], /line-height:\s*var\(--mptk-s-line-flat\)/, '靠 min-height 定高，行高必须压平')
  assert.doesNotMatch(root[1], /padding-(top|bottom)/, '标签高度不许由上下内边距叠加')
  /* 16px 档的字必须再降一档，否则 12px 的字在 16px 里顶满上下。 */
  assert.match(
    /\.mptk-tag--3xs\s*\{([^}]*)\}/.exec(css)?.[1] ?? '',
    /font-size:\s*var\(--mptk-font-3xs\)/,
    '3xs 档要用 font-3xs（10px）',
  )
  for (const tier of ['3xs', 'xxs', 'sm', 'md']) {
    const rule = new RegExp(`\\.mptk-tag--${tier}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 .mptk-tag--${tier}`)
    assert.match(
      rule[1],
      new RegExp(`--mptk-tag-h:\\s*var\\(--mptk-control-h-${tier}\\)`),
      `${tier} 档没吃对应刻度 token`,
    )
    assert.match(rule[1], /min-height:\s*var\(--mptk-tag-h\)/, `${tier} 档高度要跟着 --mptk-tag-h 走`)
  }
})

test('Tag 圆角档与全库同名同值，mark 接管四角', () => {
  const css = read('../dist/ui/display/style/index.css')
  for (const tier of ['xs', 'sm', 'md', 'lg', 'xl', 'pill']) {
    assert.match(
      css,
      new RegExp(`\\.mptk-tag--radius-${tier}\\s*\\{[^}]*border-radius:\\s*var\\(--mptk-radius-${tier}\\)`),
      `${tier} 档没吃同名圆角 token`,
    )
  }
  const mark = /\.mptk-tag--mark\s*\{([^}]*)\}/.exec(css)
  assert.ok(mark, '缺 mark 形态')
  assert.match(mark[1], /border-top-left-radius:\s*var\(--mptk-radius-none\)/, 'mark 左上直角')
  assert.match(mark[1], /border-bottom-left-radius:\s*var\(--mptk-radius-none\)/, 'mark 左下直角')
  assert.match(mark[1], /border-top-right-radius:\s*var\(--mptk-radius-pill\)/, 'mark 右上半圆')
  assert.match(mark[1], /border-bottom-right-radius:\s*var\(--mptk-radius-pill\)/, 'mark 右下半圆')
  assert.doesNotMatch(css, /border-radius:\s*50%/, '不许用 50% 画半圆')
  assert.match(read('../dist/ui/display/Tag.js'), /mptk-tag--radius-/, 'Tag 要把 radius 翻成类名')
  assert.match(read('../dist/ui/display/Tag.d.ts'), /TagRadius/, 'd.ts 缺 TagRadius')
})

test('半圆端按半径退让左右留白：弧端取高度一半，直角侧不动，纯图标正方形不参与', () => {
  const css = read('../dist/ui/display/style/index.css')
  const pill = /\.mptk-tag--radius-pill:not\([^{]*\)\s*\{([^}]*)\}/.exec(css)
  assert.ok(pill, 'pill 形态缺弧端留白规则')
  assert.match(pill[1], /padding-right:\s*calc\(var\(--mptk-tag-h\)\s*\/\s*2\)/, 'pill 右端是半圆，要按半径退让')
  assert.match(pill[1], /padding-left:\s*calc\(var\(--mptk-tag-h\)\s*\/\s*2\)/, 'pill 左端是半圆，要按半径退让')
  assert.match(pill[0], /:not\(\.mptk-tag--icon-only\)/, '纯图标标签是正方形，不能被弧端留白撑宽')
  assert.match(pill[0], /:not\(\.mptk-tag--mark\)/, 'mark 只有右端是弧，左端不能按半径退让')

  const mark = /\.mptk-tag--mark:not\([^{]*\)\s*\{([^}]*)\}/.exec(css)
  assert.ok(mark, 'mark 形态缺弧端留白规则')
  assert.match(mark[1], /padding-right:\s*calc\(var\(--mptk-tag-h\)\s*\/\s*2\)/, 'mark 右端是半圆，要按半径退让')
  assert.doesNotMatch(mark[1], /padding-left/, 'mark 左侧是直角，留白仍归档位自己定')

  const sizes = /\{[^}]*--mptk-tag-h:\s*(var\(--mptk-control-h-[\w-]+\))[^}]*\}/.exec(css)
  assert.ok(sizes, '档位类要把自己的高度写进 --mptk-tag-h，弧端留白才能跟着档位走')
})

test('默认标签实心：深灰底 + 反白字，与页面底色分得开', () => {
  const css = read('../dist/ui/display/style/index.css')
  const root = /\.mptk-tag\s*\{([^}]*)\}/.exec(css)
  assert.ok(root, '缺 .mptk-tag 根规则')
  assert.match(root[1], /background-color:\s*var\(--mptk-tag-bg\)/, '默认底色必须走语义变量，不能硬引灰阶')
  assert.match(root[1], /color:\s*var\(--mptk-tag-fg\)/, '实心深底必须反白，不能跟着全局 --mptk-fg 走')
  assert.doesNotMatch(root[1], /color:\s*var\(--mptk-fg\)/, '根规则的文字色不许是全局正文色，深底上会变成深底黑字')
  const light = read('../dist/styles/theme-light.css')
  const dark = read('../dist/styles/theme-dark.css')
  assert.match(light, /--mptk-tag-bg:\s*#969799/, '明色取 gray-6：页面底是 gray-2，浅灰档在浅底上分不出块')
  assert.match(dark, /--mptk-tag-bg:\s*#626a75/, '暗色取 gray-6：页面底是 gray-2，浅灰档同侧会陷进背景')
  /* tag-fg 只是引用反白键，断言要看解析后的最终值，不能把 var() 当结论。 */
  assert.match(resolveCssVars(light, 'light'), /--mptk-tag-fg:\s*#fff/, '明色反白字')
  assert.match(resolveCssVars(dark, 'dark'), /--mptk-tag-fg:\s*#fff/, '暗色反白字')
  for (const [mode, css] of [['明色', light], ['暗色', dark]]) {
    assert.doesNotMatch(css, /--mptk-tag-fg:\s*#[0-9a-f]{3,8}/i, `${mode} tag-fg 不许另写一份字面量：反白字只维护一处`)
  }
})

test('Tag 三种底色形态：soft 的边比底深，底色取语义浅色档', () => {
  const css = read('../dist/ui/display/style/index.css')
  const soft = /\.mptk-tag--soft\s*\{([^}]*)\}/.exec(css)
  assert.ok(soft, '缺 soft 形态')
  assert.match(soft[1], /background-color:\s*var\(--mptk-default-soft\)/, 'soft 默认浅底')
  assert.match(soft[1], /border:\s*var\(--mptk-c-border-w\) solid var\(--mptk-gray-5\)/, 'soft 需要有描边')
  assert.doesNotMatch(soft[1], /color:\s*var\(--mptk-tag-fg\)/, 'soft 是浅底，反白字用不上，必须沿用正文色')
  for (const tone of ['primary', 'success', 'warning', 'danger']) {
    const rule = new RegExp(`\\.mptk-tag--soft\\.mptk-tag--${tone}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 soft ${tone}`)
    const token = tone === 'primary' ? 'business' : tone
    assert.match(rule[1], new RegExp(`background-color:\\s*var\\(--mptk-${token}-soft\\)`), `${tone} 浅底取语义浅色档`)
    assert.match(rule[1], new RegExp(`border-color:\\s*var\\(--mptk-${token}\\)`), `${tone} 描边取语义色本身`)
    assert.match(rule[1], new RegExp(`color:\\s*var\\(--mptk-${token}\\)`), `${tone} 文字取语义色本身`)
  }
  assert.match(css, /\.mptk-tag--outline\s*\{[^}]*border:\s*var\(--mptk-c-border-w\) solid var\(--mptk-border\)/, 'outline 需要常规描边')
  assert.doesNotMatch(css, /\.mptk-tag\s*\{[^}]*border:/, 'solid 默认不占描边，否则实心块看着小一圈')
  assert.match(read('../dist/ui/display/Tag.d.ts'), /TagVariant/, 'd.ts 缺 TagVariant')
})

test('Tag 纯图标必然是正方形：宽高都锁成档位高度、不加左右内边距', () => {
  const css = read('../dist/ui/display/style/index.css')
  const base = /\.mptk-tag--icon-only\s*\{([^}]*)\}/.exec(css)
  assert.ok(base, '缺 icon-only 规则')
  assert.match(base[1], /width:\s*var\(--mptk-control-h-xs\)/, '默认档宽度等于档位高度')
  assert.match(base[1], /height:\s*var\(--mptk-control-h-xs\)/, '默认档高度等于档位高度')
  assert.match(base[1], /padding-(right|left):\s*0/, '纯图标不加左右内边距')
  assert.match(base[1], /flex:\s*none/, '挡住父容器 stretch')
  for (const tier of ['3xs', 'xxs', 'sm', 'md']) {
    const rule = new RegExp(`\\.mptk-tag--icon-only\\.mptk-tag--${tier}\\s*\\{([^}]*)\\}`).exec(css)
    assert.ok(rule, `缺 icon-only ${tier}`)
    assert.match(rule[1], new RegExp(`width:\\s*var\\(--mptk-control-h-${tier}\\)`), `${tier} 宽不等于档位高度`)
    assert.match(rule[1], new RegExp(`height:\\s*var\\(--mptk-control-h-${tier}\\)`), `${tier} 高不等于档位高度`)
  }
  const js = read('../dist/ui/display/Tag.js')
  assert.match(js, /mptk-tag--icon-only/, 'Tag 要按「无文字 + 有图标」自动转纯图标')
})

test('档名与物理高度一一对应：可点控件不开放 xxs，标签不开放 lg / xl', () => {
  for (const file of [
    '../dist/ui/actions/Button.d.ts',
    '../dist/ui/form/switch/Switch.d.ts',
    '../dist/ui/form/segmented/Segmented.d.ts',
  ]) {
    const size = /Size = ([^\n]+)/.exec(read(file))?.[1] ?? ''
    assert.doesNotMatch(size, /'(3xs|xxs)'/, `${file} 不许开放 3xs / xxs：低于最小可点目标`)
  }
  const tagSize = /TagSize = ([^\n]+)/.exec(read('../dist/ui/display/Tag.d.ts'))?.[1] ?? ''
  for (const tier of ['3xs', 'xxs', 'xs', 'sm', 'md']) {
    assert.match(tagSize, new RegExp(`'${tier}'`), `Tag 缺 ${tier} 档`)
  }
  for (const tier of ['lg', 'xl']) {
    assert.doesNotMatch(tagSize, new RegExp(`'${tier}'`), `Tag 不该开放 ${tier}：标签没这么大场景`)
  }
})

test('Button 四轴：形态档只填局部变量，纯图标锁成正方形，转圈跟随字色', () => {
  const css = read('../dist/ui/actions/style/index.css')
  for (const tone of ['default', 'primary', 'success', 'warning', 'danger']) {
    for (const variant of ['soft', 'outline', 'ghost']) {
      const rule = new RegExp(`\\.mptk-btn--${tone}\\.mptk-btn--${variant}\\s*\\{([^}]*)\\}`).exec(css)
      assert.ok(rule, `缺 ${tone} × ${variant} 形态档`)
      assert.match(rule[1], /--mptk-btn-(bg|fg|border):/, `${tone} × ${variant} 没落到局部变量`)
    }
  }
  assert.match(css, /\.mptk-btn--icon-only\s*\{[^}]*width:\s*var\(--mptk-btn-h\)/, '纯图标宽必须锁成同档高度')
  assert.match(css, /\.mptk-btn--spin-circle \.mptk-btn__label\s*\{[^}]*visibility:\s*hidden/, 'circle 模式靠隐形文字占位')
  assert.match(
    css,
    /\.mptk-btn__spinner\s*\{[^}]*--mptk-spinner-active:\s*var\(--mptk-btn-fg\)/,
    '转圈要取按钮字色，且不能停在 currentColor 关键字上（Skyline 下 conic-gradient 画不出它）',
  )
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'Button 不许硬编码颜色')
  const js = read('../dist/ui/actions/Button.js')
  assert.match(js, /loadingMode/, 'Button 要接 loadingMode')
  assert.match(js, /mptk-btn--icon-only/, 'Button 要按「无文字 + 有图标」自动转纯图标')
  assert.match(read('../dist/ui/actions/Button.d.ts'), /ButtonLoadingMode/, 'd.ts 缺 ButtonLoadingMode')
})

test('Button 品牌色派生：深底压白字、浅底压深字，soft 用分量算浅底', () => {
  assert.deepEqual(resolveButtonColor('solid', '#3b5bdb'), {
    backgroundColor: '#3b5bdb',
    borderColor: '#3b5bdb',
    color: 'var(--mptk-fg-on-accent)',
  })
  assert.equal(resolveButtonColor('solid', '#f5c518').color, 'var(--mptk-fg)', '浅品牌色必须压深字')
  assert.equal(resolveButtonColor('soft', 'rgb(124, 58, 237)').backgroundColor, 'rgba(124, 58, 237, 0.16)')
  assert.equal(
    resolveButtonColor('soft', 'var(--brand)').backgroundColor,
    'var(--mptk-surface-2)',
    '解析不了的色值，浅底退回灰面',
  )
  assert.deepEqual(resolveButtonColor('outline', '#7c3aed'), {
    backgroundColor: 'var(--mptk-surface-1)',
    borderColor: '#7c3aed',
    color: '#7c3aed',
  })
  assert.deepEqual(resolveButtonColor('ghost', '#7c3aed'), { color: '#7c3aed' })
  assert.equal(resolveButtonColor('solid', undefined), undefined, '不传色值就该交给档位类')
})

test('关键帧里不许出现 var()：WXSS 编译期固化成静态表，带 var() 的声明会整条丢失', () => {
  for (const file of ['../dist/ui/feedback/spinner/style/index.css', '../dist/ui/feedback/style/index.css']) {
    const css = read(file)
    const blocks = []
    const heads = /@keyframes\s+[\w-]+\s*\{/g
    let hit = heads.exec(css)
    while (hit !== null) {
      let depth = 0
      let index = hit.index + hit[0].length - 1
      const start = index
      for (; index < css.length; index += 1) {
        if (css[index] === '{') depth += 1
        else if (css[index] === '}') {
          depth -= 1
          if (depth === 0) break
        }
      }
      blocks.push(css.slice(start, index + 1))
      heads.lastIndex = index
      hit = heads.exec(css)
    }
    assert.ok(blocks.length > 0, `${file} 没找到任何关键帧`)
    for (const block of blocks) {
      assert.doesNotMatch(block, /var\(/, `${file} 的关键帧里出现 var()，动画会在 Skyline 下静默失效`)
    }
  }
})

test('字色只许取字色类键：面 / 底 / 浅底 / 边框一律不得用于 color', () => {
  const roots = fileURLToPath(new URL('../dist/ui', import.meta.url))
  const files = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.css')) files.push(full)
    }
  }
  walk(roots)
  assert.ok(files.length > 10, `扫到的样式产物太少（${String(files.length)} 个），遍历本身有问题`)

  // 「面」色的明暗语义相反（surface-1 明是白、暗是 #1f2329），当字色用必错，且只在暗色暴露。
  const forbidden = /^(?:surface-|gray-|border(?:$|-)|.*-bg$|.*-soft$|.*-track$|.*-dim$|.*-divider$)/
  const hits = []
  for (const file of files) {
    const css = readFileSync(file, 'utf8')
    for (const hit of css.matchAll(/(?<![-\w])color:\s*var\(--mptk-([a-z0-9-]+)\)/g)) {
      if (forbidden.test(hit[1])) hits.push(`${file.slice(file.indexOf('dist/'))} → --mptk-${hit[1]}`)
    }
  }
  assert.deepEqual(hits, [], `字色引用了面/底类键：${hits.join('；')}`)
})

test('强调底上的字走 fg-on-accent：明暗两套都是白', () => {
  for (const file of ['../dist/ui/display/style/index.css', '../dist/ui/actions/style/index.css']) {
    assert.match(
      read(file),
      /(?:--mptk-btn-fg|color):\s*var\(--mptk-fg-on-accent\)/,
      `${file} 实心块没走反白字键`,
    )
  }
  for (const mode of ['light', 'dark']) {
    assert.match(
      read(`../dist/styles/theme-${mode}.css`),
      /--mptk-fg-on-accent:\s*#fff/,
      `${mode} 主题缺反白字键或缺回白值`,
    )
  }
})
