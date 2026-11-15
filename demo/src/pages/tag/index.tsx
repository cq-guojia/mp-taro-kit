import { Text, View } from '@tarojs/components'
import { Tag } from 'mp-taro-kit/ui/display'
import type { TagSize, TagType } from 'mp-taro-kit/ui/display'

import 'mp-taro-kit/ui/display/style'
/* 带图标的标签要用到图标字形，字体样式得由宿主显式引一次（聚合入口转发到基础包）。 */
import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

const TYPES: TagType[] = ['default', 'primary', 'success', 'warning', 'danger']
const TYPE_LABELS: Record<TagType, string> = {
  default: '默认',
  primary: '业务',
  success: '成功',
  warning: '警告',
  danger: '危险',
}
const SIZES: TagSize[] = ['3xs', 'xxs', 'xs', 'sm', 'md']

export default function TagPage() {
  const render = (id: string) => {
    if (id === 'tag') {
      return (
        <View className="demo-row">
          <Tag className="demo-item">标签</Tag>
          <Tag className="demo-item" type="primary">业务</Tag>
        </View>
      )
    }
    if (id === 'tag-matrix') {
      return (
        <View>
          {TYPES.map((type) => (
            <View key={type} className="demo-row">
              {SIZES.map((size) => (
                <Tag key={size} className="demo-item" type={type} size={size}>
                  {size}
                </Tag>
              ))}
            </View>
          ))}
          <Text className="demo-note">五行五色 × 四列四档（16 / 24 / 32 / 40）；同名档与控件等高</Text>
        </View>
      )
    }
    if (id === 'tag-type') {
      return (
        <View className="demo-row">
          {TYPES.map((type) => (
            <Tag key={type} className="demo-item" type={type}>
              {TYPE_LABELS[type]}
            </Tag>
          ))}
        </View>
      )
    }
    if (id === 'tag-variant') {
      return (
        <View>
          <Text className="demo-note">solid 实心（默认）</Text>
          <View className="demo-row">
            {TYPES.map((type) => (
              <Tag key={type} className="demo-item" type={type}>
                {TYPE_LABELS[type]}
              </Tag>
            ))}
          </View>
          <Text className="demo-note">soft 浅底 + 同色描边：边深、底浅</Text>
          <View className="demo-row">
            {TYPES.map((type) => (
              <Tag key={type} className="demo-item" type={type} variant="soft">
                {TYPE_LABELS[type]}
              </Tag>
            ))}
          </View>
          <Text className="demo-note">outline 一级面 + 同色描边</Text>
          <View className="demo-row">
            {TYPES.map((type) => (
              <Tag key={type} className="demo-item" type={type} variant="outline">
                {TYPE_LABELS[type]}
              </Tag>
            ))}
          </View>
        </View>
      )
    }
    if (id === 'tag-radius') {
      return (
        <View>
          <Text className="demo-note">圆角档：xs（默认与 --mptk-control-radius 同值）/ sm / md / lg / xl / pill</Text>
          <View className="demo-row">
            <Tag className="demo-item">默认</Tag>
            <Tag className="demo-item" radius="sm">sm</Tag>
            <Tag className="demo-item" radius="md">md</Tag>
            <Tag className="demo-item" radius="lg">lg</Tag>
            <Tag className="demo-item" radius="xl">xl</Tag>
            <Tag className="demo-item" radius="pill">pill</Tag>
          </View>
          <Text className="demo-note">mark：单侧半圆，左直角、右半圆</Text>
          <View className="demo-row">
            <Tag className="demo-item" mark>标记</Tag>
            <Tag className="demo-item" mark type="primary">业务</Tag>
            <Tag className="demo-item" mark type="warning">警告</Tag>
          </View>
        </View>
      )
    }
    if (id === 'tag-icon') {
      return (
        <View>
          <Text className="demo-note">前置 / 后置图标</Text>
          <View className="demo-row">
            <Tag className="demo-item" icon="common.base:xihuan">喜欢</Tag>
            <Tag className="demo-item" iconAfter="common.base:jia">加一个</Tag>
            <Tag className="demo-item" icon="common.base:info" type="primary" variant="soft">说明</Tag>
          </View>
          <Text className="demo-note">纯图标：宽高锁成同档高度，必然是正方形（xxs / xs / sm / md）</Text>
          <View className="demo-row">
            <Tag className="demo-item" size="xxs" icon="common.base:xihuan" />
            <Tag className="demo-item" size="xs" icon="common.base:xihuan" />
            <Tag className="demo-item" size="sm" icon="common.base:xihuan" />
            <Tag className="demo-item" size="md" icon="common.base:xihuan" />
          </View>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="tag" render={render} />
}
