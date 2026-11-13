import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Switch } from 'mp-taro-kit/ui/form/switch'
import { iconClass } from 'mp-taro-kit/ui/icon/base'

import 'mp-taro-kit/ui/form/switch/style'
import 'mp-taro-kit/ui/icon/base/style'
import { DemoPage } from '../../components/DemoBlock'

/** 浅色模式是太阳，深色模式是月亮，正好拿来当开 / 关两面的图标。 */
const SUN = <Text className={iconClass('qiansemoshi')} />
const MOON = <Text className={iconClass('shensemoshi')} />

/** 模拟一次要等后台的切换：ok 决定这次是成还是败。 */
function wait(ok: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (ok ? resolve() : reject(new Error('模拟后台失败'))), 1600)
  })
}

export default function SwitchPage() {
  const [on, setOn] = useState(false)
  const [blockOn, setBlockOn] = useState(true)
  const [dayNight, setDayNight] = useState(false)
  const [failed, setFailed] = useState(false)

  /* 除「尺寸」示例外，一律按 md 档摆：形态之间要能横向比较，档位混用会被看成形态差异。 */
  const render = (id: string) => {
    if (id === 'switch-size') {
      return (
        <View className="demo-stack">
          <Text className="demo-note">圆形：sm（33×20）/ md（42×26）/ lg（52×32）</Text>
          <View className="demo-row">
            <Switch className="demo-item" checked={on} size="sm" onChange={(next) => { setOn(next) }} />
            <Switch className="demo-item" checked={on} size="md" onChange={(next) => { setOn(next) }} />
            <Switch className="demo-item" checked={on} onChange={(next) => { setOn(next) }} />
          </View>
          <Text className="demo-note">方形：sm（格子 20）/ md（格子 30）/ lg（格子 39）</Text>
          <View className="demo-row">
            <Switch
              className="demo-item"
              checked={blockOn}
              shape="block"
              size="sm"
              offContent="关"
              onContent="开"
              onChange={(next) => { setBlockOn(next) }}
            />
            <Switch
              className="demo-item"
              checked={blockOn}
              shape="block"
              size="md"
              offContent="关"
              onContent="开"
              onChange={(next) => { setBlockOn(next) }}
            />
            <Switch
              className="demo-item"
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
    if (id === 'switch-basic') {
      return (
        <View className="demo-row">
          <Switch className="demo-item" checked={false} size="md" />
          <Switch className="demo-item" checked={on} size="md" onChange={(next) => { setOn(next) }} />
          <Switch
            className="demo-item"
            checked={blockOn}
            shape="block"
            size="md"
            offContent="关"
            onContent="开"
            onChange={(next) => { setBlockOn(next) }}
          />
          <Switch
            className="demo-item"
            checked={blockOn}
            shape="block"
            size="md"
            offContent="待办"
            onContent="完成"
            onChange={(next) => { setBlockOn(next) }}
          />
        </View>
      )
    }
    if (id === 'switch-icon') {
      return (
        <View className="demo-row">
          <Switch
            className="demo-item"
            checked={dayNight}
            shape="block"
            size="md"
            offContent={SUN}
            onContent={MOON}
            onChange={(next) => { setDayNight(next) }}
          />
          <Switch
            className="demo-item"
            checked={dayNight}
            size="md"
            offContent={SUN}
            onContent={MOON}
            onChange={(next) => { setDayNight(next) }}
          />
          <Switch
            className="demo-item"
            checked={dayNight}
            shape="block"
            size="md"
            keepColor
            offContent={SUN}
            onContent={MOON}
            onChange={(next) => { setDayNight(next) }}
          />
          <Switch
            className="demo-item"
            checked={dayNight}
            size="md"
            keepColor
            offContent={SUN}
            onContent={MOON}
            onChange={(next) => { setDayNight(next) }}
          />
        </View>
      )
    }
    if (id === 'switch-state') {
      return (
        <View className="demo-stack">
          <Text className="demo-note">光板开关：等待时滑块里转圈</Text>
          <View className="demo-row">
            <Switch className="demo-item" checked={false} size="md" disabled />
            <Switch className="demo-item" checked={false} size="md" loading />
            <Switch
              className="demo-item"
              checked={on}
              size="md"
              onChange={(next) => wait(true).then(() => setOn(next))}
            />
          </View>
          <Text className="demo-note">带内容的开关：只有选中那块滑块呼吸，轨道与文字不跟着闪</Text>
          <View className="demo-row">
            <Switch
              className="demo-item"
              checked={blockOn}
              shape="block"
              size="md"
              offContent="关"
              onContent="开"
              loading
            />
            {/* 失败：等待时只呼吸、位置不动；宿主只在成功时改值，失败什么都不用回滚 */}
            <Switch
              className="demo-item"
              checked={blockOn}
              shape="block"
              size="md"
              offContent="月亮"
              onContent="太阳"
              onChange={(next) => wait(false).then(() => setBlockOn(next))}
              onFailed={() => { setFailed(true) }}
            />
          </View>
          {failed ? <Text className="demo-note">失败：等待停下，位置没动过，宿主值也没变</Text> : null}
        </View>
      )
    }
    if (id === 'switch-colors') {
      return (
        <View className="demo-row">
          <Switch className="demo-item" checked size="md" color="blue" />
          <Switch className="demo-item" checked size="md" color="green" />
          <Switch className="demo-item" checked size="md" color="orange" />
          <Switch className="demo-item" checked size="md" color="red" />
          <Switch className="demo-item" checked size="md" color="#8b5cf6" />
          <Switch className="demo-item" checked size="md" shape="block" color="green" offContent="关" onContent="开" />
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="form" render={render} />
}
