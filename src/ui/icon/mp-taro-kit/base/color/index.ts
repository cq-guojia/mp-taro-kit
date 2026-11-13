// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 包：mp-taro-kit.base.color；需要别的包的图标时引那个包自己的出口，不要跨包 import。
import { iconBaseClass, iconMap, iconPrefix } from './names.js'

export { iconBaseClass, iconPrefix, iconMap, iconNames, iconColored, iconPaired } from './names.js'

/** 取本包图标对应的 className。图标名不做字面量联合，平台增删图标不算类型破坏。 */
export function iconClass(name: string): string {
  return iconMap[name] ?? `${iconBaseClass} ${iconPrefix}${name}`
}
