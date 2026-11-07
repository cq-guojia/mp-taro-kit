/**
 * peer 依赖的编译期最小类型声明。
 *
 * React / Taro 由宿主项目提供（package.json 的 peerDependencies），本库既不安装也不打包。
 * 这里只声明本库源码真正用到的那几个签名，让 `jsx: "react-jsx"` 的 JSX 转换与组件 import
 * 在 `pnpm run build` 时能解析；运行时产物里的 import 仍由宿主 node_modules 接住。
 * 与 core/faces.ts 同一思路：本地结构化声明，不与宿主的 Taro / React 类型版本焊死。
 */
declare module 'react' {
  export type ReactNode = unknown
  export type ReactElement = unknown
  export type Key = string | number
  export interface CSSProperties {
    [property: string]: string | number | undefined
  }
  export type FC<P = Record<string, unknown>> = (props: P) => unknown
  export function useState<S>(initial: S): [S, (value: S) => void]
  // 最小声明：effect 的返回值（cleanup 或无返回）由 React 运行时自己判定，这里不窄化。
  export function useEffect(effect: () => unknown, deps?: readonly unknown[]): void
  export function useCallback<T>(fn: T, deps: readonly unknown[]): T
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T
  export function useRef<T>(initial: T): { current: T }
  export function useSyncExternalStore<T>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T,
  ): T
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    type Element = unknown
    interface IntrinsicElements {
      [name: string]: unknown
    }
  }
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown
  export const Fragment: unknown
}

declare module '@tarojs/components' {
  import type { CSSProperties, Key, ReactNode } from 'react'

  export interface StyledProps {
    className?: string
    style?: CSSProperties
    children?: ReactNode
    key?: Key
    id?: string
    onClick?: (event: unknown) => void
    catchMove?: boolean
  }

  export const View: (props: StyledProps) => unknown
  export const Text: (props: StyledProps) => unknown
  export const Image: (props: StyledProps & { src?: string; mode?: string }) => unknown
  export const ScrollView: (props: StyledProps & { scrollY?: boolean; scrollX?: boolean }) => unknown
}
