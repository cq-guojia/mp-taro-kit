import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { iconClass } from 'mp-taro-kit/ui/icon'
import { catalog } from '../../catalog'
import { DemoShell } from '../../components/DemoShell'

// 由 demo/config/index.js 的 defineConstants 在编译期替换。
declare const __MTPK_VERSION__: string
declare const __MTPK_BUILD_ID__: string
declare const __MTPK_RENDERER__: string

/** 目录页：顶部居中品牌信息与三个构建标签，下面按 catalog 的能力域分组铺 Vant 风格 cell。 */
export default function IndexPage() {
  return (
    <DemoShell title="MP-TARO-KIT" logo home>
      <View className="demo-hero">
        <Text className={`${iconClass('logo')} demo-hero__logo`} />
        <Text className="demo-hero__desc">基于 Taro + React 的小程序基础库</Text>
        <View className="demo-hero__meta">
          <Text className="demo-badge demo-badge--env">{__MTPK_RENDERER__}</Text>
          <Text className="demo-badge">{`v${__MTPK_VERSION__}`}</Text>
          <Text className="demo-badge">{__MTPK_BUILD_ID__}</Text>
        </View>
      </View>
      {catalog.map((group) => (
        <View key={group.id} className="demo-group">
          <Text className="demo-group__title">{group.title}</Text>
          {group.pages.map((page) => (
            <View
              key={page.id}
              className="demo-entry"
              onClick={() => void Taro.navigateTo({ url: `/${page.path}` })}
            >
              <View className="demo-entry__main">
                <Text className="demo-entry__title">{page.title}</Text>
                <Text className="demo-entry__summary">{page.summary}</Text>
              </View>
              <Text className={`${iconClass('move-right')} demo-entry__arrow`} />
            </View>
          ))}
        </View>
      ))}
    </DemoShell>
  )
}
