// ui 层单点出口：只导出纯逻辑、命令式 API 与类型，不 re-export 组件。
// 组件按子域走 ./ui/* 按需 import；主出口不静态依赖 React / Taro，Node 自检可直接加载。
export type { DialogPayload, UIState } from './state.js'
export { uiState } from './state.js'
export {
  markOverlayHostMounted,
  markOverlayHostUnmounted,
  isOverlayHostMounted,
  showToast,
  hideToast,
  clearToasts,
  showLoading,
  hideLoading,
  alert,
  confirm,
  resetUIForTests,
  type DialogOptions,
} from './commands.js'
export type { Notice, NoticeTone } from '../runtime/notify.js'
