// Taro-aware 装配出口：唯一 import @tarojs/taro 的库入口，主出口 src/index.ts 不引用。
// KitPage 依赖浮动按钮列的 fixed 定位；样式随出口自带，消费方只 import 本出口即可，不必再单独引 style。
import '../ui/layout/floating-action/style/index.css'
export { createKitApp, type CreateKitAppOptions, type CommandHost, type ThemeConfig } from './create-kit-app.js'
export { createTaroFaces } from './taro-faces.js'
export { KitPage, useKitPageScroll, type KitPageProps, type KitAction } from './KitPage.js'
// 三件命令宿主也从这里导出，createKitApp 的 hosts 参数直接用这里的组件。
export { ToastHost, type ToastHostProps } from '../ui/infra/ToastHost.js'
export { DialogHost, type DialogHostProps } from '../ui/infra/DialogHost.js'
export { LoadingHost, type LoadingHostProps } from '../ui/infra/LoadingHost.js'
export { LoginDialogHost } from './LoginDialogHost.js'
export {
  setLoginDialog,
  getLoginDialogComponent,
  requireLogin,
  resolveLogin,
  subscribeLoginDialog,
  type LoginDialogProps,
  type LoginDialogComponent,
} from './login-dialog.js'
