/** 控件内置主色；具体色值与明暗档写在 src/design/_tokens.scss，组件不硬编码。 */
export const CONTROL_COLORS = ['blue', 'green', 'orange', 'red'] as const

export type BuiltinControlColor = (typeof CONTROL_COLORS)[number]

/** 内置色名，或任意 CSS 色值（#rrggbb / rgb() / var() 等）。 */
export type ControlColor = BuiltinControlColor | (string & {})

export interface ControlColorParts {
  /** 内置色走类名切变量，不依赖 WXML 行内自定义属性支持。 */
  className: string
  /** 自定义色值走显式内联样式，直接覆盖需要上色的元素。 */
  inlineColor: string | undefined
}

/** 把 color 拆成「类名」或「显式色值」两条路，两个控件共用一份判断。 */
export function resolveControlColor(prefix: string, color?: ControlColor): ControlColorParts {
  if (color === undefined) return { className: '', inlineColor: undefined }
  if ((CONTROL_COLORS as readonly string[]).includes(color)) {
    return { className: `${prefix}--${color}`, inlineColor: undefined }
  }
  return { className: '', inlineColor: color }
}
