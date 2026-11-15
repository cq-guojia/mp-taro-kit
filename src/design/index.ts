// 设计层对外常量：值由生成器从 kit.config.mjs 写成字面量产物。
// design 层不运行时 import runtime（保持五层依赖方向），只读同层的生成物。

/**
 * 全库高度刻度：档名与物理高度一一对应，见 `--mptk-control-h-*`（16 / 24 / 32 / 40 / 48 / 56）。
 * 可点控件的枚举是它的子集（不含 `xxs`）；展示类标签从 `xxs` 起。
 */
export type ControlSizeTier = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 承载文字的控件默认尺寸档：不传 `size` 时用这一档（见 `--mptk-control-h-md`）。
 * Button / Switch / Segmented 与将来的输入类控件共用它，新增控件直接引用，不要各写一次。
 * 要整体改默认档，改 kit.config.mjs 的 runtime.controlSizeDefault 并重新构建。
 */
export { CONTROL_SIZE_DEFAULT, KIT_RUNTIME_DEFAULTS } from './kit-config.generated.js'
