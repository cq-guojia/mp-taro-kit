// 图标域没有组件，出口只有清单与拼类名的辅助函数；字体样式走 ./ui/icon/style。
import { iconBaseClass, iconMap, iconPrefix } from './names.js'

export { iconBaseClass, iconPrefix, iconMap, iconNames } from './names.js'

/**
 * 取图标对应的 className。图标名直接用平台里的名字，不在类型上做约束：
 * 平台随时会增删图标，把名字写成字面量联合会让这类改动变成类型破坏。
 */
export function iconClass(name: string): string {
  return iconMap[name] ?? `${iconBaseClass} ${iconPrefix}${name}`
}
