import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'

import 'mp-taro-kit/ui/actions/style'
import { DemoPage } from '../../components/DemoBlock'

export default function ActionsPage() {
  const [clicked, setClicked] = useState(false)
  const [failed, setFailed] = useState(false)

  const render = (id: string) => {
    if (id === 'button-basic') {
      return (
        <View>
          <View className="demo-stack">
            <View className="demo-row">
              <Button className="demo-item" size="xs" onClick={() => setClicked(true)}>迷你</Button>
              <Button className="demo-item" size="sm" onClick={() => setClicked(true)}>小</Button>
              <Button className="demo-item" size="md" onClick={() => setClicked(true)}>中</Button>
              <Button className="demo-item" size="lg" onClick={() => setClicked(true)}>大</Button>
              <Button className="demo-item" size="xl" onClick={() => setClicked(true)}>特大</Button>
            </View>
            <View className="demo-row">
              <Button className="demo-item" radius="pill" onClick={() => setClicked(true)}>半圆</Button>
              <Button className="demo-item" disabled radius="pill" onClick={() => setClicked(true)}>半圆禁用</Button>
            </View>
          </View>
          {clicked ? <Text className="demo-note">onClick 已触发</Text> : null}
        </View>
      )
    }
    if (id === 'button-state') {
      return (
        <View>
          <View className="demo-row">
            <Button disabled>禁用</Button>
            <Button
              loadingText="处理中…"
              onClick={() =>
                new Promise<void>((resolve) => {
                  setTimeout(() => resolve(), 800)
                })
              }
            >
              异步
            </Button>
            <Button onFailed={() => setFailed(true)} onClick={() => Promise.resolve(false)}>
              失败回调
            </Button>
          </View>
          {failed ? <Text className="demo-note">onFailed 已回调</Text> : null}
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="actions" render={render} />
}
