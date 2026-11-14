#!/usr/bin/env node
// 统一配置生成器 CLI：编译链的第一步，消费方不需要手动执行。
//   --lib  库侧：默认表 → _tokens.scss / design/runtime 生成物
//   --host 宿主侧：默认表 ⊕ kit.config.mjs → app-theme.scss / theme.json / 配置数据
//   --check 只比对不写盘；独立重算期望、结构化比对、输入指纹与变异测试一起守。
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  generate, loadConfigFile, readTokensTemplate, mergeConfig, validateConfig,
  resolveAlias, SENTINEL,
} from './lib/kit-config.mjs'

const cliPath = fileURLToPath(import.meta.url)
const cliDir = path.dirname(cliPath)
const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const flagValue = (flag, fallback) => {
  const index = argv.indexOf(flag)
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback
}

const mode = has('--host') ? 'host' : 'lib'
const check = has('--check')
// scripts/gen-kit-config.mjs 在仓库 scripts/ 下；发布后是 dist/config/cli.mjs。
// 两种位置都能定位自己的默认值表：仓库根 kit.config.mjs 或随包发布的 dist/config/defaults.mjs。
const repoRoot = path.resolve(cliDir, '..')
const root = flagValue('--root', mode === 'host' ? process.cwd() : repoRoot)
const outDir = flagValue('--out', 'demo/src')
const defaultsPath = flagValue('--defaults',
  existsSync(path.join(cliDir, 'defaults.mjs'))
    ? path.join(cliDir, 'defaults.mjs')
    : path.join(root, 'kit.config.mjs'))
const hostConfigPath = flagValue('--config', path.join(root, 'kit.config.mjs'))
const corePath = path.join(cliDir, 'lib/kit-config.mjs')

function fail(message) {
  console.error(`[gen:config] ${message}`)
  process.exit(1)
}

/** 输入指纹：配置、生成器核心与 CLI 任一改动都应让 --check 报漂移，防止生成器退化后恒绿。 */
function inputsFingerprint() {
  const hash = createHash('sha256')
  const inputs = [
    ['defaults', defaultsPath],
    ['host', mode === 'host' ? hostConfigPath : ''],
    ['core', corePath],
    ['cli', cliPath],
  ]
  for (const [label, file] of inputs) {
    if (!file) continue
    hash.update(`${label}:${existsSync(file) ? readFileSync(file) : '<absent>'}\n`)
  }
  return hash.digest('hex').slice(0, 12)
}

/** 指纹写进可注释的生成物头；JSON 不能带注释，改用结构化比对守住。 */
function stamp(files, fingerprint) {
  return Object.fromEntries(Object.entries(files).map(([name, text]) => [
    name,
    name.endsWith('.json')
      ? text
      : `// @mptk-inputs:${fingerprint}\n${text.replace(/^\/\/ @mptk-inputs:[0-9a-f]+\r?\n/m, '')}`,
  ]))
}

/** watch 期会反复触发：内容不变就不落盘，避免 mtime 抖动引发无意义的重编译循环。 */
function writeAll(files) {
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative)
    if (existsSync(target) && readFileSync(target, 'utf8') === content) continue
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

/** 不调 renderTokensScss：直接从落盘文件按哨兵抽声明，与配置独立算出的期望比对。 */
function declarationsOf(text, name) {
  const [start, end] = SENTINEL[name]
  const begin = text.indexOf(start)
  const finish = text.indexOf(end)
  if (begin < 0 || finish < 0 || finish < begin) return null
  const body = text.slice(begin + start.length, finish)
  return Object.fromEntries(
    [...body.matchAll(/^\s*([\w-]+):\s*([^;]+);/gm)].map((hit) => [hit[1], hit[2].trim()]),
  )
}

function expectedTokenDeclarations(config) {
  const expand = (group, modeName) => Object.fromEntries(
    Object.entries(group).map(([key, raw]) => [key, String(resolveAlias(raw, config, modeName))]),
  )
  return {
    base: {
      ...expand(config.base, 'light'),
      ...expand(config.component, 'light'),
      ...expand(config.structure, 'light'),
    },
    surface: expand(config.surface, 'light'),
    light: expand(config.light, 'light'),
    dark: expand(config.dark, 'dark'),
  }
}

function expectedThemeJson(config) {
  const pick = (modeName) => Object.fromEntries(
    Object.entries(config.window[modeName]).map(([key, raw]) => [key, resolveAlias(raw, config, modeName)]),
  )
  return { light: pick('light'), dark: pick('dark') }
}

function hostRowKeys(config) {
  const keys = []
  for (const group of ['base', 'light', 'dark', 'component', 'structure']) {
    for (const key of Object.keys(config[group])) keys.push(key)
  }
  for (const [key, value] of Object.entries(config.runtime)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const sub of Object.keys(value)) keys.push(`runtime.${key}.${sub}`)
    } else {
      keys.push(`runtime.${key}`)
    }
  }
  for (const modeName of ['light', 'dark']) {
    for (const key of Object.keys(config.window[modeName])) keys.push(`window.${modeName}.${key}`)
  }
  return keys.sort()
}

/** 独立重算色板生成物应有的类名：light 组每个颜色 token 一条，不调生成器的渲染函数。 */
function expectedSwatchNames(config) {
  return Object.keys(config.light)
    .filter((key) => key.startsWith('--mptk-'))
    .map((key) => key.replace(/^--mptk-/, ''))
    .sort()
}

/** 独立重算页面展示清单：色相 / 档位 / 灰阶只认配置里实际存在的键。 */
function expectedSwatchGroups(config) {
  const hues = Object.keys(config.primitives.light)
    .filter((name) => /^[a-z]+$/.test(name) && name !== 'white' && `--mptk-${name}` in config.light)
  const tiers = ['', '-hover', '-active', '-soft']
    .filter((suffix) => hues.length > 0 && hues.every((hue) => `--mptk-${hue}${suffix}` in config.light))
  const grays = Object.keys(config.light)
    .map((key) => /^--mptk-gray-(\d+)$/.exec(key))
    .filter((hit) => hit !== null)
    .map((hit) => Number(hit[1]))
    .sort((a, b) => a - b)
  return { hues, tiers, grays }
}

/** --check 的结构化比对：与生成器输出路径完全分离，避免「重跑一次再自比」的恒绿。 */
function verifyIndependently(config, rootDir) {
  if (mode === 'lib') {
    const actual = readFileSync(path.join(rootDir, 'src/design/_tokens.scss'), 'utf8')
    const expected = expectedTokenDeclarations(config)
    for (const [name, want] of Object.entries(expected)) {
      const got = declarationsOf(actual, name)
      assert.ok(got, `_tokens.scss 缺 ${name} 哨兵或声明体为空`)
      assert.deepEqual(got, want, `_tokens.scss 的 ${name} 声明与配置独立期望不一致`)
    }
    const design = readFileSync(path.join(rootDir, 'src/design/kit-config.generated.ts'), 'utf8')
    assert.match(design, new RegExp(`CONTROL_SIZE_DEFAULT[^=]*=\\s*${JSON.stringify(config.runtime.controlSizeDefault)}`))
    assert.match(design, new RegExp(`"toastDuration":\\s*${config.runtime.toastDuration}`))
    const runtime = readFileSync(path.join(rootDir, 'src/runtime/kit-config.generated.ts'), 'utf8')
    assert.match(runtime, /export interface KitConfigDefaults/, 'runtime 生成物必须是显式接口，不能退化成 typeof 常量')
    assert.match(runtime, new RegExp(`"timeout":\\s*${config.runtime.core.timeout}`))
    const keyframes = readFileSync(path.join(rootDir, 'src/design/_keyframes.scss'), 'utf8')
    for (const [key, raw] of Object.entries(config.structure)) {
      if (!key.startsWith('--mptk-s-kf-')) continue
      const name = key.replace('--mptk-s-', '')
      assert.ok(
        keyframes.includes(`$mptk-${name}: ${resolveAlias(raw, config, 'light')};`),
        `关键帧 Sass 变量 $mptk-${name} 与配置不一致`,
      )
    }
    return
  }
  const prefix = outDir.replace(/^\/+|\/+$/g, '')
  const theme = JSON.parse(readFileSync(path.join(rootDir, `${prefix}/theme.json`), 'utf8'))
  assert.deepEqual(theme, expectedThemeJson(config), 'theme.json 与配置独立期望不一致')
  const generated = readFileSync(path.join(rootDir, `${prefix}/kit-config.generated.ts`), 'utf8')
  const listed = [...generated.matchAll(/"key":\s*"([^"]+)"/g)].map((hit) => hit[1]).sort()
  assert.deepEqual(listed, hostRowKeys(config), '配置页生成表的可配项集合不全')
  const overrideScss = readFileSync(path.join(rootDir, `${prefix}/app-theme.scss`), 'utf8')
  assert.match(overrideScss, /^page\s*\{/m)
  assert.match(overrideScss, /^\.mptk-dark\s*\{/m)
  assert.match(overrideScss, /^\.mptk-light\s*\{/m)
  assert.doesNotMatch(overrideScss, /background-color/, '宿主覆盖层不得给 page 写死底色')

  const swatchScss = readFileSync(path.join(rootDir, `${prefix}/kit-swatches.generated.scss`), 'utf8')
  const wantNames = expectedSwatchNames(config)
  const listedNames = [...swatchScss.matchAll(/\.demo-swatch--([a-z0-9-]+)\s*\{/g)]
    .map((hit) => hit[1]).sort()
  assert.deepEqual(listedNames, wantNames, '色板生成物的类名集合与配置颜色键不一致')
  assert.match(swatchScss, /@mixin demo-swatches\s*\{/, '色板生成物必须以 mixin 提供，供宿主在原位置 include')
  for (const name of wantNames) {
    assert.ok(
      swatchScss.includes(`background-color: var(--mptk-${name});`),
      `色板生成物 ${name} 没有读对应 token`,
    )
  }
  const groups = expectedSwatchGroups(config)
  assert.ok(groups.hues.length > 0 && groups.tiers.length > 0 && groups.grays.length > 0,
    '配置缺少完整的色相 / 档位 / 灰阶，无法核对生成表')
  const hueConst = /export const KIT_SWATCH_HUES[^=]*=\s*\[([\s\S]*?)\]/.exec(generated)?.[1] ?? ''
  assert.deepEqual([...hueConst.matchAll(/"([^"]+)"/g)].map((hit) => hit[1]), groups.hues,
    '生成表色相清单与配置不一致')
  const grayConst = /export const KIT_SWATCH_GRAYS[^=]*=\s*\[([\s\S]*?)\]/.exec(generated)?.[1] ?? ''
  assert.deepEqual([...grayConst.matchAll(/\d+/g)].map((hit) => Number(hit[0])), groups.grays,
    '生成表灰阶清单与配置不一致')
  for (const suffix of groups.tiers) {
    assert.ok(generated.includes(`"suffix": ${JSON.stringify(suffix)}`),
      `生成表缺档位 ${suffix || '本色'}`)
  }
}

/** 变异测试：改一个键，产物里必须且只能 diff 那一个键。 */
function verifyMutation(defaults, files) {
  const mutated = mode === 'lib'
    ? { base: { '--mptk-radius-md': '13px' } }
    : { window: { light: { bgColor: '#123456' } } }
  const variant = generate(mergeConfig(defaults, mutated), {}, {
    mode,
    outDir,
    tokensTemplate: mode === 'lib' ? readTokensTemplate(root) : '',
  })
  if (mode === 'lib') {
    const before = declarationsOf(files['src/design/_tokens.scss'], 'base')
    const after = declarationsOf(variant.files['src/design/_tokens.scss'], 'base')
    const diff = Object.keys(before).filter((key) => before[key] !== after[key])
    assert.deepEqual(diff, ['--mptk-radius-md'], '改一个配置键却 diff 了别的声明')
    assert.equal(after['--mptk-radius-md'], '13px')
  } else {
    const name = `${outDir.replace(/^\/+|\/+$/g, '')}/theme.json`
    assert.deepEqual(JSON.parse(variant.files[name]), expectedThemeJson(mergeConfig(defaults, mutated)))
    assert.notDeepEqual(variant.files[name], files[name], '改了窗口底色，theme.json 却没变')
  }
  return Object.entries(files).filter(([name, content]) => variant.files[name] !== content).length
}

async function main() {
  if (!existsSync(defaultsPath)) {
    fail(`找不到库默认表 ${defaultsPath}；请确认 mp-taro-kit 已构建（dist/config/defaults.mjs）`)
  }
  const defaults = await loadConfigFile(defaultsPath)
  // 库模式绝不读宿主配置：否则宿主值会经 _tokens.scss 编进 dist，污染所有项目。
  const overrides = mode === 'host' && existsSync(hostConfigPath)
    ? await loadConfigFile(hostConfigPath)
    : {}
  const fingerprint = inputsFingerprint()
  const { files, config } = generate(defaults, overrides, {
    mode,
    outDir,
    tokensTemplate: mode === 'lib' ? readTokensTemplate(root) : '',
  })
  const expected = stamp(files, fingerprint)

  if (check) {
    const drift = []
    for (const [relative, want] of Object.entries(expected)) {
      const target = path.join(root, relative)
      if (!existsSync(target)) {
        drift.push(`${relative} 不存在`)
        continue
      }
      const actual = readFileSync(target, 'utf8')
      if (actual !== want) {
        const ek = createHash('sha256').update(want).digest('hex').slice(0, 8)
        const ak = createHash('sha256').update(actual).digest('hex').slice(0, 8)
        drift.push(`${relative} 与配置不一致（期望 ${ek} / 实际 ${ak}）`)
      }
    }
    if (drift.length > 0) {
      fail(`生成物漂移：\n  - ${drift.join('\n  - ')}\n  修复：pnpm gen:config && pnpm gen:config --host（或重新构建）`)
    }
    try {
      verifyIndependently(config, root)
      const changed = verifyMutation(defaults, files)
      console.log(
        `[gen:config] --check 通过（${mode}，${Object.keys(files).length} 个生成物，` +
        `输入指纹 ${fingerprint}，变异敏感 ${changed} 个）`,
      )
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error))
    }
    return
  }

  writeAll(expected)
  const keys = Object.keys(defaults).filter((key) => key !== 'schemaVersion')
  console.log(
    `[gen:config] ${mode} 模式，已生成 ${Object.keys(files).length} 个产物：` +
    `${Object.keys(files).join(' / ')}；默认表 ${keys.length} 组，差异 ${Object.keys(overrides).length} 组，输入指纹 ${fingerprint}`,
  )
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))

// --check 的「独立期望」不能靠重跑生成器字符串自比：这里额外暴露一次纯函数校验，
// 供 tests/kit-config-chain.test.mjs 用另一套断言路径复核同一份配置。
export { validateConfig }
