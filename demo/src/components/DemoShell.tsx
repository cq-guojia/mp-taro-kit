import { ScrollView, View } from '@tarojs/components'
import { PageShell } from 'mp-taro-kit/ui/infra'
import type { ReactNode } from 'react'
import { DemoNav } from './DemoNav'

/**
 * 页面外壳：Skyline 不支持页面全局滚动，滚动必须由 scroll-view 承担，
 * 所以每个页面都是「固定视口高度的外壳 + 唯一滚动区」，导航栏放在滚动区外面。
 *
 * 高度链路：page 基线（styles/tokens）只给满屏高度 → 外壳 height: 100% 吃满，自己用
 * padding-bottom 让出底部安全区并铺背景（Skyline 下 page 的 padding 区不画背景，会露白）→
 * 正文区 flex 吃满剩余高度。
 *
 * 根节点用库的 <PageShell /> 替换原来的根 <View />：它是主题根标记的落点，
 * 层级不增加，也不设 height；高度链仍由 .demo-shell 控制。
 *
 * `type="custom"`：Skyline 的 scroll-view 默认是 list 模式（按直接子节点做列表按需渲染，
 * 单子节点还会性能退化），整页是「一个容器包标题 + 多个块」的复杂布局，属 custom 模式的场景。
 *
 * 滚动区是非受控的：绝不把 onScroll 的位置回写成 scrollTop 属性——那是每帧 setData、
 * 视图被往回钉的卡顿/残影根源；回顶由消费方拿 scrollViewId 发节点命令，不碰 scrollTop。
 */
export function DemoShell({
  title,
  logo,
  home,
  floating,
  scrollViewId,
  onScrollTop,
  children,
}: {
  title: string
  logo?: boolean
  home?: boolean
  /** 常驻浮层（如浮动按钮列）：挂滚动区外才不会被 scroll-view 裁掉或跟着滚。 */
  floating?: ReactNode
  /** 给滚动区一个 id，消费方据此拿节点做程序化回顶。 */
  scrollViewId?: string
  /** 滚动位置只读回调（e.detail.scrollTop）；不回写、不重渲染。 */
  onScrollTop?: (top: number) => void
  children: ReactNode
}) {
  return (
    <PageShell className="demo-shell">
      <DemoNav title={title} logo={logo} home={home} />
      <ScrollView
        id={scrollViewId}
        scrollY
        type="custom"
        enhanced
        className="demo-shell__body"
        onScroll={(event) => onScrollTop?.(event.detail.scrollTop)}
      >
        <View className="demo-page">{children}</View>
      </ScrollView>
      {floating}
    </PageShell>
  )
}
