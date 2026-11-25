import { useRef, useState } from 'react'
import { View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { alert, confirm, type DialogOptions } from 'mp-taro-kit/ui/commands/dialog'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/content-popup/style'
import { DemoPage } from '../../components/DemoBlock'

const LAYOUTS: { value: NonNullable<DialogOptions['layout']>; label: string }[] = [
  { value: 'spaced', label: '横排按钮' },
  { value: 'stack', label: '竖排按钮' },
  { value: 'joined', label: '竖线' },
]

/* 小程序按 750rpx 总宽看：默认 640rpx，另外给 560 / 720 两档，数字直接用 rpx 字符串表达。 */
const WIDTHS = [
  { value: '560rpx', label: '560rpx' },
  { value: '640rpx', label: '640rpx' },
  { value: '720rpx', label: '720rpx' },
] as const
type WidthMode = typeof WIDTHS[number]['value']

/* 头部四档互斥；外伸档沿用 Popup 页「外伸icon」的叫法。 */
const HEADERS = [
  { value: 'plain', label: '普通' },
  { value: 'icon', label: '图标+备注' },
  { value: 'external-icon', label: '外伸icon' },
  { value: 'image', label: '图片' },
] as const
type HeaderMode = typeof HEADERS[number]['value']

const HEADER_IMAGE = 'https://raw.githubusercontent.com/cq-guojia/mp-taro-kit/main/assets/popup/popup-header-rise-up.png'
const EXTERNAL_ICON: NonNullable<DialogOptions['badge']> = {
  content: { kind: 'icon', name: 'common.base:riqi' },
  tone: 'blue',
}

export default function DialogPage() {
  /* 顶部只配宽度与头部；按钮形态在各示例里用横排 / 竖排 / 竖线三个按钮分别演示。 */
  const [widthMode, setWidthMode] = useState<WidthMode>('640rpx')
  const [header, setHeader] = useState<HeaderMode>('plain')
  const failOnce = useRef(true)

  const headerOptions = (): DialogOptions => {
    if (header === 'icon') {
      return { title: '带图标的标题', note: '图标档备注', icon: 'common.base:shuju' }
    }
    if (header === 'external-icon') return { badge: EXTERNAL_ICON }
    if (header === 'image') {
      return { headerImage: { src: HEADER_IMAGE, offset: { top: -30 } } }
    }
    return {}
  }

  const sharedOptions = (): DialogOptions => ({
    ...headerOptions(),
    width: widthMode,
  })
  const withLayout = (next?: NonNullable<DialogOptions['layout']>): DialogOptions =>
    next === undefined ? sharedOptions() : { ...sharedOptions(), layout: next }

  const openAlert = (next?: NonNullable<DialogOptions['layout']>) => {
    void alert('解析即关，不返回用户选择；默认无叉、点遮罩不关', withLayout(next))
  }

  const openConfirm = (next?: NonNullable<DialogOptions['layout']>) => {
    void confirm('确认后会 resolve true，取消或点遮罩 resolve false', withLayout(next))
  }

  const openCustomActions = (next?: NonNullable<DialogOptions['layout']>) => {
    void confirm('按钮文字与颜色可改，key 决定锁期间谁能点', {
      ...withLayout(next),
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

  const layoutRow = (
    open: (next?: NonNullable<DialogOptions['layout']>) => void,
    layouts: typeof LAYOUTS = LAYOUTS,
  ) => (
    <View className="demo-row">
      <Button className="demo-item" size="xs" onClick={() => open()}>默认</Button>
      {layouts.map((item) => (
        <Button
          key={item.value}
          className="demo-item"
          size="xs"
          onClick={() => open(item.value)}
        >{item.label}</Button>
      ))}
    </View>
  )

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="宽度"
              value={<Segmented items={[...WIDTHS]} value={widthMode} onChange={(next) => setWidthMode(next as WidthMode)} />}
            />
            <Cell
              title="头部"
              value={<Segmented items={[...HEADERS]} value={header} onChange={(next) => setHeader(next as HeaderMode)} />}
            />
          </CellGroup>
        </View>
      )
    }
    if (id === 'alert') return layoutRow(openAlert, LAYOUTS.filter((item) => item.value !== 'stack'))
    if (id === 'confirm') return layoutRow(openConfirm)
    if (id === 'custom-actions') return layoutRow(openCustomActions)
    if (id === 'busy') {
      return (
        <View className="demo-row">
          <Button className="demo-item" size="xs" onClick={openBusy}>异步确认（失败可重试）</Button>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="dialog" render={render} />
}
