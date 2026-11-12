// 图标包解析的纯函数：只吃平台 CSS 文本，不发请求、不写文件，便于单测。
// 变体约定：同一项目里 `<name>` 是默认字形，`<name>-dark` 是暗色字形。
// 两个类名都进同一个样式文件，用哪个由消费端按位置决定——CSS 覆盖是全页级的，做不到「只让这一处变暗」。

const DARK_SUFFIX = '-dark'

/**
 * 解析一个 iconfont 项目的 CSS。
 *   icons    主轴图标（不含占位、不含变体）：进 iconNames，供展示与遍历
 *   variants 暗色变体：只进 iconMap，供 iconClass('<name>-dark') 拼类名
 *   paired   有暗色版的主轴图标名：消费端据此决定要不要做主题判断
 * 没有 `-dark` 的图标不进 variants，明暗共用同一个字形。
 */
export function parseIcons(css) {
  const colored = css.includes('/* Color fonts */')
  const baseMatch = css.match(/\.([\w-]+)\s*\{[^}]*font-family/)
  if (baseMatch === null) {
    throw new Error('找不到带 font-family 的基础类，平台产物结构可能变了')
  }

  const rules = [...css.matchAll(/\.([\w-]+):before\s*\{\s*content:\s*"([^"]*)"/g)].map((match) => ({
    className: match[1],
    codepoint: match[2],
    name: '',
  }))
  if (rules.length === 0) {
    throw new Error('一个图标类都没解析到，平台产物结构可能变了')
  }

  // 前缀取「所有类名的公共前缀且以短横结尾」，据此把类名还原成图标名。
  let prefix = rules[0].className
  for (const rule of rules) {
    while (!rule.className.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  prefix = prefix.slice(0, prefix.lastIndexOf('-') + 1)
  for (const rule of rules) rule.name = rule.className.slice(prefix.length)

  const nameSet = new Set(rules.map((rule) => rule.name))
  const baseNameOf = (name) => (name.endsWith(DARK_SUFFIX) ? name.slice(0, -DARK_SUFFIX.length) : null)
  const isVariant = (name) => baseNameOf(name) !== null && nameSet.has(baseNameOf(name))

  const usable = rules.filter((rule) => !rule.name.startsWith('_'))
  const icons = usable.filter((rule) => !isVariant(rule.name))
  const variants = usable.filter((rule) => isVariant(rule.name))
  const paired = variants.map((rule) => baseNameOf(rule.name))

  return { baseClass: baseMatch[1], prefix, icons, variants, paired, colored }
}
