import { View, Text } from '@tarojs/components'
import { Divider, Tag } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/display/style'
import { DemoPage } from '../../components/DemoBlock'
import { KIT_CONFIG_BY_KEY } from '../../kit-config.generated'

/** 档位与取值全部来自生成表，本页不写死任何尺寸数字。 */
const configValue = (key: string) => KIT_CONFIG_BY_KEY[key]?.value ?? ''
const pxOf = (key: string) => configValue(key).replace(/px$/, '')

const HEIGHT_TIERS = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'].map((tier) => ({
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

/** 尺寸：控件高度五档，及其余不随明暗变化的档位。 */
export default function SizingPage() {
  const render = (id: string) => {
    if (id === 'control-height') {
      return (
        <View>
          <Text className="demo-note">高度刻度七档：中三档对齐 WeUI 按钮高度，两端逐档外扩。3xs（16）/ xxs（20）只给展示类标签填，可点控件从 xs 起；标签与控件同名档必然等高。</Text>
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
              <Divider className="demo-spec__divider" contentPosition="left">
                {group.title}
              </Divider>
              <View className="demo-spec__items">
                {group.items.map((item) => (
                  <Tag key={item} className="demo-item">{item}</Tag>
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
