import { ScrollView, View } from '@tarojs/components'
import { PageShell } from 'mp-taro-kit/ui/infra'
import { KitPage, useKitPageScroll, type KitAction } from 'mp-taro-kit/app'
import type { ReactNode } from 'react'
import { DemoNav } from './DemoNav'

/**
 * 页面外壳：Skyline 不支持页面全局滚动，滚动必须由 scroll-view 承担，
 * 所以每个页面都是「固定视口高度的外壳 + 唯一滚动区」，导航栏放在滚动区外面。
 *
 * 右侧浮动列默认由 <KitPage /> 提供（回顶 + 业务 actions）；要演示底层各轴的页面
 * 传 hideActions 关掉默认列，再用 floating 挂自己的手写列。
 *
 * 滚动区是非受控的：绝不把 onScroll 的位置回写成 scrollTop 属性——那是每帧 setData、
 * 视图被往回钉的卡顿/残影根源；KitPage 的 onScroll 只读位置喂回顶显隐。
 */
function ShellBody({
  scrollViewId,
  onScrollTop,
  children,
}: {
  scrollViewId: string
  onScrollTop?: (top: number) => void
  children: ReactNode
}) {
  const onScroll = useKitPageScroll()
  return (
    <ScrollView
      id={scrollViewId}
      scrollY
      type="custom"
      enhanced
      className="demo-shell__body"
      onScroll={(event) => {
        onScroll(event.detail.scrollTop)
        onScrollTop?.(event.detail.scrollTop)
      }}
    >
      <View className="demo-page">{children}</View>
    </ScrollView>
  )
}

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
  /** 滚动区 id，KitPage 据此拿节点做程序化回顶。 */
  scrollViewId?: string
  /** 演示底层轴时挂自己的手写列（在滚动区外）。 */
  floating?: ReactNode
  /** 额外的只读滚动回执，给手写列的回顶显隐用。 */
  onScrollTop?: (top: number) => void
  children: ReactNode
}) {
  const id = scrollViewId ?? 'demo-default-scroll'
  return (
    <PageShell className="demo-shell">
      <KitPage actions={actions} hideActions={hideActions} backToTop={backToTop} scrollViewId={id}>
        <DemoNav title={title} logo={logo} home={home} />
        <ShellBody scrollViewId={id} onScrollTop={onScrollTop}>{children}</ShellBody>
      </KitPage>
      {floating}
    </PageShell>
  )
}
