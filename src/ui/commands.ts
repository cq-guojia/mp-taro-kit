import type { Notice, NoticeTone } from '../runtime/notify.js'
import { getKitConfig } from '../runtime/kit-config.js'
import { uiState } from './state.js'
import type { DialogPayload } from './state.js'

type HostKind = 'toast' | 'dialog' | 'loading'

const HOST_HINT: Record<HostKind, string> = {
  toast: 'ToastHost',
  dialog: 'DialogHost',
  loading: 'LoadingHost',
}

/** 开发者契约违例：没挂对应能力的宿主就调命令，每次都抛并直给修复动作。 */
function ensureMounted(kind: HostKind): void {
  if (uiState().hosts[kind] <= 0) {
    throw new Error(
      `[mp-taro-kit/ui] 未挂载 <${HOST_HINT[kind]} />；请在 app 入口 createKitApp(App, { hosts: [...] }) 挂一次，或 import { ${HOST_HINT[kind]} } from 'mp-taro-kit/ui/infra' 手动挂载`,
    )
  }
}

/** 供各 Host 在挂载 / 卸载时调用；业务代码不要碰。计数允许多页各挂一份。 */
export function markHostMounted(kind: HostKind): void {
  uiState().hosts[kind] += 1
}

export function markHostUnmounted(kind: HostKind): void {
  const hosts = uiState().hosts
  hosts[kind] = Math.max(0, hosts[kind] - 1)
}

export function isHostMounted(kind: HostKind): boolean {
  return uiState().hosts[kind] > 0
}

function clearToastTimer(id: number): void {
  const state = uiState()
  const timer = state.toastTimers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    state.toastTimers.delete(id)
  }
}

/**
 * 弹一条 Toast。默认关闭时间取 kit.config.mjs 的 runtime.toastDuration；
 * 单次传 duration 可覆盖，传 0 表示常驻、由业务自己 hideToast。
 */
export function showToast(text: string, tone: NoticeTone = 'info', duration?: number): number {
  ensureMounted('toast')
  const state = uiState()
  const id = state.notices.show(text, tone)
  const ms = duration ?? getKitConfig().runtime.toastDuration
  if (ms > 0) {
    const timer = setTimeout(() => {
      state.toastTimers.delete(id)
      state.notices.dismiss(id)
    }, ms)
    ;(timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.()
    state.toastTimers.set(id, timer)
  }
  return id
}

export function hideToast(id: number): boolean {
  clearToastTimer(id)
  return uiState().notices.dismiss(id)
}

export function clearToasts(): Notice[] {
  const state = uiState()
  for (const id of [...state.toastTimers.keys()]) clearToastTimer(id)
  return state.notices.clear()
}

export function showLoading(): number {
  ensureMounted('loading')
  const state = uiState()
  const id = state.loading.show()
  state.loadingHandles.add(id)
  return id
}

export function hideLoading(id: number): boolean {
  const state = uiState()
  state.loadingHandles.delete(id)
  return state.loading.hide(id)
}

export interface DialogOptions {
  title?: string
  confirmText?: string
  cancelText?: string
}

function pushDialog(
  kind: DialogPayload['kind'],
  message: string,
  options: DialogOptions,
  resolve: (confirmed: boolean) => void,
): void {
  uiState().overlays.push({
    kind,
    title: options.title,
    message,
    confirmText: options.confirmText ?? '确定',
    cancelText: options.cancelText ?? '取消',
    resolve,
  })
}

/** 解析即关闭；不返回用户选择。 */
export function alert(message: string, options: DialogOptions = {}): Promise<void> {
  ensureMounted('dialog')
  return new Promise<void>((resolve) => {
    pushDialog('alert', message, options, () => resolve())
  })
}

/** 解析 true = 确认、false = 取消。 */
export function confirm(message: string, options: DialogOptions = {}): Promise<boolean> {
  ensureMounted('dialog')
  return new Promise<boolean>((resolve) => {
    pushDialog('confirm', message, options, resolve)
  })
}

/** 仅供单测清空全局状态；产品代码不要调用。 */
export function resetUIForTests(): void {
  const state = uiState()
  for (const id of state.toastTimers.keys()) clearTimeout(state.toastTimers.get(id))
  state.toastTimers.clear()
  for (const id of state.loadingHandles) state.loading.hide(id)
  state.loadingHandles.clear()
  state.overlays.clear()
  state.notices.clear()
  state.hosts.toast = 0
  state.hosts.dialog = 0
  state.hosts.loading = 0
}
