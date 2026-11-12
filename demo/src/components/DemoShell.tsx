import { ScrollView, View } from '@tarojs/components'
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
 * `type="custom"`：Skyline 的 scroll-view 默认是 list 模式（按直接子节点做列表按需渲染，
 * 单子节点还会性能退化），整页是「一个容器包标题 + 多个块」的复杂布局，属 custom 模式的场景。
 */
export function DemoShell({
  title,
  logo,
  home,
  children,
}: {
  title: string
  logo?: boolean
  home?: boolean
  children: ReactNode
}) {
  return (
    <View className="demo-shell">
      <DemoNav title={title} logo={logo} home={home} />
      <ScrollView scrollY type="custom" className="demo-shell__body">
        <View className="demo-page">{children}</View>
      </ScrollView>
    </View>
  )
}
