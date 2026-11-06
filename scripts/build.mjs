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

await rm(distDir, { recursive: true, force: true })
await mkdir(distDir, { recursive: true })

for (const { fileName, text } of emit({
  ...base,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  declaration: true,
}, fileNames)) {
  write(fileName, text)
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
  const result = sass.compile(file, { style: 'expanded', loadPaths: [srcDir] })
  const target = path.join(distDir, path.relative(srcDir, file).replace(/\.scss$/, '.css'))
  write(target, result.css)
}

const tokens = path.join(srcDir, 'design', 'tokens.css')
if (existsSync(tokens)) {
  const target = path.join(distDir, 'styles', 'tokens.css')
  await mkdir(path.dirname(target), { recursive: true })
  await cp(tokens, target)
}

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
