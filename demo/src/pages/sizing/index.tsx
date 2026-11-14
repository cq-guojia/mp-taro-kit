import { View, Text } from '@tarojs/components'

import { DemoPage } from '../../components/DemoBlock'
import { KIT_CONFIG_BY_KEY } from '../../kit-config.generated'

/** 档位与取值全部来自生成表，本页不写死任何尺寸数字。 */
const configValue = (key: string) => KIT_CONFIG_BY_KEY[key]?.value ?? ''
const pxOf = (key: string) => configValue(key).replace(/px$/, '')

const HEIGHT_TIERS = ['sm', 'md', 'lg'].map((tier) => ({
  tier,
  px: pxOf(`--mptk-control-h-${tier}`),
}))

const FONT_TIERS = ['xs', 'sm', 'md', 'lg', 'xl']
const SPACE_TIERS = ['0', '1', '2', '3', '4']
const RADIUS_TIERS = ['xs', 'sm', 'md', 'lg', 'xl', 'pill']

const SIZE_GROUPS = [
  {
    title: '字号 / 行高',
    items: FONT_TIERS.map((tier) => `${tier} ${pxOf(`--mptk-font-${tier}`)} / ${pxOf(`--mptk-line-${tier}`)}`),
  },
  { title: '间距', items: SPACE_TIERS.map((tier) => `space-${tier} ${pxOf(`--mptk-space-${tier}`)}`) },
  { title: '圆角', items: RADIUS_TIERS.map((tier) => `${tier} ${pxOf(`--mptk-radius-${tier}`)}`) },
]

/** 尺寸：控件高度三档，及其余不随明暗变化的档位。 */
export default function SizingPage() {
  const render = (id: string) => {
    if (id === 'control-height') {
      return (
        <View>
          <Text className="demo-note">控件高度三档，对齐 WeUI 按钮高度；承载文字的控件用 size 选档，调用点不自定高度。</Text>
          <View className="demo-rulers">
            {HEIGHT_TIERS.map((item) => (
              <View key={item.tier} className="demo-ruler">
                <View className={`demo-ruler__bar demo-ruler__bar--${item.tier}`} />
                <Text className="demo-ruler__label">{`${item.tier} · ${item.px}px`}</Text>
              </View>
            ))}
          </View>
          <Text className="demo-note">总高必须逐像素等于该档，不许由上下内边距撑出来；Switch 与 Segmented 逐档吃同名 token，效果见表单页。</Text>
        </View>
      )
    }
    if (id === 'scale') {
      return (
        <View>
          <Text className="demo-note">其余尺寸档位同在样式基线里，不随明暗变化（单位 px）：</Text>
          {SIZE_GROUPS.map((group) => (
            <View key={group.title} className="demo-spec">
              <Text className="demo-spec__title">{group.title}</Text>
              <View className="demo-spec__items">
                {group.items.map((item) => (
                  <Text key={item} className="demo-spec__item">{item}</Text>
                ))}
              </View>
            </View>
          ))}
          <Text className="demo-note">字号档位与《微信小程序设计指南》5.1 的常用字号对应；宿主可逐档覆盖，生成器会校验档位严格递增。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="sizing" render={render} />
}
