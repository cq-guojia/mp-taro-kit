// 旧出口兼容：实现与清单都在 base 包，这里只转发，不跨包 import。
// 新代码一律引 mp-taro-kit/ui/icon/base；扩展包引各自的 <id> 出口。
export * from './base/index.js'
