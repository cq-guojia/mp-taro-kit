/**
 * 跨副本单例：Symbol.for 挂在当前 JS 运行时的 globalThis 上，懒建、已存在直接返回。
 * 解决的是「同一进程里库被打进两份」，不是持久化——冷启动后重新建一遍。
 * key 统一带 mptk/ 前缀，避免与其他库撞符号。
 */
export function createSingleton<T>(key: string, create: () => T): T {
  const symbol = Symbol.for(`mptk/${key}`)
  const registry = globalThis as unknown as Record<symbol, T | undefined>
  if (Reflect.has(registry, symbol)) return registry[symbol] as T
  const created = create()
  registry[symbol] = created
  return created
}
