import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import {
  alert,
  clearToasts,
  confirm,
  hideLoading,
  hideToast,
  showLoading,
  showToast,
} from 'mp-taro-kit/ui'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/infra/style'
import { DemoPage } from '../../components/DemoBlock'

export default function CommandsPage() {
  const [toastId, setToastId] = useState<number | null>(null)
  const [alertResult, setAlertResult] = useState('')
  const [confirmResult, setConfirmResult] = useState('')
  const [loadingResult, setLoadingResult] = useState('')

  const render = (id: string) => {
    if (id === 'toast-command') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setToastId(showToast('命令式轻提示', 'success'))}>
              showToast
            </Button>
            <Button
              className="demo-item"
              onClick={() => {
                if (toastId !== null) hideToast(toastId)
              }}
            >
              hideToast
            </Button>
            <Button
              className="demo-item"
              onClick={() => {
                clearToasts()
                setToastId(null)
              }}
            >
              clearToasts
            </Button>
          </View>
          {toastId === null ? null : <Text className="demo-note">{`最近 id：${toastId}`}</Text>}
        </View>
      )
    }
    if (id === 'alert') {
      return (
        <View>
          <View className="demo-row">
            <Button
              className="demo-item"
              onClick={() => {
                void alert('解析即关闭，不返回用户选择', { title: '提示' }).then(() =>
                  setAlertResult('已关闭'),
                )
              }}
            >
              alert
            </Button>
          </View>
          {alertResult === '' ? null : <Text className="demo-note">{alertResult}</Text>}
        </View>
      )
    }
    if (id === 'confirm') {
      return (
        <View>
          <View className="demo-row">
            <Button
              className="demo-item"
              onClick={() => {
                void confirm('确定要继续吗？', { title: '确认', confirmText: '继续' }).then((ok) =>
                  setConfirmResult(ok ? 'true' : 'false'),
                )
              }}
            >
              confirm
            </Button>
          </View>
          {confirmResult === '' ? null : (
            <Text className="demo-note">{`Promise 解析：${confirmResult}`}</Text>
          )}
        </View>
      )
    }
    if (id === 'loading-command') {
      return (
        <View>
          <View className="demo-row">
            <Button
              className="demo-item"
              onClick={() => {
                const handle = showLoading()
                setLoadingResult(`句柄 ${handle}`)
                setTimeout(() => hideLoading(handle), 1200)
              }}
            >
              showLoading（1.2s 后关闭）
            </Button>
          </View>
          {loadingResult === '' ? null : <Text className="demo-note">{loadingResult}</Text>}
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="commands" render={render} />
}
