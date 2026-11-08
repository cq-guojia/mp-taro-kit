import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { catalogPages, type CatalogExample } from '../catalog'
import { DemoShell } from './DemoShell'

function pageOf(id: string) {
  const page = catalogPages.find((item) => item.id === id)
  if (page === undefined) throw new Error(`[demo] catalog 缺少页面 ${id}`)
  return page
}

/** 单个示例的外壳：标题、一句话、效果、usage 与 import 全部取自 catalog。 */
export function DemoBlock({
  example,
  children,
}: {
  example: CatalogExample
  children?: ReactNode
}) {
  return (
    <View className="demo-block">
      <View className="demo-block__head">
        <Text className="demo-block__title">{example.title}</Text>
        <Text className="demo-block__hint">{example.hint}</Text>
      </View>
      <View className="demo-block__body">{children}</View>
      {example.usage === '' ? null : (
        <View className="demo-block__usage">
          <Text>{example.usage}</Text>
        </View>
      )}
      <View className="demo-block__imports">
        {example.imports.map((path) => (
          <Text key={path} className="demo-block__import">
            {path}
          </Text>
        ))}
      </View>
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
        <DemoBlock key={example.id} example={example}>
          {render(example.id)}
        </DemoBlock>
      ))}
    </DemoShell>
  )
}
