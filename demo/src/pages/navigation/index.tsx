import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Card } from 'mp-taro-kit/ui/card'
import { Drawer, Dropdown, NavBar, type DrawerSide } from 'mp-taro-kit/ui/navigation'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/navigation/style'
import { DemoPage } from '../../components/DemoBlock'

export default function NavigationPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [side, setSide] = useState<DrawerSide>('left')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const render = (id: string) => {
    if (id === 'navbar') {
      return (
        <View>
          <NavBar title="自定义导航栏" statusBarHeight={0} menuButton={{ top: 0, height: 44 }} />
          <Text className="demo-note">
            状态栏高度与右上胶囊几何由调用方从平台取；组件只管排版，不依赖 Taro 与 core。
          </Text>
        </View>
      )
    }
    if (id === 'drawer') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setDrawerOpen(true)}>
              打开抽屉
            </Button>
            <Button
              className="demo-item"
              onClick={() => setSide(side === 'left' ? 'right' : 'left')}
            >
              {`切换 side（当前 ${side}）`}
            </Button>
          </View>
          <Drawer open={drawerOpen} side={side} onClose={() => setDrawerOpen(false)}>
            <Card frame={false} size="lg">
              <Text>抽屉内容由 children 注入</Text>
            </Card>
          </Drawer>
        </View>
      )
    }
    if (id === 'dropdown') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setDropdownOpen(!dropdownOpen)}>
              切换 open
            </Button>
          </View>
          <Dropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)}>
            <Card frame={false} size="lg">
              <Text>下拉面板内容由 children 注入</Text>
            </Card>
          </Dropdown>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="navigation" render={render} />
}
