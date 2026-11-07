import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Drawer, Dropdown, type DrawerSide } from 'mp-taro-kit/ui/navigation'

import 'mp-taro-kit/ui/navigation/style'
import { DemoPage } from '../../components/DemoBlock'

export default function NavigationPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [side, setSide] = useState<DrawerSide>('left')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const render = (id: string) => {
    if (id === 'drawer') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setDrawerOpen(true)}>
              <Text>打开抽屉</Text>
            </View>
            <View
              className="demo-trigger"
              onClick={() => setSide(side === 'left' ? 'right' : 'left')}
            >
              <Text>{`切换 side（当前 ${side}）`}</Text>
            </View>
          </View>
          <Drawer open={drawerOpen} side={side} onClose={() => setDrawerOpen(false)}>
            <View className="demo-panel">
              <Text>抽屉内容由 children 注入</Text>
            </View>
          </Drawer>
        </View>
      )
    }
    if (id === 'dropdown') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <Text>切换 open</Text>
            </View>
          </View>
          <Dropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)}>
            <View className="demo-panel">
              <Text>下拉面板内容由 children 注入</Text>
            </View>
          </Dropdown>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="navigation" render={render} />
}
