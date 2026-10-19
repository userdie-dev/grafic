import { readonly, ref } from 'vue'

export interface UpdateStatus {
  kind: 'downloading' | 'updated' | 'error'
  text: string
}

const state = ref<UpdateStatus | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

/** Progress of the over-the-air update, shown as a toast (see updater.ts). `ttl` hides it again after that many ms. */
export function setUpdateStatus(s: UpdateStatus | null, ttl?: number) {
  clearTimeout(timer)
  state.value = s
  if (s && ttl) timer = setTimeout(() => (state.value = null), ttl)
}

export const useUpdateStatus = () => readonly(state)
