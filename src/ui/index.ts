// ui 层单点出口：只导出纯逻辑、命令式 API 与类型，不 re-export 组件。
// 组件按子域走 ./ui/* 按需 import；主出口不静态依赖 React / Taro，Node 自检可直接加载。
export type { DialogPayload, ToastPayload, ToastTone, ToastPosition, ToastActionDescriptor, UIState } from './state.js'
export { uiState } from './state.js'
export {
  markHostMounted,
  markHostUnmounted,
  isHostMounted,
  showToast,
  hideToast,
  closeToast,
  clearToasts,
  retargetToasts,
  sweepExpiredToasts,
  setToastExpansion,
  getToastExpansion,
  subscribeToastExpansion,
  setToastConfig,
  getToastConfig,
  showLoading,
  hideLoading,
  alert,
  confirm,
  resetUIForTests,
  type DialogOptions,
  type ToastOptions,
} from './commands.js'
