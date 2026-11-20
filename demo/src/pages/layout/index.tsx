import { useState } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'
import { FloatingAction, FloatingActionGroup } from 'mp-taro-kit/ui/layout'
import type { FloatingActionPosition } from 'mp-taro-kit/ui/layout'
import type { ButtonRadius, ButtonSize, ButtonVariant } from 'mp-taro-kit/ui/actions'

import 'mp-taro-kit/ui/display/cell/style'
import 'mp-taro-kit/ui/form/segmented/style'
import 'mp-taro-kit/ui/layout/floating-action/style'
import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

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

/* 三个真实图标入口：设置 / 回顶 / 修改，都是 common.base 包里的图标名。 */
const ITEMS = [
  { id: 'settings', label: '设置', icon: 'common.base:shezhi' },
  { id: 'backtop', label: '回顶', icon: 'common.base:huidingbu' },
  { id: 'edit', label: '修改', icon: 'common.base:xiugai' },
]

export default function LayoutPage() {
  const [visible, setVisible] = useState(true)
  const [position, setPosition] = useState<FloatingActionPosition>('bottom-right')
  const [size, setSize] = useState<ButtonSize>('sm')
  const [variant, setVariant] = useState<ButtonVariant>('outline')
  const [radius, setRadius] = useState<ButtonRadius>('md')
  const [translucent, setTranslucent] = useState(true)

  const floating = (
    <FloatingActionGroup position={position}>
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
            value={<Segmented items={POSITIONS} value={position} onChange={(next) => setPosition(next as FloatingActionPosition)} />}
          />
          <Cell
            title="显隐"
            value={<Segmented items={YES_NO} value={visible ? 'yes' : 'no'} onChange={(next) => setVisible(next === 'yes')} />}
          />
          <Cell
            title="大小"
            value={<Segmented items={SIZES} value={size} onChange={(next) => setSize(next as ButtonSize)} />}
          />
          <Cell
            title="描边"
            value={<Segmented items={BORDERS} value={variant} onChange={(next) => setVariant(next as ButtonVariant)} />}
          />
          <Cell
            title="圆角"
            value={<Segmented items={RADII} value={radius} onChange={(next) => setRadius(next as ButtonRadius)} />}
          />
          <Cell
            title="背景"
            value={<Segmented items={BACKGROUNDS} value={translucent ? 'translucent' : 'solid'} onChange={(next) => setTranslucent(next === 'translucent')} />}
          />
        </CellGroup>
      </View>
    )
  }

  return <DemoPage pageId="layout" render={render} floating={floating} />
}
