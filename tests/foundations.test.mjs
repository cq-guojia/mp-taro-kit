import test from 'node:test'
import assert from 'node:assert/strict'
import { tokensOf } from './helpers/kit-config.mjs'
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
const config = (await import(new URL('../kit.config.mjs', import.meta.url))).default

function cssValue(css, key) {
  return new RegExp(`--mptk-${key}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
}

/** #fff 与 #ffffff 视为同色。 */
function hex(value) {
  const raw = value.trim().toLowerCase()
  return /^#[0-9a-f]{3}$/.test(raw)
    ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    : raw
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

test('明色三级面都不纯白，页面底色与官方窗口配置一致', () => {
  const light = read('../dist/styles/theme-light.css')
  assert.equal(cssValue(light, 'surface-base'), '#f2f3f5', '页面底色是浅灰，不是纯白')
  assert.notEqual(cssValue(light, 'surface-2'), '#fff', '次级面不能还是纯白')
  assert.notEqual(cssValue(light, 'surface-3'), '#fff', '下沉面不能还是纯白')
  assert.notEqual(cssValue(light, 'surface-2'), cssValue(light, 'surface-base'), '次级面不能与页面底色同档')
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

test('演示站色板清单由配置生成，Sass 与页面都不再各写一份', () => {
  const page = read('../demo/src/pages/design-foundation/index.tsx')
  const generated = read('../demo/src/kit-config.generated.ts')
  const swatches = read('../demo/src/kit-swatches.generated.scss')
  const app = read('../demo/src/app.scss')

  assert.match(page, /from '\.\.\/\.\.\/kit-config\.generated'/, '设计基础页必须读生成表')
  assert.doesNotMatch(page, /const (HUES|TIERS|GRAYS) = \[/, '设计基础页不许再写死色板清单')
  assert.doesNotMatch(app, /\$demo-hues|\$demo-tiers|\$demo-token-swatches/, 'app.scss 不许再写死色板清单')
  assert.match(app, /@use '\.\/kit-swatches\.generated' as sw/, 'app.scss 必须引用色板生成物')
  assert.match(app, /@include sw\.demo-swatches/, 'app.scss 必须 include 色板 mixin')

  const wantNames = Object.keys(config.light)
    .filter((key) => key.startsWith('--mptk-'))
    .map((key) => key.replace(/^--mptk-/, ''))
    .sort()
  const gotNames = [...swatches.matchAll(/\.demo-swatch--([a-z0-9-]+)\s*\{/g)]
    .map((hit) => hit[1]).sort()
  assert.deepEqual(gotNames, wantNames, '色板生成物的类名集合与配置颜色键不一致')
  for (const name of wantNames) {
    assert.match(swatches, new RegExp(`background-color:\\s*var\\(--mptk-${name}\\);`),
      `${name} 色块没读对应 token，或写了硬编码色值`)
  }

  const hueConst = /export const KIT_SWATCH_HUES[^=]*=\s*\[([\s\S]*?)\]/.exec(generated)?.[1] ?? ''
  assert.deepEqual([...hueConst.matchAll(/"([^"]+)"/g)].map((hit) => hit[1]), HUES,
    '生成表色相清单与期望不一致')
  const grayConst = /export const KIT_SWATCH_GRAYS[^=]*=\s*\[([\s\S]*?)\]/.exec(generated)?.[1] ?? ''
  assert.deepEqual([...grayConst.matchAll(/\d+/g)].map((hit) => Number(hit[0])), [1, 2, 3, 4, 5, 6, 7, 8],
    '生成表灰阶清单与期望不一致')
  for (const tier of TIERS) {
    assert.ok(generated.includes(`"suffix": ${JSON.stringify(tier)}`), `生成表缺档位 ${tier || '本色'}`)
  }
})

test('尺寸标尺逐档吃控件高度 token，档位数值与真源一致', () => {
  const page = read('../demo/src/pages/sizing/index.tsx')
  const app = read('../demo/src/app.scss')
  const light = read('../dist/styles/theme-light.css')
  const generated = read('../demo/src/kit-config.generated.ts')
  const tokens = tokensOf()
  assert.match(page, /from '\.\.\/\.\.\/kit-config\.generated'/, '尺寸页必须读生成表，不许写死档位数值')
  for (const tier of ['sm', 'md', 'lg']) {
    const key = `--mptk-control-h-${tier}`
    const px = tokens[key]
    assert.match(
      app,
      new RegExp(`\\.demo-ruler__bar--${tier}\\s*\\{[^}]*height:\\s*var\\(${key}\\)`),
      `${tier} 标尺没吃对应 token`,
    )
    assert.match(light, new RegExp(`${key}:\\s*${px}`))
    const row = new RegExp(`"key": "${key}",[\\s\\S]*?"value": "([^"]*)"`).exec(generated)
    assert.equal(row?.[1], px, `${tier} 生成表里的展示值漂移`)
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

test('站点主题配置：独立成文件、明暗两套、由 app.scss 引入', () => {
  assert.ok(exists('../demo/src/app-theme.scss'), '站点必须有可覆盖的配置文件')
  const theme = read('../demo/src/app-theme.scss')
  assert.match(theme, /^page\s*\{/m, '明色覆盖落 page')
  assert.match(theme, /^\.mptk-dark\s*\{/m, '暗色覆盖落 .mptk-dark')
  assert.match(theme, /--mptk-surface-base/, '背景是可覆盖项，必须列出来')
  assert.match(read('../demo/src/app.scss'), /@use '\.\/app-theme'/, 'app.scss 必须引入站点配置')
})

test('主题配置页：色值、默认值与标准色相名都和真源一致', () => {
  const page = read('../demo/src/pages/theme-config/index.tsx')
  for (const title of ['基础配置', '颜色配置', '其他控件配置']) {
    assert.match(page, new RegExp(`title="${title}"`), `缺分类卡片：${title}`)
  }
  assert.match(page, /from 'mp-taro-kit\/ui\/card'/, '圆角块用 Card，不手搓')
  assert.match(page, /from 'mp-taro-kit\/ui\/display\/cell'/, '列表用现成的 Cell，不手搓')
  assert.match(page, /mptk-\$\{[^}]*mode[^}]*\}/, '必须展示明暗两条色块')
  assert.match(page, /CONTROL_SIZE_DEFAULT/, '默认尺寸取常量，不硬编码')
  for (const hue of ['blue', 'green', 'orange', 'red']) {
    assert.match(page, new RegExp(`lightName: '${hue}'`), `语义色没标出标准色相名：${hue}`)
  }

  /* 页面只读生成表；生成表里的色值必须与编译产物同值，改配置时这里会先红。 */
  assert.match(page, /from '\.\.\/\.\.\/kit-config\.generated'/, '主题配置页必须读生成表，不许复制色值')
  const light = read('../dist/styles/theme-light.css')
  const dark = read('../dist/styles/theme-dark.css')
  const generated = read('../demo/src/kit-config.generated.ts')
  const listed = [...generated.matchAll(/"value":\s*"([^"]+)"/g)].map((hit) => hex(hit[1]))
  for (const key of ['surface-base', 'surface-1', 'surface-2', 'surface-3', 'fg', 'fg-2', 'fg-3', 'business', 'success', 'warning', 'danger']) {
    assert.ok(listed.includes(hex(cssValue(light, key))), `生成表缺 ${key} 的明色值`)
    assert.ok(listed.includes(hex(cssValue(dark, key))), `生成表缺 ${key} 的暗色值`)
  }
  assert.match(read('../dist/styles/theme-runtime.css'), /\.mptk-light\s*\{/, '局部反色能力由主题产物提供')
})

test('控件默认尺寸只有一处定义，三个控件都引用它', () => {
  const design = read('../src/design/index.ts')
  const generated = read('../src/design/kit-config.generated.ts')
  // 期望取自配置真源，不再把 'md' 写死在测试里：改默认档时测试跟着配置走。
  const tier = /["']?controlSizeDefault["']?\s*:\s*["'](sm|md|lg)["']/.exec(read('../kit.config.mjs'))?.[1]
  assert.ok(tier, '配置真源缺 runtime.controlSizeDefault')
  assert.match(generated, new RegExp(`CONTROL_SIZE_DEFAULT[^=]*=\\s*"${tier}"`), '生成物没写对默认档')
  assert.match(design, /export \{[^}]*CONTROL_SIZE_DEFAULT[^}]*\} from '\.\/kit-config\.generated\.js'/, 'design 层只转发生成物')
  assert.doesNotMatch(design, /export const CONTROL_SIZE_DEFAULT\s*=/, 'design 层不许再写第二份默认值')
  for (const file of ['../src/ui/actions/Button.tsx', '../src/ui/form/switch/Switch.tsx', '../src/ui/form/segmented/Segmented.tsx']) {
    const source = read(file)
    assert.match(source, /size = CONTROL_SIZE_DEFAULT/, `${file} 没引用默认档常量`)
    assert.doesNotMatch(source, /size = 'lg'/, `${file} 还在各写一次默认档`)
  }
})
