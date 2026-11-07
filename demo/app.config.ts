// 页面清单与 window 配置的真源；Taro 按 sourceRoot: 'src' 读取，由 src/app.config.ts 转发本文件。
// renderer 改成 'webview' 即可退回 WebView；其余页面与样式不变。
import { appPages } from './src/catalog'

const appConfig = {
  pages: appPages,
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'mp-taro-kit',
    navigationBarTextStyle: 'black',
  },
  renderer: 'skyline',
}

export default appConfig
