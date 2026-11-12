import { View, Text } from '@tarojs/components'
import { iconClass, iconNames } from 'mp-taro-kit/ui/icon'

import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

/**
 * 一次性验证：Skyline 下 :before 的 content 能否吃 CSS 变量。
 *
 * 三格是刻意设计的对照组，只有落在「A=home、B=home、C=logo」才算通过：
 *   A 写死码位，证明字体本身可用（其他两格空白时，问题不在 var）。
 *   B 变量未定义，走兜底 \\e61c，证明兜底不破坏渲染。
 *   C 变量定义了 \\e87e，应从 home 变成 logo，证明变量能换字形。
 *
 * 第三格若仍是 home，说明变量不生效；若两格全空，说明 content 不吃 var()。
 * 验完连同 catalog.ts 的 icon-probe 与 app.scss 的 .demo-probe-* 一起删。
 */
function ProbeRow({ label, className }: { label: string; className: string }) {
  return (
    <View className="demo-probe__row">
      <Text className="demo-probe__key">{label}</Text>
      <Text className={`mptk-icons-base ${className} demo-probe__glyph`} />
    </View>
  )
}

export default function IconPage() {
  const render = (id: string) => {
    if (id === 'icon-grid') {
      return (
        <View className="demo-icon-grid">
          {iconNames.map((name) => (
            <View key={name} className="demo-icon-cell">
              <Text className={`${iconClass(name)} demo-icon-cell__glyph`} />
              <Text className="demo-icon-cell__name">{name}</Text>
            </View>
          ))}
        </View>
      )
    }
    if (id === 'icon-probe') {
      return (
        <View>
          <ProbeRow label="A 写死 \\e61c" className="demo-probe-a" />
          <ProbeRow label="B 变量兜底" className="demo-probe-b" />
          <ProbeRow label="C 变量覆盖" className="demo-probe-c" />
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="icon" render={render} />
}
