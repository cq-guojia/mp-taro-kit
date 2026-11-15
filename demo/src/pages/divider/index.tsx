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
    if (id === 'divider-content') {
      return (
        <View className="demo-stack">
          <Divider className="demo-item" contentPosition="left">靠左</Divider>
          <Divider className="demo-item">居中</Divider>
          <Divider className="demo-item" contentPosition="right">靠右</Divider>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="divider" render={render} />
}
