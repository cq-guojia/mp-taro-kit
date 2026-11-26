import { getKitConfig } from '../runtime/kit-config.js'
import { currentPageKey } from '../runtime/page-route.js'
import { uiState } from './state.js'
import type {
  DialogAction,
  DialogLayout,
  DialogPayload,
  ToastActionDescriptor,
  ToastPayload,
  ToastPosition,
  ToastTone,
} from './state.js'
import type {
  ContentPopupBadge,
  ContentPopupImage,
  ContentPopupPosition,
} from './layout/content-popup/ContentPopup.js'
import type { EdgeOffset } from './layout/edge-offset.js'

type HostKind = string

/** 宿主名由调用方传字面量：只引 dialog 命令时产物里不会留下 loading 的名字。 */
function ensureMounted(kind: HostKind, hint: string): void {
  if (uiState().hosts[kind] <= 0) {
    throw new Error(
      `[mp-taro-kit/ui] 未挂载 <${hint} />；请在 app 入口 createKitApp(App, { hosts: [...] }) 挂一次，或 import { ${hint} } from 'mp-taro-kit/ui/infra' 手动挂载`,
    )
  }
}

/** 供各 Host 在挂载 / 卸载时调用；计数允许多页各挂一份，Toast 另按 pageKey 记一份。 */
export function markHostMounted(kind: HostKind, scope?: string): void {
  const state = uiState()
  state.hosts[kind] += 1
  if (kind === 'toast' && scope) {
    state.toastHostScopes.set(scope, (state.toastHostScopes.get(scope) ?? 0) + 1)
  }
}

export function markHostUnmounted(kind: HostKind, scope?: string): void {
  const state = uiState()
  state.hosts[kind] = Math.max(0, state.hosts[kind] - 1)
  if (kind === 'toast' && scope) {
    const count = state.toastHostScopes.get(scope) ?? 0
    if (count <= 1) state.toastHostScopes.delete(scope)
    else state.toastHostScopes.set(scope, count - 1)
  }
}

export function isHostMounted(kind: HostKind): boolean {
  return uiState().hosts[kind] > 0
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

export interface ToastOptions {
  readonly description: string
  readonly title?: string
  readonly tone?: ToastTone
  readonly icon?: string
  readonly closeButton?: boolean
  readonly action?: ToastActionDescriptor
  readonly position?: ToastPosition
  readonly enableStacking?: boolean
  readonly visibleToasts?: number
  /** 毫秒；0 表示常驻，需手动 hideToast。 */
  readonly duration?: number
  /** 命令层回调，不进全局 store；Host 按 phase / mounted / isCurrent 守卫后调用。 */
  readonly onAction?: (key: string) => void
}

function ensureToastHost(scope: string): void {
  const state = uiState()
  const scoped = state.toastHostScopes.get(scope) ?? 0
  if (scoped <= 0 && state.hosts.toast <= 0) {
    throw new Error(
      '[mp-taro-kit/ui] 未挂载 <ToastHost />；请在 app 入口 createKitApp(App, { hosts: [...] }) 挂一次，或 import { ToastHost } from \'mp-taro-kit/ui/infra\' 手动挂载',
    )
  }
}

function clearToastTimers(id: number): void {
  const state = uiState()
  for (const timer of state.toastTimers.get(id) ?? []) clearTimeout(timer)
  state.toastTimers.delete(id)
}

/** 逻辑关闭一条 Toast；幂等，退场完成后由宿主 finish。 */
export function closeToast(id: number): boolean {
  clearToastTimers(id)
  return uiState().toastLifecycle.close(id)
}

export function hideToast(id: number): boolean {
  const state = uiState()
  state.toastCallbacks.delete(id)
  const closed = closeToast(id)
  if (closed) state.toastLifecycle.finish(id)
  return closed
}

export function clearToasts(): void {
  const state = uiState()
  for (const id of [...state.toastTimers.keys()]) clearToastTimers(id)
  state.toastCallbacks.clear()
  state.toastLifecycle.clear()
}

/** 页面跨页交接：把仍有效的 Toast 改挂到当前栈顶页，由新页宿主续显剩余时间。 */
export function retargetToasts(scope: string): void {
  if (!scope) return
  const lifecycle = uiState().toastLifecycle
  for (const entry of lifecycle.getSnapshot()) {
    if (entry.phase === 'open') lifecycle.setScope(entry.id, scope)
  }
}

/** 绝对到期兜底；timer 只负责及时触发，切页 / 前台恢复也调它。 */
export function sweepExpiredToasts(now = Date.now()): void {
  const lifecycle = uiState().toastLifecycle
  for (const entry of lifecycle.getSnapshot()) {
    if (entry.phase === 'open' && now >= entry.payload.expiresAt) closeToast(entry.id)
  }
}

export function showToast(options: ToastOptions | string): number {
  const opts: ToastOptions = typeof options === 'string' ? { description: options } : options
  const scope = currentPageKey()
  ensureToastHost(scope)
  const state = uiState()
  const createdAt = Date.now()
  const duration = opts.duration ?? 3000
  const payload: ToastPayload = {
    title: opts.title,
    description: opts.description,
    tone: opts.tone ?? 'info',
    icon: opts.icon,
    closeButton: opts.closeButton ?? false,
    action: opts.action,
    position: opts.position ?? 'top',
    enableStacking: opts.enableStacking ?? false,
    visibleToasts: opts.visibleToasts ?? 3,
    duration,
    createdAt,
    expiresAt: duration > 0 ? createdAt + duration : Number.POSITIVE_INFINITY,
  }
  const id = state.toastLifecycle.open(payload, scope)
  if (opts.onAction !== undefined) state.toastCallbacks.set(id, opts.onAction)
  if (duration > 0) {
    const closeTimer = setTimeout(() => closeToast(id), duration)
    const finishTimer = setTimeout(() => state.toastLifecycle.finish(id), duration + 160)
    ;(closeTimer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.()
    ;(finishTimer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.()
    state.toastTimers.set(id, [closeTimer, finishTimer])
  }
  return id
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
  /** 确定前的异步闸门：仅返回 Promise 时转圈、整框屏蔽；同步返回不转圈，reject / 返回 false 则保持打开。 */
  onConfirm?: () => unknown
  /** 自定义按钮（含键为 confirm 的自定义按钮，alert 同样适用）的异步闸门，key 为按钮 key；同步返回不转圈；成功即 resolve(true)，只有取消 / 叉 / 遮罩 resolve(false)。 */
  onAction?: (key: string) => unknown
  /** 闸门拒绝（reject 或显式 false）时回调，弹窗保持打开可重试；同步抛错也走这里。 */
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
    customActions: options.actions !== undefined,
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
    onAction: options.onAction,
    onFailed: options.onFailed,
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
  for (const id of state.loadingHandles) state.loading.hide(id)
  state.loadingHandles.clear()
  state.dialogLifecycle.clear((payload) => payload.resolve(false))
  clearToasts()
  state.hosts.dialog = 0
  state.hosts.toast = 0
  state.hosts.loading = 0
  state.toastHostScopes.clear()
}
