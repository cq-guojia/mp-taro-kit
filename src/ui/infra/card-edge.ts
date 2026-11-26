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
 * 段头契约：参与 Card 的边界计算、能拿到该画哪条线的提示，但不声明「自带留白」。
 * 与贴边内容的区别是内容归属——段头只包标题，下面的正文是它的兄弟节点，
 * 若声明贴边会让 Card 关掉 body 留白，把兄弟正文推到卡片边上。
 */
export const CARD_SECTION_HEAD: unique symbol = Symbol('mptk-card-section-head')

export interface CardSectionHeadComponent {
  [CARD_SECTION_HEAD]?: true
}

export function markCardSectionHead<T extends object>(component: T): T {
  const marked = component as T & CardSectionHeadComponent
  marked[CARD_SECTION_HEAD] = true
  return component
}

/**
 * 贴边内容在 Card body 里该不该画自己的上下边界线。Card 渲染期算好后注入：
 * 每组只负责「自己边界上那一条」，两段之间的分界处恒好一条线，不会两边各画一条叠成双线。
 */
export interface CardEdgeLines {
  /** 上边界：前面还有内容时要画；贴着卡片顶部 / 前邻是标题时不画。 */
  top: boolean
  /** 下边界：后面还有内容时画；标题用它负责与相邻标题之间的接缝，列表在后面是标题时让位。 */
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
