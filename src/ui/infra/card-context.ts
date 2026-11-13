import { createContext, useContext } from 'react'

/** 卡片向后代声明「你被装在一层壳里」：Card 提供，CellGroup 消费，消费方不传任何参数。
    模式对齐 react-native-paper 的 CardContext，Context 放在 infra 中立层避免两个子域互相 import。 */
export interface CardSurfaceState {
  inCard: boolean
}

const OUTSIDE_CARD: CardSurfaceState = { inCard: false }
export const CARD_SURFACE_INSIDE: CardSurfaceState = { inCard: true }

export const CardSurfaceContext = createContext<CardSurfaceState>(OUTSIDE_CARD)

export function useCardSurface(): CardSurfaceState {
  return useContext(CardSurfaceContext)
}
