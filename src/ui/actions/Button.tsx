import { useRef, useState } from 'react'
import { View, Text } from '@tarojs/components'
import type { CSSProperties, ReactNode } from 'react'
import { isThenable, isSuccess } from '../../runtime/thenable.js'
import { CONTROL_SIZE_DEFAULT } from '../../design/index.js'
import { useControlGate } from '../infra/popup-lock/index.js'
import { Icon } from '../display/icon/Icon.js'
import { PRESS_STAY_TIME } from '../infra/press.js'
import { Spinner } from '../feedback/spinner/Spinner.js'
import { resolveButtonColor, type ButtonType, type ButtonVariant } from './button-color.js'

export type { ButtonType, ButtonVariant }

/** 控件高度档，取值来自 --mptk-control-h-*，与 Switch / Segmented / Tag 同轴。 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 圆角档：不传就用 `--mptk-control-radius`（库内控件统一圆角），
 * 传 `pill` 是左右半圆（999px，不是 50% —— 长方形上 50% 会变椭圆）。
 */
export type ButtonRadius = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'

/**
 * 加载时圈放哪：
 * - `auto`（默认）只由「按钮有没有前置图标」决定 —— 有 `icon` / `glyph` 时圈顶替图标位，
 *   没有时文字隐形占位、圈居中；两者按钮尺寸都一点不动（与宽度是否钉死无关）；
 * - `inline` 文字保留、圈插在前面，可能撑宽按钮，仅作宽度有富余时的显式逃生口；
 * - `circle` 强制文字隐形占位、圈居中，忽略有无图标。
 */
export type ButtonLoadingMode = 'auto' | 'inline' | 'circle'

export interface ButtonProps {
  children?: ReactNode
  /** 语义色档，默认 `primary`（品牌色实心，与旧版默认外观一致）；`default` 是中性灰。 */
  type?: ButtonType
  /** 底色形态，默认 `solid`；`soft` 就是「中间浅、边深」那一档。 */
  variant?: ButtonVariant
  size?: ButtonSize
  radius?: ButtonRadius
  /**
   * 任意品牌色，覆盖 `type` 的语义色。
   * `#rgb` / `#rrggbb` / `rgb()` 能完整派生四形态；其它写法（`var(--x)`、色名）的 `soft` 浅底退回灰面。
   */
  color?: string
  /**
   * 前置图标，`库名:图标名` 的字体通道。与 `glyph` 互斥，同时给时 `glyph` 优先。
   */
  icon?: string
  /**
   * 前置自绘图标节点（如 `<CloseGlyph />`），用于字体字形无法几何居中的场景。
   * 与 `icon` 互斥、同时给时本项优先；尺寸由节点自己决定（通常 `1em`），颜色取按钮字色。
   */
  glyph?: ReactNode
  /** 后置图标，`库名:图标名`；加载期间不渲染。 */
  iconAfter?: string
  /** 撑满父宽。 */
  block?: boolean
  /** 固定宽（数字按 px）；给了它就等同于定宽按钮，加载时按 `inline` 处理。 */
  width?: number | string
  disabled?: boolean
  /** 外部点亮加载态；与「onClick 返回 Promise 自动加载」取或。 */
  loading?: boolean
  /** 加载期间替换的文案；传了就一直保留文字并走 `inline`。 */
  loadingText?: string
  loadingMode?: ButtonLoadingMode
  className?: string
  style?: CSSProperties
  /** 返回 Promise 即自动 loading + 防连点；同步返回值不转圈。 */
  onClick?: () => unknown
  /** 显式返回 false（或 Promise<false>）时回调，表示操作没成。 */
  onFailed?: () => void
  /** 内部 loading 起止各上报一次，供外层浮层整框屏蔽；true / false 成对。 */
  onBusyChange?: (busy: boolean) => void
  /** 浮层锁里的身份；配在 Popup 的 lockExceptions 里即可在整框屏蔽时仍可点。 */
  lockKey?: string
}

/**
 * 圈径固定 `1em`：字体图标就是一个 em，圈要跟图标同尺寸 —— 换尺寸档、宿主改字号配置时自动跟上，
 * 不在这里维护第二份 px 表。
 */
const SPINNER_SIZE = '1em'

/**
 * 按钮：一条高度刻度 + 四轴正交（语义色 / 底色形态 / 尺寸 / 圆角），内容轴只有图标与文字。
 *
 * 纯图标不另立组件：没给 `children` 只给 `icon` 就是正方形（宽高同档），与 Tag 同口径。
 * 转圈复用全库自绘 Spinner，颜色取按钮字色，深浅底色都不用另配。
 */
export function Button({
  children,
  type = 'primary',
  variant = 'solid',
  size = CONTROL_SIZE_DEFAULT,
  radius,
  color,
  icon,
  glyph,
  iconAfter,
  block = false,
  width,
  disabled = false,
  loading: loadingProp = false,
  loadingText,
  loadingMode = 'auto',
  className,
  style,
  onClick,
  onFailed,
  onBusyChange,
  lockKey,
}: ButtonProps) {
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const gate = useControlGate(lockKey)
  const loading = loadingProp || busy

  const settleBusy = (value: boolean): void => {
    inFlight.current = value
    setBusy(value)
    onBusyChange?.(value)
  }

  const handleClick = (): void => {
    if (disabled || loading || inFlight.current || gate.locked) return
    const result = onClick?.()
    // 同步返回 false 也是「操作没成」：不转圈，但要兑现 onFailed 契约。
    if (!isThenable(result)) {
      if (!isSuccess(result)) onFailed?.()
      return
    }
    settleBusy(true)
    void Promise.resolve(result).then(
      (value) => {
        settleBusy(false)
        if (!isSuccess(value)) onFailed?.()
      },
      (error: unknown) => {
        settleBusy(false)
        throw error
      },
    )
  }

  const hasLabel = children !== undefined && children !== null
  const hasIcon = glyph !== undefined || icon !== undefined
  const iconOnly = !hasLabel && hasIcon
  const label = loading && loadingText !== undefined ? loadingText : children
  const hasRenderedLabel = label !== undefined && label !== null
  /* 圈落点只由「有无前置图标」决定，与按钮是否定宽无关：
     有图标时圈顶替图标位（走 mptk-btn__icon 槽），没图标时文字隐形占位、圈居中（spinCircle）。
     只有显式 loadingMode 才覆盖这条默认语义：circle 强制整枚转圈，inline 保留文字插前面。 */
  const spinCircle =
    loading &&
    loadingText === undefined &&
    hasRenderedLabel &&
    (loadingMode === 'circle' || (loadingMode === 'auto' && !hasIcon))
  const spinnerClass = spinCircle ? 'mptk-btn__spinner' : 'mptk-btn__spinner mptk-btn__icon'

  const names = [
    'mptk-btn',
    `mptk-btn--${type}`,
    `mptk-btn--${variant}`,
    `mptk-btn--${size}`,
    radius === undefined ? '' : `mptk-btn--radius-${radius}`,
    block ? 'mptk-btn--block' : '',
    iconOnly ? 'mptk-btn--icon-only' : '',
    spinCircle ? 'mptk-btn--spin-circle' : '',
    loading ? 'mptk-btn--loading' : '',
    gate.exempt ? 'mptk-btn--lock-exempt' : '',
    // 闸门锁住的按钮要显出不可点状态，不能只在 handleClick 里静默拦掉；
    // 正在转圈的那个不灰（loading 是它的可感知反馈），其余被锁的一律置灰。
    disabled || (gate.locked && !loading) ? 'mptk-btn--disabled' : '',
    className,
  ]
  const widthStyle: CSSProperties | undefined =
    width === undefined ? undefined : { width: typeof width === 'number' ? `${String(width)}px` : width }
  // 自定义色的字色要同时喂给圈：档位类里的 --mptk-btn-fg 这时已经被行内 color 盖掉了。
  const tintStyle = resolveButtonColor(variant, color)
  const rootStyle: CSSProperties = { ...tintStyle, ...widthStyle, ...style }

  return (
    <View
      className={names.filter(Boolean).join(' ')}
      style={rootStyle}
      hoverClass={disabled || loading ? 'none' : 'mptk-btn--pressed'}
      hoverStayTime={PRESS_STAY_TIME}
      onClick={handleClick}
    >
      {loading ? (
        // circle 模式必须套一层铺满按钮的定位层：Spinner 自己带着旋转动画，
        // 静态 transform 会被动画帧覆盖，直接 translate(-50%,-50%) 会让圈跑到右下角。
        spinCircle ? (
          <View className="mptk-btn__spin-layer">
            <Spinner size={SPINNER_SIZE} color={tintStyle?.color} className={spinnerClass} />
          </View>
        ) : (
          <Spinner size={SPINNER_SIZE} color={tintStyle?.color} className={spinnerClass} />
        )
      ) : glyph !== undefined ? (
        <View className="mptk-btn__glyph">{glyph}</View>
      ) : icon === undefined ? null : (
        <Icon name={icon} className="mptk-btn__icon" />
      )}
      {hasRenderedLabel ? <Text className="mptk-btn__label">{label}</Text> : null}
      {loading || iconAfter === undefined ? null : <Icon name={iconAfter} className="mptk-btn__icon-after" />}
    </View>
  )
}
