import { useRef, useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { alert, confirm, type DialogOptions } from 'mp-taro-kit/ui/commands/dialog'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/content-popup/style'
import { DemoPage } from '../../components/DemoBlock'

const YES_NO = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

const LAYOUTS: { value: NonNullable<DialogOptions['layout']>; label: string }[] = [
  { value: 'spaced', label: '横排' },
  { value: 'stack', label: '竖排' },
  { value: 'joined', label: '竖线' },
]

const POSITIONS: { value: NonNullable<DialogOptions['position']>; label: string }[] = [
  { value: 'top', label: '顶部' },
  { value: 'center', label: '中部' },
  { value: 'bottom', label: '底部' },
]

const WIDTHS = [
  { value: 'default', label: '默认 320' },
  { value: '280', label: '280px' },
  { value: '360', label: '360px' },
] as const
type WidthMode = typeof WIDTHS[number]['value']

const HEADERS = [
  { value: 'none', label: '无' },
  { value: 'badge', label: '外伸徽标' },
  { value: 'image', label: '图片头' },
] as const
type HeaderMode = typeof HEADERS[number]['value']

const HEADER_IMAGE = 'https://raw.githubusercontent.com/cq-guojia/mp-taro-kit/main/assets/popup/popup-header-search.png'
const BADGE: NonNullable<DialogOptions['badge']> = {
  content: { kind: 'icon', name: 'common.base:riqi' },
  tone: 'blue',
}

export default function DialogPage() {
  /* 顶部配置：下方 alert / confirm 两块共用，和 Popup 页同一套「配置驱动演示」写法。 */
  const [layout, setLayout] = useState<NonNullable<DialogOptions['layout']>>('spaced')
  const [position, setPosition] = useState<NonNullable<DialogOptions['position']>>('center')
  const [widthMode, setWidthMode] = useState<WidthMode>('default')
  const [header, setHeader] = useState<HeaderMode>('none')
  const [withIcon, setWithIcon] = useState(false)
  const [closeable, setCloseable] = useState(false)
  const [maskClosable, setMaskClosable] = useState(false)
  const [withOffset, setWithOffset] = useState(false)

  const [alertResult, setAlertResult] = useState('')
  const [confirmResult, setConfirmResult] = useState('')
  const [shapeResult, setShapeResult] = useState('')
  const [headerResult, setHeaderResult] = useState('')
  const [actionResult, setActionResult] = useState('')
  const [busyResult, setBusyResult] = useState('')
  const failOnce = useRef(true)

  const sharedOptions = (): DialogOptions => ({
    title: withIcon ? '带图标的标题' : '标题在 body',
    note: withIcon ? '图标档备注' : undefined,
    icon: withIcon ? 'common.base:shuju' : undefined,
    layout,
    position,
    width: widthMode === 'default' ? undefined : Number(widthMode),
    closeable,
    maskClosable,
    badge: header === 'badge' ? BADGE : undefined,
    headerImage: header === 'image' ? { src: HEADER_IMAGE, width: 320, height: 120 } : undefined,
    offsets: withOffset ? { top: 8, right: 8 } : undefined,
  })

  const openAlert = () => {
    void alert('解析即关，不返回用户选择；默认无叉、点遮罩不关', {
      ...sharedOptions(),
      confirmText: '知道了',
    }).then(() => setAlertResult('已关闭'))
  }

  const openConfirm = () => {
    void confirm('确认后会 resolve true，取消或点遮罩 resolve false', {
      ...sharedOptions(),
      confirmText: '继续',
      cancelText: '取消',
    }).then((ok) => setConfirmResult(ok ? 'true' : 'false'))
  }

  const openShape = (next: NonNullable<DialogOptions['layout']>) => {
    void confirm(`当前形态：${next}`, {
      ...sharedOptions(),
      layout: next,
      title: undefined,
    }).then((ok) => setShapeResult(`${next} → ${ok ? '确定' : '取消'}`))
  }

  const openHeader = (next: HeaderMode) => {
    void alert('头部配置不影响 body 的标题与说明', {
      ...sharedOptions(),
      title: '头部配置',
      note: next === 'none' ? undefined : `当前：${next}`,
      icon: next === 'none' ? undefined : 'common.base:riqi',
      badge: next === 'badge' ? BADGE : undefined,
      headerImage: next === 'image' ? { src: HEADER_IMAGE, width: 320, height: 120 } : undefined,
      offsets: next === 'badge' ? { top: 8, right: 8 } : undefined,
    }).then(() => setHeaderResult(`${next} 已关闭`))
  }

  const openCustomActions = () => {
    void confirm('按钮文字与颜色可改，key 决定锁期间谁能点', {
      ...sharedOptions(),
      title: '自定义按钮',
      actions: [
        { key: 'later', text: '稍后', type: 'default', variant: 'soft', color: '#8A8F99' },
        { key: 'confirm', text: '立即执行', type: 'primary', color: '#E8912D' },
      ],
      lockExceptions: ['later'],
      onAction: (key) => {
        setActionResult(`点了 ${key}`)
        return key !== 'later'
      },
    }).then((ok) => setActionResult(ok ? '立即执行 → true' : actionResult))
  }

  const openBusy = () => {
    setBusyResult('转圈中：取消可点，其它控件与叉/遮罩不可点')
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
    }).then((ok) => setBusyResult(ok ? '成功关闭，可以再点一次看失败路径' : '取消'))
  }

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <View>
          <CellGroup title="形态与几何">
            <Cell title="按钮形态" value={<Segmented items={LAYOUTS} value={layout} onChange={setLayout} />} />
            <Cell title="位置" value={<Segmented items={POSITIONS} value={position} onChange={setPosition} />} />
            <Cell
              title="宽度"
              value={<Segmented items={[...WIDTHS]} value={widthMode} onChange={(next) => setWidthMode(next as WidthMode)} />}
            />
          </CellGroup>
          <CellGroup title="头部与文案">
            <Cell
              title="头部"
              value={<Segmented items={[...HEADERS]} value={header} onChange={(next) => setHeader(next as HeaderMode)} />}
            />
            <Cell
              title="图标 + 备注"
              value={<Segmented items={YES_NO} value={withIcon ? 'yes' : 'no'} onChange={(next) => setWithIcon(next === 'yes')} />}
            />
            <Cell
              title="四向偏移"
              value={<Segmented items={YES_NO} value={withOffset ? 'yes' : 'no'} onChange={(next) => setWithOffset(next === 'yes')} />}
            />
          </CellGroup>
          <CellGroup title="关闭路径" border={false} dividerInset={false}>
            <Cell
              title="关闭叉"
              value={<Segmented items={YES_NO} value={closeable ? 'yes' : 'no'} onChange={(next) => setCloseable(next === 'yes')} />}
            />
            <Cell
              title="点遮罩关闭"
              value={<Segmented items={YES_NO} value={maskClosable ? 'yes' : 'no'} onChange={(next) => setMaskClosable(next === 'yes')} />}
            />
          </CellGroup>
        </View>
      )
    }
    if (id === 'alert') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={openAlert}>alert</Button>
          </View>
          {alertResult === '' ? null : <Text className="demo-note">{alertResult}</Text>}
        </View>
      )
    }
    if (id === 'confirm') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={openConfirm}>confirm</Button>
          </View>
          {confirmResult === '' ? null : <Text className="demo-note">{`Promise 解析：${confirmResult}`}</Text>}
        </View>
      )
    }
    if (id === 'layout') {
      return (
        <View>
          <View className="demo-row">
            {LAYOUTS.map((item) => (
              <Button key={item.value} className="demo-item" onClick={() => openShape(item.value)}>{item.label}</Button>
            ))}
          </View>
          {shapeResult === '' ? null : <Text className="demo-note">{shapeResult}</Text>}
        </View>
      )
    }
    if (id === 'header') {
      return (
        <View>
          <View className="demo-row">
            {HEADERS.map((item) => (
              <Button key={item.value} className="demo-item" onClick={() => openHeader(item.value)}>{item.label}</Button>
            ))}
          </View>
          {headerResult === '' ? null : <Text className="demo-note">{headerResult}</Text>}
        </View>
      )
    }
    if (id === 'custom-actions') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={openCustomActions}>自定义按钮</Button>
          </View>
          {actionResult === '' ? null : <Text className="demo-note">{actionResult}</Text>}
        </View>
      )
    }
    if (id === 'busy') {
      return (
        <View>
          <View className="demo-row">
            <Button className="demo-item" onClick={openBusy}>异步确认（失败可重试）</Button>
          </View>
          {busyResult === '' ? null : <Text className="demo-note">{busyResult}</Text>}
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="dialog" render={render} />
}
