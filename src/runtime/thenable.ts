/** Promise 化交互的判定器：只判定，不 await、不吞错、不改原值。 */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  if (value === null || value === undefined) return false
  return typeof (value as { then?: unknown }).then === 'function'
}

/**
 * 回调的返回值算不算「这次成了」：仅显式 false 表示没成（弹窗据此保持不关、让人重试）。
 * true / undefined / 其他值一律算成，消费方不必在调用点包 try/catch。
 */
export function isSuccess(value: unknown): boolean {
  return value !== false
}
