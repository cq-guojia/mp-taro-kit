// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 包：base-color
// 源：https://at.alicdn.com/t/c/font_5252363_pclbus5fo1.css
export const iconBaseClass = 'mptk-icons-base-color'
export const iconPrefix = 'mptk-i-base-color-'

/**
 * 当前图标名 → className。
 * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。
 */
export const iconMap: Readonly<Record<string, string>> = {
}

/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。 */
export const iconNames: readonly string[] = []

/**
 * 本包字形是否带颜色（COLR/CPAL）：true 时 color 与明暗主题都改不动它。
 * 由平台项目类型决定、整包一致，调用方据此决定要不要费劲上色，不要逐图标猜。
 */
export const iconColored = true
