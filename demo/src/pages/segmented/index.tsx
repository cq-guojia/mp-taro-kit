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

  /* 除「尺寸」示例外，一律按 md 档摆：形态之间要能横向比较，档位混用会被看成形态差异。 */
  const render = (id: string) => {
    if (id === 'segmented-size') {
      return (
        <View className="demo-stack">
          <Text className="demo-note">sm（总高 32）</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="sm"
            onChange={(next) => { setFilter(next) }}
          />
          <Text className="demo-note">md（总高 40）</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="md"
            onChange={(next) => { setFilter(next) }}
          />
          <Text className="demo-note">lg（总高 48，默认）</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            onChange={(next) => { setFilter(next) }}
          />
        </View>
      )
    }
    if (id === 'segmented-basic') {
      return (
        <View className="demo-stack">
          <Text className="demo-note">fit（默认）：底片按内容宽</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="md"
            onChange={(next) => { setFilter(next) }}
          />
          <Text className="demo-note">ratio：撑满，内容多的段更宽</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="md"
            width="ratio"
            onChange={(next) => { setFilter(next) }}
          />
          <Text className="demo-note">equal：撑满，严格等分</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="md"
            width="equal"
            onChange={(next) => { setFilter(next) }}
          />
          <Text className="demo-note">radius=&quot;pill&quot;：半圆形态</Text>
          <Segmented
            className="demo-item"
            items={FILTER_ITEMS}
            value={filter}
            size="md"
            radius="pill"
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
            size="md"
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
            size="md"
            onChange={(next) => wait(true).then(() => setChannel(next))}
          />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" disabled />
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            size="md"
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
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" color="blue" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" color="green" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" color="orange" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" color="red" onChange={(next) => { setChannel(next) }} />
          <Segmented className="demo-item" items={CHANNEL_ITEMS} value={channel} size="md" color="#8b5cf6" onChange={(next) => { setChannel(next) }} />
          <Segmented
            className="demo-item"
            items={CHANNEL_ITEMS}
            value={channel}
            size="md"
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
