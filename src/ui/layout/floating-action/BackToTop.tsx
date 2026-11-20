import { useCallback, useEffect, useRef, useState } from 'react'
import { FloatingAction, type FloatingActionProps } from './FloatingAction.js'

/**
 * 回顶按钮：FloatingAction 的外观特化，只给一个默认回顶图标。
 * 不接管滚动、不算阈值、不做动画——这三件事都在消费方。
 * 库侧不 import Taro、不碰 scrollTop 属性、不查节点。
 */
export type BackToTopProps = FloatingActionProps

export function BackToTop(props: BackToTopProps) {
  return <FloatingAction icon="common.base:huidingbu" {...props} />
}

/** useBackToTop 的入参。 */
export interface UseBackToTopOptions {
  /** 越过该高度才显示，默认 300。 */
  visibilityHeight?: number
}

/**
 * 回顶按钮的显隐钩子：只做「是否越过阈值」这一件离散判断。
 * 滚动位置存在 ref 里、不进 state；只在布尔翻转时 setState 一次。
 * 阈值变化时用最后一次滚动位置立即重算——否则改阈值要等下一次滚动才生效。
 */
export function useBackToTop({ visibilityHeight = 300 }: UseBackToTopOptions = {}): {
  visible: boolean
  onScroll: (top: number) => void
} {
  const lastTop = useRef(0)
  const reached = useRef(false)
  const [visible, setVisible] = useState(false)

  const onScroll = useCallback(
    (top: number): void => {
      lastTop.current = top
      const next = top >= visibilityHeight
      if (next === reached.current) return
      reached.current = next
      setVisible(next)
    },
    [visibilityHeight],
  )

  useEffect(() => {
    const next = lastTop.current >= visibilityHeight
    if (next === reached.current) return
    reached.current = next
    setVisible(next)
  }, [visibilityHeight])

  return { visible, onScroll }
}

/**
 * 程序化回顶：发一次节点命令，滚动由视图层原生完成，不逐帧、不碰 scrollTop 属性、不进 React state。
 *
 * 曾有逐帧发命令的版本：每帧一条 scrollTo 让视图层不断重启滚动、目标每帧变化追不上，
 * 表现为「回顶后来回蹦」；也有逐帧 setState 绑 scrollTop 的版本，受控切非受控会回弹成过山车。
 * 两者都废弃。一次命令是唯一稳定、无残影、无回弹的写法。
 *
 * 瞬间档：`duration <= 0` 传 `animated: false`，跨端都是无动画直接回顶。若仍传 animated:true + duration:0，
 * 安卓会把 0 当无效值忽略、照常播默认动画，瞬间档就失效了。
 *
 * 平台限制：`duration` 仅 iOS 生效；安卓 WebView 自 2022-12-01 起废弃 duration/velocity，
 * 安卓有动画档走平台默认时长。这是微信的平台行为，JS 侧无法在「一次命令」下跨端统一时长。
 *
 * scroll-view 需开 `enhanced`（ScrollViewContext 仅在该模式生效）。
 */
export function scrollViewToTop(
  node: { scrollTo?: (option: { top: number; duration?: number; animated?: boolean }) => void } | null | undefined,
  duration = 450,
): void {
  if (duration <= 0) {
    node?.scrollTo?.({ top: 0, animated: false })
    return
  }
  node?.scrollTo?.({ top: 0, animated: true, duration })
}
