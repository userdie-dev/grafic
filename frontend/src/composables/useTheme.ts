import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

const read = (): Theme => {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'dark'
}

const theme = ref<Theme>(read())

const apply = () => {
  const dark = theme.value === 'dark' || (theme.value === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function initTheme() {
  watchEffect(apply)
  media.addEventListener('change', apply)
}

export function useTheme() {
  const setTheme = (t: Theme) => {
    theme.value = t
    try {
      localStorage.setItem(KEY, t)
    } catch {}
  }
  return { theme, setTheme }
}
