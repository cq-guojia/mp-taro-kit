/** Card 在渲染期识别并装饰 children 树里的「贴边内容」声明。
    靠 element 的 type / props 纯值判断与 clone，不 import react 运行时：
    React element 也是普通对象，展开复制会保留 $$typeof / key / props，Node 自检可直接构造。 */
import type { ReactElement, ReactNode } from 'react'
import {
  CARD_EDGE_CONTENT,
  CARD_EDGE_LINES_PROP,
  CARD_EDGE_OUT_OF_FLOW,
  type CardEdgeContentComponent,
  type CardEdgeLines,
  type CardEdgeOutOfFlowComponent,
} from '../infra/card-edge.js'

interface ElementLike {
  type?: unknown
  props?: { children?: ReactNode }
}

function isMarkedElement(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node !== 'object') return false
  const type: unknown = (node as ElementLike).type
  return (
    (typeof type === 'function' || typeof type === 'object') &&
    type !== null &&
    (type as CardEdgeContentComponent)[CARD_EDGE_CONTENT] === true
  )
}

/** 浮层类组件：关闭时渲染 null，不占内容流，首尾判定要整棵跳过。 */
function isOutOfFlowElement(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node !== 'object') return false
  const type: unknown = (node as ElementLike).type
  return (
    (typeof type === 'function' || typeof type === 'object') &&
    type !== null &&
    (type as CardEdgeOutOfFlowComponent)[CARD_EDGE_OUT_OF_FLOW] === true
  )
}

/** 只看节点本身是不是贴边内容（不递归）。 */
export function isCardEdgeElement(node: ReactNode): boolean {
  return isMarkedElement(node)
}

export function hasCardEdgeContent(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasCardEdgeContent)
  if (isMarkedElement(node)) return true
  if (isOutOfFlowElement(node)) return false
  if (node === null || node === undefined || typeof node !== 'object') return false
  const children = (node as ElementLike).props?.children
  return children === undefined ? false : hasCardEdgeContent(children)
}

/** 不占内容流的空节点：null / undefined / 布尔 / 空字符串，渲染出来什么都没有。 */
function isRendered(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== ''
}

/** 读 element 的 children 成数组，保持子节点引用不变（Children.toArray 会 clone 加 key，破坏位置映射）。 */
function childNodes(node: ReactNode): ReactNode[] {
  if (node === null || node === undefined || typeof node !== 'object') return []
  const children = (node as ElementLike).props?.children
  if (children === undefined || children === null || children === false || children === true) return []
  return Array.isArray(children) ? children : [children]
}

function childrenIsArray(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node !== 'object') return false
  return Array.isArray((node as ElementLike).props?.children)
}

/** 纯值 clone：展开保留 element 的 $$typeof / key / ref，只换 props。不 import react。 */
function cloneWithProps(node: ReactNode, props: Record<string, unknown>): ReactElement {
  const element = node as unknown as Record<string, unknown>
  return {
    ...element,
    props: { ...(element.props as Record<string, unknown>), ...props },
  } as ReactElement
}

/**
 * 穿透包装层展开成叶子序列（贴边内容自身算叶子，不再往下展开；浮层整棵跳过）。
 * 数组与空节点在这里就摊平/丢掉：`{list.map(…)}` 与 `{cond && …}` 是小程序页面最常见的写法，
 * 把数组当成一块「普通内容」，会让前一组误判「后面还有内容」多画一条底线，
 * 数组里的组则整块拿不到边界提示。
 */
function flattenLeaves(nodes: ReactNode[], out: ReactNode[]): void {
  nodes.forEach((node) => {
    if (Array.isArray(node)) {
      flattenLeaves(node, out)
      return
    }
    if (!isRendered(node)) return
    if (isOutOfFlowElement(node)) return
    const children = childNodes(node)
    if (isMarkedElement(node) || children.length === 0) {
      out.push(node)
      return
    }
    flattenLeaves(children, out)
  })
}

/**
 * 按卡片体里所有叶子元素的文档顺序判断每条边界该由谁画。
 *
 * 唯一规则：每个分组是封口的——底线归「前一块」画，只有排在最后才不画（卡片底边接管）；
 * 上边界只在前面是普通内容时才画，紧跟卡片标题栏（标题栏自带线）或上一分组
 * （它的底线就是这条线）时让位。这样任何两块之间恒好一条线：不会两边各画一条叠成双线，
 * 也不会两边都不画留下空档。
 * 提示按顺序消费而不是按 element 身份做键：同一个 element 对象当两个兄弟用时也能各拿各的。
 */
export function decorateCardEdgeChildren(nodes: ReactNode[]): ReactNode[] {
  const leaves: ReactNode[] = []
  flattenLeaves(nodes, leaves)

  const hints: CardEdgeLines[] = []
  leaves.forEach((node, index) => {
    if (!isMarkedElement(node)) return
    hints.push({
      top: index > 0 && !isMarkedElement(leaves[index - 1]),
      bottom: leaves[index + 1] !== undefined,
    })
  })

  let cursor = 0
  const decorate = (list: ReactNode[]): ReactNode[] =>
    list.map((node) => {
      if (Array.isArray(node)) return decorate(node)
      if (!isRendered(node)) return node
      if (isOutOfFlowElement(node)) return node
      if (isMarkedElement(node)) {
        const next = hints[cursor]
        cursor += 1
        return next === undefined ? node : cloneWithProps(node, { [CARD_EDGE_LINES_PROP]: next })
      }
      const children = childNodes(node)
      if (children.length === 0) return node
      const decorated = decorate(children)
      return cloneWithProps(node, { children: childrenIsArray(node) ? decorated : decorated[0] })
    })

  return decorate(nodes)
}
