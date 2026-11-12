import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

const HUES = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'pink', 'teal']
const TIERS = ['', '-hover', '-active', '-soft']
const MODES = ['theme-light', 'theme-dark', 'theme-auto', 'theme-runtime']

function cssValue(css, key) {
  return new RegExp(`--mptk-${key}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
}

test('基础色板：四份主题产物都有 8 级灰阶与 8 支色相的四档', () => {
  for (const mode of MODES) {
    const css = read(`../dist/styles/${mode}.css`)
    for (let level = 1; level <= 8; level += 1) {
      assert.match(css, new RegExp(`--mptk-gray-${String(level)}:`), `${mode} 缺灰阶 ${String(level)}`)
    }
    for (const hue of HUES) {
      for (const tier of TIERS) {
        assert.match(css, new RegExp(`--mptk-${hue}${tier}:`), `${mode} 缺 ${hue}${tier}`)
      }
    }
    assert.doesNotMatch(css, /color-mix\(/, `${mode} 派生色不许依赖运行时混色`)
  }
})

test('明暗两套颜色键同名同数，新增颜色不许只给一档', () => {
  const source = read('../src/design/_tokens.scss')
  const light = /@mixin light\s*\{([\s\S]*?)\n\}/.exec(source)?.[1] ?? ''
  const dark = /@mixin dark\s*\{([\s\S]*?)\n\}/.exec(source)?.[1] ?? ''
  const keys = (body) => [...body.matchAll(/^\s*--(mptk-[a-z0-9-]+):/gm)].map((hit) => hit[1]).sort()
  assert.ok(keys(light).length > 0, '没解析到 light 颜色键')
  assert.deepEqual(keys(light), keys(dark), 'light 与 dark 的颜色键必须一一对应')
})

test('明色三级面不再一片白，页面底色仍与官方窗口配置一致', () => {
  const light = read('../dist/styles/theme-light.css')
  assert.equal(cssValue(light, 'surface-base'), '#fff', '页面底色不能漂移')
  assert.notEqual(cssValue(light, 'surface-2'), '#fff', '次级面不能还是纯白')
  assert.notEqual(cssValue(light, 'surface-3'), '#fff', '下沉面不能还是纯白')
  assert.equal(cssValue(light, 'control-track'), cssValue(light, 'surface-3'), '滑轨与下沉面同档')
})

test('语义色与控件主色轴引用同一组色板值，不产生第二份真值', () => {
  const light = read('../dist/styles/theme-light.css')
  const pairs = [
    ['business', 'blue'], ['success', 'green'], ['warning', 'orange'], ['danger', 'red'],
    ['control-blue', 'blue'], ['control-green', 'green'],
    ['control-orange', 'orange'], ['control-red', 'red'],
  ]
  for (const [alias, hue] of pairs) {
    assert.equal(cssValue(light, alias), cssValue(light, hue), `${alias} 与 ${hue} 色值漂移`)
  }
})

test('演示站色相清单与 tokens 的色相键一致，色块类名真的引用变量', () => {
  const page = read('../demo/src/pages/design-foundation/index.tsx')
  const listed = /const HUES = \[([^\]]+)\]/.exec(page)?.[1] ?? ''
  assert.deepEqual([...listed.matchAll(/'([a-z]+)'/g)].map((hit) => hit[1]), HUES)
  const app = read('../demo/src/app.scss')
  const declared = /\$demo-hues: ([^;]+);/.exec(app)?.[1] ?? ''
  assert.deepEqual(declared.split(',').map((item) => item.trim()), HUES)
  assert.match(app, /@each \$hue in \$demo-hues/)
  assert.match(app, /@for \$level from 1 through 8/)
  assert.match(app, /var\(--mptk-#\{\$hue\}#\{\$tier\}\)/, '色块必须读 token，不许硬编码色值')
})

test('尺寸标尺逐档吃控件高度 token，档位数值与真源一致', () => {
  const page = read('../demo/src/pages/sizing/index.tsx')
  const app = read('../demo/src/app.scss')
  const light = read('../dist/styles/theme-light.css')
  for (const [tier, px] of [['sm', 32], ['md', 40], ['lg', 48]]) {
    assert.match(
      app,
      new RegExp(`\\.demo-ruler__bar--${tier}\\s*\\{[^}]*height:\\s*var\\(--mptk-control-h-${tier}\\)`),
      `${tier} 标尺没吃对应 token`,
    )
    assert.match(page, new RegExp(`tier: '${tier}', px: ${String(px)}`), `${tier} 展示数值漂移`)
    assert.match(light, new RegExp(`--mptk-control-h-${tier}:\\s*${String(px)}px`))
  }
})

test('设计基础与尺寸各成一页，合并页已删干净', () => {
  for (const id of ['design-foundation', 'sizing']) {
    assert.ok(exists(`../demo/src/pages/${id}/index.tsx`), `缺 ${id} 展示页`)
    assert.ok(exists(`../demo/src/pages/${id}/index.config.ts`), `缺 ${id} 页面配置`)
  }
  assert.equal(exists('../demo/src/pages/foundations/index.tsx'), false, '合并页必须删掉')
  const colors = read('../demo/src/pages/design-foundation/index.tsx')
  const sizing = read('../demo/src/pages/sizing/index.tsx')
  assert.match(colors, /pageId="design-foundation"/)
  assert.doesNotMatch(colors, /demo-ruler|HEIGHT_TIERS/, '设计基础页不许混进尺寸内容')
  assert.match(sizing, /pageId="sizing"/)
  assert.doesNotMatch(sizing, /demo-swatch|const HUES/, '尺寸页不许混进色板内容')
})
