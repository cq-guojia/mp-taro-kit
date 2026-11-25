// Taro-aware 装配出口：唯一 import @tarojs/taro 的库入口，主出口 src/index.ts 不引用。
// 样式按能力自带：KitPage 的浮动列样式在 KitPage.tsx 里引入，只引 createKitApp 不带你不需要的样式。
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
