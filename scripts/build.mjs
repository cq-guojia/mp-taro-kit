import { spawnSync } from 'node:child_process'
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'
import * as sass from 'sass'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'src')
const distDir = path.join(root, 'dist')

async function walk(dir) {
  const found = []
  if (!existsSync(dir)) return found
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await walk(full)))
    else found.push(full)
  }
  return found
}

function fail(...lines) {
  for (const line of lines) console.error(`[build] ${line}`)
  process.exit(1)
}

function write(target, text) {
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, text)
}

function emit(options, fileNames) {
  const program = ts.createProgram(fileNames, options)
  const outputs = []
  const result = program.emit(undefined, (fileName, text) => outputs.push({ fileName, text }))
  const errors = [...ts.getPreEmitDiagnostics(program), ...result.diagnostics]
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
  if (errors.length > 0) {
    for (const error of errors) {
      const where = error.file
        ? `${path.relative(root, error.file.fileName)}:${error.start ?? 0}`
        : 'tsconfig.json'
      fail(`${where} ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
    }
    fail(`${errors.length} 个 TypeScript 错误，构建中止`)
  }
  return outputs
}

const configPath = path.join(root, 'tsconfig.json')
const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
if (configFile.error) fail(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
if (parsed.errors.length > 0) {
  for (const error of parsed.errors) {
    fail(ts.flattenDiagnosticMessageText(error.messageText, '\n'))
  }
}
const fileNames = parsed.fileNames
const base = {
  ...parsed.options,
  rootDir: srcDir,
  outDir: distDir,
  noEmitOnError: false,
}

// 编译链第一步：配置真源 → _tokens.scss / *.generated.ts，必须早于 TS emit 与 Sass 编译。
// 只跑 --lib，绝不读宿主差异，否则 demo 的值会被编进对外发布的 dist。
const gen = spawnSync(process.execPath, [path.join(root, 'scripts/gen-kit-config.mjs'), '--lib'], {
  cwd: root,
  encoding: 'utf8',
})
if (gen.status !== 0) fail(`gen:config --lib 失败：${gen.stderr || gen.stdout || '未知错误'}`)

// 本仓库的 demo 也是一个消费方：同步生成它的差异产物，保证库构建后全仓产物与配置一致。
// 这一步只写 demo/src，不参与 dist，宿主值不会污染发布包。
const genHost = spawnSync(process.execPath, [
  path.join(root, 'scripts/gen-kit-config.mjs'), '--host',
  '--config', 'demo/kit.config.mjs', '--out', 'demo/src',
], { cwd: root, encoding: 'utf8' })
if (genHost.status !== 0) fail(`gen:config --host 失败：${genHost.stderr || genHost.stdout || '未知错误'}`)

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

for (const { fileName, text } of emit({
  ...base,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  declaration: true,
}, fileNames)) {
  // 声明文件里的样式副作用 import 对类型无用，消费端 TS 也不认识 .css，写入前剥掉。
  write(
    fileName,
    fileName.endsWith('.d.ts')
      ? text.replace(/^import\s+['"][^'"]+\.(css|scss)['"];?\s*$/gm, '')
      : text,
  )
}

for (const { fileName, text } of emit({
  ...base,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  declaration: false,
}, fileNames)) {
  if (!fileName.endsWith('.js')) continue
  const rewritten = text.replace(
    /(\brequire\(\s*['"])(\.[^'"]*?)\.js(['"]\s*\))/g,
    (_, head, specifier, tail) => `${head}${specifier}.cjs${tail}`,
  )
  write(`${fileName.slice(0, -3)}.cjs`, rewritten)
}

const files = await walk(srcDir)
for (const file of files.filter((entry) => entry.endsWith('.css'))) {
  const target = path.join(distDir, path.relative(srcDir, file))
  await mkdir(path.dirname(target), { recursive: true })
  await cp(file, target)
}
for (const file of files.filter((entry) => entry.endsWith('.scss'))) {
  const name = path.basename(file)
  // partial 只被 @use，design/theme-*.scss 单独编译到 styles/，都不走通用映射。
  if (name.startsWith('_') || name.startsWith('theme-')) continue
  const result = sass.compile(file, { style: 'expanded', loadPaths: [srcDir] })
  const target = path.join(distDir, path.relative(srcDir, file).replace(/\.scss$/, '.css'))
  write(target, result.css)
}

// 主题出口：唯一真源是 design/_tokens.scss 里的 base / light / dark 三个 mixin。
// 扫描 design/theme-*.scss，新增一个主题文件就自动多一份产物，不再维护模式清单。
// 编译期三选一（light / dark / auto）与运行时热切换（runtime）都走这里。
const stylesDir = path.join(distDir, 'styles')
await mkdir(stylesDir, { recursive: true })
const designDir = path.join(srcDir, 'design')
const themeSources = files
  .filter((file) => path.dirname(file) === designDir)
  .filter((file) => path.basename(file).startsWith('theme-') && file.endsWith('.scss'))
  .sort()
for (const source of themeSources) {
  const result = sass.compile(source, { style: 'expanded', loadPaths: [srcDir] })
  writeFileSync(path.join(stylesDir, path.basename(source).replace(/\.scss$/, '.css')), result.css)
}
await cp(path.join(stylesDir, 'theme-light.css'), path.join(stylesDir, 'tokens.css'))

// 发布生成器：CLI 与它的纯函数依赖、库默认表都要进包，否则消费方侧 ERR_MODULE_NOT_FOUND。
// cli.mjs 用 './lib/kit-config.mjs' 相对定位，复制时保持这一层目录结构。
const configOut = path.join(distDir, 'config')
await mkdir(path.join(configOut, 'lib'), { recursive: true })
await cp(path.join(root, 'scripts/gen-kit-config.mjs'), path.join(configOut, 'cli.mjs'))
await cp(path.join(root, 'scripts/lib/kit-config.mjs'), path.join(configOut, 'lib/kit-config.mjs'))
await cp(path.join(root, 'kit.config.mjs'), path.join(configOut, 'defaults.mjs'))

// Taro 插件：CJS 是唯一真源（@tarojs/service 用 require 加载），ESM 只是同步包装。
const pluginOut = path.join(distDir, 'plugin')
await mkdir(pluginOut, { recursive: true })
await cp(path.join(root, 'scripts/plugin/index.cjs'), path.join(pluginOut, 'index.cjs'))
await cp(path.join(root, 'scripts/plugin/index.d.ts'), path.join(pluginOut, 'index.d.ts'))
write(path.join(pluginOut, 'index.mjs'), "import plugin from './index.cjs'\nexport default plugin\n")

let artifacts = 0
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await collect(full)
    else if (/\.(js|cjs|d\.ts|css)$/.test(entry.name)) artifacts += 1
  }
}
await collect(distDir)
console.log(`[build] dist/ 产物 ${artifacts} 个`)
