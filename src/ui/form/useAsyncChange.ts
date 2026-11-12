import { useEffect, useRef, useState } from 'react'
import { isSuccess, isThenable } from '../../runtime/thenable.js'
import { displayValue, settleChange, type ChangeState } from './change-state.js'

export interface AsyncChange<T> {
  /** 界面当前该显示的值。 */
  display: T
  /** 是否正在等待（转圈 + 锁点击）。 */
  busy: boolean
  /** 点一下：同步回调直接交给宿主；异步回调则先拨过去并转圈。 */
  change: (next: T) => void
}

/**
 * 只服务「点一下先拨过去再转圈」的控件：
 * 回调返回 thenable 时，界面立刻显示新值并锁住点击，成功保持，失败回弹并通知宿主。
 * 同步回调不产生临时值，完全由宿主给回来的 value 决定显示。
 */
export function useAsyncChange<T>(
  value: T,
  onChange: ((next: T) => unknown) | undefined,
  disabled: boolean,
  loading: boolean,
  onFailed?: () => void,
): AsyncChange<T> {
  const [state, setState] = useState<ChangeState<T>>({ pending: null, busy: false })
  const inFlight = useRef(false)

  useEffect(() => {
    setState((current) => settleChange(current, 'value-changed'))
  }, [value])

  const change = (next: T): void => {
    if (disabled || loading || inFlight.current) return
    const out = onChange?.(next)
    if (!isThenable(out)) return

    inFlight.current = true
    setState({ pending: next, busy: true })
    const fail = (): void => {
      inFlight.current = false
      setState((current) => settleChange(current, 'fail'))
      onFailed?.()
    }
    void Promise.resolve(out).then(
      (result) => {
        if (!isSuccess(result)) {
          fail()
          return
        }
        inFlight.current = false
        setState((current) => settleChange(current, 'ok'))
      },
      (error: unknown) => {
        fail()
        console.error('[mp-taro-kit/ui/form] 切换失败，已回弹：', error)
      },
    )
  }

  return { display: displayValue(value, state), busy: state.busy || loading, change }
}
