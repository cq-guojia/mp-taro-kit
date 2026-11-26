import Taro from '@tarojs/taro'

const pageKeys = new WeakMap<object, string>()
let seq = 0

type TaroWithStack = typeof Taro & {
  getCurrentPages?: () => unknown[]
}

function keyOf(page: unknown): string | null {
  if (typeof page !== 'object' || page === null) return null
  const existing = pageKeys.get(page)
  if (existing !== undefined) return existing
  const key = `mptk-page-${String(++seq)}`
  pageKeys.set(page, key)
  return key
}

/** 当前页只认页面栈顶：执行上下文实例会随全局重渲染漂移，不能当业务身份。 */
export function currentPageKeyFromTaro(): string {
  const taro = Taro as TaroWithStack
  const stack = typeof taro.getCurrentPages === 'function' ? taro.getCurrentPages() : []
  const current = stack.length === 0 ? undefined : stack[stack.length - 1]
  return keyOf(current) ?? ''
}

/** KitPage 用自己的 page 实例取同一个 id，和命令侧的身份体系一致。 */
export function pageKeyOf(page: unknown): string | null {
  return keyOf(page)
}
