import { useRef, useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { alert, confirm, type DialogOptions, type DialogType } from 'mp-taro-kit/ui/commands/dialog'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/content-popup/style'
import { catalogPages, pageTitleOf } from '../../catalog'
import { DemoBlock } from '../../components/DemoBlock'
import { DemoShell } from '../../components/DemoShell'

const TYPES: { value: DialogType; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'error', label: '失败' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '信息' },
]

/* alert / confirm / 自定义按钮三块配置区共用的按钮形态：横排 / 竖线，默认横排。 */
const BUTTON_LAYOUTS: { value: 'spaced' | 'joined'; label: string }[] = [
  { value: 'spaced', label: '横排按钮' },
  { value: 'joined', label: '竖线' },
]

type ButtonLayout = typeof BUTTON_LAYOUTS[number]['value']
type AlertMode = 'default' | 'external' | 'info' | 'image'

/* 小程序按 750rpx 总宽看：默认 640rpx，另外给 560 / 720 两档，数字直接用 rpx 字符串表达。 */
const WIDTHS = [
  { value: '560rpx', label: '560rpx' },
  { value: '640rpx', label: '640rpx' },
  { value: '720rpx', label: '720rpx' },
] as const
type WidthMode = typeof WIDTHS[number]['value']

const HEADER_IMAGE = 'https://raw.githubusercontent.com/cq-guojia/mp-taro-kit/main/assets/popup/popup-header-rise-up.png'

export default function DialogPage() {
  /* 顶部只配宽度；头部形态由各示例自己的按钮演示。 */
  const [widthMode, setWidthMode] = useState<WidthMode>('640rpx')
  const [alertLayout, setAlertLayout] = useState<ButtonLayout>('spaced')
  const [alertType, setAlertType] = useState<DialogType>('info')
  const [confirmLayout, setConfirmLayout] = useState<ButtonLayout>('joined')
  const [confirmType, setConfirmType] = useState<DialogType>('info')
  const [customLayout, setCustomLayout] = useState<ButtonLayout>('spaced')
  const [customType, setCustomType] = useState<DialogType>('info')
  const failOnce = useRef(true)

  const sharedOptions = (): DialogOptions => ({
    title: '标题',
    width: widthMode,
  })
  const openVariant = (kind: 'alert' | 'confirm' | 'custom', mode: AlertMode, layout: ButtonLayout, type: DialogType) => {
    const shared: DialogOptions = {
      title: '标题',
      ...(mode === 'default' ? null : { type }),
      layout,
      width: widthMode,
      ...(mode === 'info' ? { note: '图标档备注' } : null),
      ...(mode === 'external'
        ? { badge: { content: { kind: 'icon' as const, name: 'common.base:riqi' } } }
        : null),
      ...(mode === 'image' ? { headerImage: { src: HEADER_IMAGE, offset: { top: -30 } } } : null),
    }
    if (kind === 'alert') {
      void alert('标题、内容与 icon，底部只有完成，没有正确与不正确', { ...shared, confirmText: '完成' })
      return
    }
    if (kind === 'confirm') {
      void confirm('确认后会 resolve true，取消或点遮罩 resolve false', shared)
      return
    }
    void confirm('按钮文字与颜色可改，key 决定锁期间谁能点', {
      ...shared,
      title: '自定义按钮',
      actions: [
        { key: 'later', text: '稍后', type: 'default', variant: 'soft', size: 'md' },
        { key: 'confirm', text: '立即执行', type: 'primary', size: 'md', color: '#E8912D' },
      ],
      lockExceptions: ['later'],
      onAction: () => true,
    })
  }

  const openBusy = () => {
    void confirm('第一次模拟失败保持打开，第二次成功才关闭', {
      ...sharedOptions(),
      title: '异步闸门',
      layout: 'stack',
      onConfirm: () => new Promise<boolean>((resolve, reject) => {
        setTimeout(() => {
          const shouldFail = failOnce.current
          failOnce.current = false
          if (shouldFail) reject(new Error('模拟失败'))
          else resolve(true)
        }, 1200)
      }),
    })
  }

  const variantConfig = (
    layout: ButtonLayout,
    setLayout: (next: ButtonLayout) => void,
    type: DialogType,
    setType: (next: DialogType) => void,
    open: (mode: AlertMode) => void,
  ) => (
    <CellGroup>
      <Cell
        title="按钮"
        value={<Segmented<ButtonLayout> items={BUTTON_LAYOUTS} value={layout} onChange={setLayout} />}
      />
      <Cell
        title="内置 icon"
        value={<Segmented<DialogType> items={TYPES} value={type} onChange={setType} />}
      />
      <Cell
        value={
          <View className="demo-row">
            <Button className="demo-item" onClick={() => open('default')}>默认</Button>
            <Button className="demo-item" onClick={() => open('external')}>icon外伸</Button>
            <Button className="demo-item" onClick={() => open('info')}>信息头</Button>
            <Button className="demo-item" onClick={() => open('image')}>图片头</Button>
          </View>
        }
      />
    </CellGroup>
  )

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="宽度"
              value={<Segmented<WidthMode> items={[...WIDTHS]} value={widthMode} onChange={setWidthMode} />}
            />
          </CellGroup>
        </View>
      )
    }
    if (id === 'alert') {
      return variantConfig(alertLayout, setAlertLayout, alertType, setAlertType,
        (mode) => openVariant('alert', mode, alertLayout, alertType))
    }
    if (id === 'confirm') {
      return variantConfig(confirmLayout, setConfirmLayout, confirmType, setConfirmType,
        (mode) => openVariant('confirm', mode, confirmLayout, confirmType))
    }
    if (id === 'custom-actions') {
      return variantConfig(customLayout, setCustomLayout, customType, setCustomType,
        (mode) => openVariant('custom', mode, customLayout, customType))
    }
    if (id === 'busy') {
      return (
        <CellGroup>
          <Cell value={<Button onClick={openBusy}>异步确认（失败可重试）</Button>} />
        </CellGroup>
      )
    }
    return null
  }

  const page = catalogPages.find((item) => item.id === 'dialog')
  if (page === undefined) return null
  const config = page.examples[0]
  const cases = page.examples.slice(1)

  return (
    <DemoShell title={pageTitleOf('dialog')}>
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
