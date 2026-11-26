import { ScrollView, View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { getSafeAreaSnapshot } from '../../runtime/safe-area.js'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { Overlay } from '../layout/Overlay.js'
import { MOTION_DURATION, usePresence } from '../layout/presence.js'
import { resolveBottomInset, resolveTopInset } from '../layout/safe-inset.js'

export type DrawerSide = 'left' | 'right'

export interface DrawerProps {
  open: boolean
  side?: DrawerSide
  children?: ReactNode
  onClose?: () => void
  /** 是否渲染遮罩，默认渲染 */
  overlay?: boolean
  /** 点遮罩是否关闭，默认关闭 */
  closable?: boolean
  lockScroll?: boolean
  duration?: number
  /** 退场动画完成后触发一次，见 Popup */
  onExited?: () => void
  className?: string
}

/** 侧滑面板：不用 Skyline 独占手势 API，两端表现一致；遮罩走 layout 那一份。 */
export function Drawer({
  open,
  side = 'left',
  children,
  onClose,
  overlay = true,
  closable = true,
  lockScroll = true,
  duration = MOTION_DURATION,
  onExited,
  className,
}: DrawerProps) {
  const { mounted, open: shown } = usePresence(open, duration, { onExited })
  if (!mounted) return null

  // 抽屉与 Popup 左右档同口径：面板贴边，让位单独加在内容上。
  const snapshot = getSafeAreaSnapshot()
  const inset = resolveTopInset('nav-bar', snapshot)
  const bodyStyle = inset.paddingTop > 0 ? { paddingTop: `${inset.paddingTop}px` } : undefined
  // 底部横条留白 = max(呼吸, 横条)，放在滚动内容末尾的尾距 View 上（随内容滚、能滑上去），
  // 不写在面板/ScrollView 自身上——那会把全高抽屉的滚动可视区截短、滚不到底。
  // 未注入时不写，交 CSS 尾距兜底。
  const bottomPadding = resolveBottomInset(snapshot).paddingBottom
  const tailStyle = bottomPadding > 0 ? { paddingBottom: `${bottomPadding}px` } : undefined

  const names = ['mptk-drawer', `mptk-drawer--${side}`, shown ? 'mptk-drawer--open' : '']
  const panel = ['mptk-drawer__panel', `mptk-drawer__panel--${side}`, className]

  return (
    <View className={names.filter(Boolean).join(' ')}>
      {overlay ? (
        <Overlay visible={shown} closable={closable} lockScroll={lockScroll} duration={duration} onClose={onClose} />
      ) : null}
      <View className={panel.filter(Boolean).join(' ')}>
        <ScrollView scrollY className="mptk-drawer__body" style={bodyStyle}>
          {children}
          <View className="mptk-drawer__tail" style={tailStyle} />
        </ScrollView>
      </View>
    </View>
  )
}

/* 向 Card 声明：抽屉是浮层，关闭时渲染 null、不占内容流。 */
markCardEdgeOutOfFlow(Drawer)
