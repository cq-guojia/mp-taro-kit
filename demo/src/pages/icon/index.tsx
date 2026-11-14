import { View, Text } from '@tarojs/components'
import { Icon, type IconSize } from 'mp-taro-kit/ui/display/icon'
import { iconNamesByPack } from 'mp-taro-kit/ui/icon/all'

import { DemoPage } from '../../components/DemoBlock'

// 按命名空间分组：跨框架通用库在前，本框架自有库在后；demo 自有图标不对外展示。
const GROUPS = [
  { id: 'common.base', title: 'common.base · 跨框架通用基础图标' },
  { id: 'common.logo', title: 'common.logo · 跨框架通用品牌标' },
  { id: 'mp-taro-kit.base', title: 'mp-taro-kit.base · 本框架基础图标' },
]

// 档位名与字号档同名，标注里写的就是它指向的那支 token，不写具体像素。
const SIZE_TIERS: ReadonlyArray<{ size: IconSize; token: string }> = [
  { size: 'xs', token: '--mptk-font-xs' },
  { size: 'sm', token: '--mptk-font-sm' },
  { size: 'md', token: '--mptk-font-md' },
  { size: 'lg', token: '--mptk-font-lg' },
  { size: 'xl', token: '--mptk-font-xl' },
  { size: 'nav', token: '--mptk-font-nav' },
]

export default function IconPage() {
  const render = (id: string) => {
    if (id === 'icon-size') {
      return (
        <View className="demo-icon-sizes">
          {SIZE_TIERS.map(({ size, token }) => (
            <View key={size} className="demo-icon-size">
              <Icon name="common.base:home" size={size} className="demo-icon-size__glyph" />
              <Text className="demo-icon-size__label">{size}</Text>
              <Text className="demo-icon-size__token">{token}</Text>
            </View>
          ))}
        </View>
      )
    }
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
