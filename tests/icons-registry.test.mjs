// 图标库注册表的纯函数自检：路径映射与生成期校验都能离线验证，不联网、不落盘。
import assert from 'node:assert/strict'
import test from 'node:test'
import { SOURCES } from '../scripts/icons.sources.mjs'
import {
  exportPathOf,
  isColorId,
  pathOf,
  validateParsed,
  validateRegistry,
} from '../scripts/lib/icons-pack.mjs'
import { parseIcons } from '../scripts/lib/icons-parse.mjs'

const PACK = {
  id: 'common.base',
  source: 'https://at.alicdn.com/t/c/font_5252971_ku04967wvmq.css',
  visibility: 'public',
}

const parsed = (overrides = {}) => ({
  baseClass: 'koc-i-common-base',
  fontFamily: 'koc-i-common-base',
  prefix: 'koc-i-common-base-',
  icons: [],
  variants: [],
  paired: [],
  colored: false,
  ...overrides,
})

test('注册表当前八条记录自洽，public / demo 边界清楚', () => {
  assert.equal(SOURCES.length, 8)
  assert.equal(validateRegistry(SOURCES), SOURCES)
  assert.equal(SOURCES.filter((pack) => pack.visibility === 'public').length, 6)
  assert.equal(SOURCES.filter((pack) => pack.visibility === 'demo').length, 2)
  assert.equal(SOURCES.filter((pack) => isColorId(pack.id)).length, 4)
})

test('id 点号直接映射源码目录与 exports 路径', () => {
  assert.equal(pathOf(PACK), 'src/ui/icon/common/base')
  assert.equal(exportPathOf(PACK), 'ui/icon/common/base')
  assert.equal(
    pathOf({ id: 'common.base.color', visibility: 'public' }),
    'src/ui/icon/common/base/color',
  )
  assert.equal(
    exportPathOf({ id: 'common.base.color', visibility: 'public' }),
    'ui/icon/common/base/color',
  )
  assert.equal(
    pathOf({ id: 'mp-taro-kit.demo.color', visibility: 'demo' }),
    'demo/src/icons/mp-taro-kit/demo/color',
  )
})

test('注册表拒绝非法 id、重复 id、错误可见性与错误链接', () => {
  assert.throws(() => validateRegistry([{ ...PACK, id: 'base' }]), /非法 id/)
  assert.throws(() => validateRegistry([PACK, { ...PACK }]), /重复 id/)
  assert.throws(() => validateRegistry([{ ...PACK, visibility: 'private' }]), /visibility/)
  assert.throws(
    () => validateRegistry([{ ...PACK, source: 'https://example.com/a.css' }]),
    /source/,
  )
  assert.throws(
    () => validateRegistry([{ ...PACK, id: 'common.base.social' }]),
    /第三段只允许 color/,
  )
})

test('彩色标记与 id 的 .color 尾段必须互相印证', () => {
  assert.equal(validateParsed(PACK, parsed()), undefined)
  assert.throws(
    () => validateParsed({ ...PACK, id: 'common.base.color' }, parsed()),
    /彩色标记不符/,
  )
  assert.throws(
    () => validateParsed(PACK, parsed({ colored: true })),
    /彩色标记不符/,
  )
})

test('基础类、图标前缀与 @font-face 字体族三者一致才允许写出', () => {
  assert.throws(
    () => validateParsed(PACK, parsed({ prefix: 'mptk-i-' })),
    /图标类前缀/,
  )
  assert.throws(
    () => validateParsed(PACK, parsed({ fontFamily: 'mptk-icons-base' })),
    /font-family/,
  )
})

test('真实 CSS 解析出的 fontFamily 参与交叉校验', () => {
  const css = String.raw`@font-face { font-family: "koc-i-common-base"; src: url('//x.woff2'); }
.koc-i-common-base { font-family: "koc-i-common-base" !important; }
.koc-i-common-base-home:before { content: "\e61c"; }
`
  const result = parseIcons(css)
  assert.equal(result.fontFamily, 'koc-i-common-base')
  assert.equal(validateParsed(PACK, result), undefined)
})
