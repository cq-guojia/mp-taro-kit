import { useRef, useState } from 'react'
import { isSuccess, isThenable } from '../../runtime/thenable.js'

export interface AsyncChange<T> {
  /** 界面上该显示的值，始终等于宿主给的真值。 */
  display: T
  /** 是否正在等待（转圈 + 锁点击）。 */
  busy: boolean
  /** 点一下：同步回调直接交给宿主；异步回调立刻转圈，翻不翻由宿主决定。 */
  change: (next: T) => void
}

/**
 * 只服务「点了先转圈、成功再翻过去」的控件（对齐 Ant Design Mobile）：
 * 回调返回 thenable 时立刻锁点击并转圈，界面位置**保持不动**；
 * 成功后由宿主把新值传回来，失败则什么都不用回滚 —— 从来没拨过去过。
 */
export function useAsyncChange<T>(
  value: T,
  onChange: ((next: T) => unknown) | undefined,
  disabled: boolean,
  loading: boolean,
  onFailed?: () => void,
): AsyncChange<T> {
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const change = (next: T): void => {
    if (disabled || loading || inFlight.current) return
    const out = onChange?.(next)
    if (!isThenable(out)) return

    inFlight.current = true
    setBusy(true)
    const done = (): void => {
      inFlight.current = false
      setBusy(false)
    }
    void Promise.resolve(out).then(
      (result) => {
        done()
        if (!isSuccess(result)) onFailed?.()
      },
      (error: unknown) => {
        done()
        onFailed?.()
        console.error('[mp-taro-kit/ui/form] 切换失败，位置未变动：', error)
      },
    )
  }

  return { display: value, busy: busy || loading, change }
}
