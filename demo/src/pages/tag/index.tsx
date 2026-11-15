import { Text, View } from '@tarojs/components'
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
    if (id === 'tag-size') {
      return (
        <View>
          <View className="demo-row">
            <Tag className="demo-item" size="xxs">xxs 16</Tag>
            <Tag className="demo-item" size="xs">xs 24</Tag>
            <Tag className="demo-item" size="sm">sm 32</Tag>
            <Tag className="demo-item" size="md">md 40</Tag>
          </View>
          <Text className="demo-note">同名档与控件等高：标签 xs 与 Button xs 都是 24</Text>
        </View>
      )
    }
    if (id === 'tag-shape') {
      return (
        <View className="demo-row">
          <Tag className="demo-item">小圆角</Tag>
          <Tag className="demo-item" shape="round">两端半圆</Tag>
          <Tag className="demo-item" shape="mark">单侧半圆</Tag>
          <Tag className="demo-item" shape="round" plain type="primary">胶囊空心</Tag>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="tag" render={render} />
}
