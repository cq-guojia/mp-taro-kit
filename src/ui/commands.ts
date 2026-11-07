import type { Notice, NoticeTone } from '../runtime/notify.js'
import { uiState } from './state.js'
import type { DialogPayload } from './state.js'

const NOT_MOUNTED =
  '[mp-taro-kit/ui] 未挂载 <OverlayHost />；请在页面基座挂一次（mp-taro-kit/ui/infra）'

/** 开发者契约违例：没挂宿主就想用命令式能力，每次都抛并直给修复动作。 */
function ensureMounted(): void {
  if (!uiState().mounted) throw new Error(NOT_MOUNTED)
}

/** 供 <OverlayHost /> 在挂载 / 卸载时调用；业务代码不要碰。 */
export function markOverlayHostMounted(): void {
  uiState().mounted = true
}

export function markOverlayHostUnmounted(): void {
  uiState().mounted = false
}

export function isOverlayHostMounted(): boolean {
  return uiState().mounted
}

export function showToast(text: string, tone: NoticeTone = 'info'): number {
  ensureMounted()
  return uiState().notices.show(text, tone)
}

export function hideToast(id: number): boolean {
  return uiState().notices.dismiss(id)
}

export function clearToasts(): Notice[] {
  return uiState().notices.clear()
}

export function showLoading(): number {
  ensureMounted()
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
  ensureMounted()
  return new Promise<void>((resolve) => {
    pushDialog('alert', message, options, () => resolve())
  })
}

/** 解析 true = 确认、false = 取消；resolve(false) 也可由业务拿来「不关、重试」。 */
export function confirm(message: string, options: DialogOptions = {}): Promise<boolean> {
  ensureMounted()
  return new Promise<boolean>((resolve) => {
    pushDialog('confirm', message, options, resolve)
  })
}

/** 仅供单测清空全局状态；产品代码不要调用。 */
export function resetUIForTests(): void {
  const state = uiState()
  for (const id of state.loadingHandles) state.loading.hide(id)
  state.loadingHandles.clear()
  state.overlays.clear()
  state.notices.clear()
  state.mounted = false
}
