import { View, Text } from '@tarojs/components'
import { Badge } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/display/style'
import { DemoPage } from '../../components/DemoBlock'

export default function BadgePage() {
  const render = (id: string) => {
    if (id === 'badge') {
      return (
        <View className="demo-row">
          <Badge count={3}>
            <View className="demo-cell">
              <Text>消息</Text>
            </View>
          </Badge>
          <Badge dot>
            <View className="demo-cell">
              <Text>更新</Text>
            </View>
          </Badge>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="badge" render={render} />
}
