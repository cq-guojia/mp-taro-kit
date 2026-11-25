import Taro from '@tarojs/taro'

const pageKeys = new WeakMap<object, string>()
let seq = 0

type TaroWithStack = typeof Taro & {
  getCurrentPages?: () => unknown[]
  getCurrentInstance?: () => { page?: unknown }
}

function keyOf(page: unknown): string | null {
  if (typeof page !== 'object' || page === null) return null
  const existing = pageKeys.get(page)
  if (existing !== undefined) return existing
  const key = `mptk-page-${String(++seq)}`
  pageKeys.set(page, key)
  return key
}

/** 命令发生时读栈顶；拿不到栈就退回当前执行上下文的 page。两边都给同一个 page 实例发稳定 id。 */
export function currentPageKeyFromTaro(): string {
  const taro = Taro as TaroWithStack
  const stack = typeof taro.getCurrentPages === 'function' ? taro.getCurrentPages() : []
  const fromStack = stack.length === 0 ? undefined : stack[stack.length - 1]
  const fromInstance = typeof taro.getCurrentInstance === 'function'
    ? taro.getCurrentInstance()?.page
    : undefined
  return keyOf(fromInstance ?? fromStack) ?? keyOf(fromStack) ?? ''
}

/** KitPage 用自己的 page 实例取同一个 id，和命令侧的身份体系一致。 */
export function pageKeyOf(page: unknown): string | null {
  return keyOf(page)
}
