import Taro from '@tarojs/taro'
import { Text } from '@tarojs/components'
import { iconClass } from 'mp-taro-kit/ui/icon'
import { NavBar } from 'mp-taro-kit/ui/navigation'

// 图标字体样式由 app.tsx 全局引入一次，这里不再重复
import 'mp-taro-kit/ui/navigation/style'

// 系统信息进程内只取一次，页面切换不重复查询
const windowInfo = Taro.getWindowInfo()
const menuButton = Taro.getMenuButtonBoundingClientRect()

const HOME_URL = '/pages/index/index'

/**
 * 演示站统一头部：替 Skyline 的 custom 导航栏提供标题与状态栏避让。
 *
 * 返回行为对齐原生：栈里有上一页就返回上一页；没有上一页（分享或扫码直达某个子页）就回首页，
 * 图标随之从箭头换成小房子。入口页本身由页面用 `home` 声明，既不出返回键也不出房子。
 */
export function DemoNav({
  title,
  logo = false,
  home = false,
}: {
  title: string
  logo?: boolean
  home?: boolean
}) {
  const canGoBack = Taro.getCurrentPages().length > 1

  const back = () => {
    if (canGoBack) {
      void Taro.navigateBack({ delta: 1 })
      return
    }
    void Taro.reLaunch({ url: HOME_URL })
  }

  return (
    <NavBar
      title={title}
      titleIcon={logo ? <Text className={`${iconClass('logo')} demo-nav__logo`} /> : undefined}
      statusBarHeight={windowInfo.statusBarHeight ?? 0}
      menuButton={{ top: menuButton.top, height: menuButton.height }}
      showBack={!home}
      backIcon={
        <Text className={`${iconClass(canGoBack ? 'move-left' : 'home')} demo-nav__back`} />
      }
      onBack={back}
    />
  )
}
