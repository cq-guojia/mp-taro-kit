// 全量图标入口与 Icon 组件出口的自检：冒号协议、样式随出口、声明文件干净。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { iconClass, iconNamesByPack, iconPacks } from '../dist/ui/icon/all/index.js'

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('聚合入口覆盖全部对外库，不含演示站自有库', () => {
  assert.deepEqual(Object.keys(iconPacks).sort(), [
    'common.base',
    'common.base.color',
    'common.logo',
    'common.logo.color',
    'mp-taro-kit.base',
    'mp-taro-kit.base.color',
  ])
  assert.deepEqual(Object.keys(iconNamesByPack).sort(), Object.keys(iconPacks).sort())
})

// 不锁具体图标数：平台随时增删，锁数字只会在每次重跑后要求改测试，抓不到真问题。
// 该守的是「清单里的每个名字都能拼出本库的类名」——名字与类名脱节才是真故障。
test('每个库的清单与类名拼装互相对齐', () => {
  for (const [id, names] of Object.entries(iconNamesByPack)) {
    assert.ok(names.length > 0, `${id} 的图标清单不能为空`)
    for (const name of names) {
      assert.ok(
        iconClass(`${id}:${name}`).startsWith(`${iconPacks[id].baseClass} `),
        `${id}:${name} 没拼出类名`,
      )
    }
  }
})

test('库名:图标名 → className；库名不可省，未知库返回空串', () => {
  assert.equal(iconClass('common.base:home'), 'koc-i-common-base koc-i-common-base-home')
  assert.equal(iconClass('common.logo:github'), 'koc-i-common-logo koc-i-common-logo-github')
  assert.equal(iconClass('home'), '')
  assert.equal(iconClass('nope:home'), '')
  assert.equal(iconClass('common.base:'), '')
})

test('Icon 组件出口把全量样式带进包，声明文件不残留样式 import', () => {
  assert.match(read('../dist/ui/display/icon/index.js'), /icon\/all\/style\/index\.css/)
  assert.doesNotMatch(read('../dist/ui/display/icon/index.d.ts'), /\.css/)
  assert.ok(read('../dist/ui/icon/all/style/index.css').includes('@font-face'))
  assert.match(read('../dist/ui/display/icon/Icon.js'), /iconClass/)
})

test('演示站不再手写图标样式或包级 iconClass', () => {
  for (const file of [
    '../demo/src/app.tsx',
    '../demo/src/catalog.ts',
    '../demo/src/pages/icon/index.tsx',
    '../demo/src/pages/display/index.tsx',
    '../demo/src/pages/form/index.tsx',
    '../demo/src/components/DemoNav.tsx',
  ]) {
    const text = read(file)
    assert.doesNotMatch(text, /ui\/icon\/common\/base/, `${file} 仍引旧图标路径`)
    assert.doesNotMatch(text, /\biconClass\(/, `${file} 仍用包级 iconClass`)
  }
})

// 图标尺寸只有一张表：档名 = 字号档名，取值 = 对应的 --mptk-font-*。
// 这条守住两件事：不许再冒出图标专用的像素数字，档位指向的变量必须真的在主题产物里。
test('图标尺寸档就是字号档：档名与 token 一一对应，不留独立像素表', () => {
  const TIERS = ['xs', 'sm', 'md', 'lg', 'xl', 'nav']
  const js = read('../dist/ui/display/icon/Icon.js')

  for (const tier of TIERS) {
    assert.match(
      js,
      new RegExp(`\\b${tier}:\\s*['"]var\\(--mptk-font-${tier}\\)['"]`),
      `Icon 的 ${tier} 档没有指向 var(--mptk-font-${tier})`,
    )
  }
  assert.doesNotMatch(js, /\d+px/, '图标档位不许写固定像素，取值只能来自字号 token')

  const tokens = read('../dist/styles/theme-light.css')
  for (const tier of TIERS) {
    assert.match(tokens, new RegExp(`--mptk-font-${tier}:\\s*\\d+px`), `tokens 缺 --mptk-font-${tier}`)
  }
  assert.match(read('../dist/ui/display/icon/Icon.d.ts'), /IconSize/, 'Icon 的 d.ts 缺 IconSize')
})
