// 旧出口兼容：清单实体在 common.base（跨框架通用基础图标），这里只转发，不跨包 import。
// 新代码一律引 mp-taro-kit/ui/icon/<命名空间>/<库名>；demo 图标不对外。
export * from './common/base/index.js'
