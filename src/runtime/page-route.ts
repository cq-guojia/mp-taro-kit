import { createSingleton } from './singleton.js'

type PageKeyProvider = () => string

interface PageKeySlot {
  get: PageKeyProvider
}

function store(): PageKeySlot {
  return createSingleton<PageKeySlot>('page-key', () => ({ get: () => '' }))
}

/** 由 app 层注入 Taro 页面栈读取器；命令在调用时惰性取当前页，不能被页面渲染覆盖。 */
export function setPageKeyProvider(provider: PageKeyProvider): void {
  store().get = provider
}

export function currentPageKey(): string {
  return store().get()
}
