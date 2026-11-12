import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'

import 'mp-taro-kit/ui/display/cell/style'
import { menu, pagePathOf } from '../../catalog'
import { DemoShell } from '../../components/DemoShell'

// 由 demo/config/index.js 的 defineConstants 在编译期替换。
declare const __MTPK_VERSION__: string
declare const __MTPK_BUILD_ID__: string
declare const __MTPK_RENDERER__: string

/** 目录页：顶部品牌信息与三个构建标签，下面按 menu 的固定分组铺单元格。 */
export default function IndexPage() {
  const go = (pageId: string | undefined) => {
    if (pageId === undefined) return
    void Taro.navigateTo({ url: `/${pagePathOf(pageId)}` })
  }

  return (
    <DemoShell title="MP-TARO-KIT" logo home>
      <View className="demo-hero">
        <Text className="mptk-icons-demo-color mptk-i-demo-color-logo demo-hero__logo" />
        <Text className="demo-hero__desc">基于 Taro + React 的小程序基础库</Text>
        <View className="demo-hero__meta">
          <Text className="demo-badge demo-badge--env">{__MTPK_RENDERER__}</Text>
          <Text className="demo-badge">{`v${__MTPK_VERSION__}`}</Text>
          <Text className="demo-badge">{__MTPK_BUILD_ID__}</Text>
        </View>
      </View>
      {menu.map((group) => (
        <CellGroup key={group.id} title={group.title} inset>
          {group.entries.map((entry) =>
            entry.status === 'ready' ? (
              <Cell key={entry.id} title={entry.label} isLink onClick={() => go(entry.pageId)} />
            ) : (
              <Cell key={entry.id} title={entry.label} disabled />
            ),
          )}
        </CellGroup>
      ))}
    </DemoShell>
  )
}
