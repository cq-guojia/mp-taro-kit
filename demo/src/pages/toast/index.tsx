import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { showToast, setToastConfig, type ToastActionDescriptor, type ToastPosition, type ToastTone } from 'mp-taro-kit/ui/commands/toast'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
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

type DisplayMode = 'flat' | 'stacked'
const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: 'flat', label: '平铺' },
  { value: 'stacked', label: '堆叠' },
]

const POSITIONS: { value: ToastPosition; label: string }[] = [
  { value: 'bottom', label: '下方' },
  { value: 'top', label: '上方' },
]

type EmitOptions = {
  title?: string
  description: string
  tone: ToastTone
  closeButton?: boolean
  actions?: readonly ToastActionDescriptor[]
  onAction?: (key: string) => void
}

export default function ToastPage() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('flat')
  const [position, setPosition] = useState<ToastPosition>('bottom')

  const changeDisplayMode = (next: DisplayMode) => {
    setDisplayMode(next)
    setToastConfig({ enableStacking: next === 'stacked' })
  }

  const emit = (options: EmitOptions) => {
    void showToast({ ...options, position })
  }

  const openAction = (count: 1 | 2) => {
    emit({
      title: '文件已删除',
      description: count === 2
        ? '两个操作按钮横排，各自按 key 回调'
        : '点「撤销」恢复，onAction 只在命令层回调',
      tone: 'info',
      actions: count === 2
        ? [
            { key: 'later', text: '稍后', type: 'primary', variant: 'soft', icon: 'common.base:shijian1' },
            { key: 'undo', text: '撤销', type: 'primary', variant: 'solid', color: '#1677ff' },
          ]
        : [{ key: 'undo', text: '撤销' }],
      onAction: (key) => {
        if (key === 'undo') emit({ description: '已恢复', tone: 'success' })
        else if (key === 'later') emit({ description: '稍后再说', tone: 'info' })
      },
    })
  }

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <CellGroup>
          <Cell
            title="显示"
            value={<Segmented<DisplayMode> items={DISPLAY_MODES} value={displayMode} onChange={changeDisplayMode} />}
          />
          <Cell
            title="位置"
            value={<Segmented<ToastPosition> items={POSITIONS} value={position} onChange={setPosition} />}
          />
        </CellGroup>
      )
    }
    if (id === 'toast-basic') {
      return (
        <View className="demo-row">
          {BASIC_TONES.map((item) => (
            <Button
              key={item.value}
              className="demo-item"
              onClick={() => emit({
                title: '标题',
                description: `${item.value} 轻提示，各自计时、各自消失`,
                tone: item.value,
              })}
            >
              {item.label}
            </Button>
          ))}
        </View>
      )
    }
    if (id === 'toast-other') {
      return (
        <View className="demo-row">
          <Button
            className="demo-item"
            onClick={() => emit({
              title: '标题',
              description: '显式 closeButton 才有关闭叉',
              tone: 'info',
              closeButton: true,
            })}
          >
            带关闭叉
          </Button>
          <Button className="demo-item" onClick={() => openAction(1)}>带操作按钮</Button>
          <Button className="demo-item" onClick={() => openAction(2)}>双按钮</Button>
        </View>
      )
    }
    return null
  }

  const page = catalogPages.find((item) => item.id === 'toast')
  if (page === undefined) return null
  const config = page.examples[0]
  const cases = page.examples.slice(1)

  return (
    <DemoShell title={pageTitleOf('toast')}>
      <View className="demo-page__head">
        <Text className="demo-page__summary">{page.summary}</Text>
      </View>
      <DemoBlock example={config}>{render(config.id)}</DemoBlock>
      {cases.map((example) => (
        <DemoBlock key={example.id} example={example}>{render(example.id)}</DemoBlock>
      ))}
    </DemoShell>
  )
}
