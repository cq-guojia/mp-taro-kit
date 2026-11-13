import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, type CardRadius, type CardSize } from 'mp-taro-kit/ui/card'

import 'mp-taro-kit/ui/card/style'
import { DemoPage } from '../../components/DemoBlock'

const radii: CardRadius[] = ['xs', 'sm', 'md', 'lg', 'xl']
const sizes: CardSize[] = ['sm', 'md', 'lg']

export default function CardPage() {
  const [clicks, setClicks] = useState(0)
  const count = () => setClicks(clicks + 1)

  const render = (id: string) => {
    if (id === 'card-basic') {
      return (
        <Card>
          <Text>什么都不传就是一块纯壳：圆角、底色、描边全取抽象出去的档位</Text>
        </Card>
      )
    }
    if (id === 'card-radius') {
      return (
        <View className="demo-stack">
          {radii.map((radius) => (
            <Card key={radius} className="demo-item" radius={radius}>
              <Text>{`radius="${radius}"`}</Text>
            </Card>
          ))}
        </View>
      )
    }
    if (id === 'card-frame') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" title="默认：带四边描边">
            <Text>frame 默认 true</Text>
          </Card>
          <Card className="demo-item" title="frame=false：无边框" frame={false}>
            <Text>圆角与底色仍在</Text>
          </Card>
        </View>
      )
    }
    if (id === 'card-size') {
      return (
        <View className="demo-stack">
          {sizes.map((size) => (
            <Card key={size} className="demo-item" size={size} title={`size="${size}"`}>
              <Text>只换分区间距，字号与圆角不动</Text>
            </Card>
          ))}
        </View>
      )
    }
    if (id === 'card-color') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" color="blue" title="内置色名：blue">
            <Text>走类名切 --mptk-blue-soft</Text>
          </Card>
          <Card className="demo-item" color="teal" title="内置色名：teal">
            <Text>对齐 design 层 8 支色相，不新增色值</Text>
          </Card>
          <Card className="demo-item" color="#f0e6ff" title="自定义色值：#f0e6ff">
            <Text>走内联 backgroundColor，口子对业务敞开</Text>
          </Card>
        </View>
      )
    }
    if (id === 'card-header-divider') {
      return (
        <Card title="卡片标题" subtitle="头部与主体之间补一条线" extra={<Text>更多</Text>} headerDivider>
          <Text>主体内容</Text>
        </Card>
      )
    }
    if (id === 'card-slots') {
      return (
        <Card
          cover={<View className="demo-card-cover"><Text>cover · 封面区（宿主注入）</Text></View>}
          title="卡片标题"
          subtitle="subtitle · 副标题或描述"
          extra={<Text>extra · 操作区</Text>}
          footer={<Text>footer · 底部操作区</Text>}
        >
          <Text>body · 主体内容，全部槽位不给就不渲染</Text>
        </Card>
      )
    }
    if (id === 'card-state') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" title={`可点击：已点 ${clicks} 次`} onClick={count}>
            <Text>onClick 派生按压态</Text>
          </Card>
          <Card className="demo-item" title="禁用" disabled onClick={count}>
            <Text>onClick 短路，计数不动</Text>
          </Card>
          <Card className="demo-item" title="等待态" loading loadingContent={<Text>加载中…（宿主注入）</Text>}>
            <Text>有 loadingContent 时替换主体</Text>
          </Card>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="card" render={render} />
}
