import { View, Text } from '@tarojs/components'
import { Card } from 'mp-taro-kit/ui/card'
import { Badge } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/style'
import { DemoPage } from '../../components/DemoBlock'

export default function BadgePage() {
  const render = (id: string) => {
    if (id === 'badge') {
      return (
        <View className="demo-row">
          <Badge count={3}>
            <Card size="sm" radius="sm" frame={false} color="var(--mptk-surface-2)">
              <Text>消息</Text>
            </Card>
          </Badge>
          <Badge dot>
            <Card size="sm" radius="sm" frame={false} color="var(--mptk-surface-2)">
              <Text>更新</Text>
            </Card>
          </Badge>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="badge" render={render} />
}
