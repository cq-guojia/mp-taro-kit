import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { showToast } from 'mp-taro-kit/ui/commands/toast'
import type { ToastTone } from 'mp-taro-kit/ui'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/feedback/toast/style'
import { catalogPages, pageTitleOf } from '../../catalog'
import { DemoBlock } from '../../components/DemoBlock'
import { DemoShell } from '../../components/DemoShell'

const BASIC_TONES: { value: ToastTone; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'error', label: '失败' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '信息' },
]

export default function ToastPage() {
  const openBasic = (tone: ToastTone, closeButton: boolean) => {
    void showToast({
      title: '标题',
      description: `${tone} 轻提示，各自计时、各自消失`,
      tone,
      closeButton,
    })
  }

  const openStacked = () => {
    const tones: ToastTone[] = ['info', 'success', 'warning', 'error']
    tones.forEach((tone, index) => {
      void showToast({
        title: `第 ${index + 1} 条`,
        description: '折叠成一摞，点任意一条展开整叠',
        tone,
        enableStacking: true,
        visibleToasts: 3,
        duration: 6000,
      })
    })
  }

  const openAction = () => {
    void showToast({
      title: '文件已删除',
      description: '点「撤销」恢复，onAction 只在命令层回调',
      tone: 'info',
      closeButton: true,
      action: { key: 'undo', text: '撤销' },
      onAction: (key) => {
        if (key === 'undo') {
          void showToast({ description: '已恢复', tone: 'success' })
        }
      },
    })
  }

  const render = (id: string) => {
    if (id === 'toast-basic') {
      return (
        <View className="demo-row">
          {BASIC_TONES.map((item) => (
            <Button key={item.value} className="demo-item" onClick={() => openBasic(item.value, false)}>
              {item.label}
            </Button>
          ))}
          <Button className="demo-item" onClick={() => openBasic('info', true)}>带关闭叉</Button>
        </View>
      )
    }
    if (id === 'toast-stacked') {
      return (
        <View className="demo-row">
          <Button className="demo-item" onClick={openStacked}>推 4 条堆叠</Button>
        </View>
      )
    }
    if (id === 'toast-action') {
      return (
        <View className="demo-row">
          <Button className="demo-item" onClick={openAction}>带撤销按钮</Button>
        </View>
      )
    }
    return null
  }

  const page = catalogPages.find((item) => item.id === 'toast')
  if (page === undefined) return null

  return (
    <DemoShell title={pageTitleOf('toast')}>
      <View className="demo-page__head">
        <Text className="demo-page__summary">{page.summary}</Text>
      </View>
      {page.examples.map((example) => (
        <DemoBlock key={example.id} example={example}>{render(example.id)}</DemoBlock>
      ))}
    </DemoShell>
  )
}
