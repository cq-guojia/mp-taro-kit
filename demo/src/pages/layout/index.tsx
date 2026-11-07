import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Mask, Overlay, Popup } from 'mp-taro-kit/ui/layout'

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
            <View className="demo-trigger" onClick={() => setMaskVisible(true)}>
              <Text>显示遮罩</Text>
            </View>
          </View>
          <Mask visible={maskVisible} onClose={() => setMaskVisible(false)} />
        </View>
      )
    }
    if (id === 'overlay') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setOverlayVisible(!overlayVisible)}>
              <Text>切换 visible</Text>
            </View>
          </View>
          <Overlay visible={overlayVisible}>
            <View className="demo-panel">
              <Text>覆盖层内容由 children 注入</Text>
            </View>
          </Overlay>
        </View>
      )
    }
    if (id === 'popup') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setPopupOpen(true)}>
              <Text>打开弹出层</Text>
            </View>
          </View>
          <Popup open={popupOpen} position="bottom" onClose={() => setPopupOpen(false)}>
            <View className="demo-panel">
              <Text>弹出层 = 遮罩 + 定位面板</Text>
            </View>
          </Popup>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="layout" render={render} />
}
