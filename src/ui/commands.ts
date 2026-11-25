import type { Notice, NoticeTone } from '../runtime/notify.js'
import { getKitConfig } from '../runtime/kit-config.js'
import { currentPageKey } from '../runtime/page-route.js'
import { uiState } from './state.js'
import type { DialogAction, DialogLayout, DialogPayload } from './state.js'
import type {
  ContentPopupBadge,
  ContentPopupImage,
  ContentPopupPosition,
} from './layout/content-popup/ContentPopup.js'
import type { EdgeOffset } from './layout/edge-offset.js'

type HostKind = 'toast' | 'dialog' | 'loading'

/** 宿主名由调用方传字面量：只引 dialog 命令时产物里不会留下 toast / loading 的名字。 */
function ensureMounted(kind: HostKind, hint: string): void {
  if (uiState().hosts[kind] <= 0) {
    throw new Error(
      `[mp-taro-kit/ui] 未挂载 <${hint} />；请在 app 入口 createKitApp(App, { hosts: [...] }) 挂一次，或 import { ${hint} } from 'mp-taro-kit/ui/infra' 手动挂载`,
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
  ensureMounted('toast', 'ToastHost')
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
  ensureMounted('loading', 'LoadingHost')
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
  /** 标题与说明默认都排进 body；这里只给文案，不接 ReactNode。 */
  title?: string
  confirmText?: string
  cancelText?: string
  /** icon 档的备注（主标题下方的小字）。 */
  note?: string
  icon?: string
  /** 自定义按钮：key 用来在锁期间声明例外，也回传给 onAction。 */
  actions?: readonly DialogAction[]
  /** spaced 横排（默认）/ stack 竖排 / joined 竖线等分。 */
  layout?: DialogLayout
  position?: ContentPopupPosition
  width?: number | string
  closeable?: boolean
  maskClosable?: boolean
  badge?: ContentPopupBadge
  headerImage?: ContentPopupImage
  offsets?: EdgeOffset
  /** 转圈期间仍可点的控件 key；confirm 默认放行 cancel。 */
  lockExceptions?: readonly string[]
  /** 确定前的异步闸门：Promise 期间转圈、整框屏蔽；reject / 返回 false 则保持打开。 */
  onConfirm?: () => unknown
  /** 自定义按钮的异步闸门，key 为按钮 key。 */
  onAction?: (key: string) => unknown
}

function pushDialog(
  kind: DialogPayload['kind'],
  message: string,
  options: DialogOptions,
  resolve: (confirmed: boolean) => void,
): void {
  const confirmAction: DialogAction = {
    key: 'confirm',
    text: options.confirmText ?? '确定',
    type: 'primary',
  }
  const cancelAction: DialogAction = {
    key: 'cancel',
    text: options.cancelText ?? '取消',
    type: 'default',
    variant: 'ghost',
  }
  uiState().overlays.push({
    kind,
    content: {
      variant: options.icon === undefined ? 'text' : 'icon',
      title: options.title,
      description: message,
      note: options.note,
      icon: options.icon,
    },
    actions: options.actions ?? (kind === 'confirm' ? [cancelAction, confirmAction] : [confirmAction]),
    layout: options.layout ?? 'spaced',
    position: options.position ?? 'center',
    width: options.width,
    closeable: options.closeable ?? false,
    maskClosable: options.maskClosable ?? false,
    badge: options.badge,
    headerImage: options.headerImage,
    offsets: options.offsets,
    lockExceptions: options.lockExceptions ?? (kind === 'confirm' ? ['cancel'] : []),
    pageKey: currentPageKey(),
    onConfirm: options.onConfirm,
    ...(kind === 'confirm' ? { onAction: options.onAction } : null),
    resolve,
  })
}

/** 解析即关闭；不返回用户选择。 */
export function alert(message: string, options: DialogOptions = {}): Promise<void> {
  ensureMounted('dialog', 'DialogHost')
  return new Promise<void>((resolve) => {
    pushDialog('alert', message, options, () => resolve())
  })
}

/** 解析 true = 确认、false = 取消。 */
export function confirm(message: string, options: DialogOptions = {}): Promise<boolean> {
  ensureMounted('dialog', 'DialogHost')
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
  for (const payload of state.overlays.clear()) payload.resolve(false)
  state.dialogOwners.clear()
  state.notices.clear()
  state.hosts.toast = 0
  state.hosts.dialog = 0
  state.hosts.loading = 0
}
