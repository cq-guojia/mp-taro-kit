import { createSingleton } from '../runtime/singleton.js'
import { createOverlayStack } from '../runtime/overlay-stack.js'
import type { OverlayStack } from '../runtime/overlay-stack.js'
import { createOverlayLifecycle } from './infra/overlay-lifecycle.js'
import type { OverlayLifecycle } from './infra/overlay-lifecycle.js'
import { createLoadingSlot } from '../runtime/loading-slot.js'
import type { LoadingSlot } from '../runtime/loading-slot.js'
import type { ButtonSize, ButtonType, ButtonVariant } from './actions/Button.js'
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
  /** 动作来自调用方自定义集合还是默认集合：决定键为 confirm 时该走 onAction 还是 onConfirm。 */
  readonly customActions: boolean
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
  /** 确定前的异步闸门：仅返回 Promise 时转圈并整框屏蔽，同步返回不转圈，reject / false 保持打开可重试。 */
  readonly onConfirm?: () => unknown
  /** 自定义按钮（含键为 confirm 的自定义按钮）的异步闸门，key 为按钮 key；同步返回不转圈。 */
  readonly onAction?: (key: string) => unknown
  /** 闸门拒绝（reject / 显式 false / 同步抛错）时的反馈，保持打开可重试。 */
  readonly onFailed?: (key: string) => void
}

/** 弹窗条目的载荷：命令式 API 只把待渲染数据推进栈，resolve 由 <DialogHost /> 调用。 */
export type DialogPayload = DialogPayloadCommon & { readonly kind: 'alert' | 'confirm' }

/** Toast 只存可序列化 descriptor；ReactNode / onClick / resolve 一律不进全局 store。 */
export type ToastTone = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition = 'top' | 'bottom' | 'center'

/** Toast 操作按钮只描述可序列化外观与身份；行为由 onAction(key) 按 key 驱动。 */
export interface ToastActionDescriptor {
  readonly key: string
  readonly text: string
  /** 前置图标，`库名:图标名`，走 Button 的 icon。 */
  readonly icon?: string
  /** 语义色档；color 传了任意色值时优先于它。默认 default。 */
  readonly type?: ButtonType
  /** 底色形态，默认 soft。 */
  readonly variant?: ButtonVariant
  /** 任意品牌色，覆盖 type；#rgb / #rrggbb / rgb() 可完整派生。 */
  readonly color?: string
}

export interface ToastPayload {
  readonly title?: string
  readonly description: string
  readonly tone: ToastTone
  readonly icon?: string
  readonly closeButton: boolean
  readonly actions?: readonly ToastActionDescriptor[]
  /** 该条 toast 所有操作按钮的统一尺寸。 */
  readonly actionSize: ButtonSize
  readonly position: ToastPosition
  readonly enableStacking: boolean
  readonly visibleToasts: number
  readonly duration: number
  readonly createdAt: number
  /** 绝对到期时间：计时与切页兜底共用同一时钟。 */
  readonly expiresAt: number
}

/**
 * 三类命令式能力的宿主挂载计数。Taro 的 App 组件在每个页面 React root 都渲染，
 * 同一时刻多页各有一份宿主；布尔标记会因任一页卸载就把全局标成 false，
 * 其他活着的页再调命令会误报「未挂载」。计数让"还有一份活着"就可用。
 */
export interface HostMountState {
  dialog: number
  loading: number
  /** 未来命令式浮层按 key 计数，无需改类型。 */
  [kind: string]: number
}

export interface UIState {
  readonly overlays: OverlayStack<DialogPayload>
  /** 命令弹窗的通用生命周期；与 overlays 共享同一份栈。 */
  readonly dialogLifecycle: OverlayLifecycle<DialogPayload>
  readonly toasts: OverlayStack<ToastPayload>
  readonly toastLifecycle: OverlayLifecycle<ToastPayload>
  readonly loading: LoadingSlot
  readonly hosts: HostMountState
  readonly loadingHandles: Set<number>
  /** 当前页有宿主的计数；按 scope 校验，避免别页有宿主却误判当前页可用。 */
  readonly toastHostScopes: Map<string, number>
  readonly toastTimers: Map<number, readonly ReturnType<typeof setTimeout>[]>
  /** 退场后物理移除的计时器：独立于关闭计时器，避免 close 时误删导致 exiting 节点永久残留。 */
  readonly toastFinishTimers: Map<number, ReturnType<typeof setTimeout>>
  /** 命令层回调，不放进 payload；Host 按 id / seq / phase 守卫后调用。 */
  readonly toastCallbacks: Map<number, (key: string) => void>
  /**
   * 折叠堆叠的全局态：expanded 是交互态，stacking/visibleToasts 是 Toaster 级配置（sonner-native）。
   * 全局一份，所有页宿主同步；任一字段变化都通知订阅者。
   */
  readonly toastExpansion: {
    expanded: boolean
    stacking: boolean
    visibleToasts: number
    configSnapshot: { enableStacking: boolean; visibleToasts: number }
    listeners: Set<() => void>
    collapseAt: number
  }
  /** 每条弹窗只归一个 Host 渲染；Taro 每页都渲染 App 时避免多份宿主重复出框。 */
}

/** 全局唯一状态：跨副本单例保证主包 / 分包各副本看到同一份栈、队列与挂载计数。 */
export function uiState(): UIState {
  return createSingleton<UIState>('ui', () => {
    const overlays = createOverlayStack<DialogPayload>()
    const toasts = createOverlayStack<ToastPayload>()
    return {
      overlays,
      dialogLifecycle: createOverlayLifecycle(overlays),
      toasts,
      toastLifecycle: createOverlayLifecycle(toasts),
      loading: createLoadingSlot(),
      hosts: { dialog: 0, toast: 0, loading: 0 },
      loadingHandles: new Set<number>(),
      toastHostScopes: new Map<string, number>(),
      toastTimers: new Map<number, readonly ReturnType<typeof setTimeout>[]>(),
      toastFinishTimers: new Map<number, ReturnType<typeof setTimeout>>(),
      toastCallbacks: new Map<number, (key: string) => void>(),
      toastExpansion: {
        expanded: false,
        stacking: false,
        visibleToasts: 3,
        configSnapshot: { enableStacking: false, visibleToasts: 3 },
        listeners: new Set<() => void>(),
        collapseAt: 0,
      },
    }
  })
}
