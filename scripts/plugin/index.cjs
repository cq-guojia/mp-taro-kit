// Taro 4 构建插件（CJS 真源）：统一配置生成挂在编译链内部，消费方日常零操作。
// 入口须能被 @tarojs/service 的 require(fPath) 直接加载；dist/plugin/index.mjs 由 build 生成包装。
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const PLUGIN_NAME = 'mptk-kit-config'

/** 在消费方项目根生成 app-theme.scss / theme.json / kit-config.generated.ts。 */
module.exports = function kitConfigPlugin(ctx, options) {
  const opts = options && typeof options === 'object' ? options : {}
  const projectRoot = path.resolve(opts.root || process.cwd())
  const configFile = path.resolve(projectRoot, opts.config || 'kit.config.mjs')
  const outDir = opts.out || 'src'
  const cli = path.resolve(__dirname, '..', 'config', 'cli.mjs')
  const defaults = path.resolve(__dirname, '..', 'config', 'defaults.mjs')
  const args = [
    cli, '--host',
    '--root', projectRoot,
    '--config', configFile,
    '--out', outDir,
    '--defaults', defaults,
  ]

  function generate(reason) {
    const result = spawnSync(process.execPath, args, { cwd: projectRoot, encoding: 'utf8' })
    if (result.status !== 0) {
      const detail = result.stderr || result.stdout || result.error?.message || '未知错误'
      throw new Error(`[mp-taro-kit/plugin] ${reason}：统一配置生成失败\n${detail}`)
    }
  }

  // 首次构建、CI 的一次性构建都在这里生成；早于 Sass / TS 读取生成物。
  ctx.onBuildStart(() => generate('onBuildStart'))

  // watch 期间保存 kit.config.mjs 即重算；生成物被 app.scss / app.tsx 引用，写入即触发重编译。
  // 全程同步，避免生成还没落盘就进入模块图。
  ctx.modifyViteConfig(({ viteConfig }) => {
    viteConfig.plugins = viteConfig.plugins || []
    viteConfig.plugins.push({
      name: PLUGIN_NAME,
      buildStart() {
        if (typeof this.addWatchFile === 'function') this.addWatchFile(configFile)
        generate('Vite buildStart')
      },
      watchChange(id) {
        const changed = path.resolve(String(id).split('?')[0])
        if (changed === configFile) generate('kit.config.mjs 变更')
      },
    })
  })
}
