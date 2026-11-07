import { View, Text } from '@tarojs/components'
import { getConfig } from 'mp-taro-kit/core'
import { createSingleton } from 'mp-taro-kit/runtime'
import { clamp, formatBytes, formatYmd, joinPath } from 'mp-taro-kit/utils'

import { DemoPage } from '../../components/DemoBlock'

export default function FoundationPage() {
  const config = getConfig()
  const first = createSingleton('demo/probe', () => ({ hit: 0 }))
  const second = createSingleton('demo/probe', () => ({ hit: 0 }))

  const render = (id: string) => {
    if (id === 'tokens') {
      return (
        <View>
          <View className="demo-row">
            <View className="demo-swatch demo-swatch--business" />
            <View className="demo-swatch demo-swatch--success" />
            <View className="demo-swatch demo-swatch--danger" />
          </View>
          <Text className="demo-note">色块只读 var(--mptk-*)；覆盖 page 上的同名变量即可整体换肤。</Text>
        </View>
      )
    }
    if (id === 'core-configure') {
      return (
        <View>
          <Text className="demo-note">{`baseURL: ${config.baseURL || '（空）'}`}</Text>
          <Text className="demo-note">{`timeout: ${config.timeout}`}</Text>
          <Text className="demo-note">{`storagePrefix: ${config.storagePrefix}`}</Text>
          <Text className="demo-note">{`debug: ${config.debug ? 'true' : 'false'}`}</Text>
          <Text className="demo-note">由 app.tsx 注入 13 个 faces 后读取，未注入时这里会抛错。</Text>
        </View>
      )
    }
    if (id === 'utils') {
      return (
        <View>
          <Text className="demo-note">{`formatYmd('2026-11-08') = ${formatYmd('2026-11-08')}`}</Text>
          <Text className="demo-note">{`formatBytes(2048) = ${formatBytes(2048)}`}</Text>
          <Text className="demo-note">{`clamp(12, 0, 10) = ${clamp(12, 0, 10)}`}</Text>
          <Text className="demo-note">{`joinPath('a/b', 'c') = ${joinPath('a/b', 'c')}`}</Text>
        </View>
      )
    }
    if (id === 'runtime') {
      return (
        <View>
          <Text className="demo-note">{`createSingleton 两次同 key 同一对象：${first === second ? 'true' : 'false'}`}</Text>
          <Text className="demo-note">单例挂在 globalThis，冷启动即清零；覆盖层栈 / 通知队列 / loading 槽都基于它。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="foundation" render={render} />
}
