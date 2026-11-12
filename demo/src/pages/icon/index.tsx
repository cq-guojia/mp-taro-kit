import { View, Text } from '@tarojs/components'
import { iconClass, iconNames } from 'mp-taro-kit/ui/icon'

import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

export default function IconPage() {
  const render = (id: string) => {
    if (id !== 'icon-grid') return null
    return (
      <View className="demo-icon-grid">
        {iconNames.map((name) => (
          <View key={name} className="demo-icon-cell">
            <Text className={`${iconClass(name)} demo-icon-cell__glyph`} />
            <Text className="demo-icon-cell__name">{name}</Text>
          </View>
        ))}
      </View>
    )
  }

  return <DemoPage pageId="icon" render={render} />
}
