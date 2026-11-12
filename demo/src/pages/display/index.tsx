import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Badge, Divider } from 'mp-taro-kit/ui/display'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { iconClass } from 'mp-taro-kit/ui/icon'

import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/display/cell/style'
import { pagePathOf } from '../../catalog'
import { DemoPage } from '../../components/DemoBlock'

export default function DisplayPage() {
  const [clicks, setClicks] = useState(0)
  const count = () => setClicks(clicks + 1)

  const render = (id: string) => {
    if (id === 'cell-basic') {
      return (
        <CellGroup>
          <Cell title="单元格" value="内容" />
          <Cell title="单元格" value="内容" label="描述信息" border={false} />
        </CellGroup>
      )
    }
    if (id === 'cell-inset') {
      return (
        <CellGroup inset>
          <Cell title="单元格" value="内容" />
          <Cell title="单元格" value="内容" label="描述信息" />
        </CellGroup>
      )
    }
    if (id === 'cell-size') {
      return (
        <CellGroup>
          <Cell title="单元格" value="内容" size="large" label="描述信息" />
          <Cell title="常规尺寸" value="内容" />
        </CellGroup>
      )
    }
    if (id === 'cell-icon') {
      return (
        <CellGroup>
          <Cell title="单元格" icon={<Text className={iconClass('home')} />} />
          <Cell title="单元格" value="内容" isLink icon={<Text className={iconClass('shaixuan')} />} />
        </CellGroup>
      )
    }
    if (id === 'cell-link') {
      return (
        <CellGroup>
          <Cell title="向右" isLink />
          <Cell title="向下" value="内容" isLink arrowDirection="down" />
          <Cell title="向上" value="内容" isLink arrowDirection="up" />
          <Cell title="向左" value="内容" isLink arrowDirection="left" />
        </CellGroup>
      )
    }
    if (id === 'cell-navigate') {
      return (
        <CellGroup>
          <Cell
            title="打开「动作」页"
            isLink
            onClick={() => void Taro.navigateTo({ url: `/${pagePathOf('actions')}` })}
          />
        </CellGroup>
      )
    }
    if (id === 'cell-group-title') {
      return (
        <View>
          <CellGroup title="分组 1">
            <Cell title="单元格" value="内容" />
          </CellGroup>
          <CellGroup title="分组 2">
            <Cell title="单元格" value="内容" />
          </CellGroup>
        </View>
      )
    }
    if (id === 'cell-slot') {
      return (
        <CellGroup>
          <Cell
            value="内容"
            isLink
            icon={<Text className={iconClass('home')} />}
            title={
              <View className="demo-row">
                <Text>单元格</Text>
                <Badge count="标签" />
              </View>
            }
          />
          <Cell title="右侧图标位" rightIcon={<Text className={iconClass('xiugai')} />}>
            自定义 value
          </Cell>
          <Cell title="额外内容位" value="内容" extra={<Text>extra</Text>} />
        </CellGroup>
      )
    }
    if (id === 'cell-center') {
      return (
        <CellGroup>
          <Cell
            center
            title="垂直居中"
            value="内容"
            label="描述信息"
            icon={<Text className={iconClass('home')} />}
            isLink
          />
          <Cell title="默认顶部对齐" value="内容" label="描述信息" />
        </CellGroup>
      )
    }
    if (id === 'cell-state') {
      return (
        <View>
          <CellGroup>
            <Cell title="可点击（有按压反馈）" isLink onClick={count} />
            <Cell title="禁用（onClick 短路）" value="内容" disabled isLink onClick={count} />
          </CellGroup>
          <View className="demo-inset">
            <Text className="demo-note">{`点击次数：${clicks}（禁用格不计）`}</Text>
          </View>
        </View>
      )
    }
    if (id === 'badge') {
      return (
        <View className="demo-row demo-inset">
          <Badge count={3}>
            <View className="demo-cell">
              <Text>消息</Text>
            </View>
          </Badge>
          <Badge dot>
            <View className="demo-cell">
              <Text>更新</Text>
            </View>
          </Badge>
        </View>
      )
    }
    if (id === 'divider') {
      return (
        <View className="demo-inset">
          <Text className="demo-note">上方</Text>
          <Divider />
          <Text className="demo-note">下方</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="display" render={render} />
}
