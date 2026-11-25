import { createContext } from 'react'

/** undefined = 手动挂载的全局宿主；null = KitPage 内但没有页面身份，不认领；string = 具体页面。 */
export const KitPageKeyContext = createContext<string | null | undefined>(undefined)
