import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import {
  Popup,
  type OverlayOpacity,
  type OverlayTone,
  type PopupClosePosition,
  type PopupCloseShape,
  type PopupInsetTop,
  type PopupPosition,
  type PopupRoundSize,
} from 'mp-taro-kit/ui/layout'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

/* 垂直档：顶部 / 中部 / 底部，横排成一组。 */
const VERTICAL_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'top', label: '顶部' },
  { value: 'center', label: '中部' },
  { value: 'bottom', label: '底部' },
]

/* 侧面档：左侧 / 右侧，按钮尺寸与主控件同档（不传 size 走默认 sm）。 */
const SIDE_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
]

const SHAPES: { value: PopupCloseShape; label: string }[] = [
  { value: 'circle', label: '正圆' },
  { value: 'rounded', label: '圆角方' },
]

const YES_NO = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

const ROUND_SIZES: { value: PopupRoundSize; label: string }[] = [
  { value: 'none', label: '平' },
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
]

/* 遮罩三档：深色薄（浅）/ 深色标准（深）/ 泛白。 */
type MaskLevel = 'light' | 'dark' | 'pale'
const MASKS: { value: MaskLevel; label: string }[] = [
  { value: 'light', label: '浅' },
  { value: 'dark', label: '深' },
  { value: 'pale', label: '泛白' },
]
const MASK_VALUES: Record<MaskLevel, { tone: OverlayTone; opacity: OverlayOpacity }> = {
  light: { tone: 'dark', opacity: 'thin' },
  dark: { tone: 'dark', opacity: 'default' },
  pale: { tone: 'light', opacity: 'default' },
}

const INSETS: { value: PopupInsetTop; label: string }[] = [
  { value: 'none', label: '不让位' },
  { value: 'status-bar', label: '状态栏' },
  { value: 'nav-bar', label: '导航栏' },
]

const CLOSE_POSITIONS: { value: PopupClosePosition; label: string; panel: 'bottom' | 'center' }[] = [
  { value: 'top-left', label: '内部左上', panel: 'bottom' },
  { value: 'edge-top-left', label: '跨半左上', panel: 'bottom' },
  { value: 'above-right', label: '外部右上', panel: 'bottom' },
  { value: 'above-center', label: '外部上方居中', panel: 'bottom' },
  { value: 'top-right', label: '内部右上', panel: 'center' },
  { value: 'edge-top-right', label: '跨半右上', panel: 'center' },
  { value: 'below-center', label: '外部下方居中', panel: 'center' },
  { value: 'below-right', label: '外部右下方', panel: 'center' },
]

const SAMPLE_LINES = [
  '第 1 行：这次给足长度，能看出面板的真实形态',
  '第 2 行：上下档通栏，左右档是全高抽屉',
  '第 3 行：中间档有默认宽，不再撑满整屏',
  '第 4 行：圆角与遮罩跟随上方配置',
  '第 5 行：关闭按钮用图标库里的叉',
  '第 6 行：位置与关闭按钮位置在下方两块演示',
]

export default function PopupPage() {
  /* 配置区：下面两块演示共用这一套值。 */
  const [closeShape, setCloseShape] = useState<PopupCloseShape>('circle')
  const [closeBorder, setCloseBorder] = useState(true)
  const [closeBackground, setCloseBackground] = useState(true)
  const [roundSize, setRoundSize] = useState<PopupRoundSize>('md')
  const [mask, setMask] = useState<MaskLevel>('dark')
  const [closable, setClosable] = useState(true)
  const [insetTop, setInsetTop] = useState<PopupInsetTop>('nav-bar')

  /* 演示区各自的开合与目标。 */
  const [positionOpen, setPositionOpen] = useState(false)
  const [position, setPosition] = useState<PopupPosition>('bottom')
  const [closeOpen, setCloseOpen] = useState(false)
  const [closePanel, setClosePanel] = useState<'bottom' | 'center'>('bottom')
  const [closePosition, setClosePosition] = useState<PopupClosePosition>('top-left')

  const maskValues = MASK_VALUES[mask]
  const shared = {
    round: roundSize !== 'none',
    roundSize,
    overlayTone: maskValues.tone,
    overlayOpacity: maskValues.opacity,
    closable,
    insetTop,
    closeable: true,
    closeShape,
    closeBorder,
    closeBackground,
  }

  const render = (id: string) => {
    if (id === 'config') {
      return (
        <View>
          <CellGroup title="关闭按钮">
            <Cell
              title="形状"
              value={<Segmented items={SHAPES} value={closeShape} onChange={(next) => setCloseShape(next as PopupCloseShape)} />}
            />
            <Cell
              title="描边"
              value={<Segmented items={YES_NO} value={closeBorder ? 'yes' : 'no'} onChange={(next) => setCloseBorder(next === 'yes')} />}
            />
            <Cell
              title="背景"
              value={<Segmented items={YES_NO} value={closeBackground ? 'yes' : 'no'} onChange={(next) => setCloseBackground(next === 'yes')} />}
            />
          </CellGroup>
          <CellGroup title="面板">
            <Cell
              title="圆角尺寸"
              value={<Segmented items={ROUND_SIZES} value={roundSize} onChange={(next) => setRoundSize(next as PopupRoundSize)} />}
            />
            <Cell
              title="遮罩"
              value={<Segmented items={MASKS} value={mask} onChange={(next) => setMask(next as MaskLevel)} />}
            />
            <Cell
              title="点遮罩关闭"
              value={<Segmented items={YES_NO} value={closable ? 'yes' : 'no'} onChange={(next) => setClosable(next === 'yes')} />}
            />
            <Cell
              title="让位"
              value={<Segmented items={INSETS} value={insetTop} onChange={(next) => setInsetTop(next as PopupInsetTop)} />}
            />
          </CellGroup>
        </View>
      )
    }
    if (id === 'positions') {
      return (
        <View>
          <CellGroup>
            <Cell
              title="垂直"
              value={
                <View className="demo-row">
                  {VERTICAL_POSITIONS.map((item) => (
                    <Button
                      key={item.value}
                      className="demo-item"
                      size="xs"
                      onClick={() => {
                        setPosition(item.value)
                        setPositionOpen(true)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              }
            />
            <Cell
              title="侧面"
              value={
                <View className="demo-row">
                  {SIDE_POSITIONS.map((item) => (
                    <Button
                      key={item.value}
                      className="demo-item"
                      size="xs"
                      onClick={() => {
                        setPosition(item.value)
                        setPositionOpen(true)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              }
            />
          </CellGroup>
          <Popup
            open={positionOpen}
            position={position}
            onClose={() => setPositionOpen(false)}
            {...shared}
          >
            <Text>{`当前位置：${position} · 圆角 ${roundSize} · 遮罩 ${mask}`}</Text>
            {SAMPLE_LINES.map((line) => (
              <View key={line} className="demo-row">
                <Text>{line}</Text>
              </View>
            ))}
          </Popup>
        </View>
      )
    }
    if (id === 'close-position') {
      return (
        <View>
          <CellGroup>
            {CLOSE_POSITIONS.map((item) => (
              <Cell
                key={`${item.panel}-${item.value}`}
                title={`${item.panel === 'bottom' ? '底部' : '中部'} · ${item.label}`}
                value={`closePosition="${item.value}"`}
                isLink
                onClick={() => {
                  setClosePanel(item.panel)
                  setClosePosition(item.value)
                  setCloseOpen(true)
                }}
              />
            ))}
          </CellGroup>
          <Popup
            open={closeOpen}
            position={closePanel}
            closePosition={closePosition}
            onClose={() => setCloseOpen(false)}
            {...shared}
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
    return null
  }

  return <DemoPage pageId="popup" render={render} />
}
