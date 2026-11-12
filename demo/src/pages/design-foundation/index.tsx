import { View, Text } from '@tarojs/components'

import { DemoPage } from '../../components/DemoBlock'

/** 色相与档位的展示清单；类名由 app.scss 的同名循环生成，取值仍全部来自 var(--mptk-*)。 */
const HUES = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'pink', 'teal']
const TIERS = [
  { suffix: '', label: '本色' },
  { suffix: '-hover', label: '悬停' },
  { suffix: '-active', label: '按下' },
  { suffix: '-soft', label: '浅底' },
]
const GRAYS = [1, 2, 3, 4, 5, 6, 7, 8]

/** 设计基础：中性灰阶、色相与明暗两套取值，各占一块。 */
export default function DesignFoundationPage() {
  const render = (id: string) => {
    if (id === 'neutral-grays') {
      return (
        <View>
          <Text className="demo-note">编号表示层级：1 是最底层、8 是最上层文字；明色下 1 最浅 8 最深，暗色下反过来。</Text>
          <View className="demo-palette">
            {GRAYS.map((level) => (
              <View key={level} className="demo-palette__cell">
                <View className={`demo-swatch demo-swatch--gray-${String(level)}`} />
                <Text className="demo-palette__label">{`gray-${String(level)}`}</Text>
              </View>
            ))}
          </View>
          <Text className="demo-note">表面色与文字色是这套灰阶的语义别名；页面底色固定纯白，与官方窗口主题配置一致。</Text>
        </View>
      )
    }
    if (id === 'hues') {
      return (
        <View>
          <Text className="demo-note">每支四档：本色是实面，悬停与按下是按压两档，浅底是同色系极淡底。</Text>
          {HUES.map((hue) => (
            <View key={hue} className="demo-palette__row">
              <Text className="demo-palette__name">{hue}</Text>
              <View className="demo-palette">
                {TIERS.map((tier) => (
                  <View key={tier.suffix} className="demo-palette__cell">
                    <View className={`demo-swatch demo-swatch--${hue}${tier.suffix}`} />
                    <Text className="demo-palette__label">{tier.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text className="demo-note">切首页主题即可对照明暗两套：暗色色相整体提亮、按压方向反转、浅底浓度单独给。</Text>
          <Text className="demo-note">色块只读 var(--mptk-*)：真源在样式基线里，本页不复制任何色值。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="design-foundation" render={render} />
}
