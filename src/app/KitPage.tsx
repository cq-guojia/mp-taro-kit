import { createContext, useContext, useRef, type ReactNode } from 'react'
import Taro from '@tarojs/taro'
import {
  BackToTop,
  FloatingAction,
  FloatingActionGroup,
  scrollViewToTop,
  useBackToTop,
  type FloatingActionPosition,
} from '../ui/layout/floating-action/index.js'

interface ScrollNode {
  scrollTo?: (option: { top: number; duration?: number; animated?: boolean }) => void
}

type ScrollReceiver = (top: number) => void

/** null = 不在 KitPage 内；消费方 scroll-view 的 onScroll 调它喂回顶显隐，不触发 setState 回灌。 */
const KitPageScrollContext = createContext<ScrollReceiver | null>(null)

/** 在消费方 scroll-view 所在组件调用，绑到 onScroll={(e) => onScroll(e.detail.scrollTop)}。 */
export function useKitPageScroll(): ScrollReceiver {
  const receiver = useContext(KitPageScrollContext)
  if (receiver === null) {
    throw new Error('[mp-taro-kit/app] useKitPageScroll 必须在 <KitPage> 内使用；请把页面用 <KitPage> 包一层')
  }
  return receiver
}

export interface KitAction {
  /** 稳定 key；hideActions 用同一个 id 屏蔽。 */
  id: string
  icon: string
  onClick: () => void
  className?: string
}

export interface KitPageProps {
  children?: ReactNode
  /** 右侧列默认带 backToTop 回顶按钮；传 false 或放进 hideActions 即关。 */
  backToTop?: boolean
  /** 回顶触发的滚动容器 id（Skyline 下滚动在消费方的 scroll-view 上）。 */
  scrollViewId?: string
  /** 回顶阈值，默认 300。 */
  visibilityHeight?: number
  /** 回顶时长：0 = 瞬间，正数 = 动画（仅 iOS 生效，安卓平台限制）。 */
  duration?: number
  /** 业务追加的按钮，如设置入口；与默认回顶一起竖排在右侧列。 */
  actions?: readonly KitAction[]
  /** 屏蔽默认项或业务项：传 id，如 ['backToTop']。 */
  hideActions?: readonly string[]
  /** 列的位置档，默认右下。 */
  position?: FloatingActionPosition
}

/**
 * 页面壳：每页包一层即得到右侧浮动列（默认回顶 + 业务 actions）。
 * 不继承、不编译注入、不碰滚动容器的受控状态——滚动位置只读喂给 hook。
 */
export function KitPage({
  children,
  backToTop = true,
  scrollViewId = 'mptk-page-scroll',
  visibilityHeight = 300,
  duration = 450,
  actions = [],
  hideActions = [],
  position = 'bottom-right',
}: KitPageProps) {
  const nodeRef = useRef<ScrollNode | null>(null)
  const { visible, onScroll } = useBackToTop({ visibilityHeight })

  const handleBack = (): void => {
    const emit = (node: ScrollNode): void => scrollViewToTop(node, duration)
    if (nodeRef.current !== null) {
      emit(nodeRef.current)
      return
    }
    Taro.createSelectorQuery()
      .select(`#${scrollViewId}`)
      .node()
      .exec((res) => {
        const node = res?.[0]?.node as ScrollNode | null | undefined
        if (node !== null && node !== undefined) {
          nodeRef.current = node
          emit(node)
        }
      })
  }

  // backToTop 是保留 id：业务 action 用它会在切页/屏蔽时和默认项混在一起，当场拒绝。
  for (const action of actions) {
    if (action.id === 'backToTop') {
      throw new Error('[mp-taro-kit/app] KitPage 的 actions 里 id="backToTop" 是保留字；默认回顶请用 backToTop 开关')
    }
  }

  const hidden = new Set<string>(hideActions)
  const items: ReactNode[] = []

  if (backToTop) {
    items.push(<BackToTop key="backToTop" visible={visible} onClick={handleBack} />)
  }
  for (const action of actions) {
    if (hidden.has(action.id)) continue
    items.push(
      <FloatingAction key={action.id} icon={action.icon} className={action.className} onClick={action.onClick} />,
    )
  }

  return (
    <KitPageScrollContext.Provider value={onScroll}>
      {children}
      {items.length === 0 ? null : (
        <FloatingActionGroup position={position}>{items}</FloatingActionGroup>
      )}
    </KitPageScrollContext.Provider>
  )
}
