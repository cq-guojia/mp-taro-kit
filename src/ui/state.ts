import { createSingleton } from '../runtime/singleton.js'
import { getKitConfig } from '../runtime/kit-config.js'
import { createOverlayStack } from '../runtime/overlay-stack.js'
import type { OverlayStack } from '../runtime/overlay-stack.js'
import { createNotifyCenter } from '../runtime/notify.js'
import type { NotifyCenter } from '../runtime/notify.js'
import { createLoadingSlot } from '../runtime/loading-slot.js'
import type { LoadingSlot } from '../runtime/loading-slot.js'

/** 弹窗条目的载荷：命令式 API 只把待渲染数据推进栈，resolve 由 <DialogHost /> 调用。 */
export interface DialogPayload {
  readonly kind: 'alert' | 'confirm'
  readonly title: string | undefined
  readonly message: string
  readonly confirmText: string
  readonly cancelText: string
  readonly resolve: (confirmed: boolean) => void
}

/**
 * 三类命令式能力的宿主挂载计数。Taro 的 App 组件在每个页面 React root 都渲染，
 * 同一时刻多页各有一份宿主；布尔标记会因任一页卸载就把全局标成 false，
 * 其他活着的页再调命令会误报「未挂载」。计数让"还有一份活着"就可用。
 */
export interface HostMountState {
  toast: number
  dialog: number
  loading: number
}

export interface UIState {
  readonly overlays: OverlayStack<DialogPayload>
  readonly notices: NotifyCenter
  readonly loading: LoadingSlot
  readonly hosts: HostMountState
  readonly loadingHandles: Set<number>
  readonly toastTimers: Map<number, ReturnType<typeof setTimeout>>
}

/** 全局唯一状态：跨副本单例保证主包 / 分包各副本看到同一份栈、队列与挂载计数。 */
export function uiState(): UIState {
  return createSingleton<UIState>('ui', () => ({
    overlays: createOverlayStack<DialogPayload>(),
    notices: createNotifyCenter(getKitConfig().runtime.notifyLimit),
    loading: createLoadingSlot(),
    hosts: { toast: 0, dialog: 0, loading: 0 },
    loadingHandles: new Set<number>(),
    toastTimers: new Map<number, ReturnType<typeof setTimeout>>(),
  }))
}
