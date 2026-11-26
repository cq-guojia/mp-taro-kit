import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { hideLoading, showLoading } from 'mp-taro-kit/ui/commands/loading'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/infra/style'
import { DemoPage } from '../../components/DemoBlock'

export default function CommandsPage() {
  const [loadingResult, setLoadingResult] = useState('')

  const render = (id: string) => {
    if (id === 'loading-command') {
      return (
        <View>
          <View className="demo-row">
            <Button
              className="demo-item"
              onClick={() => {
                const handle = showLoading()
                setLoadingResult(`句柄 ${handle}`)
                setTimeout(() => hideLoading(handle), 1200)
              }}
            >
              showLoading（1.2s 后关闭）
            </Button>
          </View>
          {loadingResult === '' ? null : <Text className="demo-note">{loadingResult}</Text>}
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="commands" render={render} />
}
