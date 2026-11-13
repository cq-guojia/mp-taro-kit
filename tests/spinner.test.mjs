import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(relative) {
  return readFileSync(path.join(root, relative), 'utf8')
}

function exists(relative) {
  return existsSync(path.join(root, relative))
}

function walk(relative) {
  return readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name)
    return entry.isDirectory() ? walk(next) : [next]
  })
}

const SPINNER_CSS = 'dist/ui/feedback/spinner/style/index.css'

test('库源码里再没有「用图标字体转圈」的调用', () => {
  const sources = walk('src/ui').filter(
    (file) => /\.(ts|tsx)$/.test(file) && !file.includes(`${path.sep}icon${path.sep}`),
  )
  for (const file of sources) {
    assert.doesNotMatch(
      read(file),
      /iconClass\(['"]loading['"]\)|mptk-i-loading/,
      `${file} 还在用 loading 字形`,
    )
  }
  const loader = read('src/ui/feedback/Loader.tsx')
  assert.doesNotMatch(loader, /iconClass|<Text/, 'Loader 不该再有裸字形节点')
  assert.match(loader, /<Spinner\b/, 'Loader 的 ring 必须渲染自绘 Spinner')
  assert.doesNotMatch(read('src/ui/feedback/style/index.scss'), /mptk-i-loading/)
})

test('自绘 Spinner 组件级出口与样式齐全，颜色只吃主题变量', () => {
  for (const file of [
    'dist/ui/feedback/spinner/index.js',
    'dist/ui/feedback/spinner/index.d.ts',
    'dist/ui/feedback/spinner/Spinner.js',
    'dist/ui/feedback/spinner/style/index.css',
  ]) {
    assert.ok(exists(file), `缺 ${file}`)
  }
  assert.match(read('dist/ui/feedback/spinner/index.d.ts'), /SpinnerVariant/, '形态类型要一起导出')
  const css = read(SPINNER_CSS)
  assert.match(css, /--mptk-spinner-active/)
  assert.match(css, /mptk-spinner-rotate/)
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, '自绘转圈不许硬编码色值')
})

test('两种形态都照抄开源实现：circular 走圆锥渐变 + 环形遮罩，chase 六点追逐', () => {
  const css = read(SPINNER_CSS)

  // circular —— TDesign t-loading theme="circular"：父级匀速转，子元素画渐变弧
  assert.match(css, /\.mptk-spinner--circular\s*\{[^}]*animation:\s*mptk-spinner-rotate/)
  assert.match(css, /\.mptk-spinner__ring\s*\{[^}]*conic-gradient/, '圆环用 conic-gradient 画弧')
  assert.match(css, /\.mptk-spinner__ring\s*\{[^}]*border-radius:\s*100%/, '圆环本体必须是正圆')
  assert.match(css, /mask-image:\s*url\(/, 'Skyline 的 mask 只认 url()，必须有环形遮罩')
  assert.match(css, /mask-size:\s*100% 100%/)
  assert.match(css, /stroke-width='17'/, '环宽对齐 TDesign：farthest-corner 下环带约占直径 17%')

  // chase —— SpinKit sk-chase：六根 100% 覆盖层各自错峰，点在 ::before 上
  assert.match(css, /\.mptk-spinner--chase\s*\{[^}]*animation:\s*mptk-spinner-chase/)
  assert.match(
    css,
    /\.mptk-spinner__chase-dot::before\s*\{[^}]*background-color:\s*currentColor/,
    'chase 的点取 currentColor',
  )
  for (const index of [1, 2, 3, 4, 5, 6]) {
    assert.match(css, new RegExp(`nth-child\\(${String(index)}\\)`), `缺第 ${String(index)} 个点的错峰`)
  }
  for (const frame of ['mptk-spinner-chase', 'mptk-spinner-chase-dot', 'mptk-spinner-chase-dot-before']) {
    assert.match(css, new RegExp(`@keyframes ${frame}`), `缺关键帧 ${frame}`)
  }

  const source = read('src/ui/feedback/spinner/Spinner.tsx')
  assert.match(source, /variant = 'circular'/, '默认形态必须是 circular')
  assert.match(source, /const CHASE_DOTS = 6/, 'chase 是六个点')
})

test('不给单边 border 上色，避开 Skyline 让圆角失效的限制', () => {
  const css = read(SPINNER_CSS)
  assert.doesNotMatch(
    css,
    /(?<!-)\bborder\s*:|border-(top|left|right|bottom)-(color|width|style)\s*:/,
    'Skyline 下单边 border 上色会让 border-radius 失效，不许再用 border 画环',
  )
  for (const file of [
    'dist/ui/feedback/style/index.css',
    'dist/ui/form/switch/style/index.css',
  ]) {
    const built = read(file)
    assert.match(built, /\.mptk-spinner__ring\s*\{/, `${file} 的圆环几何没跟上`)
    assert.doesNotMatch(built, /border-top-color/, `${file} 又用了单边边框上色`)
  }
  assert.doesNotMatch(
    read('dist/ui/form/segmented/style/index.css'),
    /\.mptk-spinner/,
    'Segmented 不再盖转圈（改底色呼吸），产物里不该再带圆环几何',
  )
})

test('转圈只留在光板控件里，有内容位的一律改底色呼吸', () => {
  for (const file of [
    'dist/ui/feedback/style/index.css',
    'dist/ui/form/switch/style/index.css',
  ]) {
    const css = read(file)
    assert.match(css, /\.mptk-spinner\s*\{/, `${file} 没带进自绘几何`)
    assert.match(css, /mptk-spinner-(rotate|chase)/, `${file} 没带进旋转关键帧`)
    assert.doesNotMatch(
      css,
      /mptk-fb-loader-rotate|mptk-switch-spin|mptk-seg-spin/,
      `${file} 还留着旧转圈`,
    )
  }

  /* 底色呼吸：一份关键帧（src/ui/form/_busy.scss）给两个控件的等待态，都不加节点。 */
  for (const [file, rule] of [
    ['dist/ui/form/switch/style/index.css', /\.mptk-switch--breathe \.mptk-switch__thumb\s*\{[^}]*mptk-control-breathe/],
    ['dist/ui/form/segmented/style/index.css', /\.mptk-seg--busy \.mptk-seg__thumb[\s\S]{0,80}mptk-control-breathe/],
  ]) {
    const css = read(file)
    assert.match(css, /@keyframes mptk-control-breathe/, `${file} 没带进底色呼吸关键帧`)
    assert.match(css, rule, `${file} 的等待态没挂底色呼吸`)
    assert.doesNotMatch(
      css,
      /mptk-(?:switch--breathe|seg--busy)[^{]*track\s*\{[^}]*mptk-control-breathe/,
      `${file} 不该让整条轨道一起呼吸`,
    )
    assert.match(css, /50%\s*\{\s*opacity:\s*0?\.2/, `${file} 的呼吸谷值不够明显`)
  }

  /* 组件侧：有内容位时不许再把转圈塞进滑块；Segmented 彻底不引转圈。 */
  const switchSrc = read('src/ui/form/switch/Switch.tsx')
  assert.match(switchSrc, /<Spinner\b/, '光板开关仍要用共用 Spinner')
  assert.match(switchSrc, /busy && !hasContent/, '转圈只能在没有内容位时出现')
  assert.match(switchSrc, /busy && hasContent \? 'mptk-switch--breathe'/, '有内容位时要挂呼吸类')
  assert.doesNotMatch(read('src/ui/form/segmented/Segmented.tsx'), /<Spinner\b/, 'Segmented 不该再有转圈')
})

test('两种形态共用一个默认主色，且都能被 color 覆盖', () => {
  assert.match(
    read('dist/ui/feedback/style/index.css'),
    /\.mptk-fb-loader\s*\{[^}]*color:\s*var\(--mptk-spinner-active\)/,
    'blocks 必须吃与圆环同一支默认主色，不许继承页面文字色',
  )
  assert.match(
    read(SPINNER_CSS),
    /\.mptk-spinner\s*\{[^}]*color:\s*var\(--mptk-spinner-active\)/,
    '圆环默认主色',
  )
  const loader = read('src/ui/feedback/Loader.tsx')
  assert.match(loader, /color\?: string/, 'Loader 要暴露 color')
  assert.match(loader, /<Spinner size=\{side\} color=\{color\}/, 'ring 要把 color 交给 Spinner')
  assert.match(loader, /if \(color !== undefined\) box\.color = color/, 'blocks 用内联 color 覆盖')
  assert.match(read('src/ui/feedback/Loading.tsx'), /color=\{color\}/, 'Loading 要透传 color')
})

test('尺寸档跟着字号走：圈径约是字号的 1.6 倍', () => {
  const body = /const SIZE_PX[^=]*=\s*\{([^}]+)\}/.exec(read('src/ui/feedback/Loader.tsx'))?.[1]
  assert.ok(body, '缺 SIZE_PX')
  const fonts = { xs: 12, sm: 14, md: 15, lg: 17, xl: 22 }
  const pairs = [...body.matchAll(/([a-z]+):\s*(\d+)/g)]
  assert.equal(pairs.length, 5, '五档要齐')
  for (const [, key, value] of pairs) {
    const ratio = Number(value) / fonts[key]
    assert.ok(
      ratio >= 1.5 && ratio <= 1.75,
      `${key} 档 ${value}px 对字号 ${String(fonts[key])}px 的比例是 ${ratio.toFixed(2)}，应落在 1.5~1.75`,
    )
  }
})

test('明暗两套给全转圈主色，取值不相同', () => {
  const pick = (mode) => {
    const css = read(`dist/styles/${mode}.css`)
    return /--mptk-spinner-active:\s*([^;]+);/.exec(css)?.[1]?.trim()
  }
  const light = pick('theme-light')
  const dark = pick('theme-dark')
  assert.ok(light, '明色缺转圈主色')
  assert.ok(dark, '暗色缺转圈主色')
  assert.notEqual(light, dark, '明暗主色必须分开给')
  for (const mode of ['theme-auto', 'theme-runtime']) {
    assert.match(read(`dist/styles/${mode}.css`), /--mptk-spinner-active:/, `${mode} 缺主色键`)
  }
})
