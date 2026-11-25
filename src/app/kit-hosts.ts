import type { ComponentType } from 'react'
import { createSingleton } from '../runtime/singleton.js'

/** 宿主是无必填 props 的组件；业务自定义宿主也按这个形态传。 */
export type CommandHost = ComponentType<{ className?: string }>

interface HostRegistry {
  hosts: readonly CommandHost[]
}

function registry(): HostRegistry {
  return createSingleton<HostRegistry>('kit-hosts', () => ({ hosts: [] }))
}

/** createKitApp 写入配置；KitPage 在每个页面树里读出来渲染。 */
export function setKitHosts(hosts: readonly CommandHost[]): void {
  registry().hosts = hosts
}

export function kitHosts(): readonly CommandHost[] {
  return registry().hosts
}
