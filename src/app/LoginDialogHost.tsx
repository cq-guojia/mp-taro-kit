import { useSyncExternalStore } from 'react'
import {
  getLoginDialogComponent,
  resolveLogin,
  subscribeLoginDialog,
  type LoginDialogComponent,
} from './login-dialog.js'

/**
 * 登录窗渲染宿主：默认不在 createKitApp 的 hosts 里，业务要用登录窗就加进去。
 * 把 setLoginDialog 注册的 UI 真正渲染出来，resolve 直接接库的调度协议。
 */
export function LoginDialogHost() {
  const Component: LoginDialogComponent | null = useSyncExternalStore(
    subscribeLoginDialog,
    getLoginDialogComponent,
    getLoginDialogComponent,
  )
  if (Component === null) return null
  return <Component resolve={resolveLogin} />
}
