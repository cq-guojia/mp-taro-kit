// 设计层对外常量：与 src/design/_tokens.scss 的档位一一对应。
// 值仍只在 tokens 里写一次，这里只声明「默认用哪一档」。

/** 控件尺寸档位名；三档取值见 `--mptk-control-h-*`。 */
export type ControlSizeTier = 'sm' | 'md' | 'lg'

/**
 * 承载文字的控件默认尺寸档：不传 `size` 时用这一档（48px，见 `--mptk-control-h-lg`）。
 * Button / Switch / Segmented 与将来的输入类控件共用它，新增控件直接引用，不要各写一次。
 * 宿主逐实例改默认值就传 `size`；要整体改一档的高度才覆盖 `--mptk-control-h-*`。
 */
export const CONTROL_SIZE_DEFAULT: ControlSizeTier = 'lg'
