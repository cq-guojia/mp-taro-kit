import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  title?: string
  /** 内容由宿主注入，库只提供容器与按钮。 */
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  className?: string
}

/** 声明式 Dialog；命令式 confirm()/alert() 走 <OverlayHost /> 渲染。 */
export function Dialog({
  open,
  title,
  children,
  confirmText = '确定',
  cancelText = '取消',
  showCancel = true,
  onConfirm,
  onCancel,
  className,
}: DialogProps) {
  if (!open) return null
  const names = ['mptk-fb-dialog', className]
  return (
    <View className={names.filter(Boolean).join(' ')}>
      <View className="mptk-fb-dialog__panel">
        {title === undefined ? null : (
          <View className="mptk-fb-dialog__title">
            <Text>{title}</Text>
          </View>
        )}
        <View className="mptk-fb-dialog__body">{children}</View>
        <View className="mptk-fb-dialog__actions">
          {showCancel ? (
            <View className="mptk-fb-dialog__action--cancel" onClick={() => onCancel?.()}>
              <Text>{cancelText}</Text>
            </View>
          ) : null}
          <View className="mptk-fb-dialog__action--confirm" onClick={() => onConfirm?.()}>
            <Text>{confirmText}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
