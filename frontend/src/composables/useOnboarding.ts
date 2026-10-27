import { ref } from 'vue'

const KEY = 'onboarding_seen'

const seen = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Shown on the first launch only; settings can reopen it. */
const open = ref(!seen())

export function useOnboarding() {
  const show = () => (open.value = true)
  const finish = () => {
    open.value = false
    try {
      localStorage.setItem(KEY, '1')
    } catch {}
  }
  return { open, show, finish }
}
