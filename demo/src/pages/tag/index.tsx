import { View } from '@tarojs/components'
import { Tag } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/display/style'
import { DemoPage } from '../../components/DemoBlock'

export default function TagPage() {
  const render = (id: string) => {
    if (id === 'tag') {
      return (
        <View className="demo-row">
          <Tag className="demo-item">标签</Tag>
          <Tag className="demo-item" type="primary">业务</Tag>
        </View>
      )
    }
    if (id === 'tag-type') {
      return (
        <View className="demo-row">
          <Tag className="demo-item">默认</Tag>
          <Tag className="demo-item" type="primary">业务</Tag>
          <Tag className="demo-item" type="success">成功</Tag>
          <Tag className="demo-item" type="warning">警告</Tag>
          <Tag className="demo-item" type="danger">危险</Tag>
        </View>
      )
    }
    if (id === 'tag-plain') {
      return (
        <View className="demo-row">
          <Tag className="demo-item" plain>默认</Tag>
          <Tag className="demo-item" plain type="primary">业务</Tag>
          <Tag className="demo-item" plain type="success">成功</Tag>
          <Tag className="demo-item" plain type="warning">警告</Tag>
          <Tag className="demo-item" plain type="danger">危险</Tag>
        </View>
      )
    }
    if (id === 'tag-round') {
      return (
        <View className="demo-row">
          <Tag className="demo-item" round>默认</Tag>
          <Tag className="demo-item" round plain type="primary">胶囊</Tag>
          <Tag className="demo-item" round type="danger">危险</Tag>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="tag" render={render} />
}
