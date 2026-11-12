import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Switch } from 'mp-taro-kit/ui/form/switch'
import { Segmented } from 'mp-taro-kit/ui/form/segmented'

import 'mp-taro-kit/ui/form/switch/style'
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

export default function FormPage() {
  const [on, setOn] = useState(false)
  const [blockOn, setBlockOn] = useState(true)
  const [filter, setFilter] = useState('mine')
  const [channel, setChannel] = useState('all')
  const [failed, setFailed] = useState(false)

  const render = (id: string) => {
    if (id === 'switch-basic') {
      return (
        <View>
          <View className="demo-row">
            <Switch checked={on} size="sm" onChange={(next) => { setOn(next) }} />
            <Switch checked={on} size="md" onChange={(next) => { setOn(next) }} />
            <Switch checked={on} onChange={(next) => { setOn(next) }} />
          </View>
          <View className="demo-row">
            <Switch
              checked={blockOn}
              shape="block"
              offContent="关"
              onContent="开"
              onChange={(next) => { setBlockOn(next) }}
            />
          </View>
        </View>
      )
    }
    if (id === 'switch-state') {
      return (
        <View>
          <View className="demo-row">
            <Switch checked={false} disabled />
            <Switch checked={false} loading />
            <Switch
              checked={on}
              onChange={(next) => wait(true).then(() => setOn(next))}
            />
          </View>
          <View className="demo-row">
            <Switch
              checked={blockOn}
              shape="block"
              offContent="月亮"
              onContent="太阳"
              onChange={(next) => {
                setBlockOn(next)
                return wait(false)
              }}
              onFailed={() => {
                setBlockOn((current) => !current)
                setFailed(true)
              }}
            />
          </View>
          {failed ? <Text className="demo-note">失败已回弹，宿主值也回滚了</Text> : null}
        </View>
      )
    }
    if (id === 'segmented-basic') {
      return (
        <View>
          <View className="demo-block__body">
            <Segmented
              items={FILTER_ITEMS}
              value={filter}
              size="sm"
              onChange={(next) => { setFilter(next) }}
            />
          </View>
          <View className="demo-block__body">
            <Segmented items={FILTER_ITEMS} value={filter} onChange={(next) => { setFilter(next) }} />
          </View>
        </View>
      )
    }
    if (id === 'segmented-line') {
      return (
        <View className="demo-block__body">
          <Segmented
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
        <View className="demo-block__body">
          <Segmented
            items={CHANNEL_ITEMS}
            value={channel}
            disabled={false}
            onChange={(next) => wait(true).then(() => setChannel(next))}
          />
        </View>
      )
    }
    if (id === 'control-colors') {
      return (
        <View>
          <View className="demo-row">
            <Switch checked color="blue" />
            <Switch checked color="green" />
            <Switch checked color="orange" />
            <Switch checked color="red" />
            <Switch checked color="#8b5cf6" />
          </View>
          <View className="demo-block__body">
            <Segmented
              items={CHANNEL_ITEMS}
              value={channel}
              color="green"
              onChange={(next) => { setChannel(next) }}
            />
          </View>
          <View className="demo-block__body">
            <Segmented
              items={CHANNEL_ITEMS}
              value={channel}
              indicator="line"
              color="#8b5cf6"
              onChange={(next) => { setChannel(next) }}
            />
          </View>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="form" render={render} />
}
