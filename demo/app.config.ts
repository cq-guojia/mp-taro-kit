// 页面清单与 window 配置的真源；Taro 按 sourceRoot: 'src' 读取，由 src/app.config.ts 转发本文件。
// renderer 改成 'webview' 即可退回 WebView；其余页面与样式不变。
import { appPages } from './src/catalog'

const appConfig = {
  pages: appPages,
  // 官方 DarkMode：darkmode 让 getSystemInfoSync().theme / onThemeChange 有有效值；
  // themeLocation 的 @变量由框架在页面创建前解析，窗口底色与导航栏首帧就随系统主题正确。
  darkmode: true,
  themeLocation: 'theme.json',
  window: {
    backgroundColor: '@bgColor',
    backgroundColorTop: '@bgColor',
    backgroundColorBottom: '@bgColor',
    backgroundTextStyle: '@bgTxtStyle',
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTitleText: 'mp-taro-kit',
    navigationBarTextStyle: '@navTxtStyle',
  },
  renderer: 'skyline',
  componentFramework: 'glass-easel',
  lazyCodeLoading: 'requiredComponents',
  rendererOptions: {
    skyline: {
      defaultDisplayBlock: true,
      defaultContentBox: true,
    },
  },
}

export default appConfig
