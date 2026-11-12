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
    setTimeout(() => (ok ? resolve() : reject(new Error('模拟后台失败'))), 800)
  })
}

export default function SwitchPage() {
  const [on, setOn] = useState(false)
  const [blockOn, setBlockOn] = useState(true)
  const [dayNight, setDayNight] = useState(false)
  const [failed, setFailed] = useState(false)

  const render = (id: string) => {
    if (id === 'switch-basic') {
      return (
        <View className="demo-row">
          <Switch className="demo-item" checked={on} size="sm" onChange={(next) => { setOn(next) }} />
          <Switch className="demo-item" checked={on} size="md" onChange={(next) => { setOn(next) }} />
          <Switch className="demo-item" checked={on} onChange={(next) => { setOn(next) }} />
          <Switch
            className="demo-item"
            checked={blockOn}
            shape="block"
            offContent="关"
            onContent="开"
            onChange={(next) => { setBlockOn(next) }}
          />
          <Switch
            className="demo-item"
            checked={blockOn}
            shape="block"
            offContent="待办"
            onContent="完成"
            onChange={(next) => { setBlockOn(next) }}
          />
        </View>
      )
    }
    if (id === 'switch-icon') {
      return (
        <View className="demo-stack">
          <View className="demo-row">
            <Switch
              className="demo-item"
              checked={dayNight}
              shape="block"
              offContent={SUN}
              onContent={MOON}
              onChange={(next) => { setDayNight(next) }}
            />
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
              shape="block"
              size="sm"
              offContent={SUN}
              onContent={MOON}
              onChange={(next) => { setDayNight(next) }}
            />
          </View>
          <View className="demo-row">
            <Switch
              className="demo-item"
              checked={dayNight}
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
              size="sm"
              offContent={SUN}
              onContent={MOON}
              onChange={(next) => { setDayNight(next) }}
            />
          </View>
          <View className="demo-row">
            <Switch
              className="demo-item"
              checked={dayNight}
              shape="block"
              keepColor
              offContent={SUN}
              onContent={MOON}
              onChange={(next) => { setDayNight(next) }}
            />
            <Switch
              className="demo-item"
              checked={dayNight}
              keepColor
              offContent={SUN}
              onContent={MOON}
              onChange={(next) => { setDayNight(next) }}
            />
          </View>
        </View>
      )
    }
    if (id === 'switch-state') {
      return (
        <View className="demo-stack">
          <View className="demo-row">
            <Switch className="demo-item" checked={false} disabled />
            <Switch className="demo-item" checked={false} loading />
            <Switch
              className="demo-item"
              checked={on}
              onChange={(next) => wait(true).then(() => setOn(next))}
            />
            {/* 失败：点了先转圈、位置不动；宿主只在成功时改值，失败什么都不用回滚 */}
            <Switch
              className="demo-item"
              checked={blockOn}
              shape="block"
              offContent="月亮"
              onContent="太阳"
              onChange={(next) => wait(false).then(() => setBlockOn(next))}
              onFailed={() => { setFailed(true) }}
            />
          </View>
          {failed ? <Text className="demo-note">失败：转圈停了，位置没动过，宿主值也没变</Text> : null}
        </View>
      )
    }
    if (id === 'switch-colors') {
      return (
        <View className="demo-row">
          <Switch className="demo-item" checked color="blue" />
          <Switch className="demo-item" checked color="green" />
          <Switch className="demo-item" checked color="orange" />
          <Switch className="demo-item" checked color="red" />
          <Switch className="demo-item" checked color="#8b5cf6" />
          <Switch className="demo-item" checked shape="block" color="green" offContent="关" onContent="开" />
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="form" render={render} />
}
