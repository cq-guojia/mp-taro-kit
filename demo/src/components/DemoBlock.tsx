import { Fragment } from 'react'
import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Card } from 'mp-taro-kit/ui/card'
import { Divider } from 'mp-taro-kit/ui/display'
import 'mp-taro-kit/ui/card/style'
import 'mp-taro-kit/ui/display/style'
import type { KitAction } from 'mp-taro-kit/app'
import { catalogPages, type CatalogExample } from '../catalog'
import { DemoShell } from './DemoShell'

function pageOf(id: string) {
  const page = catalogPages.find((item) => item.id === id)
  if (page === undefined) throw new Error(`[demo] catalog 缺少页面 ${id}`)
  return page
}

/** 单个示例外壳：卡片壳交给 Card，标题与说明走它的槽；通栏页不套壳。 */
export function DemoBlock({
  example,
  bare = false,
  children,
}: {
  example: CatalogExample
  bare?: boolean
  children?: ReactNode
}) {
  if (bare) {
    return (
      <View className="demo-block demo-block--bare">
        {example.title !== '' && (
          <View className="demo-block__head demo-block__head--bare">
            <Text className="demo-block__title">{example.title}</Text>
            <Text className="demo-block__hint">{example.hint}</Text>
          </View>
        )}
        <View className="demo-block__body">{children}</View>
      </View>
    )
  }
  return (
    <Card
      className="demo-block"
      title={example.title === '' ? undefined : example.title}
      subtitle={example.hint === '' ? undefined : example.hint}
    >
      <View className="demo-block__content">{children}</View>
    </Card>
  )
}

/** 展示页外壳：按 catalog 铺块；标了 section 的页在每组首块前插一个分组标题。 */
export function DemoPage({
  pageId,
  render,
  actions,
  hideActions,
  backToTop,
  scrollViewId,
  floating,
  onScrollTop,
  children,
}: {
  pageId: string
  render: (id: string) => ReactNode
  actions?: readonly KitAction[]
  hideActions?: readonly string[]
  backToTop?: boolean
  scrollViewId?: string
  floating?: ReactNode
  onScrollTop?: (top: number) => void
  children?: ReactNode
}) {
  const page = pageOf(pageId)
  const blocks = page.examples.map((example, index) => ({
    example,
    showSection: example.section !== undefined && example.section !== page.examples[index - 1]?.section,
  }))
  return (
    <DemoShell
      title={page.title}
      actions={actions}
      hideActions={hideActions}
      backToTop={backToTop}
      scrollViewId={scrollViewId}
      floating={floating}
      onScrollTop={onScrollTop}
    >
      <View className="demo-page__head">
        <Text className="demo-page__summary">{page.summary}</Text>
      </View>
      {blocks.map(({ example, showSection }) => (
        <Fragment key={example.id}>
          {showSection && (
            <Divider className="demo-section" contentPosition="left">
              {example.section}
            </Divider>
          )}
          <DemoBlock example={example} bare={page.bare === true}>
            {render(example.id)}
          </DemoBlock>
        </Fragment>
      ))}
      {children}
    </DemoShell>
  )
}
