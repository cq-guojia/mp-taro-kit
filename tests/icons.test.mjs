// 图标生成器的解析：只喂 CSS 文本，不联网、不落盘。
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseIcons } from '../scripts/lib/icons-parse.mjs'

const FACE = `@font-face {
  font-family: "mptk-icons-base";
  src: url('//at.alicdn.com/x.woff2') format('woff2');
}

.mptk-icons-base {
  font-family: "mptk-icons-base" !important;
  font-size: 16px;
}
`

function cssOf(...rules) {
  return FACE + rules.map((rule) => `\n.${rule[0]}:before {\n  content: "${rule[1]}";\n}\n`).join('')
}

test('parseIcons 解析基础类、前缀与图标名', () => {
  const parsed = parseIcons(cssOf(['mptk-i-home', '\\e61c'], ['mptk-i-logo', '\\e87e']))

  assert.equal(parsed.baseClass, 'mptk-icons-base')
  assert.equal(parsed.prefix, 'mptk-i-')
  assert.deepEqual(
    parsed.icons.map((icon) => icon.name),
    ['home', 'logo'],
  )
  assert.equal(parsed.colored, false)
  assert.deepEqual(parsed.variants, [])
  assert.deepEqual(parsed.paired, [])
})

test('parseIcons 认出彩色项目', () => {
  const colored = cssOf(['mptk-i-logo', '\\e87e']).replace(
    'font-family: "mptk-icons-base";',
    'font-family: "mptk-icons-base";\n  /* Color fonts */',
  )
  assert.equal(parseIcons(colored).colored, true)
})

test('parseIcons 把 -dark 拆成变体：不进图标清单，进变体清单', () => {
  const parsed = parseIcons(cssOf(['mptk-i-logo', '\\e87e'], ['mptk-i-logo-dark', '\\e900']))

  assert.deepEqual(
    parsed.icons.map((icon) => icon.name),
    ['logo'],
  )
  assert.deepEqual(
    parsed.variants.map((icon) => icon.name),
    ['logo-dark'],
  )
  assert.deepEqual(parsed.paired, ['logo'])
})

test('parseIcons 不把没有主名的 -dark 拆成变体', () => {
  const parsed = parseIcons(cssOf(['mptk-i-home', '\\e61c'], ['mptk-i-logo-dark', '\\e900']))

  assert.deepEqual(parsed.variants, [])
  assert.deepEqual(parsed.paired, [])
  assert.deepEqual(
    parsed.icons.map((icon) => icon.name),
    ['home', 'logo-dark'],
  )
})

test('parseIcons 过滤下划线占位图标', () => {
  const parsed = parseIcons(cssOf(['mptk-i-base-color-_', '\\e615']))

  assert.deepEqual(parsed.icons, [])
  assert.deepEqual(parsed.variants, [])
})

test('有变体与没变体混在一起：paired 只含有暗色版的', () => {
  const parsed = parseIcons(
    cssOf(['mptk-i-home', '\\e61c'], ['mptk-i-logo', '\\e87e'], ['mptk-i-logo-dark', '\\e900']),
  )

  assert.deepEqual(
    parsed.icons.map((icon) => icon.name),
    ['home', 'logo'],
  )
  assert.deepEqual(parsed.paired, ['logo'])
  assert.equal(parsed.variants.length, 1)
})
