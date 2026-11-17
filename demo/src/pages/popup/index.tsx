import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import {
  Popup,
  type PopupPosition,
  type PopupCloseShape,
  type PopupClosePosition,
  type PopupInsetTop,
} from 'mp-taro-kit/ui/layout'
import { showToast } from 'mp-taro-kit/ui'

import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

const POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'top', label: '上' },
  { value: 'center', label: '中' },
  { value: 'bottom', label: '下' },
  { value: 'left', label: '左' },
  { value: 'right', label: '右' },
]

const SHAPES: { value: PopupCloseShape; label: string }[] = [
  { value: 'circle', label: '圆形' },
  { value: 'rounded', label: '圆角方' },
]

const YES_NO = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '无' },
]

const SHOW_HIDE = [
  { value: 'yes', label: '显示' },
  { value: 'no', label: '不显示' },
]

type CloseDemoItem = {
  value: PopupClosePosition
  label: string
  panel: 'bottom' | 'center'
  note: string
}

const CLOSE_GROUPS: { title: string; items: CloseDemoItem[] }[] = [
  {
    title: '底部弹窗关闭按钮 · 面板内',
    items: [
      { value: 'top-left', label: '内部左上（默认）', panel: 'bottom', note: '离上、左边各一个间距' },
      { value: 'edge-top-left', label: '跨半左上', panel: 'bottom', note: '垂直跨半，左边留距' },
    ],
  },
  {
    title: '底部弹窗关闭按钮 · 面板外',
    items: [
      { value: 'above-right', label: '外部右上', panel: 'bottom', note: '面板上方靠右 · 留 12px' },
      { value: 'above-center', label: '外部上方中间', panel: 'bottom', note: '面板上方居中 · 留 12px' },
    ],
  },
  {
    title: '中部弹窗关闭按钮 · 面板内',
    items: [
      { value: 'top-right', label: '内部右上（默认）', panel: 'center', note: '离上、右边各一个间距' },
      { value: 'edge-top-right', label: '跨半右上', panel: 'center', note: '垂直跨半，右边留距' },
    ],
  },
  {
    title: '中部弹窗关闭按钮 · 面板外',
    items: [
      { value: 'above-right', label: '外部右上', panel: 'center', note: '面板上方靠右 · 留 12px' },
      { value: 'below-center', label: '外部下方', panel: 'center', note: '面板下方居中 · 留 12px' },
      { value: 'below-right', label: '外部右下方', panel: 'center', note: '面板下方靠右 · 留 12px' },
    ],
  },
]

const INSETS: { value: PopupInsetTop; label: string }[] = [
  { value: 'none', label: '不让位' },
  { value: 'status-bar', label: '只让状态栏' },
  { value: 'nav-bar', label: '状态栏 + 导航栏' },
]

const SAMPLE_LINES = [
  '第 1 行：这次给足长度，能看出面板的真实形态',
  '第 2 行：上下档通栏，左右档是全高抽屉',
  '第 3 行：中间档有默认宽，不再撑满整屏',
  '第 4 行：圆角默认平，传 round 才带圆角',
  '第 5 行：关闭按钮用图标库里的叉',
  '第 6 行：底形可选只有叉 / 纯圆 / 圆角方',
]

export default function PopupPage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [layerOpen, setLayerOpen] = useState(false)
  const [scrollOpen, setScrollOpen] = useState(false)
  const [position, setPosition] = useState<PopupPosition>('bottom')
  const [positionOpen, setPositionOpen] = useState(false)
  const [round, setRound] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [closePanel, setClosePanel] = useState<'bottom' | 'center'>('bottom')
  const [closePosition, setClosePosition] = useState<PopupClosePosition>('top-left')
  const [closeShape, setCloseShape] = useState<PopupCloseShape>('circle')
  const [closeBorder, setCloseBorder] = useState(true)
  const [closeBackground, setCloseBackground] = useState(true)
  const [closeVisible, setCloseVisible] = useState(true)
  const [maskClosable, setMaskClosable] = useState(true)
  const [insetOpen, setInsetOpen] = useState(false)
  const [insetTop, setInsetTop] = useState<PopupInsetTop>('nav-bar')

  const openCloseDemo = (panel: 'bottom' | 'center', position: PopupClosePosition) => {
    setClosePanel(panel)
    setClosePosition(position)
    setCloseOpen(true)
  }

  const render = (id: string) => {
    if (id === 'positions') {
      return (
        <View>
          <CellGroup>
            {POSITIONS.map((item) => (
              <Cell
                key={item.value}
                title={item.label}
                value={`position="${item.value}"`}
                isLink
                onClick={() => {
                  setPosition(item.value)
                  setPositionOpen(true)
                }}
              />
            ))}
          </CellGroup>
          <Popup open={positionOpen} position={position} onClose={() => setPositionOpen(false)}>
            <Text>{`当前位置：${position}`}</Text>
            {SAMPLE_LINES.map((line) => (
              <View key={line} className="demo-row">
                <Text>{line}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    if (id === 'popup') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="平角"
              value="默认，贴边档不带圆角"
              isLink
              onClick={() => {
                setRound(false)
                setPopupOpen(true)
              }}
            />
            <Cell
              title="圆角"
              value="round，圆内侧两角"
              isLink
              onClick={() => {
                setRound(true)
                setPopupOpen(true)
              }}
            />
          </CellGroup>
          <Popup open={popupOpen} position="bottom" round={round} onClose={() => setPopupOpen(false)}>
            {SAMPLE_LINES.map((line) => (
              <View key={line} className="demo-row">
                <Text>{line}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    if (id === 'close') {
      return (
        <View>
          <CellGroup title="关闭按钮样式">
            <Cell
              title="形状"
              value={
                <View className="demo-cell-segment">
                  <Segmented
                    items={SHAPES}
                    value={closeShape}
                    size="xs"
                    onChange={(next) => setCloseShape(next as PopupCloseShape)}
                  />
                </View>
              }
            />
            <Cell
              title="描边"
              value={
                <View className="demo-cell-segment">
                  <Segmented
                    items={YES_NO}
                    value={closeBorder ? 'yes' : 'no'}
                    size="xs"
                    onChange={(next) => setCloseBorder(next === 'yes')}
                  />
                </View>
              }
            />
            <Cell
              title="背景"
              value={
                <View className="demo-cell-segment">
                  <Segmented
                    items={YES_NO}
                    value={closeBackground ? 'yes' : 'no'}
                    size="xs"
                    onChange={(next) => setCloseBackground(next === 'yes')}
                  />
                </View>
              }
            />
            <Cell
              title="关闭按钮"
              value={
                <View className="demo-cell-segment">
                  <Segmented
                    items={SHOW_HIDE}
                    value={closeVisible ? 'yes' : 'no'}
                    size="xs"
                    onChange={(next) => setCloseVisible(next === 'yes')}
                  />
                </View>
              }
            />
            <Cell
              title="点遮罩关闭"
              value={
                <View className="demo-cell-segment">
                  <Segmented
                    items={YES_NO}
                    value={maskClosable ? 'yes' : 'no'}
                    size="xs"
                    onChange={(next) => setMaskClosable(next === 'yes')}
                  />
                </View>
              }
            />
          </CellGroup>
          {CLOSE_GROUPS.map((group) => (
            <CellGroup key={group.title} title={group.title}>
              {group.items.map((item) => (
                <Cell
                  key={`${item.panel}-${item.value}`}
                  title={item.label}
                  value={item.note}
                  isLink
                  onClick={() => openCloseDemo(item.panel, item.value)}
                />
              ))}
            </CellGroup>
          ))}
          <Popup
            open={closeOpen}
            position={closePanel}
            closeable={closeVisible}
            closable={maskClosable}
            closeShape={closeShape}
            closeBorder={closeBorder}
            closeBackground={closeBackground}
            closePosition={closePosition}
            onClose={() => setCloseOpen(false)}
          >
            <View className="demo-stack">
              <Text>{`${closePanel === 'bottom' ? '底部' : '中部'}弹窗 / ${closePosition}；形状 ${closeShape} / 描边 ${closeBorder ? '有' : '无'} / 背景 ${closeBackground ? '有' : '无'}`}</Text>
              {SAMPLE_LINES.map((line) => (
                <Text key={line}>{line}</Text>
              ))}
            </View>
          </Popup>
        </View>
      )
    }
    if (id === 'inset') {
      return (
        <View>
          <CellGroup title="顶部让位（真值取状态栏 + 胶囊，不靠 env()）">
            {INSETS.map((item) => (
              <Cell
                key={item.value}
                title={item.label}
                value={`insetTop="${item.value}"`}
                isLink
                onClick={() => {
                  setInsetTop(item.value)
                  setInsetOpen(true)
                }}
              />
            ))}
          </CellGroup>
          <Popup
            open={insetOpen}
            position="top"
            insetTop={insetTop}
            onClose={() => setInsetOpen(false)}
          >
            {SAMPLE_LINES.map((line) => (
              <View key={line} className="demo-row">
                <Text>{line}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    if (id === 'layers') {
      return (
        <View>
          <CellGroup>
            <Cell title="打开面板" label="面板之上再弹一条 Toast" isLink onClick={() => setLayerOpen(true)} />
          </CellGroup>
          <Popup open={layerOpen} position="bottom" onClose={() => setLayerOpen(false)}>
            <CellGroup>
              <Cell title="弹一条 Toast" isLink onClick={() => showToast('面板之上的轻提示', 'success')} />
            </CellGroup>
          </Popup>
        </View>
      )
    }
    if (id === 'scroll') {
      return (
        <View>
          <CellGroup>
            <Cell title="打开长面板" label="面板高 35vh，超出后内容自己滚" isLink onClick={() => setScrollOpen(true)} />
          </CellGroup>
          <Popup open={scrollOpen} position="bottom" onClose={() => setScrollOpen(false)}>
            {Array.from({ length: 30 }, (_, index) => (
              <View key={String(index)} className="demo-row">
                <Text>{`第 ${String(index + 1)} 行：面板高 35vh，超出后内容自己滚`}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="popup" render={render} />
}
