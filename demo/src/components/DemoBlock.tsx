import { Fragment } from 'react'
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

/** 展示页外壳：按 catalog 铺块；标了 section 的页在每组首块前插一个分组标题。 */
export function DemoPage({
  pageId,
  render,
}: {
  pageId: string
  render: (id: string) => ReactNode
}) {
  const page = pageOf(pageId)
  const blocks = page.examples.map((example, index) => ({
    example,
    showSection: example.section !== undefined && example.section !== page.examples[index - 1]?.section,
  }))
  return (
    <DemoShell title={page.title}>
      <View className="demo-page__head">
        <Text className="demo-page__summary">{page.summary}</Text>
      </View>
      {blocks.map(({ example, showSection }) => (
        <Fragment key={example.id}>
          {showSection && (
            <View className="demo-section">
              <Text className="demo-section__title">{example.section}</Text>
            </View>
          )}
          <DemoBlock example={example} bare={page.bare === true}>
            {render(example.id)}
          </DemoBlock>
        </Fragment>
      ))}
    </DemoShell>
  )
}
