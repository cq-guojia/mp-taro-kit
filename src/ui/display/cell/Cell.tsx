import { View } from '@tarojs/components'
import type { ReactNode } from 'react'
import { resolveCellState, type CellArrowDirection, type CellSize } from './state.js'

export interface CellProps {
  /** 左侧标题，可给任意内容。 */
  title?: ReactNode
  /** 标题下方的描述信息。 */
  label?: ReactNode
  /** 右侧内容；不给时由 children 充当。 */
  value?: ReactNode
  /** 标题左侧图标位。 */
  icon?: ReactNode
  /** 右侧图标位；给了它就不渲染 isLink 箭头。 */
  rightIcon?: ReactNode
  /** 值右侧的额外内容位。 */
  extra?: ReactNode
  /** 自定义 value 显示内容，value 优先。 */
  children?: ReactNode
  /** 垂直对齐：默认居中；传 false 改为顶部对齐（多行 label 时右侧贴标题顶边）。 */
  center?: boolean
  /** 是否画下分隔线；组内最后一格由 CellGroup 自动关掉。 */
  border?: boolean
  size?: CellSize
  /** 纯视觉：只控制箭头，不开启点击反馈。 */
  isLink?: boolean
  arrowDirection?: CellArrowDirection
  /** 短路 onClick 与点击反馈，并置灰。 */
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/** 单元格：一套 DOM 承载通栏 / 卡片、描述 / 值 / 图标 / 箭头 / 插槽全部形态。 */
export function Cell({
  title,
  label,
  value,
  icon,
  rightIcon,
  extra,
  children,
  center,
  border,
  size,
  isLink = false,
  arrowDirection,
  disabled = false,
  onClick,
  className,
}: CellProps) {
  const state = resolveCellState({
    center,
    border,
    size,
    isLink,
    arrowDirection,
    disabled,
    onClick,
    className,
  })
  const content = value ?? children
  const showArrow = isLink && rightIcon === undefined

  return (
    <View
      className={state.className}
      hoverClass={state.hoverClassName}
      onClick={state.clickable ? onClick : undefined}
    >
      {icon !== undefined && <View className="mptk-cell__icon">{icon}</View>}
      <View className="mptk-cell__main">
        {title !== undefined && <View className="mptk-cell__title">{title}</View>}
        {label !== undefined && <View className="mptk-cell__label">{label}</View>}
      </View>
      {content !== undefined && <View className="mptk-cell__value">{content}</View>}
      {extra !== undefined && <View className="mptk-cell__extra">{extra}</View>}
      {rightIcon !== undefined ? (
        <View className="mptk-cell__right-icon">{rightIcon}</View>
      ) : showArrow ? (
        <View className={state.arrowClassName} />
      ) : null}
      {state.divider && <View className="mptk-cell__divider" />}
    </View>
  )
}
