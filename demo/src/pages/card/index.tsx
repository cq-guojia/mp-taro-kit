import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Card, CardHead, type CardRadius, type CardSize, type CardVariant } from 'mp-taro-kit/ui/card'
import { Icon } from 'mp-taro-kit/ui/display/icon'

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
const Head = ({ text }: { text: string }) => (
  <CardHead>
    <View className="mptk-card__title">{text}</View>
  </CardHead>
)

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
            <Card key={item.value} className="demo-item" variant={item.value}>
              <Head text={`variant="${item.value}"`} />
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
            <Card key={size} className="demo-item" size={size}>
              <Head text={`size="${size}"`} />
              <Text>只换分区间距，字号与圆角不动</Text>
            </Card>
          ))}
        </View>
      )
    }
    if (id === 'card-color') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" color="blue">
            <Head text="内置色名：blue" />
            <Text>有面的形态染底：走类名切 --mptk-blue-soft</Text>
          </Card>
          <Card className="demo-item" variant="filled" color="purple">
            <Head text="filled + 内置色名" />
            <Text>整底卡片：有色块、不画边</Text>
          </Card>
          <Card className="demo-item" variant="outline" color="teal">
            <Head text="outline + 内置色名" />
            <Text>没有面时色值落到边上，不是被吃掉</Text>
          </Card>
          <Card className="demo-item" color="#f0e6ff">
            <Head text="自定义色值：#f0e6ff" />
            <Text>走内联 backgroundColor，口子对业务敞开</Text>
          </Card>
          <Card className="demo-item" variant="filled" color="var(--mptk-surface-2)">
            <Head text="自定义色值：内嵌面" />
            <Text>整底 + 次级面：内嵌区块、代码块一类用法</Text>
          </Card>
        </View>
      )
    }
    if (id === 'card-divider') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" footer={<Text>footer · 底部操作区</Text>}>
            <Head text="标题 + 底部：段间线由 CardHead 画，底部线默认画" />
            <Text>标题线交给 CardHead，底部线由 Card 按 footer 派生</Text>
          </Card>
          <Card className="demo-item" footerDivider={false} footer={<Text>footer</Text>}>
            <Head text="显式关掉底部线" />
            <Text>footerDivider={false}：靠留白分开</Text>
          </Card>
        </View>
      )
    }
    if (id === 'card-slots') {
      return (
        <Card
          cover={<View className="demo-card-cover"><Text>cover · 封面区（宿主注入）</Text></View>}
          footer={<Text>footer · 底部操作区</Text>}
        >
          <CardHead>
            <View className="mptk-card__title">卡片标题</View>
            <View className="mptk-card__subtitle">subtitle · 副标题或描述</View>
          </CardHead>
          <Text>body · 标题走 CardHead，封面与底部仍走 Card 槽位</Text>
        </Card>
      )
    }
    if (id === 'card-head') {
      return (
        <Card>
          <CardHead>
            <View className="mptk-card__title">
              提示 alert <Icon name="common.base:home" />
            </View>
            <View className="mptk-card__subtitle">解析即关，不返回用户选择</View>
          </CardHead>
          <Text>第一段内容：标题由宿主写 View 挂类名，图标随便塞</Text>

          <CardHead>
            <View className="mptk-card__title">确认 confirm</View>
            <View className="mptk-card__subtitle">resolve true / false</View>
          </CardHead>
          <Text>第二段内容：中间段上下各一条线，接缝处恰好一条</Text>

          <CardHead>
            <View className="mptk-card__title">异步闸门</View>
          </CardHead>
          <Text>末段：下面不画线，卡片底边接管</Text>
        </Card>
      )
    }
    if (id === 'card-state') {
      return (
        <View className="demo-stack">
          <Card className="demo-item" onClick={count}>
            <Head text={`可点击：已点 ${clicks} 次`} />
            <Text>onClick 派生按压态</Text>
          </Card>
          <Card className="demo-item" variant="filled" color="orange" onClick={count}>
            <Head text="整底 + 自定义按压" />
            <Text>按压反馈叠在半透明层上，自带底色也在</Text>
          </Card>
          <Card className="demo-item" disabled onClick={count}>
            <Head text="禁用" />
            <Text>onClick 短路，计数不动</Text>
          </Card>
          <Card className="demo-item" loading loadingContent={<Text>加载中…（宿主注入）</Text>}>
            <Head text="等待态" />
            <Text>有 loadingContent 时替换主体</Text>
          </Card>
        </View>
      )
    }
    return null
  }

  return <DemoPage pageId="card" render={render} />
}
