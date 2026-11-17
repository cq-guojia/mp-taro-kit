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

/**
 * 贴边内容在 Card body 里该不该画自己的上下边界线。Card 渲染期算好后注入：
 * 每组只负责「自己边界上那一条」，两段之间的分界处恒好一条线，不会两边各画一条叠成双线。
 */
export interface CardEdgeLines {
  /** 上边界：前面还有内容时要画；贴着卡片顶部 / 卡片标题分隔线的那块不画。 */
  top: boolean
  /** 下边界：只有后面跟的是不画线的普通内容时才补；后面是同类贴边内容时由它自己的上边界负责。 */
  bottom: boolean
}

/** 内部 prop 名：消费方不传，由 Card 注入；放在 infra 中立层，card 与 cell 互不 import。 */
export const CARD_EDGE_LINES_PROP = '__mptkCardEdgeLines'

/**
 * 脱离文档流的组件（浮层类）声明：不占 Card 内容流的位置。
 *
 * 为什么必须有这个声明：Card 在渲染期静态遍历 children 判断边界归属，而浮层关闭时渲染 null。
 * 只看 element 树的话，`<Card><CellGroup /><Popup open={false}>…</Popup></Card>` 里 Popup 的
 * children 会被当成排在 CellGroup 后面的可见内容，于是该组误以为「后面还有内容」多补一条底线。
 * 静态遍历无法知道组件会不会渲染 null，所以由浮层自己声明，Card 直接跳过它整棵子树。
 */
export const CARD_EDGE_OUT_OF_FLOW: unique symbol = Symbol('mptk-card-edge-out-of-flow')

export interface CardEdgeOutOfFlowComponent {
  [CARD_EDGE_OUT_OF_FLOW]?: true
}

/** 给浮层组件挂声明，返回同一引用：组件身份不变，element.type 比较照旧成立。 */
export function markCardEdgeOutOfFlow<T extends object>(component: T): T {
  const marked = component as T & CardEdgeOutOfFlowComponent
  marked[CARD_EDGE_OUT_OF_FLOW] = true
  return component
}
