/** Card 在渲染期识别并装饰 children 树里的「贴边内容」声明。
    靠 element 的 type / props 纯值判断与 clone，不 import react 运行时：
    React element 也是普通对象，展开复制会保留 $$typeof / key / props，Node 自检可直接构造。 */
import type { ReactElement, ReactNode } from 'react'
import {
  CARD_EDGE_CONTENT,
  CARD_EDGE_OUT_OF_FLOW,
  CARD_EDGE_POSITION_PROP,
  type CardEdgeContentComponent,
  type CardEdgeOutOfFlowComponent,
  type CardEdgePosition,
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
  if (node === null || node === undefined || typeof node !== 'object') return false
  const children = (node as ElementLike).props?.children
  return children === undefined ? false : hasCardEdgeContent(children)
}

/** 读 element 的 children 成数组，保持子节点引用不变（Children.toArray 会 clone 加 key，破坏位置映射）。 */
function childNodes(node: ReactNode): ReactNode[] {
  if (node === null || node === undefined || typeof node !== 'object') return []
  const children = (node as ElementLike).props?.children
  if (children === undefined || children === null || children === false) return []
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

/** 穿透包装层展开成叶子序列（贴边内容自身算叶子，不再往下展开；浮层整棵跳过）。 */
function flattenLeaves(nodes: ReactNode[], out: ReactNode[]): void {
  nodes.forEach((node) => {
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
 * 按卡片体里所有叶子元素的文档顺序判断首尾，穿透普通包装层。
 * 贴在卡片边界的那一端才收线：第一个不画上边线，最后一个不画下边线，
 * 中间的上下都画，只有一组时两头都收。首尾按全部叶子算——后面还有内容就不能当末组。
 */
export function decorateCardEdgeChildren(nodes: ReactNode[]): ReactNode[] {
  const leaves: ReactNode[] = []
  flattenLeaves(nodes, leaves)

  const positions = new Map<ReactElement, CardEdgePosition>()
  leaves.forEach((node, index) => {
    if (!isMarkedElement(node)) return
    const isFirst = index === 0
    const isLast = index === leaves.length - 1
    const position: CardEdgePosition =
      isFirst && isLast ? 'single'
      : isFirst ? 'first'
      : isLast ? 'last'
      : 'middle'
    positions.set(node as ReactElement, position)
  })

  const decorate = (list: ReactNode[]): ReactNode[] =>
    list.map((node) => {
      if (isOutOfFlowElement(node)) return node
      const position = positions.get(node as ReactElement)
      if (position !== undefined) {
        return cloneWithProps(node, { [CARD_EDGE_POSITION_PROP]: position })
      }
      const children = childNodes(node)
      if (children.length === 0) return node
      const decorated = decorate(children)
      return cloneWithProps(node, { children: childrenIsArray(node) ? decorated : decorated[0] })
    })

  return decorate(nodes)
}
