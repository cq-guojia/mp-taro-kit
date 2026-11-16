import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Card } from 'mp-taro-kit/ui/card'
import { Popup } from 'mp-taro-kit/ui/layout'
import { showToast } from 'mp-taro-kit/ui'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

export default function PopupPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [layerOpen, setLayerOpen] = useState(false)
  const [scrollOpen, setScrollOpen] = useState(false)

  const render = (id: string) => {
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
    if (id === 'layers') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setLayerOpen(true)}>
              打开面板
            </Button>
          </View>
          <Popup open={layerOpen} position="bottom" onClose={() => setLayerOpen(false)}>
            <View className="demo-row">
              <Button className="demo-item" onClick={() => showToast('面板之上的轻提示', 'success')}>
                弹一条 Toast
              </Button>
            </View>
          </Popup>
        </View>
      )
    }
    if (id === 'scroll') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setScrollOpen(true)}>
              打开长面板
            </Button>
          </View>
          <Popup open={scrollOpen} position="bottom" onClose={() => setScrollOpen(false)}>
            {Array.from({ length: 30 }, (_, index) => (
              <View key={String(index)} className="demo-row">
                <Text>{`第 ${String(index + 1)} 行：面板限高 80vh，超出后内容自己滚`}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="popup" render={render} />
}
