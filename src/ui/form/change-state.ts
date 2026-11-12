/** 切换控件等待期的状态：pending 是界面临时显示的值，null 表示以宿主给的真值为准。 */
export interface ChangeState<T> {
  pending: T | null
  busy: boolean
}

/** 等待结束或宿主值变化时，状态往哪边收敛。 */
export type ChangeSettle = 'ok' | 'fail' | 'value-changed'

/**
 * 异步切换的唯一状态转移入口：
 * - ok：等待结束且成功，保留已经拨过去的位置，直到宿主把新值传回来；
 * - fail：失败，清掉临时值回到宿主真值（回弹）；
 * - value-changed：宿主在等待期间改了值，临时值作废、以后台为准，转圈继续到等待结束。
 */
export function settleChange<T>(state: ChangeState<T>, how: ChangeSettle): ChangeState<T> {
  if (how === 'fail') return { pending: null, busy: false }
  if (how === 'value-changed') {
    return state.pending === null ? state : { pending: null, busy: state.busy }
  }
  return { pending: state.pending, busy: false }
}

/** 界面显示值：等待期间显示拨过去的值，其余时候显示宿主真值。 */
export function displayValue<T>(value: T, state: ChangeState<T>): T {
  return state.pending === null ? value : state.pending
}
