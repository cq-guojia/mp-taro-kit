import { useState } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup } from 'mp-taro-kit/ui/display/cell'
import { Overlay, type OverlayOpacity, type OverlayTone } from 'mp-taro-kit/ui/layout'

import 'mp-taro-kit/ui/display/style'
import 'mp-taro-kit/ui/layout/style'
import { DemoPage } from '../../components/DemoBlock'

type OverlayCase = { tone: OverlayTone; opacity: OverlayOpacity; label: string; note: string }

const OVERLAY_CASES: OverlayCase[] = [
  { tone: 'dark', opacity: 'default', label: '默认', note: '深色 · 标准浓度' },
  { tone: 'dark', opacity: 'thin', label: '薄', note: '深色 · 薄浓度' },
  { tone: 'dark', opacity: 'thick', label: '厚', note: '深色 · 厚浓度' },
  { tone: 'light', opacity: 'default', label: '浅色', note: '浅色 · 标准浓度' },
]

export default function OverlayPage() {
  const [active, setActive] = useState<OverlayCase | null>(null)

  const render = (id: string) => {
    if (id !== 'overlay') return null
    return (
      <View>
        <CellGroup>
          {OVERLAY_CASES.map((item) => (
            <Cell
              key={item.label}
              title={item.label}
              value={item.note}
              isLink
              onClick={() => setActive(item)}
            />
          ))}
        </CellGroup>
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
