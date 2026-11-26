import { createSingleton } from '../runtime/singleton.js'
import { getKitConfig } from '../runtime/kit-config.js'
import { createOverlayStack } from '../runtime/overlay-stack.js'
import type { OverlayStack } from '../runtime/overlay-stack.js'
import { createNotifyCenter } from '../runtime/notify.js'
import type { NotifyCenter } from '../runtime/notify.js'
import { createLoadingSlot } from '../runtime/loading-slot.js'
import type { LoadingSlot } from '../runtime/loading-slot.js'
import type { ButtonSize } from './actions/Button.js'
import type { ContentPopupBadge, ContentPopupImage, ContentPopupPosition } from './layout/content-popup/ContentPopup.js'
import type { EdgeOffset } from './layout/edge-offset.js'

/** 对话框按钮只描述外观与身份，不含 JSX；行为由 Host 按 key 驱动。 */
export interface DialogAction {
  readonly key: string
  readonly text: string
  readonly type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  readonly variant?: 'solid' | 'soft' | 'outline' | 'ghost'
  /** 与 Popup 底栏按钮共用 Button 尺寸轴，默认 md。 */
  readonly size?: ButtonSize
  readonly color?: string
  readonly loadingText?: string
}

/** 标题交给 ContentPopup 按头部形态排布；icon 档额外给图标与备注，说明恒在 body。 */
export interface DialogContent {
  readonly variant: 'text' | 'icon'
  readonly title?: string
  readonly description: string
  readonly note?: string
  readonly icon?: string
  /** 固定类型给 inline 图标的语义色（var(--mptk-*)），只上色、不带底色。 */
  readonly iconColor?: string
}

/** 三形态：横排 spaced / 竖排 stack / 竖线 joined。 */
export type DialogLayout = 'spaced' | 'stack' | 'joined'

interface DialogPayloadCommon {
  readonly content: DialogContent
  readonly actions: readonly DialogAction[]
  readonly layout: DialogLayout
  readonly position: ContentPopupPosition
  readonly width?: number | string
  /** 关闭叉默认不给，显式开启。 */
  readonly closeable: boolean
  /** 点遮罩默认不关闭，显式开启时映射为 cancel。 */
  readonly maskClosable: boolean
  readonly badge?: ContentPopupBadge
  readonly headerImage?: ContentPopupImage
  readonly offsets?: EdgeOffset
  readonly lockExceptions: readonly string[]
  /** 发起页面的稳定实例 id；由 KitPage 提供，避免上一页遗留宿主抢到弹窗。 */
  readonly pageKey?: string
  readonly resolve: (confirmed: boolean) => void
  /** 确定前的异步闸门：返回 Promise 期间转圈并整框屏蔽，reject / false 保持打开可重试。 */
  readonly onConfirm?: () => unknown
}

/** 弹窗条目的载荷：命令式 API 只把待渲染数据推进栈，resolve 由 <DialogHost /> 调用。 */
export type DialogPayload = DialogPayloadCommon & (
  | { readonly kind: 'alert' }
  | { readonly kind: 'confirm'; readonly onAction?: (key: string) => unknown }
)

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
  /** 每条弹窗只归一个 Host 渲染；Taro 每页都渲染 App 时避免多份宿主重复出框。 */
  readonly dialogOwners: Map<number, string>
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
    dialogOwners: new Map<number, string>(),
  }))
}
