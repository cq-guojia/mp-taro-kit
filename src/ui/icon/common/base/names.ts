// 本文件由 scripts/icons.mjs 生成，请勿手改。
// 包：common.base
// 源：https://at.alicdn.com/t/c/font_5252971_834xyulhmq2.css
export const iconBaseClass = 'koc-i-common-base'
export const iconPrefix = 'koc-i-common-base-'

/**
 * 当前图标名 → className。
 * 随平台增删变化，每次 pnpm run icons 重写；不作为对外契约，调用处直接用图标名即可。
 */
export const iconMap: Readonly<Record<string, string>> = {
  "fuzhi": 'koc-i-common-base koc-i-common-base-fuzhi',
  "shuaxin": 'koc-i-common-base koc-i-common-base-shuaxin',
  "gongzuoqu": 'koc-i-common-base koc-i-common-base-gongzuoqu',
  "AIdamoxing": 'koc-i-common-base koc-i-common-base-AIdamoxing',
  "chexiao": 'koc-i-common-base koc-i-common-base-chexiao',
  "chazhao": 'koc-i-common-base koc-i-common-base-chazhao',
  "info": 'koc-i-common-base koc-i-common-base-info',
  "warn": 'koc-i-common-base koc-i-common-base-warn',
  "shensemoshi": 'koc-i-common-base koc-i-common-base-shensemoshi',
  "qiansemoshi": 'koc-i-common-base koc-i-common-base-qiansemoshi',
  "yonghu-refresh": 'koc-i-common-base koc-i-common-base-yonghu-refresh',
  "youxiangshuangjiantou": 'koc-i-common-base koc-i-common-base-youxiangshuangjiantou',
  "zuoxiangshuangjiantou": 'koc-i-common-base koc-i-common-base-zuoxiangshuangjiantou',
  "jia": 'koc-i-common-base koc-i-common-base-jia',
  "jian": 'koc-i-common-base koc-i-common-base-jian',
  "shezhi": 'koc-i-common-base koc-i-common-base-shezhi',
  "xihuan": 'koc-i-common-base koc-i-common-base-xihuan',
  "xihuan-a": 'koc-i-common-base koc-i-common-base-xihuan-a',
  "saoma": 'koc-i-common-base koc-i-common-base-saoma',
  "tuichu": 'koc-i-common-base koc-i-common-base-tuichu',
  "shoucanga": 'koc-i-common-base koc-i-common-base-shoucanga',
  "gou": 'koc-i-common-base koc-i-common-base-gou',
  "shoucang": 'koc-i-common-base koc-i-common-base-shoucang',
  "huidingbu": 'koc-i-common-base koc-i-common-base-huidingbu',
  "shuju": 'koc-i-common-base koc-i-common-base-shuju',
  "shijian1": 'koc-i-common-base koc-i-common-base-shijian1',
  "move-right": 'koc-i-common-base koc-i-common-base-move-right',
  "shaixuan": 'koc-i-common-base koc-i-common-base-shaixuan',
  "xiugai": 'koc-i-common-base koc-i-common-base-xiugai',
  "iconjia": 'koc-i-common-base koc-i-common-base-iconjia',
  "sort-down": 'koc-i-common-base koc-i-common-base-sort-down',
  "guanbi": 'koc-i-common-base koc-i-common-base-guanbi',
  "shanchu": 'koc-i-common-base koc-i-common-base-shanchu',
  "sort-up": 'koc-i-common-base koc-i-common-base-sort-up',
  "move-left": 'koc-i-common-base koc-i-common-base-move-left',
  "move-down": 'koc-i-common-base koc-i-common-base-move-down',
  "move-up": 'koc-i-common-base koc-i-common-base-move-up',
  "sort-right": 'koc-i-common-base koc-i-common-base-sort-right',
  "sort-left": 'koc-i-common-base koc-i-common-base-sort-left',
  "home": 'koc-i-common-base koc-i-common-base-home',
  "yonghu-close": 'koc-i-common-base koc-i-common-base-yonghu-close',
  "yonghu-warn": 'koc-i-common-base koc-i-common-base-yonghu-warn',
  "yonghu-minus": 'koc-i-common-base koc-i-common-base-yonghu-minus',
  "shezhi1": 'koc-i-common-base koc-i-common-base-shezhi1',
  "yonghu-add": 'koc-i-common-base koc-i-common-base-yonghu-add',
  "yonghu": 'koc-i-common-base koc-i-common-base-yonghu',
  "yonghu-check": 'koc-i-common-base koc-i-common-base-yonghu-check',
}

/** 当前图标名清单，供展示页遍历与自检，同样不承诺稳定。变体（-dark）不在其中。 */
export const iconNames: readonly string[] = ['fuzhi', 'shuaxin', 'gongzuoqu', 'AIdamoxing', 'chexiao', 'chazhao', 'info', 'warn', 'shensemoshi', 'qiansemoshi', 'yonghu-refresh', 'youxiangshuangjiantou', 'zuoxiangshuangjiantou', 'jia', 'jian', 'shezhi', 'xihuan', 'xihuan-a', 'saoma', 'tuichu', 'shoucanga', 'gou', 'shoucang', 'huidingbu', 'shuju', 'shijian1', 'move-right', 'shaixuan', 'xiugai', 'iconjia', 'sort-down', 'guanbi', 'shanchu', 'sort-up', 'move-left', 'move-down', 'move-up', 'sort-right', 'sort-left', 'home', 'yonghu-close', 'yonghu-warn', 'yonghu-minus', 'shezhi1', 'yonghu-add', 'yonghu', 'yonghu-check']

/**
 * 本包字形是否带颜色（COLR/CPAL）：true 时 color 与明暗主题都改不动它。
 * 由平台项目类型决定、整包一致，调用方据此决定要不要费劲上色，不要逐图标猜。
 */
export const iconColored = false

/** 有暗色版的主轴图标名；用 iconClass(`<名>-dark`) 取对应类名，选哪个由调用处决定。 */
export const iconPaired: readonly string[] = []
