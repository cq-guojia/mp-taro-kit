import type { ReactNode } from 'react'
import { createKitApp, ToastHost, DialogHost, LoadingHost } from 'mp-taro-kit/app'
import themeConfig from './theme.json'

import 'mp-taro-kit/styles/theme-runtime'
import 'mp-taro-kit/ui/infra/style'
// 对外图标样式由 Icon 组件出口带入，这里只引演示站自有的图标样式。
import './icons/mp-taro-kit/demo/color/style/index.scss'
import './app.scss'

function App({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

// 一条接入：13 个平台 faces 走 Taro 默认实现，安全区 / 主题 / 命令宿主全收在这里。
// 主题样式与 app.json / theme.json 仍留在消费方（编译期 / 业务自己的东西）。
export default createKitApp(App, {
  theme: { mode: 'auto', themeConfig },
  hosts: [ToastHost, DialogHost, LoadingHost],
})
