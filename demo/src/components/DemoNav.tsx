import Taro from '@tarojs/taro'
import { NavBar } from 'mp-taro-kit/ui/navigation'

import 'mp-taro-kit/ui/navigation/style'

// 系统信息进程内只取一次，页面切换不重复查询
const windowInfo = Taro.getWindowInfo()
const menuButton = Taro.getMenuButtonBoundingClientRect()

/** 演示站统一头部：替 Skyline 的 custom 导航栏提供标题与状态栏避让。 */
export function DemoNav({ title }: { title: string }) {
  return (
    <NavBar
      title={title}
      statusBarHeight={windowInfo.statusBarHeight ?? 0}
      menuButton={{ top: menuButton.top, height: menuButton.height }}
    />
  )
}
