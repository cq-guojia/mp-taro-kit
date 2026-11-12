import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { catalogPages, type CatalogExample } from '../catalog'
import { DemoShell } from './DemoShell'

function pageOf(id: string) {
  const page = catalogPages.find((item) => item.id === id)
  if (page === undefined) throw new Error(`[demo] catalog 缺少页面 ${id}`)
  return page
}

/** 单个示例外壳：只留标题与一句话，效果直接铺出来；代码示例见 docs/api/cell.md。 */
export function DemoBlock({
  example,
  bare = false,
  children,
}: {
  example: CatalogExample
  bare?: boolean
  children?: ReactNode
}) {
  return (
    <View className={bare ? 'demo-block demo-block--bare' : 'demo-block'}>
      <View className={bare ? 'demo-block__head demo-block__head--bare' : 'demo-block__head'}>
        <Text className="demo-block__title">{example.title}</Text>
        <Text className="demo-block__hint">{example.hint}</Text>
      </View>
      <View className="demo-block__body">{children}</View>
    </View>
  )
}

/** 展示页外壳：只消费 catalog 的分组数据，效果由各页按示例 id 提供。 */
export function DemoPage({
  pageId,
  render,
}: {
  pageId: string
  render: (id: string) => ReactNode
}) {
  const page = pageOf(pageId)
  return (
    <DemoShell title={page.title}>
      <View className="demo-page__head">
        <Text className="demo-page__summary">{page.summary}</Text>
      </View>
      {page.examples.map((example) => (
        <DemoBlock key={example.id} example={example} bare={page.bare === true}>
          {render(example.id)}
        </DemoBlock>
      ))}
    </DemoShell>
  )
}
