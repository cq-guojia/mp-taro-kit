import { View, Text } from '@tarojs/components'

export interface NavBarMenuButton {
  /** 胶囊按钮顶部相对屏幕顶部的距离（px） */
  top: number
  /** 胶囊按钮高度（px） */
  height: number
}

export interface NavBarProps {
  title?: string
  /** 状态栏高度（px），由调用方从平台取 */
  statusBarHeight: number
  /** 右上胶囊按钮几何信息，由调用方从平台取 */
  menuButton: NavBarMenuButton
  showBack?: boolean
  onBack?: () => void
  className?: string
}

/**
 * 自定义导航栏：Skyline 页面 `navigationStyle: custom` 时替代原生导航条。
 * 尺寸对齐微信原生（内容区 44px、标题 17px），内容区高度 = 胶囊高 + 上下对称留白。
 * 系统信息由调用方注入，组件不依赖 Taro 与 core，也不使用 Skyline 命中不可靠的 fixed。
 */
export function NavBar({
  title,
  statusBarHeight,
  menuButton,
  showBack = false,
  onBack,
  className,
}: NavBarProps) {
  const gap = Math.max(menuButton.top - statusBarHeight, 0)
  const contentHeight = menuButton.height + gap * 2
  const names = ['mptk-navbar', className].filter(Boolean)
  return (
    <View className={names.join(' ')} style={{ paddingTop: `${statusBarHeight}px` }}>
      <View className="mptk-navbar__content" style={{ height: `${contentHeight}px` }}>
        {showBack ? (
          <View className="mptk-navbar__back" onClick={() => onBack?.()}>
            <Text className="mptk-navbar__back-icon">{'‹'}</Text>
          </View>
        ) : null}
        {title === undefined ? null : <Text className="mptk-navbar__title">{title}</Text>}
      </View>
    </View>
  )
}
