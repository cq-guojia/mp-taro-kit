// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 包：common.base.color
// 源：https://at.alicdn.com/t/c/font_5252972_tyb3966r1rh.css
export const iconBaseClass = 'koc-i-common-base-c'
export const iconPrefix = 'koc-i-common-base-c-'

/**
 * 当前图标名 → className。
 * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。
 */
export const iconMap: Readonly<Record<string, string>> = {
  "_": 'koc-i-common-base-c koc-i-common-base-c-_',
}

/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。变体（-dark）不在其中。 */
export const iconNames: readonly string[] = ['_']

/**
 * 本包字形是否带颜色（COLR/CPAL）：true 时 color 与明暗主题都改不动它。
 * 由平台项目类型决定、整包一致，调用方据此决定要不要费劲上色，不要逐图标猜。
 */
export const iconColored = true

/** 有暗色版的主轴图标名；用 iconClass(`<名>-dark`) 取对应类名，选哪个由调用处决定。 */
export const iconPaired: readonly string[] = []
