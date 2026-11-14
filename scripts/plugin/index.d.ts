/** Taro 4 构建插件的类型声明；运行时由 CJS 入口提供。 */
export interface KitConfigPluginOptions {
  /** 消费方项目根，默认 process.cwd()。 */
  root?: string
  /** 宿主差异文件相对项目根的路径，默认 kit.config.mjs。 */
  config?: string
  /** 生成物输出目录相对项目根的路径，默认 src。 */
  out?: string
}

export default function kitConfigPlugin(
  ctx: unknown,
  options?: KitConfigPluginOptions,
): void
