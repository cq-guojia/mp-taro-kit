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
          <View className="demo-row">
            <Button onClick={() => setClicked(true)}>点击触发</Button>
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
