import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Button } from 'mp-taro-kit/ui/actions'
import { Loader, Loading, Spinner, Toast } from 'mp-taro-kit/ui/feedback'

import 'mp-taro-kit/ui/actions/style'
import 'mp-taro-kit/ui/feedback/style'
import { DemoPage } from '../../components/DemoBlock'

export default function FeedbackPage() {
  const [toastVisible, setToastVisible] = useState(true)

  const render = (id: string) => {
    if (id === 'toast') {
      return (
        <View>
          <Toast text="这是一条轻提示" tone="success" visible={toastVisible} />
          <View className="demo-row">
            <Button className="demo-item" onClick={() => setToastVisible(!toastVisible)}>
              切换 visible
            </Button>
          </View>
        </View>
      )
    }
    if (id === 'loading') {
      return (
        <View>
          <View className="demo-row">
            <Loading text="正在加载" />
          </View>
          <View className="demo-row">
            <Loading text="" />
          </View>
        </View>
      )
    }
    if (id === 'loader') {
      return (
        <View>
          <Text className="demo-note">
            ring 抄 TDesign circular（圆锥渐变弧 + 环形遮罩），chase 抄 SpinKit sk-chase（六点追逐）；
            三种形态共用一个默认色 --mptk-spinner-active，传 color 可单独改。切首页主题可对照。
          </Text>
          <View className="demo-row">
            <Loader variant="ring" size="xs" className="demo-loader-spaced" />
            <Loader variant="ring" size="sm" className="demo-loader-spaced" />
            <Loader variant="ring" size="md" className="demo-loader-spaced" />
            <Loader variant="ring" size="lg" className="demo-loader-spaced" />
            <Loader variant="ring" size="xl" className="demo-loader-spaced" />
          </View>
          <View className="demo-row">
            <Spinner variant="chase" size={12} className="demo-loader-spaced" />
            <Spinner variant="chase" size={16} className="demo-loader-spaced" />
            <Spinner variant="chase" size={24} className="demo-loader-spaced" />
            <Spinner variant="chase" size={32} className="demo-loader-spaced" />
            <Spinner variant="chase" size={48} className="demo-loader-spaced" />
          </View>
          <View className="demo-row">
            <Loader variant="blocks" size="xs" className="demo-loader-spaced" />
            <Loader variant="blocks" size="sm" className="demo-loader-spaced" />
            <Loader variant="blocks" size="md" className="demo-loader-spaced" />
            <Loader variant="blocks" size="lg" className="demo-loader-spaced" />
            <Loader variant="blocks" size="xl" className="demo-loader-spaced" />
          </View>
          <View className="demo-row">
            <Loader variant="ring" color="#00a870" className="demo-loader-spaced" />
            <Spinner variant="chase" size={24} color="#00a870" className="demo-loader-spaced" />
            <Loader variant="blocks" color="#00a870" className="demo-loader-spaced" />
          </View>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="feedback" render={render} />
}
