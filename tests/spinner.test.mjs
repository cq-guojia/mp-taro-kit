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
  assert.match(read('dist/ui/feedback/spinner/index.d.ts'), /Spinner/)
  const css = read('dist/ui/feedback/spinner/style/index.css')
  assert.match(css, /--mptk-spinner-active/)
  assert.match(css, /--mptk-spinner-track/)
  assert.match(css, /mptk-spinner-rotate/)
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, '自绘转圈不许硬编码色值')
})

test('四处等待态共用同一份自绘几何，不再各画一个转圈', () => {
  for (const file of [
    'dist/ui/feedback/style/index.css',
    'dist/ui/form/switch/style/index.css',
    'dist/ui/form/segmented/style/index.css',
  ]) {
    const css = read(file)
    assert.match(css, /\.mptk-spinner\s*\{/, `${file} 没带进自绘几何`)
    assert.match(css, /mptk-spinner-rotate/, `${file} 没带进旋转关键帧`)
    assert.doesNotMatch(
      css,
      /mptk-fb-loader-rotate|mptk-switch-spin|mptk-seg-spin/,
      `${file} 还留着旧转圈`,
    )
  }
  for (const file of [
    'src/ui/form/switch/Switch.tsx',
    'src/ui/form/segmented/Segmented.tsx',
  ]) {
    assert.match(read(file), /<Spinner\b/, `${file} 没改用共用 Spinner`)
  }
})

test('明暗两套给全转圈双色键，取值各不相同', () => {
  const values = (mode) => {
    const css = read(`dist/styles/${mode}.css`)
    const pick = (key) => new RegExp(`--mptk-spinner-${key}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
    return { active: pick('active'), track: pick('track') }
  }
  const light = values('theme-light')
  const dark = values('theme-dark')
  assert.ok(light.active && light.track, '明色缺转圈双色键')
  assert.ok(dark.active && dark.track, '暗色缺转圈双色键')
  assert.notEqual(light.active, dark.active, '明暗主色必须分开给')
  assert.notEqual(light.track, dark.track, '明暗轨道色必须分开给')
  for (const mode of ['theme-auto', 'theme-runtime']) {
    const css = read(`dist/styles/${mode}.css`)
    assert.match(css, /--mptk-spinner-active:/, `${mode} 缺主色键`)
    assert.match(css, /--mptk-spinner-track:/, `${mode} 缺轨道色键`)
  }
})
