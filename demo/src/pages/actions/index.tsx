import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import type { ButtonType, ButtonVariant } from 'mp-taro-kit/ui/actions'

import 'mp-taro-kit/ui/actions/style'
/* 带图标的按钮要用到图标字形，字体样式得由宿主显式引一次。 */
import 'mp-taro-kit/ui/icon/style'
import { DemoPage } from '../../components/DemoBlock'

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
/* 标签写成中文，直接看出每档按钮自己的字号；档位值仍是 size prop。 */
const SIZE_LABELS: Record<(typeof SIZES)[number], string> = {
  xs: 'XS 按钮',
  sm: 'SM 按钮',
  md: 'MD 按钮',
  lg: 'LG 按钮',
  xl: 'XL 按钮',
}
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', 'pill'] as const

const TYPES: readonly (readonly [ButtonType, string])[] = [
  ['default', '默认'],
  ['primary', '主色'],
  ['success', '成功'],
  ['warning', '警告'],
  ['danger', '危险'],
]

const VARIANTS: readonly (readonly [ButtonVariant, string])[] = [
  ['solid', '实心'],
  ['soft', '浅底'],
  ['outline', '描边'],
  ['ghost', '无底'],
]

/** 演示用的异步点击：返回 Promise 就会自动转圈并防连点。 */
const sleep = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), 900)
  })

export default function ActionsPage() {
  const [failed, setFailed] = useState(false)

  const render = (id: string) => {
    if (id === 'button-size') {
      return (
        <View>
          <Text className="demo-note">五档高度：xs / sm（默认）/ md / lg / xl，总高逐像素等于刻度 token</Text>
          <View className="demo-stack">
            <View className="demo-row">
              {SIZES.slice(0, 3).map((size) => (
                <Button key={size} className="demo-item" size={size}>
                  {SIZE_LABELS[size]}
                </Button>
              ))}
            </View>
            <View className="demo-row">
              {SIZES.slice(3).map((size) => (
                <Button key={size} className="demo-item" size={size}>
                  {SIZE_LABELS[size]}
                </Button>
              ))}
            </View>
          </View>
        </View>
      )
    }
    if (id === 'button-radius') {
      return (
        <View>
          <Text className="demo-note">不传（控件默认圆角）/ xs / sm / md / lg / xl / pill</Text>
          <View className="demo-stack">
            <View className="demo-row">
              <Button className="demo-item">默认</Button>
              {RADII.slice(0, 3).map((radius) => (
                <Button key={radius} className="demo-item" radius={radius}>
                  {radius}
                </Button>
              ))}
            </View>
            <View className="demo-row">
              {RADII.slice(3).map((radius) => (
                <Button key={radius} className="demo-item" radius={radius}>
                  {radius}
                </Button>
              ))}
            </View>
          </View>
          <Text className="demo-note">浅底形态下同一组圆角：边与浅底一起跟着变</Text>
          <View className="demo-stack">
            <View className="demo-row">
              <Button className="demo-item" variant="soft">
                默认
              </Button>
              {RADII.slice(0, 3).map((radius) => (
                <Button key={radius} className="demo-item" radius={radius} variant="soft">
                  {radius}
                </Button>
              ))}
            </View>
            <View className="demo-row">
              {RADII.slice(3).map((radius) => (
                <Button key={radius} className="demo-item" radius={radius} variant="soft">
                  {radius}
                </Button>
              ))}
            </View>
          </View>
        </View>
      )
    }
    if (id === 'button-variant') {
      return (
        <View>
          {VARIANTS.map(([variant, label]) => (
            <View key={variant}>
              <Text className="demo-note">{`${label}（${variant}）`}</Text>
              <View className="demo-row">
                {TYPES.map(([type, name]) => (
                  <Button key={type} className="demo-item" type={type} variant={variant}>
                    {name}
                  </Button>
                ))}
              </View>
            </View>
          ))}
        </View>
      )
    }
    if (id === 'button-color') {
      return (
        <View>
          {['#7c3aed', '#f5c518'].map((tint) => (
            <View key={tint}>
              <Text className="demo-note">{`${tint}：实心自动选白字或深字，浅底与描边跟着品牌色`}</Text>
              <View className="demo-row">
                {VARIANTS.map(([variant, label]) => (
                  <Button key={variant} className="demo-item" color={tint} variant={variant}>
                    {label}
                  </Button>
                ))}
              </View>
            </View>
          ))}
        </View>
      )
    }
    if (id === 'button-icon') {
      return (
        <View>
          <Text className="demo-note">前置 / 后置图标：间距 --mptk-space-1，字形跟按钮字号 1:1</Text>
          <View className="demo-row">
            <Button className="demo-item" icon="common.base:xihuan">
              喜欢
            </Button>
            <Button className="demo-item" iconAfter="common.base:info" variant="soft">
              说明
            </Button>
            <Button className="demo-item" variant="outline" icon="common.base:xihuan">
              喜欢
            </Button>
          </View>
          <Text className="demo-note">纯图标：不给 children 就锁成正方形，五档宽高都等于同档高度</Text>
          <View className="demo-row">
            {SIZES.map((size) => (
              <Button key={size} className="demo-item" size={size} icon="common.base:xihuan" />
            ))}
          </View>
          <Text className="demo-note">纯图标 + 品牌色 / 半圆</Text>
          <View className="demo-row">
            <Button className="demo-item" color="#7c3aed" icon="common.base:xihuan" />
            <Button className="demo-item" color="#f5c518" icon="common.base:xihuan" radius="pill" />
            <Button className="demo-item" variant="outline" icon="common.base:xihuan" radius="pill" />
          </View>
        </View>
      )
    }
    if (id === 'button-loading') {
      return (
        <View>
          <Text className="demo-note">
            点一下看三种落法：不定宽只留圈、定宽或 loadingMode=&quot;inline&quot; 在前面插圈、有图标则顶替图标位
          </Text>
          <View className="demo-row">
            <Button className="demo-item" onClick={sleep}>
              不定宽
            </Button>
            <Button className="demo-item" width={180} onClick={sleep}>
              定宽 180
            </Button>
            <Button className="demo-item" loadingMode="inline" onClick={sleep}>
              强制插圈
            </Button>
            <Button className="demo-item" icon="common.base:xihuan" onClick={sleep}>
              带图标
            </Button>
            <Button className="demo-item" icon="common.base:xihuan" onClick={sleep} />
          </View>
          <Text className="demo-note">替换文案 / 外部控制常驻加载</Text>
          <View className="demo-row">
            <Button className="demo-item" loadingText="提交中…" onClick={sleep}>
              替换文案
            </Button>
            <Button className="demo-item" loading>
              常驻加载
            </Button>
          </View>
        </View>
      )
    }
    if (id === 'button-state') {
      return (
        <View>
          <Text className="demo-note">禁用只降透明度：品牌色不被涂灰</Text>
          <View className="demo-row">
            <Button className="demo-item" disabled>
              禁用
            </Button>
            <Button className="demo-item" variant="outline" disabled>
              禁用描边
            </Button>
            <Button className="demo-item" color="#7c3aed" disabled>
              禁用品牌色
            </Button>
          </View>
          <Text className="demo-note">异步失败回调、整行撑满、固定宽</Text>
          <View className="demo-row">
            <Button className="demo-item" onFailed={() => setFailed(true)} onClick={() => Promise.resolve(false)}>
              失败回调
            </Button>
            <Button className="demo-item" width={200}>
              定宽 200
            </Button>
            <Button className="demo-item" width="50%">
              定宽 50%
            </Button>
          </View>
          <Button block>整行按钮</Button>
          {failed ? <Text className="demo-note">onFailed 已回调</Text> : null}
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="actions" render={render} />
}
