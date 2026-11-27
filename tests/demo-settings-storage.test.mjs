import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STORAGE_KEY, parseSettings, resolveSettings } from '../demo/src/settings-core.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (file) => readFileSync(join(root, file), 'utf8')

test('设置缓存解析：缺失、脏值、字符串都回落到合法默认', () => {
  const defaults = { themeMode: 'auto', menuScope: 'developed' }
  for (const raw of [undefined, null, 0, '', 'not json', { themeMode: 'vivid', menuScope: 'everything' }]) {
    assert.deepEqual(parseSettings(raw), defaults, `脏缓存 ${String(raw)} 不该带进 UI`)
  }
  assert.deepEqual(parseSettings({ themeMode: 'dark' }), { themeMode: 'dark', menuScope: 'developed' })
  assert.deepEqual(parseSettings({ menuScope: 'all' }), { themeMode: 'auto', menuScope: 'all' })
  assert.deepEqual(
    parseSettings(JSON.stringify({ themeMode: 'light', menuScope: 'all' })),
    { themeMode: 'light', menuScope: 'all' },
  )
  assert.deepEqual(resolveSettings({ themeMode: 'dark', menuScope: 'all' }), { themeMode: 'dark', menuScope: 'all' })
  assert.equal(STORAGE_KEY, 'mptk:demo-settings')
})

test('设置接线：入口读缓存、两处主题开关走同一写入口、首页按范围过滤', () => {
  const entry = read('demo/src/app.tsx')
  assert.match(entry, /initialThemeMode\(\)/, '入口没读持久化主题')
  assert.doesNotMatch(entry, /mode:\s*'auto'/, '入口还在硬编码 auto')

  const settings = read('demo/src/settings.ts')
  assert.match(settings, /Taro\.getStorageSync\(STORAGE_KEY\)/, '读路径没接本地缓存')
  assert.match(settings, /Taro\.setStorageSync\(STORAGE_KEY, next\)/, '写路径没接本地缓存')
  assert.match(settings, /setThemeMode\(mode\)/, '主题写入口没调库 API')

  const home = read('demo/src/pages/index/index.tsx')
  assert.match(home, /useMenuScope\(\)/, '首页没读菜单显示范围')
  assert.match(home, /menuScope === 'all'/, '首页没按显示全部放行 planned')
  assert.match(home, /filter\(\(entry\) => entry\.status === 'ready'\)/, '首页没过滤未开发菜单')
  assert.match(home, /setDemoThemeMode\(next\)/, '首页主题开关没走持久化写入口')

  const panel = read('demo/src/components/DemoSettings.tsx')
  assert.match(panel, /title="菜单显示"/, '设置面板缺菜单显示开关')
  assert.match(panel, /setDemoThemeMode\(next\)/, '设置面板主题开关没走持久化写入口')
  assert.match(panel, /setMenuScope\(next\)/, '设置面板菜单开关没走持久化写入口')
})
