export { alert, confirm } from '../../commands.js'
/** 宿主与 API 同进口：引对话框命令就拿到对应宿主，不必再去 app 里翻。 */
export { DialogHost, type DialogHostProps } from '../../infra/DialogHost.js'
export type { DialogOptions, DialogType } from '../../commands.js'
export type { DialogAction, DialogContent, DialogLayout, DialogPayload } from '../../state.js'
