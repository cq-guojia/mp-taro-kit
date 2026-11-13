/** Card 在渲染期识别 children 树里的「贴边内容」声明。
    纯值遍历、不 import React 运行时，Node 自检可直接构造 element 形状还原真实结构。 */
import type { ReactNode } from 'react'
import { CARD_EDGE_CONTENT, type CardEdgeContentComponent } from '../infra/card-edge.js'

interface ElementLike {
  type?: unknown
  props?: { children?: ReactNode }
}

export function hasCardEdgeContent(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasCardEdgeContent)
  if (node === null || node === undefined || typeof node !== 'object') return false
  const element = node as ElementLike
  const type: unknown = element.type
  if (
    (typeof type === 'function' || typeof type === 'object') &&
    type !== null &&
    (type as CardEdgeContentComponent)[CARD_EDGE_CONTENT] === true
  ) {
    return true
  }
  const children = element.props?.children
  return children === undefined ? false : hasCardEdgeContent(children)
}
