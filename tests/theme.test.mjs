import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import * as runtime from '../dist/runtime/index.js'

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

function exists(relative) {
  return existsSync(new URL(relative, import.meta.url))
}

function cssValue(css, key) {
  return new RegExp(`--mptk-${key}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
}

/** 十六进制颜色按语义比较：#fff 与 #ffffff 是同一色，不算真源漂移。 */
function hex(value) {
  const raw = value.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
  }
  return raw
}

test('运行时主题出口：三选一原样保留，第四份只覆盖颜色键', () => {
  const css = read('../dist/styles/theme-runtime.css')
  assert.match(css, /page\s*\{/, 'page 仍是变量根')
  assert.match(css, /--mptk-radius-md:\s*12px/, '基线仍由 page 提供')
  assert.match(css, /--mptk-surface-base:\s*#f2f3f5/, 'page 默认明色')
  assert.match(css, /\.mptk-dark\s*\{/, '必须有运行时根标记')
  assert.match(css, /--mptk-fg:\s*#e6e8eb/, '根标记提供暗色值')
  assert.doesNotMatch(css, /prefers-color-scheme/, '运行时模式不靠媒体查询双轨判定')

  const darkRule = css.match(/\.mptk-dark\s*\{([^}]*)\}/)
  assert.ok(darkRule, '找不到 .mptk-dark 规则')
  assert.doesNotMatch(
    darkRule[1],
    /--mptk-radius-|--mptk-font-|--mptk-space-|--mptk-line-/,
    '根标记只覆盖颜色键，不重写 26 个基线变量',
  )

  const lightRule = css.match(/\.mptk-light\s*\{([^}]*)\}/)
  assert.ok(lightRule, '必须有局部明色标记')
  assert.doesNotMatch(
    lightRule[1],
    /--mptk-radius-|--mptk-font-|--mptk-space-|--mptk-line-/,
    '局部明色同样只覆盖颜色键',
  )

  const pkg = JSON.parse(read('../package.json'))
  assert.equal(pkg.exports['./styles/theme-runtime'], './dist/styles/theme-runtime.css')
  for (const name of ['theme-light', 'theme-dark', 'theme-auto']) {
    assert.ok(exists(`../dist/styles/${name}.css`), `${name} 必须仍在生产物里`)
  }
})

test('页面底色真源分层：编译期出口由 WXSS 画，运行时出口交给官方窗口配置', () => {
  for (const name of ['theme-light', 'theme-dark', 'theme-auto']) {
    const page = read(`../dist/styles/${name}.css`).match(/page\s*\{([^}]*)\}/)
    assert.ok(page, `${name} 缺 page 规则`)
    assert.match(page[1], /background-color:\s*var\(--mptk-surface-base\)/, `${name} 必须自己画页面底色`)
  }
  const runtime = read('../dist/styles/theme-runtime.css').match(/page\s*\{([^}]*)\}/)
  assert.ok(runtime, 'theme-runtime 缺 page 规则')
  assert.doesNotMatch(runtime[1], /background-color/, '运行时出口不得把页面底色写死在 page 上')

  /* 底色可能由 SCSS 变量插值而来，源文件里取不到具体色值，改读编译产物。 */
  const lightBase = cssValue(read('../dist/styles/theme-light.css'), 'surface-base')
  const darkBase = cssValue(read('../dist/styles/theme-dark.css'), 'surface-base')
  assert.ok(lightBase && darkBase, '取不到令牌的明暗底色')
  const theme = JSON.parse(read('../demo/src/theme.json'))
  assert.equal(hex(theme.light.bgColor), hex(lightBase), 'theme.json 明色档必须与令牌一致')
  assert.equal(hex(theme.dark.bgColor), hex(darkBase), 'theme.json 暗色档必须与令牌一致')

  const config = read('../demo/app.config.ts')
  assert.match(config, /themeLocation:\s*'theme\.json'/, '必须声明官方变量配置文件')
  for (const field of ['backgroundColor', 'backgroundColorTop', 'backgroundColorBottom', 'navigationBarBackgroundColor']) {
    assert.match(config, new RegExp(`${field}:\\s*'@`), `${field} 必须引用 theme.json 变量`)
  }
})

test('主题构建链自动发现 theme-*.scss，不维护模式清单', () => {
  const build = read('../scripts/build.mjs')
  assert.doesNotMatch(build, /\['light', 'dark', 'auto'\]/, '不应再有写死的模式数组')
  assert.match(build, /startsWith\('theme-'\)/, '必须按文件名自动发现主题入口')
  const check = read('../scripts/check.mjs')
  assert.match(check, /主题出口自动校验|themeSources/, '自检必须逐条核对主题出口与产物')
})

test('主题状态：三种模式、热切换、跟随系统与窗口副作用', () => {
  runtime.resetThemeForTests()
  assert.deepEqual(runtime.getThemeSnapshot(), { mode: 'auto', systemDark: false, dark: false })

  const listeners = []
  const changes = []
  runtime.setThemeMode('auto', {
    systemDark: () => true,
    onSystemDarkChange: (notify) => {
      listeners.push(notify)
      return () => {}
    },
    onDarkChange: (dark) => changes.push(dark),
  })
  assert.equal(runtime.getThemeSnapshot().dark, true, 'auto 必须跟随 systemDark')
  assert.equal(listeners.length, 1, '系统主题监听只注册一次')
  assert.deepEqual(changes, [true], '首次配置即同步原生窗口底色')

  runtime.setThemeMode('light')
  assert.equal(runtime.getThemeSnapshot().dark, false, '强制明覆盖系统暗色')
  assert.equal(changes.at(-1), false, '窗口底色跟着热切换')

  runtime.setThemeMode('dark')
  assert.equal(runtime.getThemeSnapshot().dark, true, '强制暗覆盖系统')
  assert.equal(changes.at(-1), true)

  runtime.setThemeMode('auto')
  assert.equal(runtime.getThemeSnapshot().dark, true, '切回 auto 立即跟随系统')
  runtime.setSystemDark(false)
  assert.equal(runtime.getThemeSnapshot().dark, false, '系统主题变化触发热切换')
  assert.equal(changes.at(-1), false)

  assert.throws(() => runtime.setThemeMode('night'), /非法主题模式/, '非法模式必须抛错')
  runtime.resetThemeForTests()
})

test('主题状态订阅：变更通知、退订后不再通知', () => {
  runtime.resetThemeForTests()
  const store = runtime.themeState()
  let calls = 0
  const off = store.subscribe(() => { calls += 1 })
  store.setMode('dark')
  assert.equal(calls, 1)
  off()
  store.setMode('light')
  assert.equal(calls, 1, '退订后不得继续通知')
  runtime.resetThemeForTests()
})
