import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { markCardEdgeOutOfFlow } from '../infra/card-edge.js'
import { ContentPopup } from '../layout/content-popup/ContentPopup.js'
import type { ContentPopupAction, ContentPopupPosition } from '../layout/content-popup/ContentPopup.js'

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
  /** 与命令式共用的三档形态、位置与宽度；视觉由 ContentPopup 一份承担。 */
  layout?: 'spaced' | 'stack' | 'joined'
  position?: ContentPopupPosition
  width?: number | string
  overlay?: boolean
  closeable?: boolean
  busy?: boolean
  locked?: boolean
  lockExceptions?: readonly string[]
}

/** 声明式 Dialog：ContentPopup 的薄适配，与命令式 alert / confirm 共用一份视觉。 */
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
  layout = 'spaced',
  position = 'center',
  width,
  overlay = true,
  closeable = false,
  busy,
  locked,
  lockExceptions,
}: DialogProps) {
  const actions: ContentPopupAction[] = []
  if (showCancel) {
    actions.push({
      lockKey: 'cancel',
      text: cancelText,
      type: 'default',
      variant: 'ghost',
      onClick: () => Promise.resolve(onCancel?.()),
    })
  }
  actions.push({
    lockKey: 'confirm',
    text: confirmText,
    type: 'primary',
    onClick: () => Promise.resolve(onConfirm?.()),
  })

  return (
    <ContentPopup
      open={open}
      className={['mptk-fb-dialog', className].filter(Boolean).join(' ')}
      position={position}
      width={width}
      overlay={overlay}
      closeable={closeable}
      closable={false}
      onClose={onCancel}
      busy={busy}
      locked={locked}
      lockExceptions={lockExceptions}
      footerConfig={{
        layout: layout === 'stack' ? 'stack' : 'row',
        separation: layout === 'joined' ? 'joined' : 'spaced',
        divider: layout === 'joined',
      }}
      actions={actions}
    >
      <View className="mptk-fb-dialog__body">
        {title === undefined ? null : (
          <View className="mptk-fb-dialog__title"><Text>{title}</Text></View>
        )}
        {children}
      </View>
    </ContentPopup>
  )
}

/* 向 Card 声明：对话框是浮层，关闭时渲染 null、不占内容流。 */
markCardEdgeOutOfFlow(Dialog)
