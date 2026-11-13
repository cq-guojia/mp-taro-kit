import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'

import 'mp-taro-kit/ui/form/segmented/style'
import { DemoPage } from '../../components/DemoBlock'

const FILTER_ITEMS = [
  { value: 'mine', label: '我的待办', count: 3 },
  { value: 'all', label: '全部', count: 7 },
  { value: 'todo', label: '待认领', count: 4 },
  { value: 'doing', label: '进行中', count: 2, disabled: true },
]

const CHANNEL_ITEMS = [
  { value: 'all', label: '全部' },
  { value: 'cd', label: '成都' },
  { value: 'urumqi', label: '乌鲁木齐' },
  { value: 'beijing', label: '北京' },
]

/** 模拟一次要等后台的切换：ok 决定这次是成还是败。 */
function wait(ok: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (ok ? resolve() : reject(new Error('模拟后台失败'))), 800)
  })
}

export default function SegmentedPage() {
  const [filter, setFilter] = useState('mine')
  const [channel, setChannel] = useState('all')
  const [failed, setFailed] = useState(false)

  const render = (id: string) => {
    if (id === 'segmented-basic') {
      return (
        <View className="demo-stack">
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="sm"
            onChange={(next) => { setFilter(next) }}
          />
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            onChange={(next) => { setFilter(next) }}
          />
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            radius="pill"
            onChange={(next) => { setFilter(next) }}
          />
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            width="ratio"
            onChange={(next) => { setFilter(next) }}
          />
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            width="equal"
            onChange={(next) => { setFilter(next) }}
          />
        </View>
      )
    }
    if (id === 'segmented-line') {
      return (
        <View className="demo-stack">
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            indicator="line"
            onChange={(next) => { setChannel(next) }}
          />
        </View>
      )
    }
    if (id === 'segmented-state') {
      return (
        <View className="demo-stack">
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            onChange={(next) => wait(true).then(() => setChannel(next))}
          />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} disabled />
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            onChange={(next) => wait(false).then(() => setChannel(next))}
            onFailed={() => { setFailed(true) }}
          />
          {failed ? <Text className="demo-note">失败：转圈停了，位置没动过，宿主值也没变</Text> : null}
        </View>
      )
    }
    if (id === 'segmented-colors') {
      return (
        <View className="demo-stack">
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} color="blue" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} color="green" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} color="orange" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} color="red" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} color="#8b5cf6" onChange={(next) => { setChannel(next) }} />
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            indicator="line"
            color="#8b5cf6"
            onChange={(next) => { setChannel(next) }}
          />
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="segmented" render={render} />
}
