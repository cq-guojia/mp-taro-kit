// Taro 4 的 @tarojs/service 用 resolve.sync(item) 解析插件名，不认 package.json#exports 子路径，
// 也只试 .js / .ts 扩展名，因此这里在包根留一个物理 CJS 入口，转发到构建产物。
// 现代 ESM 消费者走 package.json#exports["./plugin"]，两条路指向同一份实现。
module.exports = require('../dist/plugin/index.cjs')
