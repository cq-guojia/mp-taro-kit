import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Card } from 'mp-taro-kit/ui/card'
import { Mask, Overlay, Popup } from 'mp-taro-kit/ui/layout'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

export default function LayoutPage() {
  const [maskVisible, setMaskVisible] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)

  const render = (id: string) => {
    if (id === 'mask') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setMaskVisible(true)}>
              显示遮罩
            </Button>
          </View>
          <Mask visible={maskVisible} onClose={() => setMaskVisible(false)} />
        </View>
      )
    }
    if (id === 'overlay') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setOverlayVisible(!overlayVisible)}>
              切换 visible
            </Button>
          </View>
          <Overlay visible={overlayVisible}>
            <Card variant="filled" size="lg">
              <Text>覆盖层内容由 children 注入</Text>
            </Card>
          </Overlay>
        </View>
      )
    }
    if (id === 'popup') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setPopupOpen(true)}>
              打开弹出层
            </Button>
          </View>
          <Popup open={popupOpen} position="bottom" onClose={() => setPopupOpen(false)}>
            <Card variant="filled" size="lg">
              <Text>弹出层 = 遮罩 + 定位面板</Text>
            </Card>
          </Popup>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="layout" render={render} />
}
