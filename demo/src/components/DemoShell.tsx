import { useState } from 'react'
import { ScrollView, View } from '@tarojs/components'
import { PageShell } from 'mp-taro-kit/ui/infra'
import { KitPage, type KitAction } from 'mp-taro-kit/app'
import type { ReactNode } from 'react'
import { DemoNav } from './DemoNav'
import { DemoSettings } from './DemoSettings'

/**
 * 页面外壳：Skyline 不支持页面全局滚动，滚动必须由 scroll-view 承担，
 * 所以每个页面都是「固定视口高度的外壳 + 唯一滚动区」，导航栏放在滚动区外面。
 *
 * 右侧浮动列默认由 <KitPage /> 提供（回顶 + 业务 actions）。滚动区作为 KitPage 的直接
 * children，KitPage 自动注入回顶所需的 id / enhanced / onScroll——页面不写这些。
 * 要演示底层各轴的 layout 页传 scrollViewId 走显式路径，并挂自己的手写列。
 *
 * 滚动区是非受控的：绝不把 onScroll 的位置回写成 scrollTop 属性——那是每帧 setData、
 * 视图被往回钉的卡顿/残影根源；回顶显隐由 KitPage 注入的 onScroll 只读喂入。
 */
export function DemoShell({
  title,
  logo,
  home,
  actions = [],
  hideActions = [],
  backToTop = true,
  scrollViewId,
  floating,
  onScrollTop,
  children,
}: {
  title: string
  logo?: boolean
  home?: boolean
  /** 右侧列的业务按钮；默认只有回顶，设置入口从这里加。 */
  actions?: readonly KitAction[]
  /** 屏蔽默认回顶或业务项：传 id。 */
  hideActions?: readonly string[]
  /** 默认回顶开关；要演示底层各轴的页面传 false。 */
  backToTop?: boolean
  /** 显式滚动区 id；不传则 KitPage 自动认领下面第一个 ScrollView。 */
  scrollViewId?: string
  /** 演示底层轴时挂自己的手写列（在滚动区外）。 */
  floating?: ReactNode
  /** 额外的只读滚动回执，给手写列的回顶显隐用。 */
  onScrollTop?: (top: number) => void
  children: ReactNode
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  // 设置入口是 demo 站级常驻能力，不属于任何页面的 actions，也不受 hideActions 屏蔽。
  const allActions: readonly KitAction[] = [
    ...actions,
    { id: 'demo-settings', icon: 'common.base:shezhi', onClick: () => setSettingsOpen(true) },
  ]
  return (
    <PageShell className="demo-shell">
      <KitPage actions={allActions} hideActions={hideActions} backToTop={backToTop} scrollViewId={scrollViewId}>
        <DemoNav title={title} logo={logo} home={home} />
        <ScrollView
          key="demo-main-scroll"
          id={scrollViewId}
          scrollY
          type="custom"
          enhanced={scrollViewId !== undefined}
          className="demo-shell__body"
          onScroll={(event) => onScrollTop?.(event.detail.scrollTop)}
        >
          <View className="demo-page">{children}</View>
        </ScrollView>
      </KitPage>
      {floating}
      {/* 浮层隔离层：恒定存在，浮层只在它内部增删，绝不与 ScrollView 同级插拔。
          Taro 把 React 更新归级到 Page.setData；浮层若在页面根下直接增删，
          渲染层 diff 会连带重建原生 scroll-view，scrollTop（实例状态）归零、回顶。
          套这一层后 ScrollView 始终待在稳定分支上，浮层开合只动本容器内部。 */}
      <View className="demo-shell__overlays">
        <DemoSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </View>
    </PageShell>
  )
}
