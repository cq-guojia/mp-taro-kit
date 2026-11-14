// 配置契约与运行时槽：唯一真源是项目根 kit.config.mjs，默认值由生成器写成
// ./kit-config.generated.js（字面量产物，不是第二份真源）。
import { createSingleton } from './singleton.js'
import { DEFAULT_KIT_CONFIG } from './kit-config.generated.js'
import type { KitConfigDefaults } from './kit-config.generated.js'

/**
 * 逐层可选，但字典（headers / 窗口字段表）保持整表语义：
 * 调用方给的是整张表，不是「某个 key 覆盖成 undefined」。
 */
export type DeepPartial<T> = {
  [K in keyof T]?: string extends keyof T[K]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}

export type KitConfig = DeepPartial<KitConfigDefaults>

interface KitSlot {
  config: KitConfigDefaults
}

/** 宿主可写的差异形状：只写要改的键，其余吃库默认。 */
export function defineKitConfig(config: KitConfig): KitConfig {
  return config
}

function slot(): KitSlot {
  return createSingleton<KitSlot>('kit-config', () => ({ config: DEFAULT_KIT_CONFIG }))
}

/** 消费方在 app 入口调一次；生成器已把差异编进 kit-config.generated，通常无需手动注入。 */
export function setKitConfig(overrides: KitConfig = {}): KitConfigDefaults {
  const current = slot().config
  const merged = {
    ...current,
    runtime: {
      ...current.runtime,
      ...(overrides.runtime ?? {}),
      core: { ...current.runtime.core, ...(overrides.runtime?.core ?? {}) },
    },
    window: {
      light: { ...current.window.light, ...(overrides.window?.light ?? {}) },
      dark: { ...current.window.dark, ...(overrides.window?.dark ?? {}) },
    },
  }
  slot().config = merged
  return merged
}

/** 库内部读取生效配置；未显式注入时就是库默认表，不抛错。 */
export function getKitConfig(): KitConfigDefaults {
  return slot().config
}

export { DEFAULT_KIT_CONFIG }
export type { KitConfigDefaults }
