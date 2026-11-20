import { createSingleton } from '../runtime/singleton.js'

export interface LoginDialogProps {
  /** 登录成功后调 true；取消/失败调 false；Promise 随之 settle。 */
  readonly resolve: (ok: boolean) => void
}

export type LoginDialogComponent = (props: LoginDialogProps) => JSX.Element | null

interface LoginDialogSlot {
  Component: LoginDialogComponent | null
  pending: ((ok: boolean) => void) | null
  listeners: Set<() => void>
}

function slot(): LoginDialogSlot {
  return createSingleton<LoginDialogSlot>('login-dialog', () => ({
    Component: null,
    pending: null,
    listeners: new Set(),
  }))
}

/** 给 LoginDialogHost 订阅注册变化；外部不要调用。 */
export function subscribeLoginDialog(listener: () => void): () => void {
  const state = slot()
  state.listeners.add(listener)
  return () => state.listeners.delete(listener)
}

export function getLoginDialogComponent(): LoginDialogComponent | null {
  return slot().Component
}

/** 业务在 app 入口注册一次登录窗；传 null 注销。库只给协议与调度，UI 归业务。 */
export function setLoginDialog(Component: LoginDialogComponent | null): void {
  const state = slot()
  // 任何替换（含换成另一个组件）都先兑现旧 pending，避免旧请求永久挂起或被新 UI 误 settle。
  if (state.pending !== null) {
    const pending = state.pending
    state.pending = null
    pending(false)
  }
  state.Component = Component
  for (const listener of state.listeners) listener()
}

/**
 * 业务在需要登录的位置调用：await requireLogin()，登录成功 resolve(true) 再往下走。
 * 未注册登录窗时当场 reject——不静默放行，避免未登录继续执行业务。
 */
export function requireLogin(): Promise<boolean> {
  const state = slot()
  if (state.Component === null) {
    return Promise.reject(new Error('[mp-taro-kit/app] 未注册登录窗；请在 app 入口调用 setLoginDialog(...)'))
  }
  if (state.pending !== null) {
    const previous = state.pending
    state.pending = null
    previous(false)
  }
  return new Promise<boolean>((resolve) => {
    state.pending = (ok: boolean) => {
      state.pending = null
      resolve(ok)
    }
  })
}

/** 登录窗 UI 调它兑现结果；重复调用无副作用。 */
export function resolveLogin(ok: boolean): void {
  const state = slot()
  if (state.pending !== null) {
    const pending = state.pending
    state.pending = null
    pending(ok)
  }
}
