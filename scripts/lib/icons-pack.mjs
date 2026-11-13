// 图标库注册表的纯函数：id 解析、路径映射、生成期校验。不发请求、不落盘，便于单测。
const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ID_PATTERN = new RegExp(`^${SEGMENT}(?:\\.${SEGMENT}){1,2}$`)
const SOURCE_PATTERN = /^https:\/\/at\.alicdn\.com\/t\/c\/font_[a-z0-9]+_[a-z0-9]+\.css$/

export function isColorId(id) {
  return id.endsWith('.color')
}

/** 一条注册表记录 → 源码目录；id 的点号就是目录层级，不在别处再拼一遍。 */
export function pathOf(pack) {
  const base = pack.visibility === 'demo' ? 'demo/src/icons' : 'src/ui/icon'
  return [base, ...pack.id.split('.')].join('/')
}

/** public 包的 exports 子路径（去掉开头的 ./）。 */
export function exportPathOf(pack) {
  return `ui/icon/${pack.id.split('.').join('/')}`
}

/** 注册表自洽性：id 形状、唯一性、可见性、链接形状。新增一条记录即纳入校验。 */
export function validateRegistry(sources) {
  const seen = new Set()
  for (const pack of sources) {
    if (!ID_PATTERN.test(pack.id)) {
      throw new Error(`[icons] 非法 id：${pack.id}，应为 命名空间.库名[.color]`)
    }
    if (seen.has(pack.id)) throw new Error(`[icons] 重复 id：${pack.id}`)
    seen.add(pack.id)
    if (pack.visibility !== 'public' && pack.visibility !== 'demo') {
      throw new Error(`[icons] ${pack.id} 的 visibility 只能是 public 或 demo`)
    }
    if (!SOURCE_PATTERN.test(pack.source)) {
      throw new Error(`[icons] ${pack.id} 的 source 不是平台 CSS 链接：${pack.source}`)
    }
    const parts = pack.id.split('.')
    if (parts.length === 3 && parts[2] !== 'color') {
      throw new Error(`[icons] ${pack.id} 第三段只允许 color`)
    }
  }
  return sources
}

/** 平台 CSS 解析结果 ↔ 注册表的交叉校验：不匹配就拒绝写出，避免类名悄悄漂移。 */
export function validateParsed(pack, parsed) {
  if (isColorId(pack.id) !== parsed.colored) {
    throw new Error(
      `[icons] ${pack.id} 彩色标记不符：id ${isColorId(pack.id) ? '带' : '不带'} .color，平台 CSS ${parsed.colored ? '是' : '不是'}彩色项目`,
    )
  }
  if (parsed.prefix !== `${parsed.baseClass}-`) {
    throw new Error(
      `[icons] ${pack.id} 图标类前缀 ${parsed.prefix} 不等于基础类 ${parsed.baseClass} 加 -，平台设置可能变了`,
    )
  }
  if (parsed.fontFamily !== parsed.baseClass) {
    throw new Error(
      `[icons] ${pack.id} @font-face 的 font-family ${parsed.fontFamily} 与基础类 ${parsed.baseClass} 不一致`,
    )
  }
}
