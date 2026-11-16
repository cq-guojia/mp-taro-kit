/**
 * 按压反馈在手指抬起后保留多久（ms）。
 *
 * 微信原生 button 的默认值是 70；Taro 的 View 组件默认是 400 —— 那 400ms 会让
 * 「点完按钮、遮罩都已经淡入」之后按钮还挂在按压态上，看起来像过一会儿才变色。
 * 所有带 hoverClass 的组件显式给这个值，不各自吃默认。
 */
export const PRESS_STAY_TIME = 70
