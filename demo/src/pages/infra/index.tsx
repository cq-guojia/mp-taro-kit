import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { isOverlayHostMounted } from 'mp-taro-kit/ui'
import {
  SafeArea,
  useLoadingState,
  useNotices,
  useOverlayEntries,
} from 'mp-taro-kit/ui/infra'

import 'mp-taro-kit/ui/infra/style'
import { DemoPage } from '../../components/DemoBlock'

export default function InfraPage() {
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const notices = useNotices()
  const loading = useLoadingState()
  const overlays = useOverlayEntries()

  const render = (id: string) => {
    if (id === 'overlay-host') {
      return (
        <View>
          <Text className="demo-note">
            {`已挂载：<OverlayHost /> = ${isOverlayHostMounted() ? 'true' : 'false'}`}
          </Text>
          <Text className="demo-note">由 app.tsx 全局挂一次；命令式 API 依赖它。</Text>
        </View>
      )
    }
    if (id === 'safe-area') {
      return (
        <View>
          <View className="demo-row">
            <View
              className="demo-trigger"
              onClick={() => setPosition(position === 'top' ? 'bottom' : 'top')}
            >
              <Text>{`切换 position（当前 ${position}）`}</Text>
            </View>
          </View>
          <SafeArea position={position}>
            <View className="demo-cell">
              <Text>安全区内的内容</Text>
            </View>
          </SafeArea>
        </View>
      )
    }
    if (id === 'use-store') {
      return (
        <View>
          <Text className="demo-note">{`notices: ${notices.length}`}</Text>
          <Text className="demo-note">{`overlays: ${overlays.length}`}</Text>
          <Text className="demo-note">{`loading.active: ${loading.active ? 'true' : 'false'}`}</Text>
          <Text className="demo-note">三个 hook 订阅同一个跨副本单例，到命令式 API 页触发后会变化。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="infra" render={render} />
}
