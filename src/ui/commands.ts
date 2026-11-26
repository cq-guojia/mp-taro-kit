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

type HostKind = string

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

/** alert / confirm 的固定类型：选一个即用配套图标与语义色底，无需自己挑图标。 */
export type DialogType = 'success' | 'error' | 'warning' | 'info'

/** 固定类型 → 库内置图标名；调用方显式传 icon 时以它为准。 */
const DIALOG_TYPE_ICON: Record<DialogType, string> = {
  success: 'common.base:gou',
  error: 'common.base:guanbi',
  warning: 'common.base:warn',
  info: 'common.base:info',
}

/** 固定类型 → 外伸徽标预设色（本身就是轻微渐变底 + 反色图标）。 */
const DIALOG_TYPE_TONE = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
} as const

/** 固定类型 → 普通 inline 图标色：只给图标上色，不造底色。 */
const DIALOG_TYPE_ICON_COLOR = {
  success: 'var(--mptk-c-dialog-type-fg-success)',
  error: 'var(--mptk-c-dialog-type-fg-error)',
  warning: 'var(--mptk-c-dialog-type-fg-warning)',
  info: 'var(--mptk-c-dialog-type-fg-info)',
} as const

export interface DialogOptions {
  /** 标题按 ContentPopup 头部形态排布，说明排进 body；这里只给文案，不接 ReactNode。 */
  title?: string
  confirmText?: string
  cancelText?: string
  /** 文字头备注（主标题下方的小字）；icon 档与纯标题档都生效。 */
  note?: string
  /** 固定类型：选配图标并给 inline 图标上语义色；有 badge 时同时换外伸图标与红黄蓝绿底色。显式 icon 只换图标名。 */
  type?: DialogType
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
  /** 闸门拒绝（onConfirm/onAction 返回 Promise 后 reject 或显式 false）时回调，弹窗保持打开可重试。 */
  onFailed?: (key: string) => void
}

function pushDialog(
  kind: DialogPayload['kind'],
  message: string,
  options: DialogOptions,
  resolve: (confirmed: boolean) => void,
): void {
  const dialogConfig = getKitConfig().runtime.dialog
  const pageKey = currentPageKey()
  // 默认形态按载荷区分：confirm 不传参走竖线，自定义按钮走横排；调用方显式传了以它为准。
  const layout = options.layout ?? (options.actions === undefined && kind === 'confirm' ? 'joined' : 'spaced')
  // joined 档沿用 ContentPopup 底栏自带的 ghost 文字按钮，不把配置的 variant 灌进去改坏它。
  const configuredVariant = (variant: 'solid' | 'soft' | 'outline' | 'ghost') =>
    layout === 'joined' ? undefined : variant
  const confirmAction: DialogAction = {
    key: 'confirm',
    text: options.confirmText ?? dialogConfig.confirmText,
    type: dialogConfig.confirm.type,
    variant: configuredVariant(dialogConfig.confirm.variant),
    size: 'md',
  }
  const cancelAction: DialogAction = {
    key: 'cancel',
    text: options.cancelText ?? dialogConfig.cancelText,
    type: dialogConfig.cancel.type,
    variant: configuredVariant(dialogConfig.cancel.variant),
    size: 'md',
  }
  const defaultActions = kind === 'confirm' ? [cancelAction, confirmAction] : [confirmAction]
  // 竖排从上到下先看确定；joined 档的自定义按钮只认文字与颜色，样式轴一律不采信。
  const actions = options.actions === undefined
    ? (kind === 'confirm' && layout === 'stack' ? [confirmAction, cancelAction] : defaultActions)
    : layout === 'joined'
      ? options.actions.map(({ key, text, color }) => ({ key, text, color }))
      : options.actions
  const icon = options.type === undefined ? options.icon : options.icon ?? DIALOG_TYPE_ICON[options.type]
  // inline 图标上语义色（无底色）；外伸徽标另走 tone 换渐变底，两者互不牵连。
  const badge = options.badge === undefined || options.type === undefined
    ? options.badge
    : {
      ...options.badge,
      content: { kind: 'icon' as const, name: icon ?? DIALOG_TYPE_ICON[options.type] },
      tone: DIALOG_TYPE_TONE[options.type],
    }
  uiState().dialogLifecycle.open({
    kind,
    content: {
      variant: icon === undefined ? 'text' : 'icon',
      title: options.title,
      description: message,
      note: options.note,
      icon,
      ...(options.type === undefined || options.icon !== undefined
        ? null
        : { iconColor: DIALOG_TYPE_ICON_COLOR[options.type] }),
    },
    actions,
    layout,
    position: options.position ?? 'center',
    width: options.width,
    closeable: options.closeable ?? false,
    maskClosable: options.maskClosable ?? false,
    badge,
    headerImage: options.headerImage,
    offsets: options.offsets,
    lockExceptions: options.lockExceptions ?? (kind === 'confirm' ? ['cancel'] : []),
    pageKey,
    onConfirm: options.onConfirm,
    onFailed: options.onFailed,
    ...(kind === 'confirm' ? { onAction: options.onAction } : null),
    resolve,
  }, pageKey)
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
  state.dialogLifecycle.clear((payload) => payload.resolve(false))
  state.notices.clear()
  state.hosts.toast = 0
  state.hosts.dialog = 0
  state.hosts.loading = 0
}
