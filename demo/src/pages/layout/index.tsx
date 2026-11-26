import { useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { BackToTop, FloatingAction, FloatingActionGroup, useBackToTop, scrollViewToTop } from 'mp-taro-kit/ui/layout'
import type { FloatingActionPosition } from 'mp-taro-kit/ui/layout'
import type { ButtonRadius, ButtonSize, ButtonVariant } from 'mp-taro-kit/ui/actions'

import 'mp-taro-kit/ui/display/cell/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

const SCROLL_VIEW_ID = 'layout-demo-scroll'

const POSITIONS: { value: FloatingActionPosition; label: string }[] = [
  { value: 'bottom-right', label: '右下' },
  { value: 'right-middle', label: '右中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'left-middle', label: '左中' },
]

const YES_NO = [
  { value: 'yes', label: '显示' },
  { value: 'no', label: '隐藏' },
]

const BORDERS: { value: ButtonVariant; label: string }[] = [
  { value: 'outline', label: '带描边' },
  { value: 'solid', label: '不带' },
]

const SIZES: { value: ButtonSize; label: string }[] = [
  { value: 'xs', label: '小' },
  { value: 'sm', label: '中' },
  { value: 'md', label: '大' },
  { value: 'lg', label: '特大' },
]

const RADII: { value: ButtonRadius; label: string }[] = [
  { value: 'pill', label: '纯圆' },
  { value: 'xl', label: '大' },
  { value: 'md', label: '中' },
  { value: 'sm', label: '小' },
]

const BACKGROUNDS = [
  { value: 'translucent', label: '半透明' },
  { value: 'solid', label: '实心' },
]

const THRESHOLDS = [
  { value: '0', label: '0' },
  { value: '200', label: '200' },
  { value: '400', label: '400' },
]

const BACK_DURATIONS = [
  { value: '0', label: '瞬间' },
  { value: '450', label: '450ms' },
  { value: '900', label: '900ms' },
]

const ITEMS = [
  { id: 'settings', label: '设置', icon: 'common.base:shezhi' },
  { id: 'edit', label: '修改', icon: 'common.base:xiugai' },
]

type ScrollNode = Parameters<typeof scrollViewToTop>[0]

export default function LayoutPage() {
  const [visible, setVisible] = useState(true)
  const [position, setPosition] = useState<FloatingActionPosition>('bottom-right')
  const [size, setSize] = useState<ButtonSize>('sm')
  const [variant, setVariant] = useState<ButtonVariant>('outline')
  const [radius, setRadius] = useState<ButtonRadius>('md')
  const [translucent, setTranslucent] = useState(true)
  const [threshold, setThreshold] = useState('200')
  const [backDuration, setBackDuration] = useState('450')
  const nodeRef = useRef<ScrollNode | null>(null)
  const { visible: backVisible, onScroll: onBackScroll } = useBackToTop({
    visibilityHeight: Number(threshold),
  })

  /* 节点只查一次缓存；点回顶发一次 scrollTo，不逐帧、不碰 scrollTop 属性。 */
  const handleBack = (): void => {
    const emit = (node: ScrollNode): void => scrollViewToTop(node, Number(backDuration))
    if (nodeRef.current) {
      emit(nodeRef.current)
      return
    }
    Taro.createSelectorQuery()
      .select(`#${SCROLL_VIEW_ID}`)
      .node()
      .exec((res) => {
        const node = res?.[0]?.node as ScrollNode | null | undefined
        if (node) {
          nodeRef.current = node
          emit(node)
        }
      })
  }

  const floating = (
    <FloatingActionGroup position={position}>
      <BackToTop visible={backVisible} onClick={handleBack} />
      {ITEMS.map((item) => (
        <FloatingAction
          key={item.id}
          visible={visible}
          size={size}
          variant={variant}
          radius={radius}
          translucent={translucent}
          icon={item.icon}
        />
      ))}
    </FloatingActionGroup>
  )

  const render = (id: string) => {
    if (id !== 'floating-action') return null
    return (
      <View>
        <CellGroup>
          <Cell
            title="位置"
            value={<Segmented<FloatingActionPosition> items={POSITIONS} value={position} onChange={setPosition} />}
          />
          <Cell
            title="显隐"
            value={<Segmented items={YES_NO} value={visible ? 'yes' : 'no'} onChange={(next) => setVisible(next === 'yes')} />}
          />
          <Cell
            title="大小"
            value={<Segmented<ButtonSize> items={SIZES} value={size} onChange={setSize} />}
          />
          <Cell
            title="描边"
            value={<Segmented<ButtonVariant> items={BORDERS} value={variant} onChange={setVariant} />}
          />
          <Cell
            title="圆角"
            value={<Segmented<ButtonRadius> items={RADII} value={radius} onChange={setRadius} />}
          />
          <Cell
            title="背景"
            value={<Segmented items={BACKGROUNDS} value={translucent ? 'translucent' : 'solid'} onChange={(next) => setTranslucent(next === 'translucent')} />}
          />
          <Cell
            title="回顶阈值"
            value={<Segmented<string> items={THRESHOLDS} value={threshold} onChange={setThreshold} />}
          />
          <Cell
            title="回顶动画"
            value={<Segmented<string> items={BACK_DURATIONS} value={backDuration} onChange={setBackDuration} />}
          />
        </CellGroup>
      </View>
    )
  }

  return (
    <DemoPage
      pageId="layout"
      render={render}
      backToTop={false}
      scrollViewId={SCROLL_VIEW_ID}
      floating={floating}
      onScrollTop={onBackScroll}
    >
      <View className="demo-filler">
        <View className="demo-filler__note">向下滚动，越过阈值后回顶按钮淡入；点它滚回顶部。</View>
        {Array.from({ length: 40 }, (_, index) => (
          <View key={index} className="demo-filler__row">滚动占位 {index + 1}</View>
        ))}
      </View>
    </DemoPage>
  )
}
