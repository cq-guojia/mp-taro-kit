// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 包：base
// 源：https://at.alicdn.com/t/c/font_5251349_v0nv5yxvl9g.css
export const iconBaseClass = 'mptk-icons-base'
export const iconPrefix = 'mptk-i-'

/**
 * 当前图标名 → className。
 * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。
 */
export const iconMap: Readonly<Record<string, string>> = {
  "shezhi1": 'mptk-icons-base mptk-i-shezhi1',
  "jia": 'mptk-icons-base mptk-i-jia',
  "jian": 'mptk-icons-base mptk-i-jian',
  "shezhi": 'mptk-icons-base mptk-i-shezhi',
  "xihuan": 'mptk-icons-base mptk-i-xihuan',
  "xihuan-a": 'mptk-icons-base mptk-i-xihuan-a',
  "saoma": 'mptk-icons-base mptk-i-saoma',
  "tuichu": 'mptk-icons-base mptk-i-tuichu',
  "shoucanga": 'mptk-icons-base mptk-i-shoucanga',
  "gou": 'mptk-icons-base mptk-i-gou',
  "shoucang": 'mptk-icons-base mptk-i-shoucang',
  "huidingbu": 'mptk-icons-base mptk-i-huidingbu',
  "shuju": 'mptk-icons-base mptk-i-shuju',
  "shijian1": 'mptk-icons-base mptk-i-shijian1',
  "iconjia": 'mptk-icons-base mptk-i-iconjia',
  "sort-down": 'mptk-icons-base mptk-i-sort-down',
  "guanbi": 'mptk-icons-base mptk-i-guanbi',
  "sort-up": 'mptk-icons-base mptk-i-sort-up',
  "sort-right": 'mptk-icons-base mptk-i-sort-right',
  "sort-left": 'mptk-icons-base mptk-i-sort-left',
  "home": 'mptk-icons-base mptk-i-home',
  "move-right": 'mptk-icons-base mptk-i-move-right',
  "shaixuan": 'mptk-icons-base mptk-i-shaixuan',
  "xiugai": 'mptk-icons-base mptk-i-xiugai',
  "shanchu": 'mptk-icons-base mptk-i-shanchu',
  "move-left": 'mptk-icons-base mptk-i-move-left',
  "move-down": 'mptk-icons-base mptk-i-move-down',
  "move-up": 'mptk-icons-base mptk-i-move-up',
}

/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。变体（-dark）不在其中。 */
export const iconNames: readonly string[] = ['shezhi1', 'jia', 'jian', 'shezhi', 'xihuan', 'xihuan-a', 'saoma', 'tuichu', 'shoucanga', 'gou', 'shoucang', 'huidingbu', 'shuju', 'shijian1', 'iconjia', 'sort-down', 'guanbi', 'sort-up', 'sort-right', 'sort-left', 'home', 'move-right', 'shaixuan', 'xiugai', 'shanchu', 'move-left', 'move-down', 'move-up']

/**
 * 本包字形是否带颜色（COLR/CPAL）：true 时 color 与明暗主题都改不动它。
 * 由平台项目类型决定、整包一致，调用方据此决定要不要费劲上色，不要逐图标猜。
 */
export const iconColored = false

/** 有暗色版的主轴图标名；用 iconClass(`<名>-dark`) 取对应类名，选哪个由调用处决定。 */
export const iconPaired: readonly string[] = []
