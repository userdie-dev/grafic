import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let prefersDark = false
let changeListener: (() => void) | undefined

beforeEach(() => {
  prefersDark = false
  changeListener = undefined
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return prefersDark
    },
    addEventListener: (_: string, l: () => void) => (changeListener = l),
  }))
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  vi.resetModules()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const load = () => import('@/composables/useTheme')

describe('useTheme', () => {
  it('defaults to dark when nothing is stored', async () => {
    const { useTheme } = await load()
    expect(useTheme().theme.value).toBe('dark')
  })

  it('reads a stored theme', async () => {
    localStorage.setItem('theme', 'light')
    const { useTheme } = await load()
    expect(useTheme().theme.value).toBe('light')
  })

  it('ignores garbage in storage', async () => {
    localStorage.setItem('theme', 'neon')
    const { useTheme } = await load()
    expect(useTheme().theme.value).toBe('dark')
  })

  it('survives localStorage throwing on read', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { useTheme } = await load()
    expect(useTheme().theme.value).toBe('dark')
  })

  it('survives localStorage throwing on write', async () => {
    const { useTheme } = await load()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    useTheme().setTheme('light')
    expect(useTheme().theme.value).toBe('light')
  })

  it('persists and applies the chosen theme', async () => {
    const { initTheme, useTheme } = await load()
    initTheme()
    const root = document.documentElement
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.style.colorScheme).toBe('dark')

    useTheme().setTheme('light')
    await nextTick()
    expect(localStorage.getItem('theme')).toBe('light')
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.style.colorScheme).toBe('light')
  })

  it('follows the system preference in system mode', async () => {
    const { initTheme, useTheme } = await load()
    initTheme()
    useTheme().setTheme('system')
    await nextTick()
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    prefersDark = true
    changeListener!()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
