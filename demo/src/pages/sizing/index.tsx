import { View, Text } from '@tarojs/components'

import { DemoPage } from '../../components/DemoBlock'

const HEIGHT_TIERS = [
  { tier: 'sm', px: 32 },
  { tier: 'md', px: 40 },
  { tier: 'lg', px: 48 },
]

const SIZE_GROUPS = [
  {
    title: '字号 / 行高',
    items: ['xs 12 / 17', 'sm 14 / 20', 'md 15 / 22', 'lg 17 / 24', 'xl 22 / 30'],
  },
  { title: '间距', items: ['space-1 4', 'space-2 8', 'space-3 12', 'space-4 16'] },
  { title: '圆角', items: ['xs 4', 'sm 8', 'md 12', 'lg 16', 'xl 20', 'pill 全圆'] },
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
                <Text className="demo-ruler__label">{`${item.tier} · ${String(item.px)}px`}</Text>
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
          <Text className="demo-note">字号档位与《微信小程序设计指南》5.1 的常用字号对应；宿主不整体覆盖档位，也不新增档位。</Text>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="sizing" render={render} />
}
