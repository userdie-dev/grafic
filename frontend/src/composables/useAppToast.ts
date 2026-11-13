import { readonly, ref } from 'vue'

export type AppToastKind = 'info' | 'success' | 'error'

export interface AppToast {
  kind: AppToastKind
  text: string
}

const state = ref<AppToast | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Small status pill in the bottom-right corner, the same one the connection and
 * update notices use. A newer toast replaces the previous one instead of stacking.
 */
export function showAppToast(text: string, kind: AppToastKind = 'info', ttl = 3000) {
  clearTimeout(timer)
  state.value = { kind, text }
  timer = setTimeout(() => (state.value = null), ttl)
}

export function hideAppToast() {
  clearTimeout(timer)
  state.value = null
}

export const useAppToast = () => readonly(state)
