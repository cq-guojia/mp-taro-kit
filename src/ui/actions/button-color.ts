/**
 * Button 的任意品牌色派生：把 `color` 翻成三段行内样式（底 / 字 / 边）。
 *
 * 只保证 `#rgb` / `#rrggbb` / `rgb()` / `rgba()` 能解析出分量 —— `soft` 的浅底要靠分量算透明度，
 * 小程序没有 `color-mix`，Web 那套「按色混出浅底」在这里只能预计算。
 * 解析不了（`var(--x)`、色名、渐变）时浅底退回灰面，边与字仍用原色。
 */

/** 语义色档；`color` 传了任意色值时优先于它。 */
export type ButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger'

/** 底色形态：实心 / 浅底描边 / 白底描边 / 无底无边。 */
export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost'

/** 三段可覆盖的口子，直接铺进行内样式，优先级高于档位类里的变量。 */
export interface ButtonColorStyle {
  backgroundColor?: string
  borderColor?: string
  color?: string
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i

/**
 * `soft` 的浅底透明度。明色下 16% 品牌色叠白、暗色下叠深底都还看得出块面，一个值吃两套主题；
 * shortcut: 14~18% 之外（例如极深的品牌色）暗色会糊，那时再拆 light / dark 两支变量。
 */
const TINT_ALPHA = 0.16

/** 实心底上「该用深字还是白字」的分界（相对亮度）。绿 / 橙 / 黄在它之上，蓝 / 红 / 深紫在它之下。 */
const LIGHT_SURFACE = 0.4

/** 取出 r/g/b 分量；不是这几种写法就返回 undefined。 */
function channelsOf(color: string): [number, number, number] | undefined {
  const text = color.trim()
  const hex = HEX.exec(text)
  if (hex !== null) {
    const body = text.slice(1)
    const full = body.length === 3 ? body.split('').map((char) => char + char).join('') : body
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ]
  }
  const rgb = RGB.exec(text)
  if (rgb === null) return undefined
  const channels: [number, number, number] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return channels.some((value) => value > 255) ? undefined : channels
}

/** WCAG 相对亮度：决定实心底上压白字还是压深字。 */
function relativeLuminance(channels: [number, number, number]): number {
  const linear = (value: number): number => {
    const unit = value / 255
    return unit <= 0.03928 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linear(channels[0]) + 0.7152 * linear(channels[1]) + 0.0722 * linear(channels[2])
}

/** 把自定义色值翻成当前形态需要的三段样式；不传 `color` 就返回 undefined，交给档位类。 */
export function resolveButtonColor(
  variant: ButtonVariant,
  color: string | undefined,
): ButtonColorStyle | undefined {
  if (color === undefined || color === '') return undefined
  const channels = channelsOf(color)
  if (variant === 'solid') {
    const light = channels !== undefined && relativeLuminance(channels) > LIGHT_SURFACE
    return {
      backgroundColor: color,
      borderColor: color,
      color: light ? 'var(--mptk-fg)' : 'var(--mptk-fg-on-accent)',
    }
  }
  if (variant === 'soft') {
    return {
      backgroundColor:
        channels === undefined
          ? 'var(--mptk-surface-2)'
          : `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${TINT_ALPHA})`,
      borderColor: color,
      color,
    }
  }
  if (variant === 'outline') {
    return { backgroundColor: 'var(--mptk-surface-1)', borderColor: color, color }
  }
  return { color }
}
