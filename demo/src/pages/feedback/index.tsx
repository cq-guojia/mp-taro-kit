import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Dialog, Loader, Loading, Toast } from 'mp-taro-kit/ui/feedback'

import 'mp-taro-kit/ui/feedback/style'
import { DemoPage } from '../../components/DemoBlock'

export default function FeedbackPage() {
  const [toastVisible, setToastVisible] = useState(true)
  const [loadingVisible, setLoadingVisible] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogResult, setDialogResult] = useState('')

  const render = (id: string) => {
    if (id === 'toast') {
      return (
        <View>
          <Toast text="这是一条轻提示" tone="success" visible={toastVisible} />
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setToastVisible(!toastVisible)}>
              <Text>切换 visible</Text>
            </View>
          </View>
        </View>
      )
    }
    if (id === 'loading') {
      return (
        <View>
          <Loading visible={loadingVisible} text="正在加载" />
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setLoadingVisible(!loadingVisible)}>
              <Text>切换 visible</Text>
            </View>
          </View>
        </View>
      )
    }
    if (id === 'loader') {
      return (
        <View>
          <View className="demo-row">
            <Loader variant="ring" size="sm" className="demo-loader-spaced" />
            <Loader variant="ring" size="md" className="demo-loader-spaced" />
            <Loader variant="ring" size="lg" className="demo-loader-spaced" />
          </View>
          <View className="demo-row">
            <Loader variant="blocks" size="sm" className="demo-loader-spaced" />
            <Loader variant="blocks" size="md" className="demo-loader-spaced" />
            <Loader variant="blocks" size="lg" className="demo-loader-spaced" />
          </View>
        </View>
      )
    }
    if (id === 'dialog') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-trigger" onClick={() => setDialogOpen(true)}>
              <Text>打开对话框</Text>
            </View>
          </View>
          {dialogResult === '' ? null : (
            <Text className="demo-note">{`上次选择：${dialogResult}`}</Text>
          )}
          <Dialog
            open={dialogOpen}
            title="声明式对话框"
            confirmText="确定"
            cancelText="取消"
            onConfirm={() => {
              setDialogOpen(false)
              setDialogResult('确定')
            }}
            onCancel={() => {
              setDialogOpen(false)
              setDialogResult('取消')
            }}
          >
            <Text>内容由 children 注入</Text>
          </Dialog>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="feedback" render={render} />
}
