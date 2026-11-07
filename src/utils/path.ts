// 纯路径方法：只做字符串切分 / 拼接，不碰宿主、不依赖 React / DOM。
// 约定：POSIX `/` 分隔；空串 `''` 表示根。

/** 拼接子路径，去掉 dir 尾斜杠与 name 首斜杠，避免多余斜杠。 */
export function joinPath(dir: string, name: string): string {
  const base = dir.replace(/\/+$/, '')
  const leaf = name.replace(/^\/+/, '')
  if (base === '') return leaf
  return leaf === '' ? base : `${base}/${leaf}`
}

/** 父目录（无父 = 空串，表示根）；先剔尾斜杠，否则 `a/b/` 会返回 `a/b`。 */
export function parentOf(path: string): string {
  const trimmed = path.replace(/\/+$/, '')
  const cut = trimmed.lastIndexOf('/')
  return cut < 0 ? '' : trimmed.slice(0, cut)
}

/** 扩展名（小写、不含点）；无扩展名返回 `''`；忽略 `?` / `#` 之后部分。 */
export function extOf(path: string): string {
  const clean = path.split(/[?#]/)[0]
  const name = clean.slice(clean.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** 路径分段（面包屑用）：`a/b/c` ⇒ `['a','b','c']`。 */
export function crumbsOf(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '')
}
