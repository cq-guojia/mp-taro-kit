import { View, Text } from '@tarojs/components'
import { Icon } from 'mp-taro-kit/ui/display/icon'
import { iconNamesByPack } from 'mp-taro-kit/ui/icon/all'

import { DemoPage } from '../../components/DemoBlock'

// 按命名空间分组：跨框架通用库在前，本框架自有库在后；demo 自有图标不对外展示。
const GROUPS = [
  { id: 'common.base', title: 'common.base · 跨框架通用基础图标' },
  { id: 'common.logo', title: 'common.logo · 跨框架通用品牌标' },
  { id: 'mp-taro-kit.base', title: 'mp-taro-kit.base · 本框架基础图标' },
]

export default function IconPage() {
  const render = (id: string) => {
    if (id !== 'icon-grid') return null
    return (
      <View>
        {GROUPS.map((group) => {
          const names = iconNamesByPack[group.id] ?? []
          return (
            <View key={group.id} className="demo-icon-group">
              <Text className="demo-icon-group__title">{group.title}</Text>
              {names.length === 0 ? (
                <Text className="demo-icon-group__empty">当前为空包（平台占位）</Text>
              ) : (
                <View className="demo-icon-grid">
                  {names.map((name) => (
                    <View key={name} className="demo-icon-cell">
                      <Icon name={`${group.id}:${name}`} className="demo-icon-cell__glyph" />
                      <Text className="demo-icon-cell__name">{name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>
    )
  }

  return <DemoPage pageId="icon" render={render} />
}
