import { useEffect, useRef, useState } from 'react'

/**
 * 进出场时长默认值（毫秒），与 kit.config.mjs 的 --mptk-c-motion-duration 同数值。
 * 配置是带单位的 CSS 时长（300ms），这里是 setTimeout 用的数字；两处要同步改，tests/layout.test.mjs 断言数值一致。
 */
export const MOTION_DURATION = 300

/** usePresence 的可选参数。布尔重载等价于只给 initialOpen，兼容既有调用点。 */
export interface PresenceOptions {
  /** 首帧的 open 值；false = 先挂载关闭态、下一帧再展开（进出场都有过渡）。缺省等于 visible。 */
  initialOpen?: boolean
  /** 退场完成：visible 已打开过再变 false、视觉节点卸载后触发一次。duration<=0 也会触发。 */
  onExited?: () => void
}

/**
 * 显隐两态：打开时先挂载、下一帧再置 open，transition 才有起点；
 * 关闭时保持挂载播完动画再卸载，duration ≤ 0 则立即卸载（低端机 / 减少动效）。
 * onExited 与卸载用同一个计时，是退场完成的唯一信号，不另起时钟。
 */
export function usePresence(
  visible: boolean,
  duration: number,
  options?: boolean | PresenceOptions,
): { mounted: boolean; open: boolean } {
  const initialOpenOption = typeof options === 'boolean' ? options : options?.initialOpen
  const onExited = typeof options === 'object' ? options?.onExited : undefined
  const initialOpen = initialOpenOption ?? visible

  const [mounted, setMounted] = useState(visible || initialOpen === false)
  const [open, setOpen] = useState(initialOpen)
  // 只有真正进入过展开态才算「已打开」；initialOpen=false 只是首帧关闭态，不算。
  const wasOpenedRef = useRef(visible && initialOpen !== false)
  // 退场计时中 duration 变化会让 effect 重跑；标记要留到 onExited 真正触发才清。
  const exitPendingRef = useRef(false)
  const onExitedRef = useRef(onExited)
  onExitedRef.current = onExited

  const completeExit = (): void => {
    setMounted(false)
    if (exitPendingRef.current) {
      exitPendingRef.current = false
      onExitedRef.current?.()
    }
  }

  useEffect(() => {
    if (visible) {
      setMounted(true)
      wasOpenedRef.current = true
      exitPendingRef.current = false
      const timer = setTimeout(() => setOpen(true), 0)
      return () => clearTimeout(timer)
    }
    setOpen(false)
    if (wasOpenedRef.current) {
      wasOpenedRef.current = false
      exitPendingRef.current = true
    }
    if (duration <= 0) {
      completeExit()
      return
    }
    const timer = setTimeout(completeExit, duration)
    return () => clearTimeout(timer)
  }, [visible, duration])

  return { mounted, open }
}
