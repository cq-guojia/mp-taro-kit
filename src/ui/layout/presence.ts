import { useEffect, useState } from 'react'

/**
 * 进出场时长默认值（毫秒），与 kit.config.mjs 的 --mptk-c-motion-duration 同数值。
 * 配置是带单位的 CSS 时长（300ms），这里是 setTimeout 用的数字；两处要同步改，tests/layout.test.mjs 断言数值一致。
 */
export const MOTION_DURATION = 300

/**
 * 显隐两态：打开时先挂载、下一帧再置 open，transition 才有起点；
 * 关闭时保持挂载播完动画再卸载，duration ≤ 0 则立即卸载（低端机 / 减少动效）。
 */
export function usePresence(visible: boolean, duration: number): { mounted: boolean; open: boolean } {
  const [mounted, setMounted] = useState(visible)
  const [open, setOpen] = useState(visible)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      const timer = setTimeout(() => setOpen(true), 0)
      return () => clearTimeout(timer)
    }
    setOpen(false)
    if (duration <= 0) {
      setMounted(false)
      return
    }
    const timer = setTimeout(() => setMounted(false), duration)
    return () => clearTimeout(timer)
  }, [visible, duration])

  return { mounted, open }
}
