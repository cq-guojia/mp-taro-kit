// Taro 在编译期读取本文件的默认导出。
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
