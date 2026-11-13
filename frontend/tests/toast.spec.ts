import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideAppToast, showAppToast, useAppToast } from '@/composables/useAppToast'

afterEach(() => {
  hideAppToast()
  vi.useRealTimers()
})

describe('useAppToast', () => {
  it('replaces the previous notice and hides it after the ttl', () => {
    vi.useFakeTimers()
    const state = useAppToast()

    showAppToast('первый')
    expect(state.value).toEqual({ kind: 'info', text: 'первый' })

    showAppToast('Не удалось', 'error', 1000)
    expect(state.value).toEqual({ kind: 'error', text: 'Не удалось' })

    vi.advanceTimersByTime(999)
    expect(state.value).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(state.value).toBeNull()
  })

  it('can be hidden before the ttl elapses', () => {
    showAppToast('готово', 'success', 10_000)
    hideAppToast()
    expect(useAppToast().value).toBeNull()
  })
})
