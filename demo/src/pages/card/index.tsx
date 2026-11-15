import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, type CardRadius, type CardSize, type CardVariant } from 'mp-taro-kit/ui/card'

import 'mp-taro-kit/ui/card/style'
import { DemoPage } from '../../components/DemoBlock'

const variants: { value: CardVariant; note: string }[] = [
  { value: 'surface', note: '有面 + 有边：默认卡片，靠描边界定范围' },
  { value: 'filled', note: '只有面：整块底色成块，不画一圈线' },
  { value: 'outline', note: '只有边：底透给页面，色值染的是这条边' },
  { value: 'plain', note: '都没有：只留分区间距与圆角裁切' },
]
const radii: CardRadius[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl']
const sizes: CardSize[] = ['sm', 'md', 'lg']

export default function CardPage() {
  const [clicks, setClicks] = useState(0)
  const count = () => setClicks(clicks + 1)

  const render = (id: string) => {
    if (id === 'card-basic') {
      return (
        <Card>
          <Text>什么都不传就是一块纯壳：形态、圆角、底色、描边全取抽象出去的档位</Text>
        </Card>
      )
    }
    if (id === 'card-variant') {
      return (
        <View className="demo-stack">
          {variants.map((item) => (
            <Card key={item.value} className="demo-item" variant={item.value} title={`variant="${item.value}"`}>
              <Text>{item.note}</Text>
            </Card>
          ))}
        </View>
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
            <Text>有面的形态染底：走类名切 --mptk-blue-soft</Text>
          </Card>
          <Card className="demo-item" variant="filled" color="purple" title="filled + 内置色名">
            <Text>整底卡片：有色块、不画边</Text>
          </Card>
          <Card className="demo-item" variant="outline" color="teal" title="outline + 内置色名">
            <Text>没有面时色值落到边上，不是被吃掉</Text>
          </Card>
          <Card className="demo-item" color="#f0e6ff" title="自定义色值：#f0e6ff">
            <Text>走内联 backgroundColor，口子对业务敞开</Text>
          </Card>
          <Card className="demo-item" variant="filled" color="var(--mptk-surface-2)" title="自定义色值：内嵌面">
            <Text>整底 + 次级面：内嵌区块、代码块一类用法</Text>
          </Card>
        </View>
      )
    }
    if (id === 'card-divider') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" title="两段分区线都默认画" footer={<Text>footer · 底部操作区</Text>}>
            <Text>有头部有底部，两条线都跟着出现</Text>
          </Card>
          <Card
            className="demo-item"
            title="显式关掉头部线"
            footer={<Text>footer · 底部操作区</Text>}
            headerDivider={false}
          >
            <Text>headerDivider={false}：标题与主体连成一片，底部线仍在</Text>
          </Card>
          <Card className="demo-item" title="显式关掉底部线" footerDivider={false} footer={<Text>footer</Text>}>
            <Text>footerDivider={false}：靠留白分开</Text>
          </Card>
        </View>
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
          <Card className="demo-item" variant="filled" color="orange" title="整底 + 自定义按压" onClick={count}>
            <Text>按压反馈叠在半透明层上，自带底色也在</Text>
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
