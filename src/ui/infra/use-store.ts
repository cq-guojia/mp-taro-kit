import { useSyncExternalStore } from 'react'
import { uiState } from '../state.js'
import type { DialogPayload } from '../state.js'
import type { OverlayEntry } from '../../runtime/overlay-stack.js'
import type { Notice } from '../../runtime/notify.js'
import type { LoadingState } from '../../runtime/loading-slot.js'

/** runtime 的 observable 直接喂给 useSyncExternalStore；订阅桥只做转发，不复制状态。 */
export function useOverlayEntries(): readonly OverlayEntry<DialogPayload>[] {
  return useSyncExternalStore(
    (listener) => uiState().overlays.subscribe(listener),
    () => uiState().overlays.getSnapshot(),
  )
}

export function useNotices(): readonly Notice[] {
  return useSyncExternalStore(
    (listener) => uiState().notices.subscribe(listener),
    () => uiState().notices.getSnapshot(),
  )
}

export function useLoadingState(): LoadingState {
  return useSyncExternalStore(
    (listener) => uiState().loading.subscribe(listener),
    () => uiState().loading.getSnapshot(),
  )
}
