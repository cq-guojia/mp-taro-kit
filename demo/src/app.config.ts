// Taro 4 按 sourceRoot: 'src' 定位入口配置，根目录的 app.config.ts 不被读取。
// 这里只做转发：页面清单与 window 配置的真源仍是 demo/app.config.ts / demo/src/catalog.ts。
// readConfig 用 esbuild bundle 求值，转发与 catalog 派生都能在编译期展开。
export { default } from '../app.config'
