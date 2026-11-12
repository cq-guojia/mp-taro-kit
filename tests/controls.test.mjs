import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolveControlColor, CONTROL_COLORS } from '../dist/ui/form/control-color.js'

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
    assert.match(root[1], /height:\s*var\(--mptk-control-h-lg\)/, `${dir} 默认档必须是官方 48`)
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

test('两端不贴边：Segmented 滑动块左右各留 3px，Switch 方形滑块两端对称', () => {
  const segJs = read('../dist/ui/form/segmented/Segmented.js')
  assert.match(segJs, /calc\(.*- 6px\)/, '滑动块宽度要减掉左右边距')
  assert.match(segJs, /calc\(.*\+ 3px\)/, '滑动块起点要让出左边距')
  const switchCss = read('../dist/ui/form/switch/style/index.css')
  const block = /\.mptk-switch--block \.mptk-switch__thumb\s*\{([^}]*)\}/.exec(switchCss)
  assert.ok(block, '缺方形滑块规则')
  assert.match(block[1], /left:\s*3px/)
  assert.match(block[1], /width:\s*calc\(50% - 4px\)/)
  const onRule = /\.mptk-switch--block\.mptk-switch--on \.mptk-switch__thumb\s*\{([^}]*)\}/.exec(switchCss)
  assert.ok(onRule, '缺方形滑块开启态规则')
  assert.match(onRule[1], /translateX\(calc\(100% \+ 2px\)\)/)
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
