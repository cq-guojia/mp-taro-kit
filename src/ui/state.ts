import { createSingleton } from '../runtime/singleton.js'
import { getKitConfig } from '../runtime/kit-config.js'
import { createOverlayStack } from '../runtime/overlay-stack.js'
import type { OverlayStack } from '../runtime/overlay-stack.js'
import { createNotifyCenter } from '../runtime/notify.js'
import type { NotifyCenter } from '../runtime/notify.js'
import { createLoadingSlot } from '../runtime/loading-slot.js'
import type { LoadingSlot } from '../runtime/loading-slot.js'

/** 弹窗条目的载荷：命令式 API 只把待渲染数据推进栈，resolve 由 <OverlayHost /> 调用。 */
export interface DialogPayload {
  readonly kind: 'alert' | 'confirm'
  readonly title: string | undefined
  readonly message: string
  readonly confirmText: string
  readonly cancelText: string
  readonly resolve: (confirmed: boolean) => void
}

export interface UIState {
  readonly overlays: OverlayStack<DialogPayload>
  readonly notices: NotifyCenter
  readonly loading: LoadingSlot
  /** 宿主是否已挂载 <OverlayHost />；命令式 API 靠它判定开发者契约。 */
  mounted: boolean
  readonly loadingHandles: Set<number>
  /** Toast 自动消失的定时器句柄：hide/clear/reset 时统一清掉，不留悬空回调。 */
  readonly toastTimers: Map<number, ReturnType<typeof setTimeout>>
}

/**
 * 全局唯一状态：用 runtime 的跨副本单例，保证命令式 API 与 <OverlayHost />
 * 在主包 / 分包各副本里看到的是同一份栈、同一条通知队列、同一个 loading 槽。
 */
export function uiState(): UIState {
  return createSingleton<UIState>('ui', () => ({
    overlays: createOverlayStack<DialogPayload>(),
    notices: createNotifyCenter(getKitConfig().runtime.notifyLimit),
    loading: createLoadingSlot(),
    mounted: false,
    loadingHandles: new Set<number>(),
    toastTimers: new Map<number, ReturnType<typeof setTimeout>>(),
  }))
}
