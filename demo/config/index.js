// Taro 4 工程配置。sourceRoot 固定为 src：app.tsx / app.config.ts / pages 都相对它解析。
// 入口配置的真源在根目录 app.config.ts，由 src/app.config.ts 转发给编译器。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const libPkg = JSON.parse(readFileSync(path.resolve(here, '../../package.json'), 'utf8'))

// config/index.js 由 Node 原生 ESM 加载，import ../app.config.ts 会因它无扩展名 import catalog 而解析失败；
// 改读配置文本取 renderer，保持 app.config.ts 为渲染引擎唯一真源；取值失败时首页显示 unknown 而非误报。
const appConfigSource = readFileSync(path.resolve(here, '../app.config.ts'), 'utf8')
const renderer = /\brenderer:\s*['"]([^'"]+)['"]/.exec(appConfigSource)?.[1] ?? 'unknown'
const rendererLabel = renderer === 'skyline' ? 'Skyline' : renderer === 'webview' ? 'WebView' : renderer

// 编译号格式对齐参考项目：YYMMDD-HHMMSS-mmm（如 261109-203707-630）。
// shortcut: 编译号在构建进程启动时生成，watch 热更新不刷号，重启 dev 才换；要每次保存都换需改成 vite 插件逐次注入。
const pad = (value, size = 2) => String(value).padStart(size, '0')
const now = new Date()
const buildId = [
  `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
  pad(now.getMilliseconds(), 3),
].join('-')

export default {
  projectName: 'mp-taro-kit-demo',
  // 一次性接入：统一配置生成器挂在编译链里，之后只改项目根 kit.config.mjs。
  plugins: ['mp-taro-kit/plugin'],
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'vite',
  defineConstants: {
    __MTPK_VERSION__: JSON.stringify(libPkg.version),
    __MTPK_BUILD_ID__: JSON.stringify(buildId),
    __MTPK_RENDERER__: JSON.stringify(rendererLabel),
  },
  copy: {
    patterns: [],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
}
