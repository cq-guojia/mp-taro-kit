import { useState } from 'react'
import { View } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Overlay, type OverlayOpacity, type OverlayTone } from 'mp-taro-kit/ui/layout'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

type OverlayCase = { tone: OverlayTone; opacity: OverlayOpacity; label: string }

const OVERLAY_CASES: OverlayCase[] = [
  { tone: 'dark', opacity: 'default', label: '默认' },
  { tone: 'dark', opacity: 'thin', label: '薄' },
  { tone: 'dark', opacity: 'thick', label: '厚' },
  { tone: 'light', opacity: 'default', label: '浅色' },
]

export default function OverlayPage() {
  const [active, setActive] = useState<OverlayCase | null>(null)

  const render = (id: string) => {
    if (id !== 'overlay') return null
    return (
      <View>
        <View className="demo-row">
          {OVERLAY_CASES.map((item) => (
            <Button key={item.label} className="demo-item" onClick={() => setActive(item)}>
              {item.label}
            </Button>
          ))}
        </View>
        <Overlay
          visible={active !== null}
          tone={active?.tone}
          opacity={active?.opacity}
          onClose={() => setActive(null)}
        />
      </View>
    )
  }

  return <DemoPage pageId="overlay" render={render} />
}
