/** 贴边内容契约：声明该组件自带行内留白，放进 Card 时壳不该再给上下 padding。
    放在 infra 中立层，card 与 display/cell 互不 import；零 React 运行时依赖，Node 自检可直调。 */

export const CARD_EDGE_CONTENT: unique symbol = Symbol('mptk-card-edge-content')

export interface CardEdgeContentComponent {
  [CARD_EDGE_CONTENT]?: true
}

/** 给组件挂声明，返回同一引用：组件身份不变，element.type 比较照旧成立。 */
export function markCardEdgeContent<T extends object>(component: T): T {
  const marked = component as T & CardEdgeContentComponent
  marked[CARD_EDGE_CONTENT] = true
  return component
}
