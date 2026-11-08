// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 源：https://at.alicdn.com/t/c/font_5251349_d8h0vmduuam.css
export const iconBaseClass = 'mptk-icons-base'
export const iconPrefix = 'mptk-i-'

/**
 * 当前图标名 → className。
 * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。
 */
export const iconMap: Readonly<Record<string, string>> = {
  "home": 'mptk-icons-base mptk-i-home',
  "logo": 'mptk-icons-base mptk-i-logo',
  "move-right": 'mptk-icons-base mptk-i-move-right',
  "shaixuan": 'mptk-icons-base mptk-i-shaixuan',
  "xiugai": 'mptk-icons-base mptk-i-xiugai',
  "shanchu": 'mptk-icons-base mptk-i-shanchu',
  "move-left": 'mptk-icons-base mptk-i-move-left',
  "move-down": 'mptk-icons-base mptk-i-move-down',
  "move-up": 'mptk-icons-base mptk-i-move-up',
}

/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。 */
export const iconNames: readonly string[] = ['home', 'logo', 'move-right', 'shaixuan', 'xiugai', 'shanchu', 'move-left', 'move-down', 'move-up']
