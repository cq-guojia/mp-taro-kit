import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { catalog } from '../../catalog'
import { DemoNav } from '../../components/DemoNav'

/** 目录页：只读 catalog 渲染分组与跳转，不放示例。 */
export default function IndexPage() {
  return (
    <View className="demo-page">
      <DemoNav title="mp-taro-kit" />
      <View className="demo-page__head">
        <Text className="demo-page__summary">按能力域分组的组件效果与使用方法</Text>
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
              <Text className="demo-entry__title">{page.title}</Text>
              <Text className="demo-entry__summary">{page.summary}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
