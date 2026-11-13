import { View, Text } from '@tarojs/components'
import { Divider } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/display/style'
import { DemoPage } from '../../components/DemoBlock'

export default function DividerPage() {
  const render = (id: string) => {
    if (id === 'divider') {
      return (
        <View>
          <Text className="demo-note">上方</Text>
          <Divider />
          <Text className="demo-note">下方</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="divider" render={render} />
}
