import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Card } from 'mp-taro-kit/ui/card'
import {
  SafeArea,
  useLoadingState,
  useOverlayEntries,
} from 'mp-taro-kit/ui/infra'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/infra/style'
import { DemoPage } from '../../components/DemoBlock'

export default function InfraPage() {
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const loading = useLoadingState()
  const overlays = useOverlayEntries()

  const render = (id: string) => {
    if (id === 'safe-area') {
      return (
        <View>
          <View className="demo-row">
            <Button
              className="demo-item"
              onClick={() => setPosition(position === 'top' ? 'bottom' : 'top')}
            >
              {`切换 position（当前 ${position}）`}
            </Button>
          </View>
          <SafeArea position={position}>
            <Card size="sm" radius="sm" variant="filled" color="var(--mptk-surface-2)">
              <Text>安全区内的内容</Text>
            </Card>
          </SafeArea>
        </View>
      )
    }
    if (id === 'use-store') {
      return (
        <View>
          <Text className="demo-note">{`overlays: ${overlays.length}`}</Text>
          <Text className="demo-note">{`loading.active: ${loading.active ? 'true' : 'false'}`}</Text>
          <Text className="demo-note">两个 hook 订阅同一个跨副本单例，到命令式 API 页触发后会变化。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="infra" render={render} />
}
