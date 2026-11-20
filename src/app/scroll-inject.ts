import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'

export interface ScrollViewInjection {
  /** 自动生成的内部 id；仅当 ScrollView 自己没写 id 时用。 */
  id: string
  /** 回顶显隐的只读回执。 */
  onScroll: (top: number) => void
}

export interface ScrollViewLookup {
  children: ReactNode
  /** 实际用于 selector query 的 id；null = 没找到，回顶静默无效。 */
  id: string | null
}

/**
 * 在 KitPage 的直接 children 里找第一个 ScrollView，把回顶需要的三样东西注入进去：
 * id（节点查询）、enhanced（ScrollViewContext 仅在增强模式生效）、onScroll（显隐回执）。
 *
 * - 只认直接子节点，不钻进自定义组件内部——那是调用方的边界，钻进去会误伤。
 * - ScrollView 自己写了 id 就尊重它，只补 enhanced / onScroll。
 * - 找不到就原样返回、id 为 null；调用方点回顶什么也不做，不报错、不隐藏按钮。
 *
 * scrollViewType 由 KitPage 传入 '@tarojs/components' 的 ScrollView：小程序端它就是字符串
 * 'scroll-view'，H5 端是组件 class，两处比较都覆盖，且本模块零平台依赖、可在 Node 真跑。
 */
export function injectFirstScrollView(
  children: ReactNode,
  scrollViewType: unknown,
  injection: ScrollViewInjection,
): ScrollViewLookup {
  let id: string | null = null
  const next = Children.map(children, (child) => {
    if (id !== null || !isValidElement(child)) return child
    if (child.type !== scrollViewType && child.type !== 'scroll-view') return child

    const props = child.props as {
      id?: string
      onScroll?: (event: { detail: { scrollTop: number } }) => void
    }
    id = props.id ?? injection.id
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      id,
      enhanced: true,
      onScroll: (event: { detail: { scrollTop: number } }) => {
        injection.onScroll(event.detail.scrollTop)
        props.onScroll?.(event)
      },
    })
  })
  return { children: next, id }
}
